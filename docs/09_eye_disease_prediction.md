# Module M9: Eye Disease & Retinal Pathology Classification (EfficientNetB3)

## 1. Module Overview
- **Module ID**: `M9`
- **Clinical Specialty**: Ophthalmology / Retinal Medicine
- **Diagnostic Task**: 4-Class Fundus Retinopathy Classification
- **Target Classes**:
  1. `cataract` (Crystalline lens opacification)
  2. `diabetic_retinopathy` (Microvascular retinal damage from chronic diabetes)
  3. `glaucoma` (Optic nerve head cupping / neurodegenerative loss)
  4. `normal` (Unremarkable fundus and optic disk)
- **Input Modality**: Color Digital Fundus Photography (Retinal Scans)
- **Input Tensor Dimensions**: $(1, 224, 224, 3)$, normalized to $[0.0, 1.0]$
- **Associated Notebook**: [`notebooks/Final_Eye_Disease_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Eye_Disease_Prediction.ipynb)
- **Production Artifacts**: `models/Eye-model/efficientnetb3-Eye Disease-91.94.h5`, `models/Eye-model/Eye Disease-class_dict.csv`, `models/Eye-model/efficientnetb3-Eye Disease-weights.h5`

---

## 2. Clinical Significance & Problem Formulation
Ophthalmic pathologies such as diabetic retinopathy, glaucoma, and cataracts represent the leading causes of preventable blindness worldwide. In particular, diabetic retinopathy is a major microvascular manifestation of diabetes mellitus that often exhibits no early visual symptoms until microaneurysms, hard exudates, and retinal hemorrhages cause severe macular edema or retinal detachment.

This module automates the screening of color fundus photographs into three major sight-threatening diseases and healthy retinal controls.

---

## 3. Dataset & Distribution
- **Dataset**: Eye Diseases Classification Dataset (`/kaggle/input/eye-diseases-classification/dataset`)
- **Sample Distribution**:
  - `Training`: 3,373 validated fundus images (80%)
  - `Validation`: 422 images (10%)
  - `Testing`: 422 images (10%)
  - Total: 4,217 fundus photographs across all 4 categories.
- **Class Dictionary (`Eye Disease-class_dict.csv`)**:
  - `0`: `cataract`
  - `1`: `diabetic_retinopathy`
  - `2`: `glaucoma`
  - `3`: `normal`

---

## 4. Preprocessing & Data Generator Pipeline
1. **Dynamic Dataframe Construction**:
   - `define_paths(data_dir)`: Recursively indexes all images and corresponding folder class labels into Pandas DataFrames.
2. **Stratified Partitioning (`split_data`)**:
   - Executes multi-step stratified train/valid/test splitting ensuring exact class proportion alignment.
3. **Data Generator (`create_gens`)**:
   - `ImageDataGenerator(horizontal_flip=True)` for training.
   - Standardized target image resolution: $(224, 224, 3)$.
   - Dynamic test batch sizing: Computes divisor for exact modular batch evaluation without truncation artifacts.
4. **Sample Visualizer (`show_images`)**:
   - Plots a $5 \times 5$ sample grid displaying scaled retinal images with ground-truth diagnosis titles.

---

## 5. Model Architecture & Layer Topology
- **Base Architecture**: `tf.keras.applications.efficientnet.EfficientNetB3` (pre-trained on ImageNet)
  - Selected for compound scaling balancing depth, width, and resolution.
  - Base feature extractor: `include_top=False`, `pooling='max'`.
- **Classification Head & Regularization**:
  - `BatchNormalization(axis=-1, momentum=0.99, epsilon=0.001)`: Stabilizes intermediate activations.
  - `Dense(256, activation='relu')`: Features triple-regularization to combat overfitting on high-resolution ophthalmic textures:
    - $L2$ Kernel Regularizer ($\lambda = 0.016$)
    - $L1$ Activity Regularizer ($\lambda = 0.006$)
    - $L1$ Bias Regularizer ($\lambda = 0.006$)
  - `Dropout(rate=0.45, seed=123)`: Heavy dropout preventing co-adaptation.
  - `Dense(4, activation='softmax')`: Normalized probability over 4 ophthalmic classes.

---

## 6. Advanced Training Callbacks & Optimization
The notebook implements a specialized custom callback: **`MyCallback`**:
- **Dynamic Learning Rate Scheduling**:
  - Monitors training accuracy against an adjustable threshold.
  - Reduces learning rate by factor $0.5$ if validation loss fails to improve after patience epochs.
- **Early Stopping & Weight Restoration**:
  - Automatically restores best model weights (`self.best_weights`) based on lowest validation loss.
  - Interactive training halt option (`ask_epoch` prompt for interactive Kaggle sessions).
- **Optimizer**: `Adamax(learning_rate=0.001)`
- **Loss**: `categorical_crossentropy`

---

## 7. Evaluation & Diagnostic Performance
- **Test Set Accuracy**: **91.94%** (as reflected in artifact filename: `efficientnetb3-Eye Disease-91.94.h5`).
- **Confusion Matrix**: Demonstrates high sensitivity across diabetic retinopathy (microaneurysms/exudates) and glaucoma (optic cup-to-disc ratio changes).
- **Per-Class Metrics**:
  - Detailed classification report and normalized confusion matrix included in notebook output.

---

## 8. Explainability & Cross-Module Evidence Fusion in MedAgent
- **Grad-CAM & Integrated Gradients**:
  - Diabetic Retinopathy: Localizes punctate microaneurysms, cotton-wool spots, and hard exudates in the macula.
  - Glaucoma: Attends to the optic nerve head, neuroretinal rim thinning, and cup enlargement.
  - Cataract: Identifies generalized diffuse haze and loss of sharp retinal vessel delineation.
- **Critical Cross-Module Linkage (`M9 + M1`)**:
  - **Diabetic Retinopathy & Glycemic Correlation**:
    - When `M1 (Diabetes)` predicts high glycemic risk AND `M9` predicts `diabetic_retinopathy`, the LLM agent flags a confirmed microvascular organ damage link.
    - Prompts urgent recommendations for comprehensive dilated eye examination and tighter HbA1c management.

---

## 9. Artifacts & Persistence
- Serialized Model: `models/Eye-model/efficientnetb3-Eye Disease-91.94.h5`
- Standardized Model Alias: `models/Eye-model/eye_disease_model.h5`
- Model Weights: `models/Eye-model/efficientnetb3-Eye Disease-weights.h5`
- Class Mapping: `models/Eye-model/Eye Disease-class_dict.csv`
- Kaggle Download Package: Automated `eye_disease_artifacts.zip` with `IPython.display.FileLink`.
