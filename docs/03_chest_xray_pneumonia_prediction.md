# Module M3: Chest X-Ray Pneumonia Detection (Deep CNN / Xception)

## 1. Module Overview
- **Module ID**: `M3`
- **Clinical Specialty**: Pulmonology / Thoracic Radiology
- **Diagnostic Task**: Binary Classification (Normal vs. Acute Pneumonia)
- **Input Modality**: Chest Radiographs (Anterior-Posterior / Posterior-Anterior X-Rays)
- **Input Tensor Dimensions**: $(1, 224, 224, 3)$, normalized to $[0.0, 1.0]$
- **Associated Notebook**: [`notebooks/Final_Chest_XRay_Prediction.ipynb`](file:///Users/shivammaurya/Desktop/Projects/Disease_Analizer/notebooks/Final_Chest_XRay_Prediction.ipynb)
- **Production Artifacts**: `models/Pneumonia_model/xrays_pneumonia.keras`

---

## 2. Clinical Significance & Problem Formulation
Pneumonia is an acute lower respiratory infection causing inflammation of the pulmonary parenchyma and alveolar fluid accumulation (consolidation). On chest radiographs, pneumonia manifests as patchy opacities, lobar consolidation, air bronchograms, or diffuse infiltrates. Rapid detection is critical in emergency triage, pediatric care, and intensive care units.

This module automates the detection of consolidation and pulmonary opacities to classify radiographs into `NORMAL` or `PNEUMONIA`.

---

## 3. Dataset & Distribution
- **Dataset**: Pediatric Chest X-Ray Database (`datasets/chest_xray/`)
- **Structure**:
  - `train/`: 3,876 Pneumonia + 1,342 Normal (~5,216 images)
  - `val/`: 9 Pneumonia + 9 Normal (18 images)
  - `test/`: 390 Pneumonia + 234 Normal (624 benchmark evaluation images)
- **Image Characteristics**: Grayscale and RGB radiologic scans in JPEG format with varying original aspect ratios.

---

## 4. Image Preprocessing & Data Augmentation
1. **Dynamic Resampling & Aspect Ratio Handling**:
   - High-fidelity bilinear/Lanczos interpolation resizing arbitrary scanner resolutions into standardized $(224, 224, 3)$ tensors.
   - Dynamic channel conversion (replicates grayscale single-channel radiographs across 3 RGB channels to match ImageNet pre-training).
2. **Data Augmentation (`ImageDataGenerator`)**:
   - `rescale=1./255`: Normalizes 8-bit pixel values $[0, 255]$ into $[0.0, 1.0]$.
   - `shear_range=0.2`: Simulates slight patient positioning tilts.
   - `zoom_range=0.2`: Accounts for patient distance variation from detector.
   - `horizontal_flip=True`: Simulates anatomical variation while preserving pulmonary structure.

---

## 5. Model Architecture & Topology
The architecture uses **Xception (Extreme Inception)** featuring depthwise separable convolutions:

1. **Pre-trained Backbone**:
   - `base_model = Xception(weights='imagenet', include_top=False, input_shape=(224, 224, 3))`
   - Captures rich hierarchical spatial textures (rib contours, lung fields, vascular markings).
   - Base convolutional layers frozen to preserve feature extractors.
2. **Classification Head**:
   - `GlobalAveragePooling2D()`: Compresses 2D feature maps into a 1D feature vector, preventing spatial overfitting.
   - `Dropout(0.5)`: Regularization combating co-adaptation of features.
   - `Dense(128, activation='relu')`: Non-linear clinical representation layer.
   - `Dropout(0.5)`: Secondary regularization stage.
   - `Dense(1, activation='sigmoid')`: Emits calibrated probability of pneumonia presence:
     $$\hat{y} = \sigma(W^T x + b) = \frac{1}{1 + e^{-(W^T x + b)}}$$

---

## 6. Training Configuration & Loss Formulation
- **Optimizer**: `Adam(learning_rate=0.0001)` (low learning rate ensures stable fine-tuning)
- **Loss Function**: `binary_crossentropy`
- **Batch Size**: 32
- **Epochs**: 5 (with transfer learning convergence)

---

## 7. Evaluation & Diagnostic Performance
- **Test Set Accuracy**: ~89.5% – 92.3%
- **Sensitivity (Pneumonia Recall)**: > 96% (minimizing false negatives in clinical triage)
- **Validation**: Includes a verification cell executing test inference with `load_model` on sample radiographs.

---

## 8. Explainability & Visual Grounding in MedAgent
- **Grad-CAM (Gradient-Weighted Class Activation Mapping)**: Computes gradients of the sigmoid score with respect to the final convolutional feature maps, projecting an attention heatmap over the lungs.
- **Radiological Evidence Extraction**:
  - Highlights whether activations localize to lobar consolidation, interstitial bilateral infiltrates, or pleural effusion.
  - Generates visual bounding coordinates passed in the structured JSON evidence block to the LLM agent.

---

## 9. Artifacts & Persistence
- Primary Model: `models/Pneumonia_model/xrays_pneumonia.keras`
- Legacy Checkpoint: `models/chest_xray_model.h5`
- Kaggle Download Bundle: One-click bundle generated via `chest_xray_artifacts.zip`.
