# Module M5: Breast Cancer Detection (PCA & Optimized Classifiers)

## 1. Module Overview
- **Module ID**: `M5`
- **Clinical Specialty**: Oncology / Cytopathology
- **Diagnostic Task**: Binary Classification (Benign vs. Malignant Breast Mass)
- **Input Modality**: Tabular Features Extracted from Digitized Fine Needle Aspirate (FNA) Biopsies
- **Associated Notebook**: [`notebooks/Final_Breast_Cancer_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Breast_Cancer_Prediction.ipynb)
- **Production Artifacts**: `breast_cancer_model.pkl`, `breast_cancer_ensemble.pkl`, `breast_cancer_scaler.pkl`, `breast_cancer_pca.pkl`

---

## 2. Clinical Significance & Problem Formulation
Fine Needle Aspiration (FNA) of breast tissue is a standard minimally invasive biopsy technique. Nuclear morphometry features computed from digitized microscopic images of the aspirate (such as nuclear radius, texture, contour irregularities, and chromatin distribution) correlate with malignant transformation.

Differentiating benign fibroadenomas and cysts from invasive ductal/lobular carcinomas requires high diagnostic accuracy and, critically, extremely low false negative rates to avoid delayed oncological intervention.

---

## 3. Dataset & Biomarkers
- **Source**: Wisconsin Diagnostic Breast Cancer (WDBC) Dataset (`Breast_cancer_dataset.csv`)
- **Sample Count**: 569 biopsy samples
- **Target Variable**: `diagnosis` (M = Malignant [1], B = Benign [0])
- **30 Morphometric Nuclear Features**:
  - Computed for cell nuclei in each aspirate image:
    1. `radius` (mean of distances from center to points on perimeter)
    2. `texture` (standard deviation of gray-scale values)
    3. `perimeter`
    4. `area`
    5. `smoothness` (local variation in radius lengths)
    6. `compactness` ($\text{perimeter}^2 / \text{area} - 1.0$)
    7. `concavity` (severity of concave portions of contour)
    8. `concave points` (number of concave portions of contour)
    9. `symmetry`
    10. `fractal dimension` ("coastline approximation" - 1)
  - Each feature is measured across three metrics: **Mean**, **Standard Error (SE)**, and **"Worst" (largest)** value, resulting in 30 continuous predictors.

---

## 4. Preprocessing & Dimensionality Reduction
1. **Cleaning & Label Encoding**:
   - Dropped non-informative identifier columns (`id`, `Unnamed: 32`).
   - One-hot encoded `diagnosis` into binary target vector $y \in \{0, 1\}$.
2. **Mutual Information Analysis**:
   - Ranked mutual information between all 30 features and malignancy. Features with highest predictive capacity: `worst perimeter`, `worst area`, `worst radius`, `mean concave points`.
3. **Correlation Heatmap**:
   - Confirmed severe multicollinearity among geometric dimensions (`radius`, `perimeter`, `area` show $r > 0.98$).
4. **Stratified Train-Test Split**:
   - 70:30 stratified split preserving benign-to-malignant balance (`test_size=0.3, stratify=y_num, random_state=1`).
5. **Standardization & PCA (Principal Component Analysis)**:
   - Features standardized via `StandardScaler()`.
   - Applied `PCA(n_components=0.95)` to retain components explaining 95% of total cumulative variance.
   - **Dimensionality Reduction**: Reduced feature dimensionality from **30 features to 10 principal components** with zero loss in predictive fidelity.
   - **PCA Biplot**: Visualized component loadings and sample clusters along PC1 (variance explained: 44.3%) and PC2 (variance explained: 19.0%).

---

## 5. Model Architecture & Hyperparameter Optimization
Six diverse classifiers were trained and tuned using 5-Fold Cross-Validation (`GridSearchCV`, $K=5$, `shuffle=True`):

1. **$k$-Nearest Neighbors (`KNeighborsClassifier`)**:
   - Tuned $k \in [1, 25]$; optimal $k=3$. Accuracy: **95.32%** (7 False Negatives).
2. **Logistic Regression (`LogisticRegression`)**:
   - Tuned $C \in [0.001, 100]$, penalty $\in \{L1, L2\}$, solver `liblinear`.
   - Optimal: $C=1.0$, $L2$ penalty. Accuracy: **96.49%** (5 False Negatives).
3. **Linear Support Vector Classifier (`LinearSVC`)**:
   - Tuned $C \in [0.005, 2.0]$; optimal $C=0.009$. Accuracy: **95.91%** (6 False Negatives).
4. **Kernel Support Vector Machine (`SVC` with RBF Kernel)**:
   - Tuned $C \in [0.001, 5.0]$, $\gamma \in [0.0001, 1.0]$. Accuracy: **95.91%** (6 False Positives).
5. **Decision Tree Classifier (`DecisionTreeClassifier`)**:
   - Tuned criterion $\in \{\text{gini}, \text{entropy}\}$, max depth $\in [1, 20]$. Accuracy: **90.64%**.
6. **Ensemble Meta-Model (`VotingClassifier`)**:
   - Combines KNN, Logistic Regression, SVM, and Decision Tree via hard majority voting. Accuracy: **95.91%**.

### Champion Model Selection:
**Logistic Regression** emerged as the top-performing model, delivering the highest overall accuracy (**96.49%**) and the lowest false-negative rate (critical for oncological safety).

---

## 6. Evaluation & Confusion Matrix
- **Test Samples**: 171 patients (107 Benign, 64 Malignant)
- **Confusion Matrix (Logistic Regression)**:
  - True Negative (Benign correctly identified): 106
  - False Positive (Benign classified as malignant): 1
  - False Negative (Malignant classified as benign): 5
  - True Positive (Malignant correctly identified): 59
- **Precision**: 0.9833 (Malignant)
- **Recall / Sensitivity**: 0.9219 (Malignant), 0.9907 (Benign)
- **Macro F1-Score**: 0.9620

---

## 7. Explainability & Evidence Fusion in MedAgent
- **Biplot Factor Loadings**: Relates principal components directly back to cytological criteria (cell diameter enlargement, contour indentation).
- **LIME Explanations**: Demonstrates feature importance weights on the top PCA components.
- **Guideline Integration**: Connects classification output with BI-RADS biopsy follow-up criteria.

---

## 8. Artifacts & Kaggle Downloads
- Serialized Model: `breast_cancer_model.pkl` (Trained Logistic Regression)
- Ensemble Backup: `breast_cancer_ensemble.pkl` (Voting Meta-Model)
- Fitted Scaler: `breast_cancer_scaler.pkl`
- Fitted PCA: `breast_cancer_pca.pkl`
- Download Package: Automated `breast_cancer_artifacts.zip` with `IPython.display.FileLink`.
