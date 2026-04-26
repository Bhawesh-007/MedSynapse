import os
import sys
import io
import traceback
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Ensure project root in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from backend.services.ocr_service import MedicalOCREngine
    from backend.services.model_service import ModelService
except ImportError:
    from services.ocr_service import MedicalOCREngine
    from services.model_service import ModelService

app = FastAPI(
    title="MedSynapse Clinical Diagnostic API",
    description="AI-driven multi-disease diagnostics with automated OCR medical report parameter extraction.",
    version="2.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_service = ModelService.get_instance()

# Pydantic Schemas
class DiabetesInput(BaseModel):
    pregnancies: Optional[float] = 1
    glucose: float = 120
    blood_pressure: float = 70
    skin_thickness: Optional[float] = 20
    insulin: Optional[float] = 80
    bmi: float = 25.0
    dpf: Optional[float] = 0.5
    age: float = 35

class HeartInput(BaseModel):
    age: float = 52
    sex: int = 1
    cp: int = 0
    trestbps: float = 125
    chol: float = 210
    fbs: Optional[int] = 0
    restecg: Optional[int] = 0
    thalach: float = 150
    exang: Optional[int] = 0
    oldpeak: Optional[float] = 0.8
    slope: Optional[int] = 1
    ca: Optional[int] = 0
    thal: Optional[int] = 2


@app.get("/api/health")
def health_check():
    models_status = {
        "diabetes_model": os.path.exists(os.path.join(BASE_DIR, "models", "diabetes_model.pkl")),
        "heart_model": os.path.exists(os.path.join(BASE_DIR, "models", "heart_model.pkl")),
        "xray_pneumonia_model": os.path.exists(os.path.join(BASE_DIR, "models", "xrays_pneumonia.keras")),
        "brain_tumor_model": os.path.exists(os.path.join(BASE_DIR, "models", "brain_tumor_model.keras")),
    }
    return {
        "status": "online",
        "system": "MedSynapse AI v2.0",
        "ocr_engine": "Tesseract OCR + PyMuPDF Active",
        "models": models_status
    }


@app.get("/api/sample-reports")
def get_sample_reports():
    """Provides sample clinical lab reports for instant 1-click OCR demonstration."""
    return [
        {
            "id": "sample-diabetic",
            "title": "Comprehensive Diabetic Metabolic Panel",
            "patient": "Eleanor Vance (Female, Age 42)",
            "disease_target": "diabetes",
            "sample_text": """METROPOLITAN CLINICAL LABORATORIES
Patient Name: Eleanor Vance
Age: 42 yrs    Gender: Female    Pregnancies: 2
Date of Collection: 14-Aug-2026

METABOLIC & GLYCEMIC PROFILE:
- Fasting Blood Sugar (FBS / Glucose): 154 mg/dL  [Reference: 70 - 99 mg/dL] - HIGH
- Serum Fasting Insulin: 38.2 μU/mL  [Reference: 2.6 - 24.9 μU/mL] - ELEVATED
- HbA1c (Glycated Hemoglobin): 7.6 %  [Reference: 4.0 - 5.6 %]
- Blood Pressure (Resting BP): 136/88 mm Hg  [Reference: < 120/80 mm Hg]
- Body Mass Index (BMI): 31.4 kg/m2  (Weight: 84 kg, Height: 164 cm)
- Triceps Skinfold Thickness: 28 mm
- Diabetes Pedigree Score: 0.65
""",
            "expected_outcome": "High Risk of Diabetes (FBS: 154 mg/dL, BMI: 31.4)"
        },
        {
            "id": "sample-cardiac",
            "title": "Cardiovascular Stress & Lipid Evaluation",
            "patient": "Arthur Pendelton (Male, Age 58)",
            "disease_target": "heart",
            "sample_text": """ST. JUDE CARDIOLOGY INSTITUTE
Patient: Arthur Pendelton    Age: 58    Sex: Male
Clinical Indications: Chest tightness on exertion, shortness of breath

LABORATORY & CARDIAC FINDINGS:
- Resting Blood Pressure (trestbps): 148/92 mm Hg
- Serum Total Cholesterol: 265 mg/dL  [Reference: < 200 mg/dL] - HIGH
- Fasting Blood Glucose: 130 mg/dL
- Maximum Heart Rate Achieved (thalach): 128 bpm
- Chest Pain Presentation: Typical Angina (Type 0)
- Exercise Induced Angina: Positive (Yes)
- Resting Electrocardiogram (ECG): ST-T wave abnormality
- ST Depression induced by exercise (oldpeak): 2.4 mm
- Slope of peak ST segment: Flat (1)
- Major vessels colored by fluoroscopy (ca): 2
- Thalassemia: Reversable Defect (3)
""",
            "expected_outcome": "High Risk of Coronary Heart Disease (Chol: 265, ST Dep: 2.4)"
        },
        {
            "id": "sample-healthy",
            "title": "Routine Executive Wellness Screening",
            "patient": "Sophia Chen (Female, Age 29)",
            "disease_target": "diabetes",
            "sample_text": """GLOBAL HEALTHCARE DIAGNOSTICS
Patient Name: Sophia Chen    Age: 29    Sex: Female    Pregnancies: 0
Annual Wellness Examination

TEST RESULTS:
- Fasting Blood Glucose: 86 mg/dL  [Normal: 70 - 99 mg/dL]
- Blood Pressure: 115/75 mm Hg  [Optimal: < 120/80 mm Hg]
- Total Cholesterol: 168 mg/dL  [Desirable: < 200 mg/dL]
- Serum Fasting Insulin: 8.4 μU/mL  [Normal: 2.6 - 24.9 μU/mL]
- Body Mass Index (BMI): 21.8 kg/m2  [Normal: 18.5 - 24.9 kg/m2]
- Max Heart Rate (Pulse): 165 bpm
- ECG: Normal Sinus Rhythm
- Skin Thickness: 18 mm
- Diabetes Pedigree Function: 0.22
""",
            "expected_outcome": "Low Risk / Optimal Healthy Baseline"
        }
    ]


@app.post("/api/ocr/parse-report")
async def parse_medical_report(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    disease_type: str = Form("all")
):
    """Parses an uploaded lab report (PDF/image) or raw report text and extracts clinical parameters."""
    try:
        extracted_text = ""
        filename = ""
        
        if file is not None:
            filename = file.filename
            contents = await file.read()
            if len(contents) == 0:
                raise HTTPException(status_code=400, detail="Uploaded file is empty.")
            extracted_text = MedicalOCREngine.extract_text(contents, filename)
        elif raw_text:
            extracted_text = raw_text
        else:
            raise HTTPException(status_code=400, detail="Please upload a file or provide report text.")

        if not extracted_text.strip():
            return {
                "success": False,
                "message": "No text could be extracted from the document.",
                "raw_text": "",
                "parameters": {},
                "extracted_count": 0
            }

        parsed_data = MedicalOCREngine.parse_report_parameters(extracted_text, disease_type)
        return {
            "success": True,
            "filename": filename,
            "raw_text": parsed_data["raw_text"],
            "line_count": parsed_data["line_count"],
            "extracted_count": parsed_data["extracted_count"],
            "parameters": parsed_data["parameters"],
            "ready_inputs": parsed_data["ready_inputs"]
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")


@app.post("/api/predict/diabetes")
def predict_diabetes_risk(payload: DiabetesInput):
    try:
        result = model_service.predict_diabetes(payload.model_dump())
        return {"success": True, "data": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Diabetes prediction failed: {str(e)}")


@app.post("/api/predict/heart")
def predict_heart_risk(payload: HeartInput):
    try:
        result = model_service.predict_heart(payload.model_dump())
        return {"success": True, "data": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Heart disease prediction failed: {str(e)}")


@app.post("/api/predict/xray")
async def predict_xray(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded X-Ray image is empty.")
        result = model_service.predict_xray(contents)
        return {"success": True, "data": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"X-Ray analysis failed: {str(e)}")


@app.post("/api/predict/mri")
async def predict_mri(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded MRI scan is empty.")
        result = model_service.predict_mri(contents)
        return {"success": True, "data": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Brain MRI analysis failed: {str(e)}")


# Serve built frontend static assets in production
dist_dir = os.path.join(BASE_DIR, "frontend", "dist")
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept /api routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
