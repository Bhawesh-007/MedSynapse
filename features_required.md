# Features Required for Disease Probability Calculation

This document lists **exactly** what the diabetes, heart, and breast models need in order to
produce a probability. It covers the current branch (`feature/model_refinement`) and `main`,
because the branches differ in a few details.

Sources checked:

- `backend/services/model_service.py` (inference order, preprocessing, class maps)
- `backend/services/diabetes_feature_contract.py`
- `backend/services/heart_feature_contract.py`
- `backend/services/breast_feature_contract.py`
- `backend/services/jev_scoring.py`
- `backend/main.py` (Pydantic input schemas, OCR/Gemma routing)
- `scripts/train/*.py` and `notebooks/Final_*.ipynb` on `main`
- Serialized artifacts under `models/`

> Order matters. Every model below is fed a positional vector, so these lists are the
> required column order, not just a set of names.

---

## 1. Branch and artifact availability

| Disease | Current branch (`feature/model_refinement`) | `main` | Model artifact expected |
|---|---|---|---|
| Diabetes | ✅ | ✅ | `models/diabetes_model.pkl` + `diabetes_scaler.pkl` |
| Coronary heart disease | ✅ | ✅ | `models/heart_model.pkl` + `heart_scaler.pkl` |
| Breast cancer | ✅ | ✅ | `breast_cancer_model.pkl`, `breast_cancer_scaler.pkl`, `breast_cancer_pca.pkl` (ensemble variant also present) |

`main` additionally tracks packaged artifacts (`*_artifacts.zip`). The current branch tracks
only the diabetes and heart binaries; the breast artifacts exist locally but are untracked.

---

## 2. How features reach a model

There are three entry paths, and they do **not** require the same inputs:

1. **Manual form** → `POST /api/predict/<disease>` → Pydantic schema → `ModelService`.
   Missing optional fields are filled with the schema defaults. This is the path that
   currently works for diabetes and heart.
2. **OCR + Gemma** → `POST /api/ocr/parse-report` → regex parameters → Gemma contract
   validation → `feature_extractions` table. This path **does not run the disease model**.
   It only stores auditable evidence.
3. **Feature store** → `POST /api/predict/<disease>/from-feature-store/{id}` →
   stored `model_features` → `ModelService`. This path refuses to substitute values.

The OCR route also computes a **JEV suitability score** (`backend/services/jev_scoring.py`),
which is a completeness/confidence indicator, not a disease probability.

---

## 3. Diabetes mellitus — tabular

**Model:** soft-voting ensemble (RF + GradientBoosting + ExtraTrees + LogisticRegression)
**Dataset:** PIMA Indians Diabetes
**Probability:** `predict_proba(...)[1]` = diabetes risk

### 3.1 Contract order (production, DPF-free)

| # | Feature | API key | Unit | Accepted range | Notes |
|---|---|---|---|---|---|
| 1 | `Pregnancies` | `pregnancies` | count | 0–30 | Gravida / "number of pregnancies"; parity is not a substitute |
| 2 | `Glucose` | `glucose` | mg/dL | >0–600 | Fasting plasma glucose; mmol/L is converted ×18.0182 |
| 3 | `BloodPressure` | `blood_pressure` | mmHg | >0–300 | **Diastolic** component; `142/90` → `90` |
| 4 | `SkinThickness` | `skin_thickness` | mm | >0–100 | Triceps skinfold |
| 5 | `Insulin` | `insulin` | µIU/mL | >0–1500 | Fasting serum insulin |
| 6 | `BMI` | `bmi` | kg/m² | >0–100 | |
| 7 | `Age` | `age` | years | 1–120 | |
| 8 | `BMI_Cat` | *(derived)* | category 0–3 | 0–3 | Derived by the app, never by Gemma |

`BMI_Cat`: `<18.5 → 0`, `18.5–24.9 → 1`, `25–29.9 → 2`, `≥30 → 3`.

