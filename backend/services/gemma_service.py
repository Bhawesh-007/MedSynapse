"""Local Gemma adapter for post-OCR diabetes feature extraction.

The adapter uses Ollama's local ``/api/generate`` contract.  It keeps Gemma
behind one small boundary: another local Gemma runtime only needs to provide
the same JSON response, or this file can be adapted without changing OCR/API
routes or the diabetes feature contract.
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.services.diabetes_feature_contract import (
    DiabetesFeatureContractError,
    build_diabetes_model_features,
    diabetes_extraction_prompt,
    diabetes_extraction_json_schema,
    missing_or_unverified_features,
    parse_gemma_diabetes_extraction,
)


class GemmaServiceError(RuntimeError):
    """A local Gemma request failed or did not honour the extraction contract."""


class GemmaService:
    """Call a local Gemma model after OCR has produced report text."""

    def __init__(
        self,
        base_url: str | None = None,
        model_name: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("GEMMA_BASE_URL", "http://127.0.0.1:11434")).rstrip("/")
        self.model_name = model_name or os.getenv("GEMMA_MODEL", "")
        self.timeout_seconds = timeout_seconds or float(os.getenv("GEMMA_TIMEOUT_SECONDS", "45"))

    @property
    def configured(self) -> bool:
        return bool(self.model_name)

    def extract_diabetes_features(self, ocr_text: str) -> dict[str, Any]:
        """Return validated diabetes evidence from existing OCR text.

        This does not run a prediction.  A response with missing fields is
        valid extraction output, but it is explicitly marked as not ready for
        inference so the doctor can complete the review.
        """

        if not self.configured:
            return {
                "status": "not_configured",
                "message": "Set GEMMA_MODEL to enable local Gemma extraction.",
                "features": {},
                "missing_or_unverified": [],
                "model_features": None,
            }

        if not ocr_text or not ocr_text.strip():
            raise GemmaServiceError("Cannot send empty OCR text to Gemma")

        response_payload = self._generate_json(ocr_text)
        try:
            features = parse_gemma_diabetes_extraction(response_payload)
        except DiabetesFeatureContractError as exc:
            raise GemmaServiceError(f"Gemma returned an invalid diabetes extraction: {exc}") from exc

        missing = missing_or_unverified_features(features)
        return {
            "status": "needs_review" if missing else "ready_for_inference",
            "message": (
                "Doctor review is required for missing or ambiguous fields."
                if missing
                else "All required diabetes features were extracted; doctor approval is still required."
            ),
            "features": {name: asdict(feature) for name, feature in features.items()},
            "missing_or_unverified": missing,
            "model_features": None if missing else build_diabetes_model_features(features),
        }

    def _generate_json(self, ocr_text: str) -> dict[str, Any]:
        prompt = f"{diabetes_extraction_prompt()}\n\nOCR REPORT TEXT:\n{ocr_text}"
        request_payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            # Ollama accepts a JSON Schema here.  Generic JSON mode permits
            # the model to drop keys; this schema requires all seven fields.
            "format": diabetes_extraction_json_schema(),
            "options": {"temperature": 0},
        }
        request = Request(
            f"{self.base_url}/api/generate",
            data=json.dumps(request_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                body = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            raise GemmaServiceError(f"Gemma service returned HTTP {exc.code}") from exc
        except URLError as exc:
            raise GemmaServiceError(
                f"Cannot reach local Gemma at {self.base_url}: {exc.reason}"
            ) from exc
        except (TimeoutError, json.JSONDecodeError) as exc:
            raise GemmaServiceError("Gemma service returned an unreadable response") from exc

        generated_json = body.get("response") if isinstance(body, dict) else None
        if not isinstance(generated_json, str):
            raise GemmaServiceError("Gemma response did not contain a JSON string in 'response'")

        try:
            parsed = json.loads(generated_json)
        except json.JSONDecodeError as exc:
            raise GemmaServiceError("Gemma response was not valid JSON") from exc
        if not isinstance(parsed, dict):
            raise GemmaServiceError("Gemma JSON must be an object")
        return parsed
