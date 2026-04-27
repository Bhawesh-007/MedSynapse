import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, Printer, FileDown, CheckCircle, Info, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DiagnosticResultCard({ result, onReset, title = 'Diagnostic Risk Assessment' }) {
  if (!result) return null;

  const isHealthy = result.prediction === 0 || result.is_positive === false || result.has_disease === false || result.has_tumor === false || result.diagnosis === 'No Tumor (Healthy)';
  const riskPercent = result.risk_percentage || result.confidence_percentage || (result.pneumonia_probability ? (result.pneumonia_probability * 100).toFixed(1) : 0);

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

  const handlePrint = () => {
    window.print();
  };

  const getRiskColor = () => {
    if (isHealthy) return '#10b981'; // Green
    if (result.risk_tier === 'Moderate Risk') return '#f59e0b'; // Amber
    return '#f43f5e'; // Rose/Red
  };

  const riskColor = getRiskColor();

  return (
    <div className="glass-panel glass-panel-glow animate-fade-in" style={{ padding: '1.75rem', marginTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
        <div>
          <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>Diagnostic Report</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>{title}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Evaluated by MedSynapse AI Diagnostic Pipeline • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }} className="no-print">
          <button onClick={handlePrint} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <Printer size={15} /> Print / Save PDF
          </button>
          {onReset && (
            <button onClick={onReset} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              Reset Analysis
            </button>
          )}
        </div>
      </div>

      {/* Main Score & Status Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        margin: '1.5rem 0',
        alignItems: 'center'
      }}>
        {/* Risk Gauge Visual */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="3.2"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={riskColor}
                strokeWidth="3.4"
                strokeDasharray={`${riskPercent}, 100`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {riskPercent}%
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Risk / Conf
              </div>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <span 
              className={`badge ${isHealthy ? 'badge-success' : 'badge-danger'}`}
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            >
              {isHealthy ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
              {result.risk_tier || (isHealthy ? 'Low Risk / Healthy' : 'Action Recommended')}
            </span>
          </div>
        </div>

        {/* Diagnosis Outcome Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Primary Diagnostic Classification
            </span>
            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: riskColor,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px'
            }}>
              {result.diagnosis || (result.has_disease ? `High Risk Detected` : `Optimal Baseline`)}
            </h2>
          </div>

          {result.description && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {result.description}
            </p>
          )}

          {/* MRI Multi-class breakdown if available */}
          {result.class_probabilities && (
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Model Class Confidence Distribution
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {Object.entries(result.class_probabilities).map(([cls, prob]) => (
                  <div key={cls} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cls}</span>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${prob}%`,
                        height: '100%',
                        backgroundColor: prob > 40 ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#ffffff', fontFamily: 'var(--font-mono)', minWidth: '45px', textAlign: 'right' }}>
                      {prob}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Transformation & Tensor Calibration Details (if radiology / vision model) */}
      {result.image_transformation && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'rgba(56, 189, 248, 0.05)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '10px',
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>Auto-Transformation Active</span>
            <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
              Original: <strong>{result.image_transformation.original_dimensions}</strong> ({result.image_transformation.original_mode})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>➡️ Standardized Tensor: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{result.image_transformation.transformed_shape}</strong></span>
            <span>• {result.image_transformation.normalization}</span>
          </div>
        </div>
      )}

      {/* Contributing Factors Section */}
      {result.contributing_factors && result.contributing_factors.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#38bdf8" /> Key Clinical Indicators & Biomarkers
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {result.contributing_factors.map((fac, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>{fac.factor}</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{fac.value}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {fac.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Clinical Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={16} color="#10b981" /> Recommended Next Steps & Clinical Guidance
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.recommendations.map((rec, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '1.25rem', padding: '10px 14px', backgroundColor: 'rgba(14, 165, 233, 0.06)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.15)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        ⚠️ <strong>Medical Disclaimer:</strong> This assessment is generated by machine learning models for early screening and triage support. It does not replace definitive medical diagnosis by a licensed healthcare professional.
      </div>
    </div>
  );
}
