# Module M4: Cranial MRI Brain Tumor Differential (Xception Transfer Learning)

## 1. Module Overview
- **Module ID**: `M4`
- **Clinical Specialty**: Neuro-Oncology / Neuroradiology
- **Diagnostic Task**: 4-Class Multi-Category Neoplasm Classification
- **Classes**:
  1. `Glioma` (Intra-axial glial cell tumor)
  2. `Meningioma` (Extra-axial meningeal tumor)
  3. `Pituitary Tumor` (Sellar/parasellar adenoma)
  4. `No Tumor` (Normal cranial anatomy)
- **Input Modality**: Axial / Coronal / Sagittal Cranial Magnetic Resonance Imaging (MRI)
- **Input Tensor Dimensions**: $(1, 299, 299, 3)$, normalized to $[0.0, 1.0]$
- **Associated Notebook**: [`notebooks/Final_Brain_Tumor_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Brain_Tumor_Prediction.ipynb)
- **Production Artifacts**: `models/brain_tumor_model/brain_tumor_model.keras`

---

## 2. Clinical Significance & Problem Formulation
Intracranial neoplasms exhibit substantial morphological diversity, ranging from aggressive infiltrative intra-axial gliomas to well-circumscribed extra-axial meningiomas and endocrine-active pituitary adenomas. Discriminating tumor category on MRI is essential for surgical planning, stereotactic radiotherapy, and targeted chemotherapy.

This module automates the differential diagnosis across three major intracranial tumor categories plus normal controls.

---

## 3. Dataset & Distribution
- **Dataset**: Kaggle Cranial MRI Multi-Class Brain Tumor Dataset (`datasets/brain tumor/`)
- **Distribution**:
  - `Training/`: 5,600 total scans
    - `glioma`: 1,400 scans
    - `meningioma`: 1,400 scans
    - `pituitary`: 1,400 scans
    - `notumor`: 1,400 scans
  - `Testing/`: 1,600 total scans
    - `glioma`: 400 scans
    - `meningioma`: 400 scans
    - `pituitary`: 400 scans
    - `notumor`: 400 scans
- **Total Balance**: Perfectly balanced across all 4 categories, eliminating class frequency bias.

---

## 4. Preprocessing & Data Augmentation Pipeline
1. **Resolution Standardization**:
   - Resized using bilinear resampling to $(299, 299, 3)$, matching native Xception input tensor requirements.
2. **Train / Test / Validation Split**:
   - `Training`: 80% of data for backpropagation.
   - `Validation`: 10% for epoch checkpoint evaluation.
   - `Test`: 10% held-out set for final unbiased metric calculation.
3. **Data Augmentation (`ImageDataGenerator`)**:
   - Dynamic scaling ($1/255$)
   - Horizontal flipping for anatomical symmetry modeling
   - Safe brightness and zoom perturbations reflecting scanner variability.

---

## 5. Model Architecture & Layer Topology
- **Base Architecture**: `tf.keras.applications.Xception` (weights pre-trained on ImageNet)
- **Feature Extraction**:
  - `pooling='max'`: Captures sharp boundary gradients typical of intracranial mass margins.
- **Custom Deep Classification Head**:
  - `base_model` (Xception)
  - `Flatten()`: Unrolls extracted spatial feature maps.
  - `Dropout(rate=0.3)`: Primary dropout stage.
  - `Dense(128, activation='relu')`: Latent clinical feature representation.
  - `Dropout(rate=0.25)`: Secondary dropout stage.
  - `Dense(4, activation='softmax')`: Emits normalized categorical probability distribution:
    $$P(Y = c \mid X) = \frac{e^{z_c}}{\sum_{j=1}^4 e^{z_j}}$$
- **Optimization**:
  - `Adamax(learning_rate=0.001)`: Variant of Adam based on the infinity norm, providing high numerical stability for deep vision models.
  - **Loss Function**: `categorical_crossentropy`
  - **Monitored Metrics**: `['accuracy', Precision(), Recall()]`

---

## 6. Training Pipeline & Callbacks
- **Batch Size**: 32
- **Epochs**: 10
- **Training Strategy**: Unshuffled test generator for exact confusion matrix index alignment.
- **Loss Progression**: Smooth monotonic reduction in cross-entropy loss with concurrent convergence of precision and recall.

---

## 7. Performance & Empirical Results
- **Training Accuracy**: ~98.4%
- **Validation Accuracy**: ~96.8%
- **Test Accuracy**: ~96.2%
- **Per-Class Metrics**:
  - `Glioma`: F1-Score ~ 0.94
  - `Meningioma`: F1-Score ~ 0.95
  - `Pituitary`: F1-Score ~ 0.98
  - `No Tumor`: F1-Score ~ 0.99
- **Inference Function**: Includes `predict(img_path)` testing single scan inference and displaying prediction confidence against true labels.

---

## 8. Explainability (XAI) & LLM Evidence Fusion
- **Grad-CAM++**: Highlights higher-order visual cues identifying tumor core, necrotic center, and surrounding peritumoral edema.
- **Lesion Localization Coordinates**:
  - Centroid and bounding box coordinates of top activation areas are extracted and fed to the LLM agent.
- **Structured Evidence Block**:
  - Encodes tumor classification confidence, differential probabilities (e.g. *88% Meningioma, 9% Glioma, 3% Other*), and anatomical location markers.

---

## 9. Artifacts & Model Persistence
- Production Checkpoint: `models/brain_tumor_model/brain_tumor_model.keras`
- Format: Native modern Keras 3 format containing full model topology, weights, and optimizer state.
- Kaggle Download Bundle: One-click bundle generated via `brain_tumor_artifacts.zip`.
