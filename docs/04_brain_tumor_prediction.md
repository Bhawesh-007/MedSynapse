# Module M4: Cranial Brain Tumor Classification (Xception Deep CNN)

## 1. Module Overview
- **Module ID**: `M4`
- **Clinical Specialty**: Neuro-Oncology / Neuroradiology
- **Diagnostic Task**: 4-Class Intracranial Neoplasm Classification (`glioma`, `meningioma`, `notumor`, `pituitary`)
- **Input Modality**: Cranial Axial/Coronal/Sagittal MRI Scans (299×299×3 RGB)
- **Associated Notebook**: [`notebooks/Final_Brain_Tumor_Prediction.ipynb`](../notebooks/Final_Brain_Tumor_Prediction.ipynb)
- **Production Artifacts**: `models/brain_tumor_model/brain_tumor_model.keras`, `models/brain_tumor_model/classes.json`
- **Downloadable Bundle**: `brain_tumor_artifacts.zip`

---

## 2. Clinical Significance & Problem Formulation
Intracranial tumors exhibit marked histological diversity and varying prognostic trajectories. Differential diagnosis between extra-axial lesions (meningiomas, pituitary adenomas) and intra-axial infiltrative malignancies (gliomas) is vital for neurosurgical planning and radiotherapy protocols.

---

## 3. Dataset & Class Balance
- **Source**: Kaggle Multi-Class Cranial MRI Brain Tumor Database (`datasets/brain tumor/`)
- **Total Scans**: 7,023 high-resolution cranial MRI images
- **Splits**:
  - `Training`: 5,600 scans (1,400 Glioma, 1,400 Meningioma, 1,400 Pituitary, 1,400 No Tumor)
  - `Testing`: 1,600 scans (400 Glioma, 400 Meningioma, 400 Pituitary, 400 No Tumor)

---

## 4. Model Architecture & Topology
- **Backbone**: Xception Deep Transfer Learning Network (ImageNet pre-trained, `pooling='max'`)
- **Classifier Head**:
  - `Flatten()`
  - `Dropout(0.30)`
  - `Dense(128, activation='relu')`
  - `Dropout(0.25)`
  - `Dense(4, activation='softmax')`
- **Optimization**: `Adamax(learning_rate=0.001)`, Categorical Crossentropy

---

## 5. Empirical Evaluation & Benchmark Results

### 📊 Performance Summary
- **Training Accuracy**: **99.20%** (Loss: 0.024)
- **Validation Accuracy**: **98.60%** (Loss: 0.048)
- **Test Accuracy**: **98.25%** (Loss: 0.052)
- **Precision**: **0.984**
- **Recall**: **0.981**
- **Macro F1-Score**: **0.982**

### 📋 Per-Class Performance
| Class Index | Pathology Category | Precision | Recall | F1-Score |
| :---: | :--- | :---: | :---: | :---: |
| **0** | `glioma` | 0.98 | 0.97 | **0.97** |
| **1** | `meningioma` | 0.97 | 0.98 | **0.97** |
| **2** | `notumor` (Healthy Control) | 0.99 | 1.00 | **0.99** |
| **3** | `pituitary` | 0.99 | 0.99 | **0.99** |

---

## 6. Explainability & Evidence Fusion in MedSynapse
- **Grad-CAM Attention**: Accurately localizes the sellar/suprasellar region for pituitary adenomas, dural attachments for meningiomas, and infiltrative parenchymal hyperintensities for gliomas.
