# Module M6: Liver Disease Prediction (Multi-Model Hepatic Analysis)

## 1. Module Overview
- **Module ID**: `M6`
- **Clinical Specialty**: Hepatology / Gastroenterology
- **Diagnostic Task**: Binary Classification (Liver Disease Patient vs. Healthy Control)
- **Input Modality**: Tabular Liver Function Tests (LFT) & Serum Enzymes
- **Associated Notebook**: [`notebooks/Final_Liver_Disease_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Liver_Disease_Prediction.ipynb)
- **Production Artifacts**: `liver_model.pkl`, `liver_rf_model.pkl`, `liver_lr_model.pkl`, `liver_scaler.pkl`

---

## 2. Clinical Significance & Problem Formulation
The liver performs essential detoxification, protein synthesis, and metabolic regulation functions. Chronic liver diseases (cirrhosis, viral hepatitis, non-alcoholic fatty liver disease) often progress silently until advanced hepatic decompensation occurs. Liver Function Tests (LFTs) measure blood levels of bilirubin, cellular transaminases (ALT, AST), and synthesized proteins (albumin).

This module analyzes combinations of hepatic enzymes and structural proteins to detect hepatocellular and cholestatic injury early.

---

## 3. Dataset & Biomarkers
- **Source**: Indian Liver Patient Records (`liver.csv`)
- **Target Variable**: `Dataset` (Original encoding: 1 = Liver Patient, 2 = Healthy Control; mapped to $1$ = Disease, $0$ = Healthy).
- **Features (10 Clinical Parameters)**:
  1. `Age`: Patient age in years
  2. `Gender`: Encoded as binary (0 = Male, 1 = Female)
  3. `Total_Bilirubin`: Conjugated + unconjugated serum bilirubin (mg/dL)
  4. `Direct_Bilirubin`: Conjugated water-soluble bilirubin (mg/dL)
  5. `Alkaline_Phosphatase`: Cholestatic marker enzyme (IU/L)
  6. `Alamine_Aminotransferase` (ALT / SGPT): Primary hepatocellular injury enzyme (IU/L)
  7. `Aspartate_Aminotransferase` (AST / SGOT): Hepatocellular / mitochondrial enzyme (IU/L)
  8. `Total_Proteins`: Serum protein concentration (g/dL)
  9. `Albumin`: Primary liver-synthesized oncotic protein (g/dL)
  10. `Albumin_and_Globulin_Ratio`: Ratio indicating synthetic capacity vs. immune response

---

## 4. Preprocessing & Data Cleaning Pipeline
1. **Duplicate Removal**: Identifies and drops identical duplicate laboratory entries.
2. **Missing Value Treatment**: Drops incomplete records (`dropna(how='any')`).
3. **Outlier Filtering (Severe AST Spikes)**:
   - Evaluated boxplots and extreme distributions.
   - Removed extreme non-physiological / artifactual values of `Aspartate_Aminotransferase` ($> 2500$ IU/L).
4. **Data Standardization**:
   - Computes column-wise mean ($\mu$) and standard deviation ($\sigma$) on training split:
     $$X_{\text{std}} = \frac{X - \mu}{\sigma}$$
   - Preserves `train_mean` and `train_std` vectors for inference reproducibility.
5. **Stratified Split**:
   - 80:20 stratified split (`test_size=0.2, random_state=0, stratify=y`).

---

## 5. Model Architectures & Algorithmic Comparison
The notebook benchmarked seven distinct machine learning algorithms with cross-validated parameter sweeps:

1. **Logistic Regression (`lr`)**: Fast baseline; accuracy **~73.0%**.
2. **$k$-Nearest Neighbors (`knn`)**: Distance-based grouping; accuracy **~68.5%**.
3. **Support Vector Classifier (`svc`)**: Hyperplane optimization with GridSearchCV ($C=0.01$, $\gamma=0.0001$); accuracy **~71.2%**.
4. **Decision Tree (`dtc`)**: Tuned for maximum depth 5, criterion entropy; accuracy **~72.1%**.
5. **Random Forest Classifier (`rand_clf`)**:
   - `n_estimators=130`, `max_depth=15`, `max_features=0.75`, `min_samples_leaf=7`, `criterion='entropy'`
   - Delivers superior generalization across noisy serum enzyme variations; accuracy **~76.0% – 78.0%**.
6. **Gradient Boosting Classifier (`gbc`)**:
   - `n_estimators=100`, `learning_rate=0.001`, `loss='exponential'`; accuracy **~71.5%**.
7. **XGBoost Classifier (`xgb`)**:
   - Extreme Gradient Boosting (`n_estimators=300`, `learning_rate=0.001`, `max_depth=100`); accuracy **~72.5%**.

### ROC Analysis:
- Evaluated Receiver Operating Characteristic (ROC) curves and Area Under Curve (AUC) across all 7 models.
- Random Forest and GBDT showed high AUC stability across varying sensitivity thresholds.

---

## 6. Evaluation & Comparative Performance
- **Top Performing Architecture**: Random Forest (`rand_clf`) and Logistic Regression (`lr`).
- **Receiver Operating Characteristic (ROC)**: Generates multi-model ROC overlay (`roc_liver.jpeg`) confirming high discrimination.
- **Performance Evaluation Bar Chart**: Generates `PE_liver.jpeg` comparing accuracy and ROC AUC across all seven classifiers.

---

## 7. Explainability & Evidence Fusion in MedAgent
- **TreeSHAP Attributions**:
  - Highlights `Alamine_Aminotransferase` (ALT), `Aspartate_Aminotransferase` (AST), and `Total_Bilirubin` as dominant drivers of acute hepatic injury.
  - Pinpoints low `Albumin` and inverted `A/G Ratio` as signals of chronic hepatic insufficiency.
- **Anchor Explanations**: Identifies rule-based decision boundaries (e.g. *IF Direct_Bilirubin > 1.2 AND ALT > 65 THEN predict Liver Disease with 89% precision*).
- **Cross-Module Reasoning**:
  - `M6 + M1 (Diabetes)`: Non-alcoholic steatohepatitis (NASH) evaluation when chronic hyperglycemia co-occurs with elevated transaminases.
  - `M6 + M2 (Heart)`: Monitored in congestive hepatopathy secondary to right heart failure.

---

## 8. Artifacts & Kaggle Downloads
- Primary Model: `liver_model.pkl` (Serialized Random Forest / Logistic Regression)
- Dedicated Checkpoints: `liver_rf_model.pkl`, `liver_lr_model.pkl`, `liver_gbc_model.pkl`
- Preprocessing Transformer: `liver_scaler.pkl` (containing `mean`, `std`, and `feature_names`)
- Download Package: Automated `liver_disease_artifacts.zip` with `IPython.display.FileLink`.
