import React from 'react';
import { 
  Droplets, 
  Heart, 
  Scan, 
  Eye, 
  Ribbon, 
  FileText, 
  ArrowRight, 
  Brain, 
  Layers, 
  AlertTriangle, 
  Activity,
  Zap,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function DashboardHome({ setTab }) {
  const modules = [
    {
      id: 'diabetes',
      code: 'M1',
      title: 'Diabetes Mellitus',
      category: 'Metabolic & Endocrinology',
      desc: 'Predict diabetic risk and glycemic irregularities using Voting Classifier ensemble with BMI stratification.',
      badge: '74.68% Test Acc',
      badgeColor: 'badge-danger',
      icon: Droplets,
      iconColor: '#b42318',
      keyInputs: 'Glucose, Insulin, BMI, Blood Pressure, Age',
      arch: 'Soft-Voting Ensemble (RF+GB+ET+LR)'
    },
    {
      id: 'heart',
      code: 'M2',
      title: 'Coronary Heart Disease',
      category: 'Cardiology & Vascular',
      desc: 'Assess coronary arterial risk using 13 clinical biomarkers, exercise ECG metrics, and lipid profiles.',
      badge: '98.54% Test Acc',
      badgeColor: 'badge-warning',
      icon: Heart,
      iconColor: '#c81e1e',
      keyInputs: 'Resting BP, Cholesterol, Max HR, Angina, ST Depression',
      arch: 'Random Forest (100 Trees)'
    },
    {
      id: 'xray',
      code: 'M3',
      title: 'Pneumonia (Chest X-Ray)',
      category: 'Pulmonology & Radiology',
      desc: 'Deep Convolutional Neural Network for rapid detection of acute bacterial and viral pneumonia infiltrates.',
      badge: '83.01% Test Acc',
      badgeColor: 'badge-cyan',
      icon: Scan,
      iconColor: '#287a89',
      keyInputs: 'Chest Radiograph (JPEG, PNG, DICOM)',
      arch: 'Xception Deep Transfer Learning'
    },
    {
      id: 'brain-tumor',
      code: 'M4',
      title: 'Brain Tumor (Cranial MRI)',
      category: 'Neuro-Oncology',
      desc: '4-class intracranial neoplasm classifier distinguishing Glioma, Meningioma, Pituitary Adenoma, and Healthy Brain.',
      badge: '95.25% Test Acc',
      badgeColor: 'badge-purple',
      icon: Brain,
      iconColor: '#7c3aed',
      keyInputs: 'Cranial Axial / Coronal MRI Scans (299×299)',
      arch: 'Xception Deep Transfer Network'
    },
    {
      id: 'breast',
      code: 'M5',
      title: 'Breast Cancer (FNA)',
      category: 'Oncology & Cytopathology',
      desc: 'Evaluates 30 fine-needle aspirate (FNA) morphology measurements for benign vs malignant breast lesion triage.',
      badge: '96.49% Test Acc',
      badgeColor: 'badge-purple',
      icon: Ribbon,
      iconColor: '#b83280',
      keyInputs: '30 WDBC Cell Nuclei Morphology Metrics',
      arch: 'PCA + Tuned Logistic Regression / Ensemble'
    },
    {
      id: 'liver',
      code: 'M6',
      title: 'Liver Disease (ILPD)',
      category: 'Hepatology & Gastroenterology',
      desc: 'Multi-analyte LFT panel evaluating transaminases (ALT/AST), alkaline phosphatase, and protein ratios.',
      badge: '79.49% Test Acc',
      badgeColor: 'badge-warning',
      icon: Activity,
      iconColor: '#d97706',
      keyInputs: 'Total/Direct Bilirubin, ALP, ALT, AST, Albumin, A/G Ratio',
      arch: 'Random Forest / GBDT / XGBoost'
    },
    {
      id: 'kidney-stone',
      code: 'M7',
      title: 'Kidney Pathology & Calculi',
      category: 'Nephrology & Urology',
      desc: 'Automated 4-class CT scan screening for Nephrolithiasis (Stones), Renal Cysts, Tumors, and Healthy Parenchyma.',
      badge: '99.25% Test Acc',
      badgeColor: 'badge-cyan',
      icon: Layers,
      iconColor: '#0284c7',
      keyInputs: 'Abdominal CT Radiography (150×150)',
      arch: 'MobileNetV2, EfficientNetB0, U-Net'
    },
    {
      id: 'skin-cancer',
      code: 'M8',
      title: 'Skin Cancer (HAM10000)',
      category: 'Dermatology & Oncology',
      desc: '7-class dermatoscopic lesion classifier distinguishing Melanoma, Basal Cell Carcinoma, and benign nevi.',
      badge: '97.98% Test Acc',
      badgeColor: 'badge-danger',
      icon: AlertTriangle,
      iconColor: '#dc2626',
      keyInputs: 'Dermoscopic Lesion Photography (28×28)',
      arch: 'Deep 4-Block Hierarchical CNN'
    },
    {
      id: 'eye',
      code: 'M9',
      title: 'Eye Diseases (Retinal Fundus)',
      category: 'Ophthalmology & Retina',
      desc: 'Multi-class color fundus screening for Diabetic Retinopathy, Glaucoma Optic Neuropathy, and Cataracts.',
      badge: '90.78% Test Acc',
      badgeColor: 'badge-purple',
      icon: Eye,
      iconColor: '#6b46c1',
      keyInputs: 'Digital Retinal Fundus Images (224×224)',
      arch: 'PyTorch ResNet-18 Transfer Learning'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Hero Banner */}
      <div 
        className="glass-panel" 
        style={{
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '3px 8px',
              background: '#e2e8f0',
              color: '#0f172a',
              borderRadius: '4px'
            }}>
              Agentic Multi-Disease Diagnostic Architecture
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2, color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
            Unified Multi-Modal Clinical Intelligence Framework
          </h1>

          <p style={{ fontSize: '1rem', color: '#475569', marginTop: '0.9rem', lineHeight: 1.6 }}>
            Unifying <strong>9 specialized diagnostic disease modules</strong> across metabolic, cardiovascular, pulmonary, neuro-oncological, oncological, hepatic, nephrological, dermatological, and ophthalmic domains with automated lab report OCR and SHAP explainability.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setTab('ocr')} 
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.95rem', background: '#0f172a' }}
            >
              <FileText size={16} />
              <span>Upload Report</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>9 Modules</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Multi-Specialty ML & CNN Backbone</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>Tesseract 5</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Automated PDF & Scan OCR</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>SHAP + CAM</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Fused Multi-Method Explainability</div>
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>A4 PDF</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Standardized Clinical Reports</div>
          </div>
        </div>
      </div>

      {/* 9 Diagnostic Modules Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              The 9 Clinical Diagnostic Modules
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px', margin: 0 }}>
              Select any diagnostic module to input clinical parameters or upload radiological imaging:
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="glass-panel"
                onClick={() => setTab(mod.id)}
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.9rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}>
                      <Icon size={22} color="#0f172a" />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className={`badge ${mod.badgeColor}`}>{mod.badge}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 700 }}>
                    {mod.category}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '3px 0 6px 0' }}>
                    {mod.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                    {mod.desc}
                  </p>
                </div>

                <div>
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: '4px',
                    fontSize: '0.74rem',
                    color: '#475569',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: '1rem'
                  }}>
                    <strong style={{ color: '#0f172a' }}>Architecture:</strong> {mod.arch}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f172a', fontWeight: 700, fontSize: '0.85rem' }}>
                    <span>Launch Diagnostic Workspace</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured OCR Workflow Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: '1.5rem',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileText size={18} color="#0f172a" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Have a Lab Report or Clinical PDF?
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '4px 0 0 0' }}>
            Upload patient laboratory documents. The OCR engine reads metabolic panels, lipid profiles, blood pressure, LFTs, and FNA parameters automatically to populate the diagnostic models.
          </p>
        </div>

        <button 
          onClick={() => setTab('ocr')} 
          className="btn-primary"
          style={{ padding: '10px 18px', background: '#0f172a' }}
        >
          <Zap size={15} /> Open Lab OCR Studio
        </button>
      </div>

    </div>
  );
}
