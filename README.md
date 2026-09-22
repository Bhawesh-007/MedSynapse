<div align="center">
  <h1>MedSynapse: AI Multi-Disease Prediction & Medical Report OCR 🏥</h1>
  <h3>🏆 Next-Gen AI Healthcare & Medical Diagnostics Project</h3>

  <p><i>"Revolutionizing Early Diagnostics with Automated Medical Report OCR & Multi-Modal Clinical AI"</i></p>

  <div>
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white" alt="FastAPI">
    <img src="https://img.shields.io/badge/React_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/Tesseract_OCR-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="OCR">
    <img src="https://img.shields.io/badge/TensorFlow_Keras3-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow">
    <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-Learn">
  </div>
</div>

---

## 🚀 Overview

**MedSynapse** is an AI-powered clinical screening and diagnostic platform designed to assist healthcare professionals and individuals in early disease detection and lab report analysis.

The system combines **Computer Vision**, **Machine Learning ensembles**, and **Document Intelligence (OCR)** into a unified clinical dashboard:
1. **Automated Lab Report OCR**: Drop any medical lab report (PDF or Image) to automatically extract Glucose, Blood Pressure, Insulin, BMI, Cholesterol, Heart Rate, and ECG indicators with confidence scoring.
2. **Multi-Disease Prediction Models**: Soft-voting ensembles and classification models for **Diabetes Mellitus** and **Coronary Heart Disease**.
3. **Medical Imaging Analysis**: Deep Convolutional Neural Networks for **Chest X-Ray (Pneumonia)** and **Cranial MRI (Brain Tumor 4-class differential)**.
4. **Clinical Risk Scoring & Reporting**: Animated circular risk gauges, biomarker impact breakdowns, and one-click printable / PDF medical summaries.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph User["👤 User / Clinician"]
        Browser["Web Browser"]
    end

    subgraph Frontend["🖥️  Frontend — React 18 + Vite SPA"]
        direction TB
        Navbar["Navbar & Tab Router"]
        subgraph Views["UI Views / Modules"]
            V_Home["🏠 Dashboard Home"]
            V_OCR["📄 OCR Lab Scanner"]
            V_Diab["🩸 Diabetes Workspace"]
            V_Heart["❤️  Cardiac Workspace"]
            V_XRay["🩻 X-Ray Analyzer"]
            V_MRI["🧠 MRI Analyzer"]
        end
        DiagCard["DiagnosticResultCard"]
        APIClient["API Service Client\n(api.js — fetch / FormData)"]

        Navbar --> Views
        Views --> DiagCard
        Views --> APIClient
    end

    subgraph Backend["⚡ Backend — FastAPI + Uvicorn"]
        direction TB
        Router["FastAPI App\n(CORS · Pydantic Validation · Error Handling)"]
        subgraph Endpoints["REST Endpoints"]
            EP_Health["GET  /api/health"]
            EP_Sample["GET  /api/sample-reports"]
            EP_OCR["POST /api/ocr/parse-report"]
            EP_Diab["POST /api/predict/diabetes"]
            EP_Heart["POST /api/predict/heart"]
            EP_XRay["POST /api/predict/xray"]
            EP_MRI["POST /api/predict/mri"]
        end
        StaticSPA["SPA Static File Server\n(/frontend/dist)"]

        Router --> Endpoints
        Router --> StaticSPA
    end

    subgraph Services["🧠 AI Service Layer"]
        direction LR
        subgraph OCREngine["Document Intelligence\nocr_service.py"]
            OCR_Extract["Text Extractor\n(PDF → PyMuPDF · Image → Tesseract)"]
            OCR_Preproc["Image Preprocessor\n(Grayscale · Contrast Enhance)"]
            OCR_Regex["Regex Parameter Matcher\n(13+ clinical biomarkers)"]
            OCR_Ready["Ready-Input Builder\n(diabetes / heart defaults)"]

            OCR_Extract --> OCR_Preproc --> OCR_Regex --> OCR_Ready
        end

        subgraph ModelSvc["Model Inference Service\nmodel_service.py  — Singleton"]
            direction TB
            ImgTransform["Image Transformer\n(EXIF · Alpha · Lanczos Resize · Float32 Norm)"]
            DiabInfer["Diabetes Predictor\n(Scaler → Ensemble → Risk Tier)"]
            HeartInfer["Heart Disease Predictor\n(Scaler → LogReg → Risk Tier)"]
            XRayInfer["X-Ray CNN Predictor\n(224×224 → CNN → Sigmoid)"]
            MRIInfer["Brain MRI Predictor\n(299×299 → Xception → Softmax 4-class)"]
            RiskGen["Clinical Risk & Recommendation Generator"]

            ImgTransform --> XRayInfer
            ImgTransform --> MRIInfer
            DiabInfer --> RiskGen
            HeartInfer --> RiskGen
            XRayInfer --> RiskGen
            MRIInfer --> RiskGen
        end
    end

    subgraph ModelStore["💾 Serialised Model Artefacts\n/models/"]
        M1["diabetes_model.pkl\ndiabetes_scaler.pkl"]
        M2["heart_model.pkl\nheart_scaler.pkl"]
        M3["xrays_pneumonia.keras\n(CNN · input 224×224×3)"]
        M4["brain_tumor_model.keras\n(Xception · input 299×299×3)"]
    end

    subgraph Notebooks["📓 Offline Training\n/notebooks/"]
        NB1["Final_Diabetes_Prediction.ipynb"]
        NB2["Final_Heart_Disease_Prediction.ipynb"]
        NB3["Final_Chest_XRay_Prediction.ipynb"]
        NB4["Final_Brain_Tumor_Prediction.ipynb"]
    end

    %% ── User ↔ Frontend ──────────────────────────────────
    Browser <-->|"HTTPS / localhost"| Frontend

    %% ── Frontend ↔ Backend ───────────────────────────────
    APIClient -->|"HTTP REST (JSON / multipart)"| Router

    %% ── Endpoints → Services ─────────────────────────────
    EP_OCR  --> OCR_Extract
    EP_Diab --> DiabInfer
    EP_Heart --> HeartInfer
    EP_XRay --> ImgTransform
    EP_MRI  --> ImgTransform

    %% ── Services → Model Store ───────────────────────────
    DiabInfer  --> M1
    HeartInfer --> M2
    XRayInfer  --> M3
    MRIInfer   --> M4

    %% ── Notebooks → Model Store (offline) ────────────────
    Notebooks -.->|"train → export"| ModelStore