Zero is only valid for `Pregnancies`. For Glucose, BloodPressure, SkinThickness, Insulin,
and BMI, zero means missing and must be rejected.

### 3.2 The 9-feature artifact conflict

The installed `models/diabetes_scaler.pkl` is a **9-feature** scaler:

```
Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI,
DiabetesPedigreeFunction, Age, BMI_Cat
```

The production contract and the OCR/Gemma feature store are **DPF-free** (8 features:
the seven above plus `BMI_Cat`). Consequences:

- `POST /api/predict/diabetes` (manual form) still sends `dpf` and works, because the
  Pydantic schema defaults `dpf = 0.5`.
- `POST /api/predict/diabetes/from-feature-store/{id}` **fails** for the installed artifact
  unless `MEDSYNAPSE_ALLOW_SYNTHETIC_DPF=1`, which enables a synthetic DPF test mode.
- `TABULAR_PROFILES["diabetes"]` in `jev_scoring.py` uses the DPF-free contract names,
  and JEV derives `BMI_Cat` from `BMI` when scoring completeness.
- `scripts/train/train_diabetes.py` on `main` trains the 9-feature version **including**
  `DiabetesPedigreeFunction`. To use the DPF-free path end-to-end, a new 8-feature
  artifact must be trained and installed.

---

## 4. Coronary heart disease — tabular

**Model:** RandomForest classifier
**Dataset:** UCI Cleveland heart disease
**Probability:** index `[1]` on the current branch (correct: class 1 = disease)

### 4.1 Feature order (13)

| # | Contract name | API key | Unit | Allowed values |
|---|---|---|---|---|
| 1 | `Age` | `age` | years | 1–120 |
| 2 | `Sex` | `sex` | category | `1` = male, `0` = female |
| 3 | `CP` | `cp` | category | `0`–`3` chest-pain type |
| 4 | `RestingBP` | `trestbps` | mmHg | >0 |
| 5 | `Cholesterol` | `chol` | mg/dL | ≥0 |
| 6 | `FastingBloodSugar` | `fbs` | category | `1` if fasting glucose >120 mg/dL, else `0` |
| 7 | `RestingECG` | `restecg` | category | `0`, `1`, `2` |
| 8 | `MaxHeartRate` | `thalach` | bpm | >0 |
| 9 | `ExerciseAngina` | `exang` | category | `1` = yes, `0` = no |
| 10 | `STDepression` | `oldpeak` | mm | ≥0 |
| 11 | `Slope` | `slope` | category | `0`, `1`, `2` |
| 12 | `MajorVessels` | `ca` | count | `0`–`3` |
| 13 | `Thalassemia` | `thal` | category | dataset code (`0`–`3`; sample uses `3`) |

Serialized scaler confirms this exact order.

### 4.2 Class-index inconsistency

`scripts/train/train_heart.py` maps `target = (num > 0)` and reports
`predict_proba(...)[:, 1]` as disease probability. The current branch uses `[1]` ✅.
`main` uses `probabilities[0]` ❌, which returns the **no-disease** probability. A model
trained as `1 = disease` will therefore be inverted on `main`.

---

## 5. Breast cancer — tabular (WDBC FNA)

**Model:** scaler → PCA → classifier
**Dataset:** Wisconsin Diagnostic Breast Cancer
**Probability:** `predict_proba(...)[1]` = malignant

### 5.1 The 30 features, in exact order

Order is `mean` block → `se` block → `worst` block, and within each block:

`radius, texture, perimeter, area, smoothness, compactness, concavity, concave_points,
symmetry, fractal_dimension`

