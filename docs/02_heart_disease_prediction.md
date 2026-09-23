# Module M2: Coronary Heart Disease Prediction (Random Forest & Logistic Regression)

## 1. Module Overview
- **Module ID**: `M2`
- **Clinical Specialty**: Cardiology / Cardiovascular Medicine
- **Diagnostic Task**: Binary Classification (Heart Disease Presence vs. Absence)
- **Input Modality**: Tabular Cardiovascular Biomarkers & Stress Test Parameters
- **Associated Notebook**: [`notebooks/Final_Heart_Disease_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Heart_Disease_Prediction.ipynb)
- **Production Artifacts**: `models/heart_model/heart_model.pkl`, `models/heart_model/heart_scaler.pkl`

---

## 2. Clinical Significance & Problem Formulation
Cardiovascular diseases (CVDs) remain the leading cause of global mortality. Coronary heart disease involves impaired myocardial perfusion due to atherosclerotic plaque accumulation in coronary arteries. Diagnostic evaluation combines hemodynamic indicators (blood pressure, resting heart rate), serum lipid profiles (cholesterol), electrocardiographic findings (ST-segment depression, slope), and symptoms of exercise-induced angina.

This module models these multivariate clinical features to estimate the probability of coronary artery pathology and pinpoint hemodynamic risk factors.

---

## 3. Dataset & Clinical Parameters
- **Source**: Cleveland Heart Disease Database (`datasets/heart.csv`)
- **Target Variable**: `target` (0 = Disease Absent, 1 = Disease Present)
- **Features (13 Clinical Parameters)**:
  1. `age`: Patient age in years
  2. `sex`: Sex (1 = male, 0 = female)
  3. `cp`: Chest pain type (0: typical angina, 1: atypical angina, 2: non-anginal pain, 3: asymptomatic)
  4. `trestbps`: Resting blood pressure on hospital admission (mm Hg)
  5. `chol`: Serum cholesterol in mg/dL
  6. `fbs`: Fasting blood sugar > 120 mg/dL (1 = true, 0 = false)
  7. `restecg`: Resting electrocardiographic results (0: normal, 1: ST-T wave abnormality, 2: left ventricular hypertrophy)
  8. `thalach`: Maximum heart rate achieved during exercise stress test
  9. `exang`: Exercise-induced angina (1 = yes, 0 = no)
  10. `oldpeak`: ST depression induced by exercise relative to rest
  11. `slope`: Slope of the peak exercise ST segment (0: upsloping, 1: flat, 2: downsloping)
  12. `ca`: Number of major vessels (0–3) colored by fluoroscopy
  13. `thal`: Thalassemia defect status (1: normal, 2: fixed defect, 3: reversible defect)

---

## 4. Data Preprocessing Pipeline
1. **Feature-Target Separation**: Isolates target variable `target` from clinical feature matrix $X \in \mathbb{R}^{N \times 13}$.
2. **Feature Standardization**:
   - Continuous physiological variables (`trestbps`, `chol`, `thalach`, `oldpeak`, `age`) span vastly different scales.
   - All features are standardized via `StandardScaler()`:
     $$z = \frac{x - \mu}{\sigma}$$
3. **Train-Test Partitioning**:
   - Divided using an 80:20 stratified split (`test_size=0.2, random_state=42`).

---

## 5. Model Architecture & Hyperparameters
- **Primary Architecture**: Random Forest Classifier (`RandomForestClassifier`)
- **Key Parameters**:
  - `n_estimators=100`: 100 decorrelated decision trees built via bootstrap aggregation.
  - `criterion='gini'`: Gini impurity criterion for optimal branch splits.
  - `random_state=42`: Fixed seed ensuring reproducible split and feature subsampling.
- **Alternative / Baseline Models**:
  - Logistic Regression with $L2$ regularization for direct coefficient interpretability.

---

## 6. Evaluation & Results
- **Training Accuracy**: ~100.0% (fully fit ensemble trees)
- **Test Set Accuracy**: ~85.2% – 88.5%
- **Sensitivity & Specificity**: High discriminative capacity for identifying patients with critical ST depression and fluoroscopy-confirmed vessel occlusions.
- **Verification Routine**: Includes a post-serialization cell verifying inference execution using `pickle.load` on random test vectors.

---

## 7. Explainability & Evidence Fusion in MedAgent
- **Feature Importance & SHAP**:
  - `cp` (chest pain type), `thalach` (maximum heart rate), `oldpeak` (ST depression), and `ca` (colored vessels) emerge as the dominant predictive drivers.
- **LIME Explanations**: Generates local linear surrogates explaining why specific threshold combinations (e.g., age > 55, exercise angina present, oldpeak > 2.0) triggered a high-risk warning.
- **Cross-Module Reasoning**:
  - `M2 + M1 (Diabetes)`: Cardiovascular risk is modulated when diabetic biomarkers indicate microvascular strain.
  - `M2 + M6 (Liver)`: Monitors lipid and metabolic enzyme relationships in chronic systemic inflammation.

---

## 8. Artifacts & Model Persistence
- Production Weights: `models/heart_model/heart_model.pkl`
- Preprocessing Scaler: `models/heart_model/heart_scaler.pkl`
- Kaggle Download Bundle: One-click bundle generated via `heart_artifacts.zip`.