```

> **Architecture at a Glance**
> | Layer | Technology | Responsibility |
> | :--- | :--- | :--- |
> | **Client / SPA** | React 18, Vite, Lucide | Interactive dashboard, file uploads, animated risk gauges, result cards |
> | **API Gateway** | FastAPI, Uvicorn, Pydantic | Routing, request validation, CORS, SPA serving |
> | **Document Intelligence** | PyMuPDF, Tesseract OCR, PIL | PDF/image text extraction, contrast enhancement, regex biomarker parsing |
> | **ML Inference** | Scikit-learn, NumPy | Diabetes (soft-voting ensemble) & Heart disease (Logistic Regression + Scaler) prediction |
> | **DL Vision Inference** | TensorFlow / Keras 3 | Pneumonia detection (CNN) & Brain tumor 4-class classification (Xception) |
> | **Model Storage** | `.pkl`, `.keras` files | Pre-trained weights & scalers; lazy-loaded singleton pattern |
> | **Offline Training** | Jupyter Notebooks | Dataset exploration, model training, and artefact export |

---

## 📑 Diagnostic Modules & AI Stack

| Module | Diagnostic Domain | Model Architecture | Key Biomarkers / Scans |
| :--- | :--- | :--- | :--- |
| 🩸 **Diabetes Mellitus** | Metabolic & Glycemic Risk | **Soft-Voting Ensemble** (RF + GradBoost + LR) | Glucose, Insulin, BMI, Blood Pressure, Age |
| ❤️ **Coronary Heart Disease** | Cardiovascular Disease | **Logistic Regression + Scaler** | Resting BP, Cholesterol, Max HR, Angina, ST Dep |
| 🩻 **Pneumonia Detection** | Pulmonary Imaging | **Deep CNN Vision Model** | Chest Radiograph (X-Ray) • Auto-transformed to (224, 224, 3) |
| 🧠 **Brain Tumor Classification** | Neuro-Oncology | **Xception Transfer Learning** | Cranial MRI Scan • Auto-transformed to (299, 299, 3) |
| 📄 **Smart Report OCR** | Document Intelligence | **Tesseract OCR + PyMuPDF** | PDF / Image Clinical Lab Reports |

---

## 🖼️ Automated Medical Image Transformation Pipeline

To ensure deep learning vision models execute seamlessly without shape mismatch errors, the application includes a dedicated preprocessing engine:
- **Arbitrary Size Handling**: Automatically accepts any input resolution or aspect ratio (e.g., `1920×1080`, `3000×2000`, `800×400`, `512×512`).
- **High-Fidelity Resampling**: Uses Lanczos interpolation (`Image.Resampling.LANCZOS`) to preserve fine anatomical boundaries and infiltrates.
- **EXIF Auto-Orientation**: Transposes camera/scanner orientation tags so images are evaluated in the correct medical orientation.
- **Color Channel & Alpha Blending**: Safely handles RGBA, Grayscale, CMYK, and indexed palettes by compositing over neutral black medical backgrounds.
- **Strict Tensor Standardization**: Output tensors are validated to exact dimensions:
  - **X-Ray Pneumonia CNN**: `(1, 224, 224, 3)` normalized to `float32 [0.0, 1.0]`
  - **Brain Tumor Xception**: `(1, 299, 299, 3)` normalized to `float32 [0.0, 1.0]`

---

## 🔄 Project Pipeline

The system has **three independent but interoperable pipelines** that share a common API gateway and result card component.

---

### Pipeline 1 — Smart Lab Report OCR

Converts any raw clinical document (PDF or image) into structured biomarker values ready to feed directly into Prediction Pipeline 2.

```mermaid
flowchart LR
    A(["📂 Input\nPDF / Image / Raw Text"]) --> B

    subgraph B["1 · Document Extraction"]
        B1{"File\nType?"}
        B1 -->|PDF| B2["PyMuPDF\nEmbedded text extraction"]
        B1 -->|Scanned PDF| B3["PyMuPDF render @ 200 DPI\n→ Tesseract OCR"]
        B1 -->|Image| B4["PIL Grayscale + Contrast ×1.8\n→ Tesseract OCR"]
        B1 -->|Raw Text| B5["Pass-through"]
    end

    B2 & B3 & B4 & B5 --> C

    subgraph C["2 · Clinical Parameter Extraction"]
        C1["Regex Matching Engine\n13+ biomarkers"]
        C2["Glucose · BP · Insulin · BMI\nAge · Sex · Skin Thickness · DPF\nChol · HR · FBS · CP · ECG\nExang · ST Depression"]
        C1 --> C2
    end

    C2 --> D

    subgraph D["3 · Structured Output Builder"]
        D1["Diabetes Ready-Input\n8 fields with defaults"]
        D2["Heart Ready-Input\n13 fields with defaults"]
        D3["Confidence Scores\n& Status Labels"]
    end

    D --> E(["✅ JSON Response\nparameters + ready_inputs"])
    E --> F(["🔁 Auto-fill\nDiabetes / Heart Workspace"])
