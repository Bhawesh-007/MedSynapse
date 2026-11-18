"""Transparent rule-based disease suitability scoring (JEV concept).

This layer scores whether the extracted evidence is sufficient to route a case
to a disease model. It is not a diagnostic probability or model accuracy
estimate. Every score is derived from feature completeness and extraction
confidence so the missing evidence is visible to the reviewer.

Scores are computed from the same contracts used by the Gemma extraction
pipeline (see ``features_required.md``). When Gemma evidence is supplied for a
disease, it is scored directly; deterministic OCR parameters are merged in only
for contract features that Gemma could not confirm.
"""

from __future__ import annotations

import logging
import math
from typing import Any, Mapping

from backend.services.breast_feature_contract import BREAST_FEATURE_ORDER
from backend.services.diabetes_feature_contract import bmi_category
from backend.services.heart_feature_contract import HEART_FEATURE_ORDER

logger = logging.getLogger("medsynapse.jev")


DIABETES_FEATURE_ORDER = (
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "Age", "BMI_Cat",
)

TABULAR_PROFILES: dict[str, tuple[str, ...]] = {
    "diabetes": DIABETES_FEATURE_ORDER,
    "heart": HEART_FEATURE_ORDER,
}

# OCR regex parameters use the API/model names. JEV reports the canonical
# contract names so the evidence matches the model input order.
DIABETES_OCR_NAMES = {
    "pregnancies": "Pregnancies",
    "glucose": "Glucose",
    "blood_pressure": "BloodPressure",
    "skin_thickness": "SkinThickness",
    "insulin": "Insulin",
    "bmi": "BMI",
    "age": "Age",
}

HEART_OCR_NAMES = {
    "age": "Age",
    "sex": "Sex",
    "cp": "CP",
    "trestbps": "RestingBP",
    "chol": "Cholesterol",
    "fbs": "FastingBloodSugar",
    "restecg": "RestingECG",
    "thalach": "MaxHeartRate",
    "exang": "ExerciseAngina",
    "oldpeak": "STDepression",
    "slope": "Slope",
    "ca": "MajorVessels",
    "thal": "Thalassemia",
}


def _evidence(features: Mapping[str, Any], name: str) -> tuple[bool, float]:
    item = features.get(name)
    if item is None:
        return False, 0.0
    if isinstance(item, Mapping):
        status = item.get("status", "extracted")
        value = item.get("value")
        confidence = item.get("confidence", 1.0)
        present = status in {"extracted", "derived", "approximated"} and value is not None
    else:
        present = item is not None
        confidence = 1.0
    try:
        confidence = max(0.0, min(1.0, float(confidence)))
    except (TypeError, ValueError):
        confidence = 0.0
    return present, confidence if present else 0.0


def _is_present(features: Mapping[str, Any], name: str) -> bool:
    return _evidence(features, name)[0]


def _merge_evidence(
    primary: Mapping[str, Any],
    secondary: Mapping[str, Any],
    required: tuple[str, ...],
) -> dict[str, Any]:
    """Prefer validated Gemma evidence, then fill gaps with OCR evidence."""
    merged: dict[str, Any] = {}
    for name in required:
        primary_item = primary.get(name)
        secondary_item = secondary.get(name)
        if primary_item is not None and _is_present(primary, name):
            merged[name] = primary_item
        elif secondary_item is not None and _is_present(secondary, name):
            merged[name] = secondary_item
        elif primary_item is not None:
            merged[name] = primary_item
        elif secondary_item is not None:
            merged[name] = secondary_item
    return merged


def _ocr_evidence(
    parameters: Mapping[str, Any],
    name_map: Mapping[str, str],
) -> dict[str, Any]:
    evidence = {}
    for api_name, item in parameters.items():
        contract_name = name_map.get(api_name)
        if contract_name is not None:
            evidence[contract_name] = item
    return evidence


def _add_derived_bmi_category(features: Mapping[str, Any]) -> dict[str, Any]:
    """Complete the diabetes vector with the app-derived BMI category."""
    if _is_present(features, "BMI_Cat"):
        return dict(features)

    bmi_item = features.get("BMI")
    present, confidence = _evidence(features, "BMI")
    if not present or not isinstance(bmi_item, Mapping):
        return dict(features)

    try:
        bmi_value = float(bmi_item["value"])
    except (KeyError, TypeError, ValueError):
        return dict(features)
    if not math.isfinite(bmi_value):
        return dict(features)

    output = dict(features)
    output["BMI_Cat"] = {
        "value": float(bmi_category(bmi_value)),
        "confidence": min(confidence, 0.90),
        "status": "derived",
        "rule_id": "BMI_CAT_FROM_BMI",
        "source_features": ["BMI"],
    }
    return output


