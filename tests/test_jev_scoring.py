import unittest

from backend.services.breast_feature_contract import BREAST_FEATURE_ORDER
from backend.services.diabetes_feature_contract import RAW_FEATURE_ORDER
from backend.services.heart_feature_contract import HEART_FEATURE_ORDER
from backend.services.jev_scoring import score_disease_suitability


def _extracted(value=1.0, confidence=0.8):
    return {
        "value": value,
        "unit": None,
        "source_text": "report",
        "page": 1,
        "confidence": confidence,
        "status": "extracted",
    }


def _complete(feature_order):
    return {name: _extracted(float(index + 1)) for index, name in enumerate(feature_order)}


class JevGemmaEvidenceTests(unittest.TestCase):
    def test_all_mode_scores_every_tabular_contract_from_gemma_evidence(self):
        scores = score_disease_suitability(
            disease_type="all",
            gemma_features={
                "diabetes": _complete(RAW_FEATURE_ORDER),
                "heart": _complete(HEART_FEATURE_ORDER),
                "breast": _complete(BREAST_FEATURE_ORDER),
            },
        )
        by_disease = {score["disease"]: score for score in scores}

        self.assertEqual(by_disease["Diabetes Mellitus"]["required_feature_count"], 8)
        self.assertEqual(by_disease["Diabetes Mellitus"]["available_feature_count"], 8)
        self.assertEqual(by_disease["Coronary Heart Disease"]["available_feature_count"], 13)
        self.assertEqual(by_disease["Breast Cancer"]["available_feature_count"], 30)
        self.assertEqual(by_disease["Breast Cancer"]["status"], "ready_for_routing")
        self.assertIn("Gemma", by_disease["Breast Cancer"]["source"])

    def test_diabetes_profile_never_requires_dpf_and_derives_bmi_category(self):
        scores = score_disease_suitability(
            disease_type="diabetes",
            gemma_features={"diabetes": _complete(RAW_FEATURE_ORDER)},
        )
        diabetes = scores[0]

        self.assertNotIn("DiabetesPedigreeFunction", diabetes["missing_features"])
        self.assertIn("BMI_Cat", diabetes["available_features"])
        self.assertEqual(diabetes["confidence_percentage"], 80.0)

    def test_ocr_parameters_fill_only_features_gemma_could_not_confirm(self):
        scores = score_disease_suitability(
            {"glucose": {"value": 168, "confidence": 0.96, "status": "extracted"}},
            disease_type="diabetes",
            gemma_features={
                "diabetes": {
                    "Glucose": {"value": 150, "confidence": 0.5, "status": "extracted"},
                    "BMI": {"value": 33.4, "confidence": 0.9, "status": "extracted"},
                }
            },
        )
        diabetes = scores[0]

        self.assertIn("Glucose", diabetes["available_features"])
        self.assertIn("BMI", diabetes["available_features"])
        self.assertIn("BMI_Cat", diabetes["available_features"])
        self.assertNotIn("Glucose", diabetes["missing_features"])

    def test_breast_is_scored_in_all_mode_even_without_explicit_breast_selection(self):
        scores = score_disease_suitability(
            disease_type="all",
            gemma_features={"breast": _complete(BREAST_FEATURE_ORDER)},
        )
        breast = next(score for score in scores if score["disease"] == "Breast Cancer")

        self.assertEqual(breast["available_feature_count"], 30)
        self.assertEqual(breast["status"], "ready_for_routing")


if __name__ == "__main__":
    unittest.main()
