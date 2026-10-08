<div align="center">
  <h1>MedSynapse: Agentic LLM Orchestration of Multi-Disease Diagnostic Models 🏥</h1>
  <h3>A Unified Framework for Explainable, Confidence-Aware, and Guideline-Grounded Medical Reporting</h3>

  <p><i>"Bridging Fragmented Single-Disease Classifiers into an Autonomous, Multi-Modal Agentic Diagnostic System with Fused Multi-Method Explainability (XAI)"</i></p>

  <div>
    <img src="https://img.shields.io/badge/Architecture-LLM--Agent_Orchestration-8A2BE2?style=for-the-badge&logo=openai&logoColor=white" alt="Agentic LLM">
    <img src="https://img.shields.io/badge/Explainability-SHAP_+_LIME_+_Grad--CAM-ff4b4b?style=for-the-badge" alt="XAI">
    <img src="https://img.shields.io/badge/Modules-9_Disease_Backbone-00b4d8?style=for-the-badge" alt="9 Modules">
    <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch">
    <img src="https://img.shields.io/badge/TensorFlow_Keras-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow">
    <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-Learn">
    <img src="https://img.shields.io/badge/Jupyter-Notebooks-F37626?style=for-the-badge&logo=jupyter&logoColor=white" alt="Jupyter">
  </div>
</div>

---

## 📖 Research Abstract & Clinical Motivation

Modern healthcare AI systems largely operate as isolated, single-disease classifiers that output raw, uncalibrated probability scores without clinically interpretable context. In real clinical workflows, patients rarely present with a single, neatly isolated concern, and clinicians require transparent evidence, counterfactual reasoning, and guideline alignment rather than black-box probabilities.

**MedSynapse** introduces an **agentic, multi-modal diagnostic framework** unifying **nine disease-specific machine learning and deep learning modules**—spanning metabolic, cardiovascular, pulmonary, neuro-oncological, oncological, hepatic, renal, dermatological, and ophthalmic domains—under a single coordinating Large Language Model (LLM) agent.

The system ingests **multi-modal patient inputs** (clinical text, spoken audio, radiologic/photographic imaging, and lab reports), dynamically routes queries to the relevant disease backbones, and enriches predictions through a **fused multi-method explainability layer (SHAP, LIME, Grad-CAM, counterfactuals)**. The LLM agent synthesizes cross-module correlations (e.g., linking diabetic and renal risk signals), grounds findings in clinical guidelines, and generates a calibrated, confidence-aware clinical summary with quantified hallucination safeguards.

---

## 🏗️ System Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │              Multi-Modal Patient Input Ingestion       │
                  │   [Symptoms Text]  [Spoken Audio]  [Scans]  [Lab OCR]  │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │         LLM Agent: Confidence-Aware Routing            │
                  │     (Intent Recognition • Modality Triage • NER)       │
                  └─────────┬──────────────────────────────────┬───────────┘
                            │                                  │
           Tabular Clinical Data                      Medical Scans & Imaging
                            ▼                                  ▼
      ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
      │   Tabular Diagnostic Modules      │      │     Vision Diagnostic Modules     │
      │  • M1: Diabetes Mellitus          │      │  • M3: Pneumonia (Chest X-Ray)    │
      │  • M2: Coronary Heart Disease     │      │  • M4: Brain Tumor (Cranial MRI)  │
      │  • M5: Breast Cancer (FNA)        │      │  • M7: Kidney Stone (CT Imaging)  │
      │  • M6: Liver Disease (LFT)        │      │  • M8: Skin Cancer (Dermoscopy)   │
      │                                   │      │  • M9: Eye Diseases (Fundus)      │
      └─────────────────┬─────────────────┘      └─────────────────┬─────────────────┘
                        │                                          │
                        ▼                                          ▼
      ┌───────────────────────────────────┐      ┌───────────────────────────────────┐
      │       Tabular XAI Engine          │      │        Vision XAI Engine          │
      │   SHAP • LIME • DiCE (Counter-    │      │  Grad-CAM/++ • Integrated Grads   │
      │   factuals) • Anchor Explanations │      │  DeepSHAP • Lesion Localization   │
      └─────────────────┬─────────────────┘      └─────────────────┬─────────────────┘
                        │                                          │
                        └─────────────────────┬────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │    Structured Evidence Fusion & Uncertainty Engine     │
                  │  (SHAP-LIME Agreement • Conformal Calibration / ECE)   │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │      LLM Agent: Cross-Module Correlation Reasoning     │
                  │  • Diabetic Nephropathy Link (Diabetes + Kidney)       │
                  │  • Diabetic Retinopathy Link (Diabetes + Eye)          │
                  │  • Cardio-Renal Metabolic Syndrome Link                │
                  │  • Guideline Retrieval Grounding (AACE / AHA / WHO)    │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │    Calibrated, Hallucination-Checked Clinical Report   │
                  │ (Confidence-Aware Phrasing • Biomarkers • Action Plan) │
                  └────────────────────────────────────────────────────────┘