```

---

### Pipeline 2 — Tabular ML Prediction  *(Diabetes & Heart Disease)*

Processes structured clinical biomarkers through scikit-learn models to produce a risk tier, probability score, contributing factors, and clinical recommendations.

```mermaid
flowchart LR
    A(["🔢 Input\nStructured Biomarkers\nJSON payload"]) --> B

    subgraph B["1 · Input Validation & Feature Engineering"]
        B1["Pydantic Schema Validation\nDiabetesInput / HeartInput"]
        B2["BMI Categorisation\n0=Underweight · 1=Normal\n2=Overweight · 3=Obese"]
        B1 --> B2
    end

    B2 --> C

    subgraph C["2 · Feature Scaling"]
        C1["StandardScaler\n.transform(input_array)\nLoaded from .pkl"]
    end

    C --> D

    subgraph D["3 · Model Inference"]
        D1["Scikit-learn Model\n.predict() → class label\n.predict_proba() → probabilities"]
        D2{{"🩸 Diabetes\nSoft-Voting Ensemble\n(RF + GradBoost + LR)"}}
        D3{{"❤️ Heart Disease\nLogistic Regression"}}
        D1 --- D2
        D1 --- D3
    end

    D --> E

    subgraph E["4 · Clinical Risk Analysis"]
        E1["Risk Probability → Risk Tier\nLow · Moderate · High"]
        E2["Contributing Factor Evaluation\nGlucose · BMI · BP · Cholesterol …"]
        E3["Recommendation Generator\n3-4 clinical action items"]
        E1 --> E2 --> E3
    end

    E --> F(["📊 JSON Response\nrisk_percentage · risk_tier\nfactors · recommendations"])
    F --> G(["🖥️ Animated Risk Gauge\n& Result Card"])
