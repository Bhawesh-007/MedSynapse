# 📚 MedSynapse Diagnostic Modules: Empirical Results & Implementation Documentation

This directory contains comprehensive technical, clinical, and empirical benchmark documentation for all nine machine learning and deep learning diagnostic backbones unified under the **MedSynapse** multi-disease clinical decision-support system.

---

## 🏆 Master Empirical Performance Matrix

All models have been evaluated on held-out clinical test cohorts and benchmarked against standard clinical evaluation metrics:

| Module ID | Diagnostic Domain | Clinical Target | Input Modality | Best Architecture | Test Accuracy | Precision | Recall | F1-Score | Production Artifact Bundle |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **M1** | **Metabolic** | Diabetes Mellitus | Tabular (8 Biomarkers) | Soft-Voting Ensemble (RF + GB + ET + LR) | **74.68%** | 0.75 | 0.75 | **0.74** | `models/diabetes_artifacts.zip` |
| **M2** | **Cardiology** | Coronary Heart Disease | Tabular (13 Biomarkers) | Random Forest Classifier (100 Trees) | **98.54%** | 0.99 | 0.99 | **0.99** | `models/heart_artifacts.zip` |
| **M3** | **Pulmonology** | Pneumonia (Pediatric) | Chest X-Ray (299×299×3) | Xception Deep Transfer Learning | **83.01%** | 0.84 | 0.83 | **0.83** | `models/chest_xray_artifacts.zip` |
| **M4** | **Neuro-Oncology** | Brain Tumor (4-Class) | Cranial MRI (299×299×3) | Xception Deep Transfer Network | **95.25%** | 0.96 | 0.95 | **0.95** | `models/brain_tumor_artifacts.zip` |
| **M5** | **Oncology** | Breast Cancer (WDBC) | FNA Biopsy (30 Features) | PCA + Tuned Logistic Regression / Ensemble | **96.49%** | 0.97 | 0.96 | **0.96** | `models/breast_cancer_artifacts.zip` |
| **M6** | **Hepatology** | Liver Disease (ILPD) | Tabular LFT (10 Parameters) | Random Forest & Gradient Boosting | **79.49%** | 0.80 | 0.79 | **0.79** | `models/liver_disease_artifacts.zip` |
| **M7** | **Nephrology** | Kidney Pathology (4-Class) | CT Scan (150×150×3) | MobileNetV2 & EfficientNetB0 | **99.25%** | 0.99 | 0.99 | **0.99** | `models/kidney_stone_artifacts.zip` |
| **M8** | **Dermatology** | Skin Cancer (7-Class HAM10000) | Dermoscopy (28×28×3) | Deep 4-Block Hierarchical CNN | **97.98%** | 0.98 | 0.98 | **0.98** | `models/skin_cancer_artifacts.zip` |
| **M9** | **Ophthalmology** | Eye Diseases (Multi-Class) | Retinal Fundus (224×224×3) | PyTorch ResNet-18 Deep Transfer Learning | **90.78%** | 0.91 | 0.91 | **0.91** | `models/eye_disease_artifacts.zip` |

---

## 📑 Diagnostic Module Documentation Index

- **Module M1 (Metabolic)**: [`01_diabetes_prediction.md`](01_diabetes_prediction.md) — Soft-voting glycemic prediction with median zero-imputation and StandardScaler normalization.
- **Module M2 (Cardiology)**: [`02_heart_disease_prediction.md`](02_heart_disease_prediction.md) — Cleveland cardiovascular risk classification and biomarker sensitivity.
- **Module M3 (Pulmonology)**: [`03_chest_xray_pneumonia_prediction.md`](03_chest_xray_pneumonia_prediction.md) — Pulmonary radiography classification with Xception deep transfer learning.
- **Module M4 (Neuro-Oncology)**: [`04_brain_tumor_prediction.md`](04_brain_tumor_prediction.md) — Multi-class intracranial neoplasm MRI classification (Glioma, Meningioma, Pituitary, Normal).
- **Module M5 (Oncology)**: [`05_breast_cancer_prediction.md`](05_breast_cancer_prediction.md) — FNA biopsy malignancy classification with PCA dimensionality reduction.
- **Module M6 (Hepatology)**: [`06_liver_disease_prediction.md`](06_liver_disease_prediction.md) — Multi-model liver function test (LFT) benchmark and ensemble routing.
- **Module M7 (Nephrology)**: [`07_kidney_stone_prediction.md`](07_kidney_stone_prediction.md) — High-resolution renal CT imaging classifier for cyst, stone, and tumor detection.
- **Module M8 (Dermatology)**: [`08_skin_cancer_prediction.md`](08_skin_cancer_prediction.md) — 7-class dermatoscopy classification on HAM10000 with 4-block CNN achieving 97.98% accuracy.
- **Module M9 (Ophthalmology)**: [`09_eye_disease_prediction.md`](09_eye_disease_prediction.md) — PyTorch Retinal fundus multi-class diagnostic network (Cataract, Retinopathy, Glaucoma, Normal).

---

## 🔬 Explainability (XAI) & Evidence Fusion in MedSynapse

All 9 backbones feed structured attributions directly into the MedSynapse LLM orchestrator:
1. **Tabular XAI Engine**: Kernel/Tree SHAP, LIME, and DiCE counterfactuals generate numerical feature deltas (e.g. *reducing fasting glucose by 22 mg/dL drops risk below clinical threshold*).
2. **Vision XAI Engine**: Grad-CAM/Grad-CAM++ generates heatmaps identifying exact anatomical lesion coordinates in MRI, CT, X-Ray, and Fundus photography.
3. **Structured JSON Evidence Fusion**: Biomarkers, heatmaps, and calibration metrics are compiled into a typed JSON schema passed to the agentic clinical synthesizer, eliminating hallucinations.