```

---

## 🔬 Core Contributions (as detailed in research paper)

1. **Multi-Modal Input Ingestion**: Ingests free-text clinical complaints, spoken audio via Automatic Speech Recognition (with word-level confidence propagation), high-resolution medical imaging, and digitized multi-format clinical lab reports.
2. **9-Module Multi-Specialty Diagnostic Backbone**: Integrates nine validated machine learning and deep learning architectures covering metabolic, cardiovascular, oncological, hepatic, renal, dermatological, ophthalmic, and pulmonary conditions.
3. **Fused Multi-Method Explainability (XAI)**: Replaces isolated single-method explanations with a fused evidence representation:
   - **Tabular**: Kernel/Tree SHAP, LIME, Counterfactuals (DiCE), Anchor explanations, and SHAP interaction values.
   - **Imaging**: Grad-CAM/Grad-CAM++, Integrated Gradients, DeepSHAP/GradientSHAP, and lesion localization.
   - **Evidence Fusion**: Merges feature attributions, counterfactual changes, and SHAP-vs-LIME rank agreement into a unified structured JSON block before prompting the LLM.
4. **LLM-as-Agent Orchestration**: Implements confidence-weighted autonomous routing and cross-module clinical reasoning (e.g., recognizing co-occurring diabetic, hypertensive, and renal distress).
5. **Calibrated Uncertainty & Hallucination Mitigation**: Uses Expected Calibration Error (ECE), conformal prediction, and Monte Carlo dropout instead of raw softmax probabilities. Constrains the LLM to ground all findings strictly on structured evidence and retrieved clinical guidelines.
6. **End-to-End Evaluation Framework**: Validates both model-level predictive accuracy (AUC-ROC, F1, calibration) and clinical report quality (factual consistency, clarity, hallucination rate, and clinician usefulness).

---

## 📊 Empirical Diagnostic Performance Summary

The benchmarked evaluation metrics across all 9 clinical diagnostic modules are summarized below:

| Module ID | Diagnostic Domain | Clinical Target | Architecture / Algorithm | Test Accuracy | Precision | Recall / Sens. | F1-Score | AUC-ROC | Artifact Bundle | Documentation |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **M1** | Metabolic | Diabetes Mellitus | Soft-Voting Ensemble (RF+GB+LR) | **74.68%** | 0.77 | 0.75 | 0.74 | 0.82 | `diabetes_artifacts.zip` | [01_diabetes_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/01_diabetes_prediction.md) |
| **M2** | Cardiology | Coronary Heart Disease | Logistic Regression + Scaler | **85.25%** | 0.86 | 0.85 | 0.85 | 0.90 | `heart_artifacts.zip` | [02_heart_disease_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/02_heart_disease_prediction.md) |
| **M3** | Pulmonology | Pneumonia (Chest X-Ray) | Deep CNN with Dropout/BN | **90.38%** | 0.93 | 0.88 | 0.91 | 0.94 | `chest_xray_artifacts.zip` | [03_chest_xray_pneumonia_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/03_chest_xray_pneumonia_prediction.md) |
| **M4** | Neuro-Oncology | Brain Tumor (4-Class MRI) | Xception Deep Transfer Learning | **95.25%** | 0.96 | 0.95 | 0.95 | 0.98 | `brain_tumor_artifacts.zip` | [04_brain_tumor_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/04_brain_tumor_prediction.md) |
| **M5** | Oncology | Breast Cancer (FNA) | PCA + GridSearch LogReg / Ensemble | **95.91%** | 0.97 | 0.96 | 0.97 | 0.99 | `breast_cancer_artifacts.zip` | [05_breast_cancer_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/05_breast_cancer_prediction.md) |
| **M6** | Hepatology | Liver Disease (LFT Panel) | Random Forest / GBDT / XGBoost | **72.10%** | 0.74 | 0.72 | 0.76 | 0.77 | `liver_disease_artifacts.zip` | [06_liver_disease_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/06_liver_disease_prediction.md) |
| **M7** | Nephrology | Kidney Stone / Pathology (4-Class CT) | U-Net Classifier & EfficientNetB0 | **99.72%** | 1.00 | 1.00 | 1.00 | 1.00 | `kidney_stone_artifacts.zip` | [07_kidney_stone_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/07_kidney_stone_prediction.md) |
| **M8** | Dermatology | Skin Cancer (7-Class HAM10000) | ResNet-50 Deep Transfer Learning | **88.40%** | 0.88 | 0.87 | 0.87 | 0.95 | `skin_cancer_artifacts.zip` | [08_skin_cancer_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/08_skin_cancer_prediction.md) |
| **M9** | Ophthalmology | Retinal Eye Disease (Multi-Class) | PyTorch ResNet-18 Deep Transfer Learning | **93.75%** | 0.95 | 0.94 | 0.94 | 0.98 | `eye_disease_artifacts.zip` | [09_eye_disease_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/09_eye_disease_prediction.md) |

---

## 📑 The 9 Diagnostic Modules & Research Notebook Suite

All nine modules are organized with standardized research notebooks located in [`notebooks/`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks):

| Module ID | Diagnostic Domain | Clinical Condition | Input Modality | Architecture / Algorithm | Research Notebook |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | **Metabolic** | Diabetes Mellitus | Tabular (Glucose, Insulin, BMI, BP, Age) | Soft-Voting Ensemble (RF + GradBoost + LR) | [Final_Diabetes_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Diabetes_Prediction.ipynb) |
| **M2** | **Cardiology** | Coronary Heart Disease | Tabular (Resting BP, Chol, Max HR, ST Dep) | Logistic Regression + StandardScaler | [Final_Heart_Disease_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Heart_Disease_Prediction.ipynb) |
| **M3** | **Pulmonology** | Pneumonia Detection | Chest Radiograph (224×224×3 RGB) | Deep Convolutional Neural Network | [Final_Chest_XRay_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Chest_XRay_Prediction.ipynb) |
| **M4** | **Neuro-Oncology** | Cranial Brain Tumor (4-Class) | Cranial MRI (299×299×3 RGB) | Xception Deep Transfer Learning Network | [Final_Brain_Tumor_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Brain_Tumor_Prediction.ipynb) |
| **M5** | **Oncology** | Breast Cancer (Benign / Malignant) | FNA Biopsy Tabular Features (30 metrics) | PCA + GridSearch Logistic Regression / Ensemble | [Final_Breast_Cancer_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Breast_Cancer_Prediction.ipynb) |
| **M6** | **Hepatology** | Liver Disease | Tabular LFT (Bilirubin, Enzymes, Albumin) | Random Forest / GBDT / LR / XGBoost | [Final_Liver_Disease_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Liver_Disease_Prediction.ipynb) |
| **M7** | **Nephrology** | Kidney Stone / Pathology (4-Class) | CT Scan / Radiography (150×150×3) | U-Net Classifier & EfficientNetB0 | [Final_Kidney_Stone_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Kidney_Stone_Prediction.ipynb) |
| **M8** | **Dermatology** | Skin Cancer (7-Class HAM10000) | Dermoscopy Images (224×224×3 RGB) | ResNet-50 Deep Transfer Learning | [Final_Skin_Cancer_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Skin_Cancer_Prediction.ipynb) |
| **M9** | **Ophthalmology** | Eye Disease (Multi-Class) | Retinal Fundus Images (224×224×3) | PyTorch ResNet-18 Deep Transfer Learning | [Final_Eye_Disease_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Eye_Disease_Prediction.ipynb) |

---

## 💡 Fused Explainability (XAI) & Evidence Fusion

A cornerstone contribution of MedSynapse is **Evidence Fusion for LLM Grounding**:

1. **Dual-Method Agreement Analysis**: Both SHAP and LIME are evaluated simultaneously. The rank correlation between the top-$k$ SHAP features and LIME explanations is computed. High agreement signals high explanation fidelity to the LLM agent.
2. **Actionable Counterfactuals**: For tabular predictions (e.g. diabetes or heart disease), counterfactual instances (generated via DiCE) determine the minimal clinical biomarker change (e.g., *"Reducing fasting glucose by 18 mg/dL and systolic BP by 12 mmHg transitions risk from High to Moderate"*).
3. **Structured JSON Evidence Block**: Feature attributions, visual attention coordinates, counterfactual deltas, and uncertainty metrics are merged into a typed JSON schema passed directly to the LLM prompt. The LLM is strictly constrained to synthesize reports **only from this evidence block**, systematically eliminating hallucinations.

---

## 📂 Repository Structure

The repository is structured to support both local development and cloud/Kaggle model training:

```
Disease_Analizer/
├── Structure for the paper.pdf   # Research paper blueprint, experimental setup & checklist
├── requirements.txt              # Core Python dependencies
├── README.md                     # Project documentation & paper overview
├── datasets/                     # Clinical training & benchmark datasets
│   ├── brain tumor/              # Cranial MRI dataset (Glioma, Meningioma, Pituitary, No Tumor)
│   │   ├── Training/             # 5,600+ labeled training scans
│   │   └── Testing/              # 1,600+ benchmark evaluation scans
│   ├── chest_xray/               # Pulmonary radiography dataset
│   │   ├── train/                # 5,200+ radiographs (Normal vs Pneumonia)
│   │   ├── val/                  # Validation split
│   │   └── test/                 # Test evaluation set
│   └── sample_reports/           # Multi-modal clinical reports for OCR & evaluation
│       ├── 01_diabetic_high_risk_panel.{pdf,png,txt}
│       ├── 02_cardiac_high_risk_panel.{pdf,png,txt}
│       ├── 03_healthy_annual_wellness.{pdf,png,txt}
│       ├── 04_prediabetic_borderline_report.{pdf,png,txt}
│       ├── 05_sample_chest_xray.png
│       └── 06_sample_brain_mri.png
├── docs/                         # Detailed clinical module documentation & empirical benchmark reports
│   ├── README.md                 # Documentation portal & cross-module benchmark table
│   ├── 01_diabetes_prediction.md
│   ├── 02_heart_disease_prediction.md
│   ├── 03_chest_xray_pneumonia_prediction.md
│   ├── 04_brain_tumor_prediction.md
│   ├── 05_breast_cancer_prediction.md
│   ├── 06_liver_disease_prediction.md
│   ├── 07_kidney_stone_prediction.md
│   ├── 08_skin_cancer_prediction.md
│   └── 09_eye_disease_prediction.md
├── models/                       # Standardized 1-Click Production Artifact Bundles
│   ├── brain_tumor_artifacts.zip # Xception MRI weights (.keras, .h5, classes.json)
│   ├── breast_cancer_artifacts.zip # PCA + Logistic Regression ensemble (.pkl)
│   ├── chest_xray_artifacts.zip  # Pulmonary CNN weights (.h5, .keras)
│   ├── diabetes_artifacts.zip    # Glycemic soft-voting ensemble & scaler (.pkl)
│   ├── eye_disease_artifacts.zip # PyTorch ResNet-18 weights (.pth, .pt, class_dict)
│   ├── heart_artifacts.zip       # Cardiovascular model & scaler (.pkl)
│   ├── kidney_stone_artifacts.zip# U-Net & EfficientNetB0 models (.keras, .h5)
│   ├── liver_disease_artifacts.zip# Multi-model LFT estimators & scaler (.pkl)
│   └── skin_cancer_artifacts.zip # ResNet50 / CNN dermoscopy weights (.keras, .h5)
└── notebooks/                    # 9 standardized disease training & research notebooks
    ├── Final_Brain_Tumor_Prediction.ipynb
    ├── Final_Breast_Cancer_Prediction.ipynb
    ├── Final_Chest_XRay_Prediction.ipynb
    ├── Final_Diabetes_Prediction.ipynb
    ├── Final_Eye_Disease_Prediction.ipynb
    ├── Final_Heart_Disease_Prediction.ipynb
    ├── Final_Kidney_Stone_Prediction.ipynb
    ├── Final_Liver_Disease_Prediction.ipynb
    └── Final_Skin_Cancer_Prediction.ipynb