| # | Feature | # | Feature | # | Feature |
|---|---|---|---|---|---|
| 1 | `radius_mean` | 11 | `radius_se` | 21 | `radius_worst` |
| 2 | `texture_mean` | 12 | `texture_se` | 22 | `texture_worst` |
| 3 | `perimeter_mean` | 13 | `perimeter_se` | 23 | `perimeter_worst` |
| 4 | `area_mean` | 14 | `area_se` | 24 | `area_worst` |
| 5 | `smoothness_mean` | 15 | `smoothness_se` | 25 | `smoothness_worst` |
| 6 | `compactness_mean` | 16 | `compactness_se` | 26 | `compactness_worst` |
| 7 | `concavity_mean` | 17 | `concavity_se` | 27 | `concavity_worst` |
| 8 | `concave_points_mean` | 18 | `concave_points_se` | 28 | `concave_points_worst` |
| 9 | `symmetry_mean` | 19 | `symmetry_se` | 29 | `symmetry_worst` |
| 10 | `fractal_dimension_mean` | 20 | `fractal_dimension_se` | 30 | `fractal_dimension_worst` |

Notes:

- All 30 are continuous, unitless/derived image-morphometry values from an FNA slide.
  They are **not** routine lab values, so they cannot be read off a blood report.
- `se` = standard error, `worst` = mean of the three largest values.
- All 30 are mandatory. `predict_breast_cancer` raises if any key is missing or non-finite.
- Geometry (`radius`, `perimeter`, `area`) must be in the same scale used at training
  (WDBC units); no unit conversion is performed at inference.
- The scaler and PCA must be the ones paired with the classifier. Using a scaler from a
  different artifact order silently produces a valid-looking but wrong probability.

OCR/Gemma extracts all 30 into the strict `breast_feature_contract`. A configured
Gemma model is always sent the complete OCR text so it can attempt every field;
exact regex-labelled values take precedence over the model for the same field.
There is no precomputed fallback when Gemma is unavailable.

---

## 6. What a "complete" probability request needs

| Module | Minimum required inputs | Derived by app | Artifact needed |
|---|---|---|---|
| Diabetes (manual) | pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, dpf, age | `BMI_Cat` | 9-feature scaler+model |
| Diabetes (feature store) | the same minus `dpf` | `BMI_Cat` | 8-feature scaler+model |
| Heart | 13 values in §4.1 | — | 13-feature scaler+model |
| Breast | 30 WDBC values in §5.1 | PCA transform | scaler + PCA + classifier |

A probability must never be produced when a required value is missing. The current
contracts correctly return `needs_review` / HTTP 409 rather than imputing.

---

## 7. Known inconsistencies to resolve

1. **Diabetes artifact vs contract** — installed scaler is 9 features (includes DPF);
   contract and feature store are 8 (DPF-free). Add an 8-feature artifact or keep
   DPF explicitly.
2. **JEV diabetes profile** — resolved: JEV scores the DPF-free contract and derives
   `BMI_Cat` from `BMI`, so a complete Gemma extraction can score 100%.
3. **Heart class index** — `main` uses `probabilities[0]`; training and the current branch
   use `[1]`. `main` reports inverted risk.
4. **Breast artifact pairing** — the classifier must be used with its matching scaler and
   PCA. Mixing artifacts from the ensemble and single-model exports gives wrong
   probabilities without raising an error.
5. **Breast OCR coverage** — resolved: with `disease_type=all`, the OCR route now runs the
   breast WDBC extraction alongside diabetes and heart, and JEV scores all three from the
   stored Gemma evidence.

---

## 8. Quick reference: exact input vectors

```text
Diabetes (artifact):
[Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI,
 DiabetesPedigreeFunction, Age, BMI_Cat]

Diabetes (contract / feature store):
[Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, Age, BMI_Cat]

Heart:
[age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak,
 slope, ca, thal]

Breast:
[radius_mean, texture_mean, perimeter_mean, area_mean, smoothness_mean,
 compactness_mean, concavity_mean, concave_points_mean, symmetry_mean,
 fractal_dimension_mean,
 radius_se, texture_se, perimeter_se, area_se, smoothness_se,
 compactness_se, concavity_se, concave_points_se, symmetry_se,
 fractal_dimension_se,
 radius_worst, texture_worst, perimeter_worst, area_worst, smoothness_worst,
 compactness_worst, concavity_worst, concave_points_worst, symmetry_worst,
 fractal_dimension_worst]
```
