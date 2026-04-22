import os
import io
import pickle
import numpy as np
from PIL import Image
import tensorflow as tf
from numpy.random import MT19937, RandomState
import numpy.random._pickle as np_pickle

# Compatibility shims for Keras 3 layers
class FixedFlatten(tf.keras.layers.Flatten):
    def call(self, inputs, *args, **kwargs):
        if isinstance(inputs, (list, tuple)) and len(inputs) > 0:
            if not hasattr(inputs, 'shape'):
                inputs = inputs[0]
        while isinstance(inputs, (list, tuple)) and len(inputs) == 1:
            inputs = inputs[0]
        return super().call(inputs, *args, **kwargs)

    @classmethod
    def from_config(cls, config):
        return cls(**config)

class FixedPooling(tf.keras.layers.GlobalAveragePooling2D):
    def call(self, inputs, *args, **kwargs):
        if isinstance(inputs, (list, tuple)) and len(inputs) > 0:
            if not hasattr(inputs, 'shape'):
                inputs = inputs[0]
        while isinstance(inputs, (list, tuple)) and len(inputs) == 1:
            inputs = inputs[0]
        return super().call(inputs, *args, **kwargs)

    @classmethod
    def from_config(cls, config):
        return cls(**config)

# Unpickler compatibility for legacy scikit-learn models
class CompatMT19937(MT19937):
    def __setstate__(self, state):
        try:
            super().__setstate__(state)
        except Exception:
            pass

def compat_ctor(*args, **kwargs):
    return CompatMT19937()

def compat_randomstate_ctor(*args, **kwargs):
    return RandomState()

class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if 'MT19937' in name or module.startswith('numpy.random'):
            if 'MT19937' in name:
                return CompatMT19937
            if name == '__bit_generator_ctor':
                return compat_ctor
            if name == '__randomstate_ctor':
                return compat_randomstate_ctor
        return super().find_class(module, name)

np_pickle.__bit_generator_ctor = compat_ctor
np_pickle.__randomstate_ctor = compat_randomstate_ctor