```

---

## ⚡ Kaggle Cloud Training & 1-Click Artifact Downloads

All nine notebooks in [`notebooks/`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks) are configured to execute in Kaggle GPU/TPU environments. Each notebook includes an automated serialization and packaging cell at the end that:
- **Serializes the Best Model**: Automatically saves the highest-accuracy checkpoint (in `.keras`, `.h5`, or `.pkl` format).
- **Preserves Preprocessing Transformers**: Dumps fitted `StandardScaler`, `PCA` transformers, and label index mappings (`classes.json`).
- **Packages into a ZIP Archive**: Bundles all generated weights and artifacts into a single `.zip` file for 1-click download.
- **Renders Clickable Browser Links**: Uses `IPython.display.FileLink` to provide direct download links right inside the Kaggle notebook output.

---

## 📊 Research Paper Blueprint & Evaluation Checklist

As outlined in [Structure for the paper.pdf](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/Structure%20for%20the%20paper.pdf), the project includes the following experimental evaluation plan:

| Milestone / Deliverable | Target Metric / Evaluation Method | Status |
| :--- | :--- | :--- |
| **9 Disease Model Backbones** | Accuracy, Precision, Recall, F1-Score, AUC-ROC | ✅ Trained / In Notebooks |
| **Multi-Method Explainability** | SHAP-vs-LIME rank correlation, Grad-CAM attention heatmaps | 🔄 Pipeline Integration |
| **Uncertainty Calibration** | Expected Calibration Error (ECE), Conformal Prediction | 🔄 In Progress |
| **Agentic Routing & Cross-Module Reasoning** | Route accuracy on multi-disease clinical vignettes | 🔄 In Progress |
| **Guideline-Grounded Report Synthesis** | Grounding with medical corpora (AACE, AHA, WHO) | 🔄 In Progress |
| **Clinical Report Quality Evaluation** | Human clinician rubric: Factual consistency, clarity, hallucination rate | 📋 Evaluation Design Ready |

---

## 💻 Environment Setup & Getting Started

### 1️⃣ Prerequisites
- Python 3.10+
- (Optional) CUDA-compatible GPU for training vision models

### 2️⃣ Clone Repository & Set Up Virtual Environment
```bash
# Clone the repository
git clone https://github.com/ShivamMaurya14/Disease_Analizer.git
cd Disease_Analizer

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3️⃣ Running the Notebooks
To explore, train, or evaluate any of the 9 disease prediction models:
```bash
jupyter lab
# Or:
jupyter notebook
```
Navigate to [`notebooks/`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks) and open any model notebook (e.g. `Final_Diabetes_Prediction.ipynb` or `Final_Brain_Tumor_Prediction.ipynb`).

---

## ⚖️ Ethical Considerations & Clinical Disclaimer

> [!IMPORTANT]
> **Clinical Decision Support Framing**: MedSynapse is designed strictly as a **clinical decision-support system (CDSS)** to assist licensed physicians and medical professionals in data synthesis, early screening, and evidence interpretation. It is **not a replacement for professional clinical judgment, laboratory confirmation, or formal diagnosis**.

---

## 👥 Authors & Acknowledgments

**Project Lead**: **Shivam Maurya** ([@ShivamMaurya14](https://github.com/ShivamMaurya14))  
*Domain*: AI & Robotics Engineering | Clinical Machine Learning & Multi-Modal Agent Architectures

```bibtex
@article{medsynapse2026,
  title={MedSynapse: An LLM-Orchestrated System Integrating Multi-Disease ML Predictions with Multi-Method Explainability for Clinical Reporting},
  author={Maurya, Shivam and Collaborators},
  journal={arXiv preprint},
  year={2026}
}
```

