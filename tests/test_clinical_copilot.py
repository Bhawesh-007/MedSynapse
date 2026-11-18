import json
import unittest
from unittest.mock import patch, MagicMock

from backend.services.clinical_copilot_service import (
    ClinicalCopilotService,
    ClinicalCopilotError,
)


SAMPLE_MODEL_RUN = {
    "id": "test-run-1234",
    "disease_type": "diabetes",
    "workflow_status": "awaiting_clinician_review",
    "prediction": {
        "predicted_class": 1,
        "risk_tier": "High Risk",
        "risk_probability": 0.74,
        "positive_class_probability": 0.74,
    },
    "clinical_report": {
        "clinical_inputs": [
            {"name": "Glucose", "value": 165.0, "unit": "mg/dL"},
            {"name": "BMI", "value": 34.2, "unit": "kg/m²"},
            {"name": "BloodPressure", "value": 90.0, "unit": "mmHg"},
        ],
        "explainability": {
            "method": "SHAP",
            "top_positive_contributors": [
                {"feature": "BMI", "patient_value": 34.2, "shap_value": 0.312},
                {"feature": "Glucose", "patient_value": 165.0, "shap_value": 0.185},
            ],
            "top_negative_contributors": [
                {"feature": "Pregnancies", "patient_value": 1, "shap_value": -0.045},
            ],
            "plain_language": {
                "sentences": [
                    "High BMI contributed the most to the elevated risk score.",
                    "Fasting glucose was also a significant positive factor.",
                ]
            },
        },
    },
    "clinician_decision": None,
}


class FakeCopilotResponse:
    def __init__(self, content_text: str):
        self.content_text = content_text

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return json.dumps({
            "id": "copilot-fake-id",
            "model": "openai/gpt-oss-20b",
            "choices": [{"message": {"role": "assistant", "content": self.content_text}}],
        }).encode("utf-8")


class ClinicalCopilotServiceTests(unittest.TestCase):
    def setUp(self):
        self.service = ClinicalCopilotService(
            api_key="fake-test-key",
            model="openai/gpt-oss-20b",
            timeout_seconds=10.0,
        )

    def test_suggestions_generation(self):
        diabetes_suggestions = self.service.generate_suggestions("diabetes", {})
        self.assertTrue(any("ADA" in s or "biomarkers" in s for s in diabetes_suggestions))

        heart_suggestions = self.service.generate_suggestions("heart", {})
        self.assertTrue(any("cardiac" in s or "Oldpeak" in s for s in heart_suggestions))

        xray_suggestions = self.service.generate_suggestions("pneumonia_xray", {})
        self.assertTrue(any("radiograph" in s or "lobar" in s for s in xray_suggestions))

    def test_build_grounding_context(self):
        context = self.service.build_grounding_context(SAMPLE_MODEL_RUN)
        self.assertIn("DISEASE MODULE: DIABETES", context)
        self.assertIn("High Risk", context)
        self.assertIn("Glucose: 165.0 mg/dL", context)
        self.assertIn("BMI (patient val=34.2, SHAP=0.312)", context)
        self.assertIn("High BMI contributed the most", context)

    def test_chat_unconfigured_raises_error(self):
        unconfigured_service = ClinicalCopilotService(api_key="")
        with self.assertRaises(ClinicalCopilotError) as ctx:
            unconfigured_service.chat(model_run=SAMPLE_MODEL_RUN, messages=[{"role": "user", "content": "Hello"}])
        self.assertIn("LLM provider is not configured", str(ctx.exception))

    @patch("urllib.request.urlopen")
    def test_chat_successful_call(self, mock_urlopen):
        expected_reply = "The primary driver of the High Risk tier is elevated BMI (34.2 kg/m²), which contributed +0.312 in SHAP attribution."
        mock_urlopen.return_value = FakeCopilotResponse(expected_reply)

        result = self.service.chat(
            model_run=SAMPLE_MODEL_RUN,
            messages=[{"role": "user", "content": "Why is the patient at high risk?"}],
        )

        self.assertIn("message", result)
        self.assertEqual(result["message"]["role"], "assistant")
        self.assertEqual(result["message"]["content"], expected_reply)
        self.assertTrue(len(result["suggestions"]) > 0)


if __name__ == "__main__":
    unittest.main()
