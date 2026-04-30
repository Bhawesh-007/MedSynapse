import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  FileDown, 
  CheckCircle, 
  Info, 
  Sparkles, 
  Activity, 
  FileCheck,
  Stethoscope
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DiagnosticResultCard({ 
  result, 
  onReset, 
  title = 'Diagnostic Risk Assessment',
  inputData = null
}) {
  if (!result) return null;

  const [reportId] = useState(() => `MS-${Math.floor(100000 + Math.random() * 900000)}`);
  const [reportDate] = useState(() => new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }));

  const isHealthy = result.prediction === 0 || 
                    result.is_positive === false || 
                    result.has_disease === false || 
                    result.has_tumor === false || 
                    result.diagnosis === 'No Tumor (Healthy)';

  const riskPercent = result.risk_percentage || 
                      result.confidence_percentage || 
                      (result.pneumonia_probability ? (result.pneumonia_probability * 100).toFixed(1) : 0);

  // Trigger celebration confetti if healthy result
  React.useEffect(() => {
    if (isHealthy) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isHealthy]);

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    const diseaseName = (result.disease || result.modality || 'Medical').replace(/\s+/g, '_');
    document.title = `MedSynapse_${diseaseName}_Report_${reportId}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const getRiskColor = () => {
    if (isHealthy) return '#10b981'; // Green
    if (result.risk_tier === 'Moderate Risk') return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose/Red
  };

  const riskColor = getRiskColor();
  const statusClass = isHealthy ? 'success' : (result.risk_tier === 'Moderate Risk' ? 'warning' : 'danger');

  return (
    <div className="glass-panel glass-panel-glow clinical-report-sheet animate-fade-in" style={{ padding: '1.75rem', marginTop: '1.5rem' }}>
      
      {/* =========================================================================
          1. CLINICAL HEADER & HOSPITAL LETTERHEAD
          ========================================================================= */}
      <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid rgba(56, 189, 248, 0.3)', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color="#0284c7" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: '#ffffff' }} className="report-inst-title">
              MEDSYNAPSE CLINICAL INTELLIGENCE LABS
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Department of AI Diagnostics & Clinical Radiology • Automated Specimen Evaluation
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
            REF: {reportId}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Issued: {reportDate}
          </div>
        </div>
      </div>

      {/* Action Toolbar (Screen Only) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-cyan">A4 Standardized Report</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ready for clinical export & print</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleDownloadPDF} 
            className="btn-primary" 
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileDown size={16} /> Download A4 PDF Report
          </button>
          <button 
            onClick={handleDownloadPDF} 
            className="btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Document
          </button>
          {onReset && (
            <button 
              onClick={onReset} 
              className="btn-secondary" 
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              Reset Analysis
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. SPECIMEN & PATIENT CLINICAL DATA SUMMARY (A4 TABLE)
          ========================================================================= */}
      <div className="break-inside-avoid" style={{ margin: '1rem 0' }}>
        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <tbody>
            <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)' }}>
              <td style={{ width: '22%', fontWeight: 700, color: 'var(--text-muted)' }}>Diagnostic Scope:</td>
              <td style={{ width: '28%', fontWeight: 600, color: '#ffffff' }}>{title}</td>
              <td style={{ width: '22%', fontWeight: 700, color: 'var(--text-muted)' }}>Modality / Engine:</td>
              <td style={{ width: '28%', color: '#38bdf8' }}>{result.disease || result.modality || 'Machine Learning Multi-Modal'}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Assessment Status:</td>
              <td style={{ fontWeight: 600, color: isHealthy ? '#10b981' : '#f43f5e' }}>
                {isHealthy ? 'Normal / Negative Finding' : 'Pathological / Positive Indication'}
              </td>
              <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Validation Pipeline:</td>
              <td style={{ color: 'var(--text-secondary)' }}>Keras 3 + Scikit-Learn Scaler</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          3. PRIMARY DIAGNOSTIC IMPRESSION (STRATIFICATION BOX)
          ========================================================================= */}
      <div className={`print-status-box ${statusClass} break-inside-avoid`} style={{
        padding: '1.25rem',
        borderRadius: '10px',
        margin: '1.25rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            Primary Clinical Classification
          </span>
          <h2 style={{
            fontSize: '1.55rem',
            fontWeight: 800,
            color: riskColor,
            margin: '4px 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isHealthy ? <ShieldCheck size={26} color="#10b981" /> : <AlertTriangle size={26} color={riskColor} />}
            {result.diagnosis || (result.has_disease ? `High Risk Detected` : `Optimal Baseline`)}
          </h2>
          {result.description && (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px' }}>
              {result.description}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '10px 20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: riskColor }}>
            {riskPercent}%
          </div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            {result.risk_tier || (isHealthy ? 'Healthy Index' : 'Confidence')}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. IMAGE TRANSFORMATION & TENSOR NORMALIZATION METRICS (IF RADIOLOGY/MRI)
          ========================================================================= */}
      {result.image_transformation && (
        <div className="break-inside-avoid" style={{
          padding: '10px 14px',
          backgroundColor: 'rgba(56, 189, 248, 0.05)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          margin: '1rem 0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> AI Radiographic Tensor Preprocessing:
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Source Image: <strong>{result.image_transformation.original_dimensions}</strong> ({result.image_transformation.original_mode})
            </span>
            <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              Standardized Model Tensor: <strong>{result.image_transformation.transformed_shape}</strong> (Float32 [0.0 - 1.0])
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. MULTI-CLASS PROBABILITIES TABLE (IF MRI SCAN)
          ========================================================================= */}
      {result.class_probabilities && (
        <div className="break-inside-avoid" style={{ margin: '1rem 0' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Differential Model Class Probabilities Distribution:
          </h4>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Pathology Class</th>
                <th style={{ width: '45%' }}>Probability Weight</th>
                <th style={{ textAlign: 'right', width: '20%' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.class_probabilities).map(([cls, prob]) => (
                <tr key={cls}>
                  <td style={{ fontWeight: 600 }}>{cls}</td>
                  <td>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${prob}%`, height: '100%', backgroundColor: prob > 40 ? '#0284c7' : '#94a3b8' }} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {prob}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          6. CLINICAL BIOMARKER / CONTRIBUTING FACTORS MATRIX
          ========================================================================= */}
      {result.contributing_factors && result.contributing_factors.length > 0 && (
        <div className="break-inside-avoid" style={{ margin: '1.25rem 0' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} color="#38bdf8" /> Significant Clinical Indicators & Biomarker Analysis
          </h4>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Biomarker / Factor</th>
                <th style={{ width: '25%' }}>Observed Value</th>
                <th style={{ width: '45%' }}>Clinical Impact Evaluation</th>
              </tr>
            </thead>
            <tbody>
              {result.contributing_factors.map((fac, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: '#ffffff' }}>{fac.factor}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 600 }}>{fac.value}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{fac.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          7. EVIDENCE-BASED RECOMMENDATIONS & CLINICAL GUIDANCE
          ========================================================================= */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="break-inside-avoid" style={{ margin: '1.25rem 0' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={15} color="#10b981" /> Recommended Next Steps & Clinical Guidance
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {result.recommendations.map((rec, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* =========================================================================
          8. CLINICAL SIGN-OFF & MEDICAL DISCLAIMER BLOCK
          ========================================================================= */}
      <div className="print-footer-sign break-inside-avoid" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '60%' }}>
          <p style={{ margin: 0, fontSize: '0.74rem', lineHeight: 1.4 }}>
            <strong>Institutional Medical Disclaimer:</strong> This diagnostic report is generated using calibrated machine learning ensemble models and deep neural networks for screening assistance. Final diagnostic and therapeutic decisions must be verified by a licensed medical practitioner.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ height: '32px', borderBottom: '1px solid #94a3b8', width: '180px', marginBottom: '4px' }} />
          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.78rem' }}>MedSynapse Clinical AI v2.0</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Automated Verification Signature</div>
        </div>
      </div>

    </div>
  );
}

