# Module M1: Diabetes Mellitus Prediction (Soft-Voting Ensemble)

## 1. Module Overview
- **Module ID**: `M1`
- **Clinical Specialty**: Endocrinology / Metabolic Health
- **Diagnostic Task**: Binary Classification (Diabetic vs. Non-Diabetic)
- **Input Modality**: Tabular Clinical Biomarkers
- **Associated Notebook**: [`notebooks/Final_Diabetes_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Diabetes_Prediction.ipynb)
- **Production Artifacts**: `models/Diabetes_model/diabetes_model.pkl`, `models/Diabetes_model/diabetes_scaler.pkl`

---

## 2. Clinical Significance & Problem Formulation
Diabetes mellitus is a chronic metabolic disorder characterized by persistent hyperglycemia resulting from defects in insulin secretion, insulin action, or both. Early identification of prediabetic and high-risk diabetic individuals is critical to prevent irreversible microvascular and macrovascular complications, including diabetic nephropathy, retinopathy, neuropathy, and coronary artery disease.

In this module, patient clinical metrics are evaluated to compute an individualized glycemic risk probability along with feature-level contributions.

---

## 3. Dataset & Clinical Biomarkers
- **Source**: Pima Indians Diabetes Database (`datasets/diabetes.csv`)
- **Target Variable**: `Outcome` (0 = Non-diabetic, 1 = Diabetic)
- **Features (8 Clinical Indicators)**:
  1. `Pregnancies`: Number of pregnancies
  2. `Glucose`: Plasma glucose concentration over 2 hours in an oral glucose tolerance test (mg/dL)
  3. `BloodPressure`: Diastolic blood pressure (mm Hg)
  4. `SkinThickness`: Triceps skin fold thickness (mm)
  5. `Insulin`: 2-Hour serum insulin ($\mu$U/ml)
  6. `BMI`: Body mass index ($\text{weight in kg} / (\text{height in m})^2$)
  7. `DiabetesPedigreeFunction`: Genetic risk score based on family history
  8. `Age`: Patient age (years)

---

## 4. Data Preprocessing & Feature Engineering
1. **Physiological Zero-Value Correction**:
   - In clinical measurements, values of `0` for `Glucose`, `BloodPressure`, `SkinThickness`, `Insulin`, and `BMI` represent missing data rather than true zero measurements.
   - Identified zero entries are converted to `np.nan`.
2. **KNN Imputation**:
   - Replaced naive median imputation with a 5-neighbor $k$-Nearest Neighbors Imputer (`KNNImputer(n_neighbors=5)`), preserving multivariate physiological relationships between glucose, insulin, and adiposity.
3. **Outlier Capping (Winsorization)**:
   - Evaluated Interquartile Range ($IQR = Q_3 - Q_1$).
   - Extreme physiological outliers in skewed features (`Insulin` and `DiabetesPedigreeFunction`) are capped within $[Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]$.
4. **Domain Feature Engineering (`BMI_Cat`)**:
   - Engineered an ordinal BMI category based on clinical thresholds:
     - `0`: Underweight ($< 18.5$)
     - `1`: Normal ($18.5 - 24.9$)
     - `2`: Overweight ($25.0 - 29.9$)
     - `3`: Obese ($\ge 30.0$)
5. **Feature Standardization & Split**:
   - Transformed all input variables via `StandardScaler()`.
   - Partitioned into 80% training and 20% test sets (`test_size=0.2, random_state=42`).

---

## 5. Model Architecture & Ensemble Design
The module implements a **Soft-Voting Ensemble (`VotingClassifier`)** that aggregates predicted class probabilities across three diverse model families:

1. **Random Forest Classifier**:
   - `n_estimators=20`, `max_depth=20`, `min_samples_split=5`, `min_samples_leaf=1`
   - Captures non-linear decision boundaries and high-order feature interactions.
2. **Gradient Boosting Classifier**:
   - `n_estimators=100`, `learning_rate=0.1`, `max_depth=3`
   - Iteratively minimizes residual errors using shallow boosted decision trees.
3. **Logistic Regression**:
   - `solver='liblinear'`, `random_state=42`
   - Provides well-calibrated baseline linear risk probabilities.

### Soft-Voting Aggregation:
$$\hat{P}(Y=1 \mid X) = \frac{1}{3} \left[ P_{\text{RF}}(Y=1 \mid X) + P_{\text{GB}}(Y=1 \mid X) + P_{\text{LR}}(Y=1 \mid X) \right]$$

---

## 6. Evaluation & Results
- **Training Accuracy**: ~89.2%
- **Test Accuracy**: ~77.3% – 80.5%
- **Sensitivity / Recall (Class 1)**: Robust detection of high-risk glycemic cases.
- **Verification Routine**: The notebook includes an automated verification block that re-loads `diabetes_model.pkl` and `diabetes_scaler.pkl` to validate inference integrity on out-of-sample data.

---

## 7. Explainability & Evidence Fusion in MedAgent
- **TreeSHAP & KernelSHAP**: Identifies the patient's primary risk drivers (typically `Glucose`, `BMI`, and `Age`).
- **Counterfactual Explanations (DiCE)**: Computes the minimal actionable change to revert a diabetic prediction to normal (e.g. *"-15 mg/dL Glucose and -2.4 BMI"*).
- **Cross-Module Linkage**:
  - `M1 + M7 (Kidney)`: Triggers diabetic nephropathy evaluation if elevated glucose co-occurs with renal imaging/clinical anomalies.
  - `M1 + M9 (Eye)`: Triggers diabetic retinopathy screening when glycemic risk exceeds 70%.
  - `M1 + M2 (Heart)`: Evaluates shared metabolic syndrome and cardiovascular risk amplification.

---

## 8. Artifacts & Persistence
- Serialized Model: `models/Diabetes_model/diabetes_model.pkl`
- Fitted Scaler: `models/Diabetes_model/diabetes_scaler.pkl`
- Kaggle Download Bundle: Direct download cell at notebook end generating `diabetes_artifacts.zip`.
