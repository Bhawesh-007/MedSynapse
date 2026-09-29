# Module M8: Melanoma & Dermatological Lesion Classification (Resampled CNN)

## 1. Module Overview
- **Module ID**: `M8`
- **Clinical Specialty**: Dermatology / Cutaneous Oncology
- **Diagnostic Task**: 9-Class Dermoscopy Lesion Classification
- **Input Modality**: Dermoscopic Macrophotography (180×180×3 RGB)
- **Associated Notebook**: [`notebooks/Final_Skin_Cancer_Prediction.ipynb`](../notebooks/Final_Skin_Cancer_Prediction.ipynb)
- **Production Artifacts**: `models/skin_cancer_model.keras`, `models/skin_cancer_classes.json`
- **Downloadable Bundle**: `skin_cancer_artifacts.zip`

---

## 2. Clinical Significance & Problem Formulation
Melanoma represents only ~1% of all skin cancers but causes the vast majority of skin cancer deaths. Distinguishing early invasive melanoma from benign melanocytic nevi, seborrheic keratoses, and basal cell carcinomas under dermoscopy drastically improves patient survival rates.

---

## 3. Dataset & Class Categories
- **Source**: International Skin Imaging Collaboration (ISIC) Archive
- **The 9 Lesion Categories**:
  1. `actinic keratosis`: Premalignant squamocellular lesion
  2. `basal cell carcinoma`: Common slow-growing epithelial malignancy
  3. `dermatofibroma`: Benign dermal nodule
  4. `melanoma`: Highly invasive melanocytic cancer
  5. `nevus`: Benign melanocytic mole
  6. `pigmented benign keratosis`: Solar lentigo / benign keratosis
  7. `seborrheic keratosis`: Benign non-cancerous skin growth
  8. `squamous cell carcinoma`: Invasive keratinocyte cancer
  9. `vascular lesion`: Angioma / vascular malformation

---

## 4. Class Imbalance Resolution & Modeling
1. **Initial Challenge**: Extreme class imbalance in raw ISIC data (e.g. nevi over-represented, melanoma under-represented) caused base model accuracy to plateau at ~55%.
2. **Augmentor Resampling Pipeline**: Augmented each under-represented class to 1,000 balanced samples per category using calibrated rotation, zoom, and horizontal/vertical flips.
3. **Deep CNN Architecture**:
   - 5 Convolutional stages: 32 → 64 → 128 → 256 → 512 filters (`Conv2D` + `MaxPool2D`)
   - Progressive spatial dropout: 0.15 → 0.20 → 0.25
   - Fully connected classification head: `Dense(1024, relu)` + `Dense(9, softmax)`

---

## 5. Empirical Evaluation & Benchmark Results

### 📊 Performance Trajectory
- **Base Unbalanced Model**: Test Accuracy: **55.39%**
- **Augmented & Balanced Model**:
  - **Training Accuracy**: **88.40%**
  - **Validation Accuracy**: **85.60%**
  - **Test Macro F1-Score**: **0.87**

---

## 6. Explainability & Evidence Fusion in MedSynapse
- **Grad-CAM Dermoscopy Heatmaps**: Highlights asymmetrical pigment networks, irregular borders, and color variegation in accordance with the clinical **ABCDE Melanoma Rubric**.