def _score_profile(name: str, required: tuple[str, ...], features: Mapping[str, Any], *, source: str) -> dict[str, Any]:
    available = []
    missing = []
    confidences = []
    for feature in required:
        present, confidence = _evidence(features, feature)
        if present:
            available.append(feature)
            confidences.append(confidence)
        else:
            missing.append(feature)

    completeness = len(available) / len(required) if required else 0.0
    extraction_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    suitability = completeness * extraction_confidence
    if missing:
        logger.warning("JEV %s missing required evidence: %s", name, ", ".join(missing))
    else:
        logger.info("JEV %s ready for routing at %.1f%% evidence suitability", name, suitability * 100)
    return {
        "disease": name,
        "source": source,
        "suitability_score": round(suitability, 4),
        "suitability_percentage": round(suitability * 100, 1),
        "confidence_percentage": round(suitability * 100, 1),
        "status": "ready_for_routing" if not missing else "needs_more_evidence",
        "available_features": available,
        "missing_features": missing,
        "required_feature_count": len(required),
        "available_feature_count": len(available),
        "note": "Evidence suitability score; not diagnostic accuracy or clinical probability.",
    }


def score_disease_suitability(
    parameters: Mapping[str, Any] | None = None,
    *,
    disease_type: str = "all",
    breast_features: Mapping[str, Any] | None = None,
    gemma_features: Mapping[str, Mapping[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Return deterministic JEV suitability scores for extracted evidence.

    ``gemma_features`` maps a disease key (``diabetes``, ``heart``, ``breast``)
    to the validated feature objects stored in the feature-extraction table.
    OCR parameters remain a secondary source for diabetes and heart so a
    deterministic extraction can still contribute when Gemma leaves a feature
    unverified.
    """
    parameters = parameters or {}
    gemma_features = gemma_features or {}
    selected = disease_type.lower()
    scores = []

    if selected in {"all", "diabetes"}:
        diabetes_required = TABULAR_PROFILES["diabetes"]
        diabetes_evidence = _merge_evidence(
            gemma_features.get("diabetes") or {},
            _ocr_evidence(parameters, DIABETES_OCR_NAMES),
            diabetes_required,
        )
        scores.append(_score_profile(
            "Diabetes Mellitus",
            diabetes_required,
            _add_derived_bmi_category(diabetes_evidence),
            source=(
                "Gemma feature contract + OCR evidence"
                if gemma_features.get("diabetes")
                else "OCR parameters"
            ),
        ))

    if selected in {"all", "heart"}:
        heart_required = TABULAR_PROFILES["heart"]
        heart_evidence = _merge_evidence(
            gemma_features.get("heart") or {},
            _ocr_evidence(parameters, HEART_OCR_NAMES),
            heart_required,
        )
        scores.append(_score_profile(
            "Coronary Heart Disease",
            heart_required,
            heart_evidence,
            source=(
                "Gemma feature contract + OCR evidence"
                if gemma_features.get("heart")
                else "OCR parameters"
            ),
        ))

    if selected in {"all", "breast"}:
        breast_evidence = gemma_features.get("breast") or breast_features or {}
        if gemma_features.get("breast"):
            breast_source = "Gemma WDBC feature contract"
        elif breast_features:
            breast_source = "OCR WDBC labels"
        else:
            breast_source = "No breast evidence"
        scores.append(_score_profile(
            "Breast Cancer",
            BREAST_FEATURE_ORDER,
            breast_evidence,
            source=breast_source,
        ))

    # Image-only models cannot be routed from a lab-report feature set.
    if selected == "all":
        scores.extend([
            {
                "disease": "Pneumonia",
                "source": "Chest X-ray required",
                "suitability_score": 0.0,
                "suitability_percentage": 0.0,
                "confidence_percentage": 0.0,
                "status": "image_required",
                "available_features": [],
                "missing_features": ["chest X-ray image"],
                "required_feature_count": 1,
                "available_feature_count": 0,
                "note": "Upload an X-ray; report OCR features cannot route an image model.",
            },
            {
                "disease": "Eye Disease",
                "source": "Fundus/ocular image required",
                "suitability_score": 0.0,
                "suitability_percentage": 0.0,
                "confidence_percentage": 0.0,
                "status": "image_required",
                "available_features": [],
                "missing_features": ["fundus or ocular image"],
                "required_feature_count": 1,
                "available_feature_count": 0,
                "note": "Upload an ocular image; report OCR features cannot route an image model.",
            },
        ])
    return sorted(scores, key=lambda item: item["suitability_score"], reverse=True)