```

---

### Pipeline 3 — Medical Imaging AI  *(X-Ray & Brain MRI)*

Accepts arbitrary-resolution medical scan images and runs them through a standardised preprocessing pipeline before deep learning inference.

```mermaid
flowchart LR
    A(["🖼️ Input\nChest X-Ray or Brain MRI\nany size / format"]) --> B

    subgraph B["1 · Image Preprocessing\ntransform_image()"]
        B1["EXIF Transpose\nOrientation correction"]
        B2["Alpha / Transparency Handling\nComposite over black background"]
        B3["Color Mode Normalisation\nAny mode → RGB"]
        B4["High-Fidelity Resampling\nLanczos interpolation"]
        B5["Float32 Normalisation\nPixel values → 0.0 – 1.0"]
        B6["Batch Dimension Expand\nshape (1, H, W, 3)"]
        B1 --> B2 --> B3 --> B4 --> B5 --> B6
    end

    B6 --> C

    subgraph C["2 · Target Tensor Shape"]
        C1{{"🩻 X-Ray\n(1, 224, 224, 3)"}}
        C2{{"🧠 Brain MRI\n(1, 299, 299, 3)"}}
    end

    C --> D

    subgraph D["3 · Deep Learning Inference"]
        D1{{"🩻 Chest X-Ray CNN\nSigmoid → Pneumonia Probability"}}
        D2{{"🧠 Xception Transfer Learning\nSoftmax → 4-Class Probabilities"}}
        C1 --> D1
        C2 --> D2
    end

    D --> E

    subgraph E["4 · Result Interpretation"]
        E1["X-Ray: Pneumonia / Normal\nConfidence %"]
        E2["MRI: Glioma · Meningioma\nPituitary · No Tumor\nPer-class probability breakdown"]
        D1 --> E1
        D2 --> E2
    end

    E --> F(["📋 JSON Response\ndiagnosis · confidence\nclass_probabilities\nrecommendations"])
    F --> G(["🖥️ Visual Diagnosis Card\n& Probability Bars"])
```

---

## 📂 Project Structure

```
├── backend/              # FastAPI Application & Backend Core
│   ├── main.py           # API routes for OCR, Predictions & SPA serving
│   └── services/         # AI & Document Intelligence Core Services
│       ├── model_service.py # Unified ML/DL model inference & image transformation
│       └── ocr_service.py   # Tesseract OCR & clinical parameter extraction
├── frontend/             # Modern React + Vite Web Application
│   ├── src/
│   │   ├── components/   # Dashboard, OCR Studio, Disease Workspaces & Results
│   │   ├── services/     # Frontend API Client
│   │   ├── App.jsx       # Main Application & Navigation
│   │   └── index.css     # Clinical Glassmorphism Design System
│   └── package.json
├── models/               # Trained ML & Deep Learning Models (.pkl, .keras)
├── test_reports/         # Dummy Clinical Reports & Scans (PDF, PNG, TXT)
│   ├── sample_diabetic_report.pdf  # Comprehensive Diabetic Panel
│   ├── sample_cardiac_report.pdf   # Cardiovascular Stress Report
│   ├── sample_healthy_report.png   # Routine Wellness Screening Image
│   └── sample_prediabetic_report.txt # Raw Text Lab Report
├── notebooks/            # Jupyter training & research notebooks
├── scripts/              # Verification & utility scripts
│   └── verify_models.py  # Automated model verification script
├── run_app.py            # Unified application launcher (configurable port)
├── run_app.sh            # One-click startup shell script
├── requirements.txt      # Python dependencies
└── README.md             # Project Documentation
```

---

## 📡 REST API Reference

| Endpoint | Method | Payload / Form Data | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | — | System health status & model availability check |
| `/api/sample-reports` | `GET` | — | Preset clinical reports for instant OCR demo |
| `/api/ocr/parse-report` | `POST` | `file` (PDF/Image) or `raw_text` | Extracts 13+ clinical parameters via OCR |
| `/api/predict/diabetes` | `POST` | JSON: `DiabetesInput` | Evaluates glycemic risk & contributing factors |
| `/api/predict/heart` | `POST` | JSON: `HeartInput` | Evaluates coronary heart disease risk |
| `/api/predict/xray` | `POST` | `file` (Radiograph image) | Deep CNN inference for acute pneumonia |
| `/api/predict/mri` | `POST` | `file` (Cranial MRI image) | Xception 4-class intracranial tumor classification |

---

## 💻 Quick Start & Running Locally

### 1️⃣ Install Dependencies
```bash
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..
```

### 2️⃣ Verify AI Models (Optional)
```bash
python scripts/verify_models.py
```

### 3️⃣ Launch Application
```bash
# Runs on default port 8080 (or auto-selects next free port)
python run_app.py

# Or specify a custom port:
python run_app.py --port 5050
```
*Or use the shell script:*
```bash
./run_app.sh
```

Navigate to **`http://localhost:5050`** (or your selected port) in your browser.

---

## 🧪 Testing with Sample Data

The `test_reports/` directory contains sample clinical reports and scans for testing:
- **`sample_diabetic_report.pdf`**: Upload to **OCR Lab Report Scanner** to auto-extract parameters and run Diabetes prediction.
- **`sample_cardiac_report.pdf`**: Upload to test coronary heart disease parameter extraction.
- **`sample_healthy_report.png`**: Test OCR extraction on image-based lab reports.
- **Interactive 1-Click Demos**: Every disease workspace includes 1-click test scan and sample preset buttons for immediate evaluation without uploading files.

---

## 👥 Contributors

**Team - MEDSYNAPSE**

| Name | Role | Profile |
| :--- | :--- | :--- |
| **Shivam Maurya** | AI & Robotics Engineer | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/ShivamMaurya14) |

