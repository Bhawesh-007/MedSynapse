import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image
from starlette.testclient import TestClient

from backend.services.breast_feature_contract import BREAST_FEATURE_ORDER


MOCK_FINAL_REPORT = {
    "title": "Clinical Diagnostic Screening Report",
    "screening_summary": "Screening summary verified by attending clinician.",
    "model_findings": "Model findings concordant with screening thresholds.",
    "explainability_summary": "Attribution analysis describes model behavior and does not establish medical causality.",
    "clinician_review": "Approved by Dr. Sarah Lin, MD (Attending).",
    "recommendations": ["Review clinically."],
    "limitations": ["Screening only."],
    "disclaimer": "Not a definitive diagnosis.",
}


class AllDiseasePipelinesTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.old_db = os.environ.get("MEDSYNAPSE_DATABASE_PATH")
        os.environ["MEDSYNAPSE_DATABASE_PATH"] = str(
            Path(self.temp_dir.name) / "test_pipelines.sqlite3"
        )
        from backend.database import initialize_database
        initialize_database()

        from backend.main import app, clinical_report_service
        self.client = TestClient(app)
        self.report_patcher = patch.object(
            clinical_report_service,
            "generate_final_report",
            return_value=MOCK_FINAL_REPORT,
        )
        self.report_patcher.start()

    def tearDown(self):
        self.report_patcher.stop()
        if self.old_db is None:
            os.environ.pop("MEDSYNAPSE_DATABASE_PATH", None)
        else:
            os.environ["MEDSYNAPSE_DATABASE_PATH"] = self.old_db
        self.temp_dir.cleanup()

    @staticmethod
    def _create_dummy_image_bytes(size=(100, 100)):
        img = Image.new("RGB", size, color=(128, 128, 128))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def _verify_review_and_report_flow(self, run_id, disease_key, is_tabular=True):
        # 1. Check initial state
        run_res = self.client.get(f"/api/model-runs/{run_id}")
        self.assertEqual(run_res.status_code, 200)
        run_data = run_res.json()["data"]
        self.assertEqual(run_data["workflow_status"], "awaiting_clinician_review")

        report = run_data["clinical_report"]
        self.assertIn("screening", report)
        self.assertIn("decision_trace", report)
        self.assertIn("explainability", report)

        # 2. Clinician Review (Approve)
        explainability = report.get("explainability", {})
        all_contribs = explainability.get("all_contributions", [])
        verified_features = [c["feature"] for c in all_contribs[:2]] if all_contribs else None

        review_payload = {
            "decision": "approved",
            "reviewed_by": "Dr. Sarah Lin, MD (Attending)",
            "comment": f"Screening audit verified for {disease_key}. Clinical metrics concordant.",
            "verified_features": verified_features,
        }
        review_res = self.client.post(f"/api/model-runs/{run_id}/review", json=review_payload)
        self.assertEqual(review_res.status_code, 200)
        self.assertEqual(review_res.json()["data"]["workflow_status"], "clinician_approved")

        # 3. Final Report Narrative Generation
        gen_res = self.client.post(
            "/api/reports/generate-narrative",
            json={"report": {"model_run_id": run_id}}
        )
        self.assertEqual(gen_res.status_code, 200)
        final_doc = gen_res.json()
        self.assertTrue(final_doc["success"])
        self.assertIn("data", final_doc)

    def test_pipeline_1_diabetes(self):
        payload = {
            "pregnancies": 2,
            "glucose": 135.0,
            "blood_pressure": 75.0,
            "skin_thickness": 22.0,
            "insulin": 90.0,
            "bmi": 28.4,
            "dpf": 0.45,
            "age": 42.0,
        }
        res = self.client.post("/api/predict/diabetes", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "diabetes", is_tabular=True)

    def test_pipeline_2_heart(self):
        payload = {
            "age": 55, "sex": 1, "cp": 1, "trestbps": 130, "chol": 230,
            "fbs": 0, "restecg": 0, "thalach": 145, "exang": 0,
            "oldpeak": 1.2, "slope": 1, "ca": 1, "thal": 2
        }
        res = self.client.post("/api/predict/heart", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "heart", is_tabular=True)

    def test_pipeline_3_pneumonia(self):
        img_bytes = self._create_dummy_image_bytes((224, 224))
        files = {"file": ("chest_xray.png", img_bytes, "image/png")}
        res = self.client.post("/api/predict/xray", files=files)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "pneumonia", is_tabular=False)

    def test_pipeline_4_brain_tumor(self):
        img_bytes = self._create_dummy_image_bytes((224, 224))
        files = {"file": ("brain_mri.png", img_bytes, "image/png")}
        res = self.client.post("/api/predict/brain-tumor", files=files)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "brain_tumor", is_tabular=False)

    def test_pipeline_5_breast_cancer(self):
        features = {f: 1.0 for f in BREAST_FEATURE_ORDER}
        res = self.client.post("/api/predict/breast-cancer", json={"features": features})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "breast", is_tabular=True)

    def test_pipeline_6_liver_disease(self):
        payload = {
            "age": 48.0,
            "gender": 1,
            "total_bilirubin": 1.4,
            "direct_bilirubin": 0.5,
            "alkaline_phosphotase": 210.0,
            "alamine_aminotransferase": 45.0,
            "aspartate_aminotransferase": 48.0,
            "total_protiens": 6.7,
            "albumin": 3.2,
            "ag_ratio": 0.95
        }
        res = self.client.post("/api/predict/liver", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "liver", is_tabular=True)

    def test_pipeline_7_kidney_stone(self):
        img_bytes = self._create_dummy_image_bytes((150, 150))
        files = {"file": ("kidney_ct.png", img_bytes, "image/png")}
        res = self.client.post("/api/predict/kidney-stone", files=files)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "kidney_stone", is_tabular=False)

    def test_pipeline_8_skin_cancer(self):
        img_bytes = self._create_dummy_image_bytes((28, 28))
        files = {"file": ("skin_dermoscopy.png", img_bytes, "image/png")}
        res = self.client.post("/api/predict/skin-cancer", files=files)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "skin_cancer", is_tabular=False)

    def test_pipeline_9_retinal_eye_disease(self):
        img_bytes = self._create_dummy_image_bytes((224, 224))
        files = {"file": ("retinal_fundus.png", img_bytes, "image/png")}
        res = self.client.post("/api/predict/eye", files=files)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        run_id = data["model_run_id"]
        self.assertTrue(run_id)
        self._verify_review_and_report_flow(run_id, "eye", is_tabular=False)


if __name__ == "__main__":
    unittest.main()