class ModelService:
    _instance = None

    def __init__(self):
        # Resolve project root from backend/services/
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        self.models_dir = os.path.join(self.base_dir, 'models')
        self._diabetes_model = None
        self._diabetes_scaler = None
        self._heart_model = None
        self._heart_scaler = None
        self._xray_model = None
        self._mri_model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelService()
        return cls._instance

    # 1. Diabetes Model
    def get_diabetes_model(self):
        if self._diabetes_model is None:
            model_path = os.path.join(self.models_dir, 'diabetes_model.pkl')
            scaler_path = os.path.join(self.models_dir, 'diabetes_scaler.pkl')
            with open(model_path, 'rb') as f:
                self._diabetes_model = CustomUnpickler(f).load()
            with open(scaler_path, 'rb') as f:
                self._diabetes_scaler = pickle.load(f)
        return self._diabetes_model, self._diabetes_scaler

    def predict_diabetes(self, data: dict) -> dict:
        model, scaler = self.get_diabetes_model()
        pregnancies = float(data.get('pregnancies', 0))
        glucose = float(data.get('glucose', 100))
        blood_pressure = float(data.get('blood_pressure', 70))
        skin_thickness = float(data.get('skin_thickness', 20))
        insulin = float(data.get('insulin', 80))
        bmi = float(data.get('bmi', 25.0))
        dpf = float(data.get('dpf', 0.5))
        age = float(data.get('age', 30))

        # Categorize BMI
        if bmi < 18.5:
            bmi_cat = 0
        elif 18.5 <= bmi < 25:
            bmi_cat = 1
        elif 25 <= bmi < 30:
            bmi_cat = 2
        else:
            bmi_cat = 3

        input_arr = np.array([[pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, dpf, age, bmi_cat]])
        scaled_input = scaler.transform(input_arr)
        
        prediction = int(model.predict(scaled_input)[0])
        probabilities = model.predict_proba(scaled_input)[0]
        risk_probability = float(probabilities[1])

        # Clinical factor analysis
        factors = []
        if glucose >= 126:
            factors.append({'factor': 'Fasting Glucose', 'value': f"{glucose} mg/dL", 'impact': 'High (Diabetic threshold exceeded)'})
        elif glucose >= 100:
            factors.append({'factor': 'Fasting Glucose', 'value': f"{glucose} mg/dL", 'impact': 'Moderate (Impaired fasting glucose)'})
        
        if bmi >= 30:
            factors.append({'factor': 'Body Mass Index', 'value': f"{bmi} kg/m²", 'impact': 'High (Obesity Class I+)'})
        elif bmi >= 25:
            factors.append({'factor': 'Body Mass Index', 'value': f"{bmi} kg/m²", 'impact': 'Moderate (Overweight)'})
            
        if insulin > 166:
            factors.append({'factor': 'Serum Insulin', 'value': f"{insulin} μU/mL", 'impact': 'High (Possible Insulin Resistance)'})

        if blood_pressure >= 85:
            factors.append({'factor': 'Diastolic BP', 'value': f"{blood_pressure} mm Hg", 'impact': 'Elevated vascular tension'})

        if not factors:
            factors.append({'factor': 'Metabolic Profile', 'value': 'Optimal', 'impact': 'Parameters within standard baseline'})

        recommendations = []
        if risk_probability >= 0.5:
            recommendations = [
                "Schedule a clinical consultation for oral glucose tolerance test (OGTT) and HbA1c screening.",
                "Adopt a low-glycemic dietary regimen rich in soluble fiber and lean protein.",
                "Engage in at least 150 minutes per week of moderate-intensity aerobic and resistance exercise.",
                "Monitor self-monitored blood glucose levels (fasting and 2-hr postprandial)."
            ]
        else:
            recommendations = [
                "Maintain a balanced, nutrient-dense diet and stay physically active.",
                "Undergo routine annual wellness and preventative metabolic screenings.",
                "Keep body mass index (BMI) within the healthy range (18.5 - 24.9 kg/m²)."
            ]

        return {
            'disease': 'Diabetes Mellitus',
            'prediction': prediction,
            'has_disease': bool(prediction == 1),
            'risk_probability': round(risk_probability, 4),
            'risk_percentage': round(risk_probability * 100, 1),
            'risk_tier': 'High Risk' if risk_probability >= 0.65 else ('Moderate Risk' if risk_probability >= 0.35 else 'Low Risk'),
            'contributing_factors': factors,
            'recommendations': recommendations
        }

    # 2. Heart Disease Model
    def get_heart_model(self):
        if self._heart_model is None:
            model_path = os.path.join(self.models_dir, 'heart_model.pkl')
            scaler_path = os.path.join(self.models_dir, 'heart_scaler.pkl')
            with open(model_path, 'rb') as f:
                self._heart_model = CustomUnpickler(f).load()
            with open(scaler_path, 'rb') as f:
                self._heart_scaler = pickle.load(f)
        return self._heart_model, self._heart_scaler

    def predict_heart(self, data: dict) -> dict:
        model, scaler = self.get_heart_model()
        age = float(data.get('age', 50))
        sex = float(data.get('sex', 1))
        cp = float(data.get('cp', 0))
        trestbps = float(data.get('trestbps', 120))
        chol = float(data.get('chol', 200))
        fbs = float(data.get('fbs', 0))
        restecg = float(data.get('restecg', 0))
        thalach = float(data.get('thalach', 150))
        exang = float(data.get('exang', 0))
        oldpeak = float(data.get('oldpeak', 0.0))
        slope = float(data.get('slope', 1))
        ca = float(data.get('ca', 0))
        thal = float(data.get('thal', 2))

        input_arr = np.array([[age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal]])
        scaled_input = scaler.transform(input_arr)

        prediction = int(model.predict(scaled_input)[0])
        probabilities = model.predict_proba(scaled_input)[0]
        risk_probability = float(probabilities[1])

        factors = []
        if chol >= 240:
            factors.append({'factor': 'Serum Cholesterol', 'value': f"{chol} mg/dL", 'impact': 'High (Atherosclerosis risk)'})
        elif chol >= 200:
            factors.append({'factor': 'Serum Cholesterol', 'value': f"{chol} mg/dL", 'impact': 'Borderline Elevated'})

        if trestbps >= 140:
            factors.append({'factor': 'Resting BP', 'value': f"{trestbps} mm Hg", 'impact': 'Stage 2 Hypertension'})
        elif trestbps >= 130:
            factors.append({'factor': 'Resting BP', 'value': f"{trestbps} mm Hg", 'impact': 'Stage 1 Hypertension'})

        if exang == 1:
            factors.append({'factor': 'Exercise Induced Angina', 'value': 'Present', 'impact': 'Myocardial ischemia indicator'})

        if oldpeak >= 2.0:
            factors.append({'factor': 'ST Depression (Oldpeak)', 'value': f"{oldpeak} mm", 'impact': 'Significant ST depression'})

        if not factors:
            factors.append({'factor': 'Cardiovascular Markers', 'value': 'Stable', 'impact': 'Parameters within normal bounds'})

        recommendations = []
        if risk_probability >= 0.5:
            recommendations = [
                "Urgent referral to a cardiologist for comprehensive 12-lead ECG, Echo, or Stress Test.",
                "Review lipid profile (LDL/HDL/Triglycerides) and consider statin therapy if indicated.",
                "Initiate cardiovascular dietary modifications (DASH diet, Mediterranean diet, reduced sodium).",
                "Strict blood pressure management and smoking cessation."
            ]
        else:
            recommendations = [
                "Continue heart-healthy lifestyle with regular physical exercise.",
                "Maintain optimal blood pressure (< 120/80 mm Hg) and cholesterol levels (< 200 mg/dL).",
                "Schedule annual preventative cardiac checkups."
            ]

        return {
            'disease': 'Coronary Heart Disease',
            'prediction': prediction,
            'has_disease': bool(prediction == 1),
            'risk_probability': round(risk_probability, 4),
            'risk_percentage': round(risk_probability * 100, 1),
            'risk_tier': 'High Risk' if risk_probability >= 0.65 else ('Moderate Risk' if risk_probability >= 0.35 else 'Low Risk'),
            'contributing_factors': factors,
            'recommendations': recommendations
        }

    @staticmethod
    def transform_image(image_bytes: bytes, target_size: tuple = (224, 224)) -> tuple[np.ndarray, dict]:
        """
        Transforms any arbitrary input image (various sizes, aspect ratios, color modes, orientations)
        into the exact tensor shape and format required by deep learning models.
        
        target_size: (width, height), e.g. (224, 224) for X-Ray, (299, 299) for MRI
        """
        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Input image bytes are empty.")
            
        try:
            from PIL import ImageOps
            img = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            raise ValueError(f"Failed to decode image file: {str(e)}. Please upload a valid PNG, JPEG, WEBP, or TIFF.")

        orig_w, orig_h = img.size
        orig_mode = img.mode

        # 1. Handle EXIF rotation metadata if present
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        # 2. Handle transparency / alpha channels cleanly
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            # Create a solid black background (standard in medical imaging) and composite
            img_rgba = img.convert('RGBA')
            bg = Image.new('RGB', img_rgba.size, (0, 0, 0))
            bg.paste(img_rgba, mask=img_rgba.split()[3])
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # 3. High-fidelity resampling to target tensor shape
        target_w, target_h = target_size
        img_transformed = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

        # 4. Convert to float32 NumPy array normalized to [0.0, 1.0]
        img_arr = np.array(img_transformed, dtype=np.float32) / 255.0

        # 5. Expand batch dimension -> shape: (1, target_h, target_w, 3)
        if img_arr.ndim == 3:
            img_tensor = np.expand_dims(img_arr, axis=0)
        else:
            img_tensor = img_arr

        # Enforce exact tensor shape validation
        expected_shape = (1, target_h, target_w, 3)
        if img_tensor.shape != expected_shape:
            raise ValueError(f"Image tensor shape mismatch: got {img_tensor.shape}, expected {expected_shape}")

        metadata = {
            'original_dimensions': f"{orig_w} × {orig_h} px",
            'original_mode': orig_mode,
            'transformed_shape': f"{target_w} × {target_h} × 3",
            'normalization': 'Float32 [0.0 - 1.0]'
        }

        return img_tensor, metadata

    # 3. Chest X-Ray Model
    def get_xray_model(self):
        if self._xray_model is None:
            model_path = os.path.join(self.models_dir, 'xrays_pneumonia.keras')
            custom_objects = {
                'Flatten': FixedFlatten,
                'GlobalAveragePooling2D': FixedPooling
            }
            try:
                self._xray_model = tf.keras.models.load_model(model_path, compile=False, custom_objects=custom_objects)
            except Exception:
                self._xray_model = tf.keras.models.load_model(model_path, compile=False, safe_mode=False, custom_objects=custom_objects)
        return self._xray_model

    def predict_xray(self, image_bytes: bytes) -> dict:
        model = self.get_xray_model()
        img_arr, transform_meta = self.transform_image(image_bytes, target_size=(224, 224))

        preds = model.predict(img_arr, verbose=0)
        if len(preds[0]) > 1:
            prob = float(preds[0][1])
        else:
            prob = float(preds[0][0])

        is_pneumonia = prob > 0.5
        confidence = prob if is_pneumonia else (1.0 - prob)

        recommendations = []
        if is_pneumonia:
            recommendations = [
                "Immediate medical evaluation by a pulmonologist or primary care physician.",
                "Confirm clinical symptoms (fever, productive cough, shortness of breath, pleuritic chest pain).",
                "Evaluate for antibiotic or antiviral treatment depending on clinical etiology.",
                "Pulse oximetry monitoring for adequate oxygen saturation (> 94%)."
            ]
        else:
            recommendations = [
                "No radiological evidence of acute pneumonia infiltration detected.",
                "If respiratory symptoms persist, consult a doctor for differential evaluation (bronchitis, asthma, allergies).",
                "Maintain good respiratory hygiene and seasonal vaccinations."
            ]

        return {
            'modality': 'Chest Radiography (X-Ray)',
            'diagnosis': 'Pneumonia' if is_pneumonia else 'Normal (Clear Lungs)',
            'is_positive': is_pneumonia,
            'pneumonia_probability': round(prob, 4),
            'confidence_percentage': round(confidence * 100, 1),
            'severity': 'Elevated Radiological Density' if is_pneumonia else 'Normal Pulmonary Clarity',
            'image_transformation': transform_meta,
            'recommendations': recommendations
        }

    # 4. Brain Tumor MRI Model
    def get_mri_model(self):
        if self._mri_model is None:
            model_path = os.path.join(self.models_dir, 'brain_tumor_model.keras')
            if os.path.exists(model_path):
                try:
                    # Rebuild architecture directly for flawless Keras 3 forward-pass
                    base_model = tf.keras.applications.Xception(weights=None, include_top=False, input_shape=(299, 299, 3), pooling='max')
                    model = tf.keras.Sequential([
                        base_model,
                        FixedFlatten(),
                        tf.keras.layers.Dropout(rate=0.3),
                        tf.keras.layers.Dense(128, activation='relu'),
                        tf.keras.layers.Dropout(rate=0.25),
                        tf.keras.layers.Dense(4, activation='softmax')
                    ])
                    model.load_weights(model_path)
                    self._mri_model = model
                except Exception:
                    custom_objects = {'Flatten': FixedFlatten, 'GlobalAveragePooling2D': FixedPooling}
                    self._mri_model = tf.keras.models.load_model(model_path, compile=False, custom_objects=custom_objects)
        return self._mri_model

    def predict_mri(self, image_bytes: bytes) -> dict:
        model = self.get_mri_model()
        if model is None:
            raise RuntimeError("Brain tumor model is not loaded.")

        img_arr, transform_meta = self.transform_image(image_bytes, target_size=(299, 299))

        # Use functional tensor call to avoid Keras 3 list-wrap bug
        try:
            preds_tensor = model(img_arr, training=False)
            preds = preds_tensor.numpy()[0] if hasattr(preds_tensor, 'numpy') else np.array(preds_tensor)[0]
        except Exception:
            preds = model.predict(img_arr, verbose=0)[0]

        class_names = ['Glioma Tumor', 'Meningioma Tumor', 'No Tumor (Healthy)', 'Pituitary Tumor']
        
        pred_idx = int(np.argmax(preds))
        pred_class = class_names[pred_idx]
        confidence = float(preds[pred_idx])

        probabilities_dict = {
            class_names[i]: round(float(preds[i]) * 100, 2)
            for i in range(len(class_names))
        }

        has_tumor = (pred_idx != 2)
        recommendations = []
        if has_tumor:
            recommendations = [
                f"Urgent neurosurgical / neuro-oncological evaluation for confirmed {pred_class}.",
                "Obtain contrast-enhanced volumetric MRI (T1+Gadolinium, T2/FLAIR) and MRS spectroscopy.",
                "Multidisciplinary tumor board review for surgical planning, biopsy, or stereotactic radiosurgery."
            ]
        else:
            recommendations = [
                "MRI scan shows no intracranial mass effect, abnormal contrast enhancement, or tumor pathology.",
                "Continue follow-up if neurological symptoms (headaches, seizures, vision changes) warrant further investigation."
            ]

        descriptions = {
            'Glioma Tumor': 'Intra-axial glial cell neoplasm requiring prompt neurological assessment.',
            'Meningioma Tumor': 'Extra-axial tumor arising from the arachnoid layer of the meninges.',
            'Pituitary Tumor': 'Adenoma localized to the sellar / pituitary gland region.',
            'No Tumor (Healthy)': 'Normal cerebral anatomy without detectable neoplastic lesion.'
        }

        return {
            'modality': 'Brain Magnetic Resonance Imaging (MRI)',
            'diagnosis': pred_class,
            'has_tumor': has_tumor,
            'confidence_percentage': round(confidence * 100, 1),
            'class_probabilities': probabilities_dict,
            'description': descriptions.get(pred_class, 'Neurological scan analysis completed.'),
            'image_transformation': transform_meta,
            'recommendations': recommendations
        }
