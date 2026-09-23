# 📚 MedAgent Diagnostic Modules Implementation Documentation

This directory contains technical implementation documents for all nine machine learning and deep learning diagnostic modules in the **MedAgent** multi-disease clinical decision-support framework.

---

## 📑 Diagnostic Modules Index

| Module ID | Diagnostic Domain | Clinical Pathology | Modality | Primary Architecture | Implementation Document | Research Notebook |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | **Metabolic** | Diabetes Mellitus | Tabular (8 Biomarkers) | Soft-Voting Ensemble (RF + GradBoost + LR) | [01_diabetes_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/01_diabetes_prediction.md) | [Final_Diabetes_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Diabetes_Prediction.ipynb) |
| **M2** | **Cardiology** | Coronary Heart Disease | Tabular (13 Cardiac Metrics) | Random Forest & Logistic Regression | [02_heart_disease_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/02_heart_disease_prediction.md) | [Final_Heart_Disease_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Heart_Disease_Prediction.ipynb) |
| **M3** | **Pulmonology** | Pneumonia Detection | Radiography (224×224×3) | Xception Deep CNN with Depthwise Convolutions | [03_chest_xray_pneumonia_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/03_chest_xray_pneumonia_prediction.md) | [Final_Chest_XRay_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Chest_XRay_Prediction.ipynb) |
| **M4** | **Neuro-Oncology** | Cranial Brain Tumor (4-Class) | Cranial MRI (299×299×3) | Xception Transfer Learning Network | [04_brain_tumor_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/04_brain_tumor_prediction.md) | [Final_Brain_Tumor_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Brain_Tumor_Prediction.ipynb) |
| **M5** | **Oncology** | Breast Cancer (Benign / Malignant) | FNA Biopsy (30 Features) | PCA (10 PCs) + Tuned Logistic Regression | [05_breast_cancer_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/05_breast_cancer_prediction.md) | [Final_Breast_Cancer_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Breast_Cancer_Prediction.ipynb) |
| **M6** | **Hepatology** | Liver Disease | Tabular LFT (10 Parameters) | Multi-Model (Random Forest / GBDT / XGBoost) | [06_liver_disease_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/06_liver_disease_prediction.md) | [Final_Liver_Disease_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Liver_Disease_Prediction.ipynb) |
| **M7** | **Nephrology** | Kidney Stone / Pathology (4-Class) | CT Scan (150×150×3) | Custom U-Net Classifier & EfficientNetB0 | [07_kidney_stone_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/07_kidney_stone_prediction.md) | [Final_Kidney_Stone_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Kidney_Stone_Prediction.ipynb) |
| **M8** | **Dermatology** | Skin Cancer / Melanoma (9-Class) | Dermoscopy (180×180×3) | Balanced 5-Stage CNN with Augmentor Resampling | [08_skin_cancer_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/08_skin_cancer_prediction.md) | [Final_Skin_Cancer_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Skin_Cancer_Prediction.ipynb) |
| **M9** | **Ophthalmology** | Eye Disease (4-Class) | Fundus Photography (224×224×3) | EfficientNetB3 with L1/L2 Regularization | [09_eye_disease_prediction.md](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/docs/09_eye_disease_prediction.md) | [Final_Eye_Disease_Prediction.ipynb](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Eye_Disease_Prediction.ipynb) |

---

## 🔍 Common Architecture Patterns

Each implementation document is structured with consistent clinical, technical, and architectural criteria:
1. **Module Overview**: Metadata, clinical specialty, diagnostic task, and production file paths.
2. **Clinical Significance & Formulation**: Biological mechanism, clinical burden, and diagnostic challenges.
3. **Dataset & Biomarkers**: Data source, sample volume, class balance, and feature definitions.
4. **Data Preprocessing & Augmentation**: Missing data handling, outlier winsorization, normalization/scaling, and domain-specific augmentations.
5. **Model Architecture & Topology**: Mathematical formulation, base backbones, classification heads, and regularization.
6. **Training Pipeline**: Loss functions, optimizers, learning rate scheduling, callbacks, and validation strategies.
7. **Empirical Results**: Accuracy, precision, recall, F1, confusion matrices, and ROC-AUC metrics.
8. **Explainability (XAI) & Evidence Fusion**: Integration of SHAP, LIME, Grad-CAM, and counterfactual reasoning into the MedAgent LLM pipeline.
9. **Artifacts & Model Persistence**: Serialized production files and Kaggle 1-click download packaging.
10. **Cross-Module Reasoning**: Clinical relationships between co-occurring disease modules (e.g. *Diabetic Nephropathy*, *Diabetic Retinopathy*, *Cardio-Renal Syndrome*).
