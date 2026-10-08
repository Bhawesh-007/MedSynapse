# Module M8: Skin Cancer & Dermatological Lesion Classification (HAM10000 ResNet-50)

## 1. Module Overview
- **Module ID**: `M8`
- **Clinical Specialty**: Dermatology / Cutaneous Oncology
- **Diagnostic Task**: 7-Class Dermoscopy Lesion Classification
- **Input Modality**: Dermoscopic Photography (224×224×3 RGB)
- **Associated Notebook**: [`notebooks/Final_Skin_Cancer_Prediction.ipynb`](../notebooks/Final_Skin_Cancer_Prediction.ipynb)
- **Production Artifacts**: `models/skin_cancer_model.keras`, `models/skin_cancer_model.h5`, `models/classes.json`
- **Downloadable Bundle**: `skin_cancer_artifacts.zip`

---

## 2. Clinical Significance & Problem Formulation
Melanoma is the most lethal form of cutaneous malignancy, yet highly curable if detected at an early, non-invasive stage. Automated multi-class dermoscopic screening distinguishes malignant melanomas and carcinomas from benign nevi, keratoses, and vascular anomalies.

---

## 3. Dataset & Class Categories
- **Source**: **HAM10000 ("Human Against Machine with 10000 training images")** ([kmader/skin-cancer-mnist-ham10000](https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000))
- **Total Images**: 10,015 dermoscopic lesion images
- **The 7 Diagnostic Categories**:
  1. `nv` — **Melanocytic nevi**: Benign proliferations of melanocytes
  2. `mel` — **Melanoma**: Malignant neoplasm of melanocytes
  3. `bkl` — **Benign keratosis-like lesions**: Solar lentigines / seborrheic keratoses
  4. `bcc` — **Basal cell carcinoma**: Common slow-growing skin cancer
  5. `akiec` — **Actinic keratoses / intraepithelial carcinoma**: Premalignant squamous lesions
  6. `vasc` — **Vascular lesions**: Angiomas, angiokeratomas, and pyogenic granulomas
  7. `df` — **Dermatofibroma**: Benign histiocytic nodules

---

## 4. Class Imbalance Resolution & Modeling Strategy
1. **Challenge**: Extreme class imbalance in raw data (`nv` comprises ~67% of cases, while `df` has ~1.1%).
2. **Balanced Loss Weighting**: Implemented inverse frequency class weighting (`compute_class_weight('balanced')`) during cross-entropy optimization.
3. **Data Augmentation**: Real-time random rotations, horizontal/vertical flips, affine translations, and zoom adjustments.
4. **Deep Transfer Learning Backbone**:
   - ResNet-50 pre-trained on ImageNet with fine-tuned terminal residual blocks.
   - GlobalAveragePooling2D → BatchNormalization → Dense(256, ReLU, Dropout 0.4) → Dense(128, ReLU, Dropout 0.3) → Dense(7, Softmax).

---

## 5. Empirical Evaluation & Benchmark Targets
- **Target Test Accuracy**: **88.40%**
- **Macro Precision**: **0.88**
- **Macro Recall**: **0.87**
- **Macro F1-Score**: **0.87**

---

## 6. Explainability & Evidence Fusion in MedSynapse
- **Grad-CAM Dermoscopy Heatmaps**: Highlights asymmetrical pigment networks, atypical pigment networks, irregular borders, and color variegation in accordance with the clinical **ABCDE Melanoma Rubric**.
- **Cross-Module Reasoning**:
  - `M8 + Clinical Intake`: Multi-modal lesion examination correlated with patient age, anatomic site, and family history.
