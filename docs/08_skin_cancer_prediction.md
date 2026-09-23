# Module M8: Skin Cancer & Melanoma Detection (ISIC 9-Class CNN with Augmentor)

## 1. Module Overview
- **Module ID**: `M8`
- **Clinical Specialty**: Dermatology / Cutaneous Oncology
- **Diagnostic Task**: 9-Class Lesion Classification (Melanoma & Non-Melanoma Lesions)
- **Target Classes (9 ISIC Categories)**:
  1. `Actinic keratosis`
  2. `Basal cell carcinoma`
  3. `Dermatofibroma`
  4. `Melanoma` (Highest fatality cutaneous malignancy)
  5. `Nevus` (Benign melanocytic proliferation)
  6. `Pigmented benign keratosis`
  7. `Seborrheic keratosis`
  8. `Squamous cell carcinoma`
  9. `Vascular lesion`
- **Input Modality**: Dermatoscopic Microscopic Images (Dermoscopy)
- **Input Tensor Dimensions**: $(1, 180, 180, 3)$, normalized to $[0.0, 1.0]$
- **Associated Notebook**: [`notebooks/Final_Skin_Cancer_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Skin_Cancer_Prediction.ipynb)
- **Production Artifacts**: `skin_cancer_model.keras`, `skin_cancer_model.h5`, `skin_cancer_classes.json`

---

## 2. Clinical Significance & Problem Formulation
Melanoma accounts for only about 1% of all skin cancer occurrences but causes roughly 75% of skin cancer-related mortalities due to its high propensity for early lymphatic and hematogenous metastasis. Distinguishing early-stage malignant melanoma from benign nevi, pigmented keratoses, or dermatofibromas is visually challenging even for experienced dermatologists.

This module automates the triage of dermoscopic images across nine pathological categories, focusing on reducing false negatives in melanoma and squamous cell carcinoma.

---

## 3. Dataset & Class Imbalance Challenges
- **Source**: International Skin Imaging Collaboration (ISIC) Archive (`Skin cancer ISIC The International Skin Imaging Collaboration`)
- **Initial Training Set**: ~2,239 images divided unevenly across 9 categories.
- **Severe Class Imbalance**:
  - `Pigmented benign keratosis` and `Nevus` accounted for the vast majority of raw training samples.
  - Rare malignancies like `Dermatofibroma` and `Vascular lesion` had as few as 95–115 samples.
  - Raw unmitigated training resulted in severe bias toward majority classes and high false negative rates for melanoma.

---

## 4. Iterative Architecture Progression
The notebook systematically details three iterative stages of model development to overcome overfitting and class imbalance:

### Model 1: Baseline Sequential CNN
- 5-stage convolutional architecture without regularization:
  - `Conv2D(32)` $\rightarrow$ `Conv2D(64)` $\rightarrow$ `Conv2D(128)` $\rightarrow$ `Conv2D(256)` $\rightarrow$ `Conv2D(512)` $\rightarrow$ `Dense(1024)` $\rightarrow$ `Dense(9, softmax)`
- **Finding**: Severe overfitting. Training accuracy reached ~75% while validation accuracy lagged at ~55% (a 20% generalization gap).

### Model 2: In-Graph Data Augmentation + Dropout Regularization
- Implemented `keras.Sequential` augmentation pipeline:
  - `RandomFlip("horizontal_and_vertical")`
  - `RandomRotation(0.2)`
  - `RandomZoom(0.2)`
- Injected progressive spatial dropout: `Dropout(0.15)`, `Dropout(0.20)`, `Dropout(0.25)` after deeper conv layers.
- **Finding**: Generalization gap successfully dropped to 2–3%, but overall accuracy remained low (~55%) because the extreme class imbalance was not yet resolved.

### Model 3: Augmentor Pipeline Class Balancing (Champion Architecture)
- Integrated the specialized **Augmentor** library (`import Augmentor`) to dynamically resample and synthesize equal distributions across all 9 classes:
  - Rotations ($p=0.7$, max rotation $\pm 10^{\circ}$)
  - Target sample distribution: Exactly **1,000 augmented images per class** (totaling 9,000 balanced training images).
- **Architecture**:
  - `Rescaling(1.0 / 255)`
  - `Conv2D(32, 3, padding='same', activation='relu')` + `MaxPool2D()`
  - `Conv2D(64, 3, padding='same', activation='relu')` + `MaxPool2D()`
  - `Conv2D(128, 3, padding='same', activation='relu')` + `MaxPool2D()` + `Dropout(0.15)`
  - `Conv2D(256, 3, padding='same', activation='relu')` + `MaxPool2D()` + `Dropout(0.20)`
  - `Conv2D(512, 3, padding='same', activation='relu')` + `MaxPool2D()` + `Dropout(0.25)`
  - `Flatten()` $\rightarrow$ `Dense(1024, activation='relu')` $\rightarrow$ `Dense(9, activation='softmax')`
- **Result**: Accuracy elevated to **~90%**, with minimal train-validation gap (4-5%) and balanced sensitivity across all 9 skin lesion categories.

---

## 5. Training Strategy & Optimization
- **Optimizer**: `Adam(lr=0.001)`
- **Loss Function**: `SparseCategoricalCrossentropy(from_logits=False)`
- **Epochs**: 25 epochs per iteration
- **Batch Size**: 32

---

## 6. Evaluation & Results
- **Test Accuracy**: Evaluated on independent test split: **~90.0% accuracy**.
- **Melanoma Sensitivity**: Dramatically improved via the balanced 1,000-sample per-class synthetic distribution.
- **Model Checkpointing**: The notebook saves both full model structures (`skin_cancer_model.keras`, `.h5`) and layer weights (`cnn_fc_model.h5`).

---

## 7. Explainability & Evidence Fusion in MedAgent
- **Grad-CAM Attention Mapping**:
  - Highlights asymmetry, irregular pigment networks, and atypical dots/globules corresponding to dermatological **ABCDE criteria** (Asymmetry, Border, Color, Diameter, Evolution).
- **LIME-for-Images**: Identifies superpixel clusters that positively or negatively support the melanoma hypothesis.
- **Structured Evidence Block**:
  - Passes the lesion category, confidence score, and top alternative differential to the LLM agent.

---

## 8. Artifacts & Kaggle Downloads
- Serialized Model: `skin_cancer_model.keras` & `skin_cancer_model.h5`
- Model Weights: `cnn_fc_model.h5`
- Class Mapping: `skin_cancer_classes.json`
- Download Package: Automated `skin_cancer_artifacts.zip` with `IPython.display.FileLink`.
