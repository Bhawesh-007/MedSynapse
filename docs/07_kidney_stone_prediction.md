# Module M7: Kidney Stone & Renal Pathology Classification (U-Net & Transfer Learning)

## 1. Module Overview
- **Module ID**: `M7`
- **Clinical Specialty**: Nephrology / Urological Radiology
- **Diagnostic Task**: 4-Class Kidney Pathology Classification from CT Scans
- **Target Classes**:
  1. `Cyst` (Fluid-filled benign renal collection)
  2. `Normal` (Unremarkable renal parenchyma and collecting system)
  3. `Stone` (Nephrolithiasis / urolithiasis calcification)
  4. `Tumor` (Renal mass / solid parenchymal neoplasm)
- **Input Modality**: Axial Non-Contrast Computed Tomography (CT) Scans
- **Input Tensor Dimensions**: $(1, 150, 150, 3)$, normalized to $[0.0, 1.0]$
- **Associated Notebook**: [`notebooks/Final_Kidney_Stone_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Kidney_Stone_Prediction.ipynb)
- **Production Artifacts**: `kidney_stone_unet_model.keras`, `kidney_stone_unet_model.h5`, `kidney_stone_classes.json`

---

## 2. Clinical Significance & Problem Formulation
Kidney stones (nephrolithiasis) cause acute colicky flank pain, hematuria, and potential urinary tract obstruction leading to hydronephrosis and acute kidney injury. Differentiating radiopaque stones from renal cysts, tumors, or normal variants on non-contrast abdominal CT requires precise attenuation and morphological evaluation.

This module automates the triage of abdominal CT images into four clinically distinct categories: normal tissue, cystic lesions, calcified stones, and solid neoplasms.

---

## 3. Dataset & Distribution
- **Dataset**: CT-KIDNEY-DATASET-Normal-Cyst-Tumor-Stone (Kaggle Dataset)
- **Input Dimensions**: Resampled to $150 \times 150 \times 3$
- **Splits**: 80% Training ($train\_ds$), 20% Validation ($test\_ds$) with fixed `seed=123` via `image_dataset_from_directory`.
- **Pipeline Optimization**: `cache().prefetch(buffer_size=AUTOTUNE)` for high-throughput GPU pipelining.

---

## 4. Model Architectures & Deep Learning Pipelines
The notebook evaluates and compares three progressive deep learning architectures:

### 1. MobileNetV2 Transfer Learning
- Pre-trained ImageNet backbone frozen (`trainable=False`).
- Classifier head: `GlobalAveragePooling2D` $\rightarrow$ `Dense(128, relu)` $\rightarrow$ `Dropout(0.5)` $\rightarrow$ `Dense(4, softmax)`.
- Optimizer: `Adam(lr=0.0001)`, `loss='sparse_categorical_crossentropy'`.
- Result: Fast baseline convergence.

### 2. EfficientNetB0 Transfer Learning
- Compound scaling backbone (`weights='imagenet'`, frozen).
- Classifier head: `GlobalAveragePooling2D` $\rightarrow$ `Dense(128, relu)` $\rightarrow$ `Dropout(0.5)` $\rightarrow$ `Dense(4, softmax)`.
- Optimizer: `Adam(lr=0.0001)`, 40 epochs.
- Demonstrates high validation accuracy with minimal parameter footprint.

### 3. Custom U-Net Classifier Architecture
The notebook constructs a specialized U-Net convolutional backbone featuring residual/bridge pooling for hierarchical representation:
- **Encoder Block 1**:
  - `Conv2D(32, (3, 3), activation='relu', padding='same')`
  - `BatchNormalization()`
  - `MaxPooling2D((2, 2))`
- **Encoder Block 2**:
  - `Conv2D(64, (3, 3), activation='relu', padding='same')`
  - `BatchNormalization()`
  - `MaxPooling2D((2, 2))`
- **Bridge**:
  - `Conv2D(128, (3, 3), activation='relu', padding='same')`
  - `BatchNormalization()`
- **Global Pooling Classifier Head**:
  - `GlobalAveragePooling2D()` (replaces upsampling for classification task)
  - `Dropout(0.5)`
  - `Dense(128, activation='relu')`
  - `Dense(4, activation='softmax')`

---

## 5. Comparative Evaluation & Visualizations
- **Accuracy & Loss Curves**:
  - Direct epoch-by-epoch comparison plots (`MobileNetV2` vs `EfficientNetB0` vs `U-Net`).
- **Confusion Matrix**: Generates $4 \times 4$ heatmap across `Cyst`, `Normal`, `Stone`, and `Tumor`.
- **Batch Visualizer**: Plots a $4 \times 4$ grid (16 test scans) displaying:
  - Scanned CT slice
  - Actual label
  - Predicted label with confidence percentage ($\%$)

---

## 6. Explainability & Evidence Fusion in MedAgent
- **Grad-CAM Saliency Maps**:
  - Highlights hyperdense calcifications characteristic of kidney stones.
  - Pinpoints hypoattenuating fluid density typical of renal cysts versus contrast-enhancing parenchymal distortion in renal tumors.
- **Cross-Module Reasoning**:
  - `M7 + M1 (Diabetes)`: In patients with diabetes mellitus, co-occurring renal findings prompt evaluation of diabetic glomerulosclerosis / chronic kidney disease.
  - `M7 + M2 (Heart)`: Evaluates cardio-renal syndrome when both cardiac stress and renal pathology indicators co-occur.

---

## 7. Artifacts & Kaggle Downloads
- Serialized Model: `kidney_stone_unet_model.keras` & `kidney_stone_unet_model.h5`
- Transfer Model: `kidney_stone_efficientnet_model.keras`
- Class Mapping: `kidney_stone_classes.json`
- Download Package: Automated `kidney_stone_artifacts.zip` with `IPython.display.FileLink`.
