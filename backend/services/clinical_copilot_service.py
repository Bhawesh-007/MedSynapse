"""Clinician-facing Explainable AI (XAI) & Clinical Copilot Service.

Provides interactive clinical decision support grounded strictly in the active
model run's inputs, predictions, SHAP attribution, and Grad-CAM evidence.
"""

from __future__ import annotations

import json
import os
import socket
import urllib.error
import urllib.request
from typing import Any


GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b"


class ClinicalCopilotError(RuntimeError):
    """Raised when copilot configuration, validation, or transport fails."""


class ClinicalCopilotService:
    """Conversational clinical decision-support copilot for reviewing doctors."""

    def __init__(
        self,
        *,
        api_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.api_url = (
            api_url if api_url is not None else (os.getenv("LLM_API_URL") or GROQ_CHAT_COMPLETIONS_URL)
        ).strip()
        self.api_key = (
            api_key if api_key is not None else (os.getenv("LLM_API_KEY") or os.getenv("GROQ_API_KEY") or "")
        ).strip()
        self.model = (
            model if model is not None else (os.getenv("LLM_MODEL") or DEFAULT_GROQ_MODEL)
        ).strip()
        configured_timeout = timeout_seconds or os.getenv("LLM_TIMEOUT_SECONDS") or 30
        try:
            self.timeout_seconds = float(configured_timeout)
        except (TypeError, ValueError) as exc:
            raise ClinicalCopilotError("LLM_TIMEOUT_SECONDS must be numeric.") from exc
        if not 1 <= self.timeout_seconds <= 120:
            raise ClinicalCopilotError("LLM_TIMEOUT_SECONDS must be between 1 and 120.")

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.model)

    def generate_suggestions(self, disease_type: str, prediction: dict[str, Any]) -> list[str]:
        """Return context-tailored quick questions for the clinician."""
        disease = (disease_type or "").lower()
        if "diabetes" in disease:
            return [
                "Which biomarkers contributed most to this risk score?",
                "How do these values compare with ADA screening guidelines?",
                "Draft a concise clinical review note for sign-off.",
                "What would be the effect if BMI was in the normal range?",
            ]
        if "heart" in disease:
            return [
                "What clinical parameters are driving this cardiac risk?",
                "Explain the significance of the ST-depression (Oldpeak) value.",
                "Draft a clinical review note for cardiologist consultation.",
                "What confirmatory diagnostic tests are recommended next?",
            ]
        if "pneumonia" in disease or "xray" in disease:
            return [
                "Which anatomical regions in the radiograph showed high attention?",
                "How do the model findings correlate with typical lobar consolidation?",
                "Draft a preliminary screening note for the medical team.",
                "What differential causes should be considered for these opacities?",
            ]
        if "breast" in disease:
            return [
                "Which morphological features had the highest positive SHAP impact?",
                "How does the model distinguish benign versus malignant patterns here?",
                "Draft a clinical evaluation note for the biopsy review team.",
            ]
        return [
            "Explain the primary factors influencing this result.",
            "Compare observed parameters with normal reference ranges.",
            "Draft a concise clinical review note for this case.",
        ]

    def build_grounding_context(self, model_run: dict[str, Any]) -> str:
        """Serialize model-run data into a dense, auditable clinical grounding text."""
        disease_type = model_run.get("disease_type", "Unknown")
        prediction = model_run.get("prediction", {})
        clinical_report = model_run.get("clinical_report", {})
        explainability = clinical_report.get("explainability", {})
        clinical_inputs = clinical_report.get("clinical_inputs", [])
        decision = model_run.get("clinician_decision")

        context_lines = [
            f"DISEASE MODULE: {disease_type.upper()}",
            f"WORKFLOW STATUS: {model_run.get('workflow_status', 'awaiting_clinician_review')}",
        ]

        # Prediction details
        risk_tier = prediction.get("risk_tier") or prediction.get("prediction_label") or "Undetermined"
        prob = (
            prediction.get("positive_class_probability")
            or prediction.get("risk_probability")
            or prediction.get("pneumonia_probability")
        )
        prob_str = f"{prob * 100:.1f}%" if isinstance(prob, (int, float)) else "N/A"
        predicted_class = prediction.get("predicted_class", prediction.get("prediction"))
        context_lines.append(
            f"MODEL PREDICTION: Class={predicted_class}, Risk Tier={risk_tier}, Confidence/Probability={prob_str}"
        )

        # Patient clinical measurements
        if clinical_inputs:
            inputs_str = ", ".join(
                f"{item.get('name', 'param')}: {item.get('value')} {item.get('unit') or ''}".strip()
                for item in clinical_inputs
            )
            context_lines.append(f"PATIENT MEASUREMENTS: {inputs_str}")

        # Explainability evidence (SHAP)
        if explainability:
            method = explainability.get("method", "Unknown")
            context_lines.append(f"EXPLAINABILITY METHOD: {method}")

            top_pos = explainability.get("top_positive_contributors", [])
            if top_pos:
                pos_str = ", ".join(
                    f"{item.get('feature')} (patient val={item.get('patient_value')}, SHAP={item.get('shap_value')})"
                    for item in top_pos[:4]
                )
                context_lines.append(f"TOP RISK-INCREASING CONTRIBUTORS (SHAP > 0): {pos_str}")

            top_neg = explainability.get("top_negative_contributors", [])
            if top_neg:
                neg_str = ", ".join(
                    f"{item.get('feature')} (patient val={item.get('patient_value')}, SHAP={item.get('shap_value')})"
                    for item in top_neg[:4]
                )
                context_lines.append(f"TOP RISK-REDUCING CONTRIBUTORS (SHAP < 0): {neg_str}")

            plain_sentences = (
                explainability.get("plain_language", {}).get("sentences", [])
            )
            if plain_sentences:
                context_lines.append(
                    "DETERMINISTIC EXPLANATION SUMMARY: " + " ".join(plain_sentences)
                )

        # Clinician decision if exists
        if decision:
            context_lines.append(
                f"RECORDED CLINICIAN DECISION: {decision.get('decision')} by {decision.get('reviewed_by')} (Note: {decision.get('comment') or 'None'})"
            )

        return "\n".join(context_lines)

    def chat(
        self,
        *,
        model_run: dict[str, Any],
        messages: list[dict[str, str]],
    ) -> dict[str, Any]:
        """Conduct a grounded, multi-turn clinical copilot consultation."""
        if not self.configured:
            raise ClinicalCopilotError(
                "LLM provider is not configured. Please set LLM_API_KEY in your environment."
            )

        grounding_context = self.build_grounding_context(model_run)
        disease_type = model_run.get("disease_type", "")
        prediction = model_run.get("prediction", {})
        suggestions = self.generate_suggestions(disease_type, prediction)

        system_prompt = (
            "You are the MedSynapse Clinical Copilot, an AI clinical decision-support and "
            "Explainable AI (XAI) assistant for licensed medical practitioners and researchers.\n\n"
            "PATIENT & MODEL AUDIT CONTEXT:\n"
            f"```\n{grounding_context}\n```\n\n"
            "CRITICAL CLINICAL SAFETY RULES:\n"
            "1. Ground all answers strictly in the Patient & Model Audit Context above. Never invent, "
            "assume, or hallucinate lab numbers or patient attributes not present in the record.\n"
            "2. Never claim that the patient definitively 'has' or 'is diagnosed with' a disease. "
            "Always describe findings as AI screening probabilities, risk assessments, or feature attributions.\n"
            "3. When discussing SHAP values or Grad-CAM heatmaps, explain that feature attribution "
            "reflects statistical model influence for this specific input vector and does not prove medical causality.\n"
            "4. Do not prescribe drugs, dosages, or changes in medication. Frame actionable items around "
            "recommended confirmatory clinical guidelines (e.g. ADA, AHA, WHO) and physician evaluation.\n"
            "5. If the clinician asks to draft a review note, provide a concise, high-density, professional "
            "medical paragraph suitable for documentation or sign-off, summarizing key risk drivers and limitations.\n"
            "6. Keep responses clear, structured, and clinically professional."
        )

        # Keep context window compact: take at most the last 8 conversational messages
        recent_messages = messages[-8:] if len(messages) > 8 else messages

        groq_messages = [{"role": "system", "content": system_prompt}]
        for msg in recent_messages:
            role = msg.get("role", "user")
            content = msg.get("content", "").strip()
            if role in ("user", "assistant") and content:
                groq_messages.append({"role": role, "content": content})

        request_body = {
            "model": self.model,
            "temperature": 0.2,
            "max_completion_tokens": 1024,
            "messages": groq_messages,
        }

        request = urllib.request.Request(
            self.api_url,
            data=json.dumps(request_body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "MedSynapse/2.0-Copilot",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            try:
                err_body = json.loads(exc.read().decode("utf-8"))
                err_msg = err_body.get("error", {}).get("message") or str(err_body)
            except Exception:
                err_msg = str(exc)
            raise ClinicalCopilotError(
                f"Groq API call failed with HTTP {exc.code}: {err_msg}"
            ) from exc
        except (urllib.error.URLError, socket.timeout, TimeoutError) as exc:
            raise ClinicalCopilotError(f"Groq API connection failed: {exc}") from exc
        except json.JSONDecodeError as exc:
            raise ClinicalCopilotError("Groq returned a non-JSON response.") from exc

        try:
            assistant_content = payload["choices"][0]["message"]["content"]
            if not isinstance(assistant_content, str):
                raise TypeError("message content is not text")
        except (KeyError, IndexError, TypeError) as exc:
            raise ClinicalCopilotError("Invalid chat completion response from Groq.") from exc

        return {
            "message": {
                "role": "assistant",
                "content": assistant_content.strip(),
            },
            "suggestions": suggestions,
            "provider_model": payload.get("model") or self.model,
        }
