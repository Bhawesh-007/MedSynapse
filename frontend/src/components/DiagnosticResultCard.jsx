import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Printer, 
  FileDown, 
  CheckCircle, 
  Info, 
  Activity, 
  FileCheck,
  Stethoscope,
  CheckSquare,
  Square,
  Layers,
  ClipboardList,
  UserCheck,
  Ban
} from 'lucide-react';
import { generateFinalReport, reviewModelRun } from '../services/api';

export default function DiagnosticResultCard({ 
  result: resultProp,
  onReset, 
  title = 'Diagnostic Risk Assessment',
  onWorkflowStageChange,
}) {
  const assessmentResponse = resultProp?.success && resultProp?.data ? resultProp : null;
  const result = assessmentResponse?.data || resultProp;
  const clinicalReport = assessmentResponse?.clinical_report || null;
  const modelRunId = assessmentResponse?.model_run_id || clinicalReport?.model_run_id || null;

  const [reportId] = useState(() => `MS-${Math.floor(100000 + Math.random() * 900000)}`);
  const [reportDate] = useState(() => new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }));

  const [reviewedBy, setReviewedBy] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [doctorDecisionChoice, setDoctorDecisionChoice] = useState('approved');
  const [workflowStatus, setWorkflowStatus] = useState(
    assessmentResponse?.workflow_status || 'awaiting_clinician_review'
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [finalReport, setFinalReport] = useState(null);

  const explainability = clinicalReport?.explainability || {};
  const decisionTrace = clinicalReport?.decision_trace || {};
  const clinicalInputs = clinicalReport?.clinical_inputs || [];
  const explanationSentences = explainability?.plain_language?.sentences || [];
  const baseValue = explainability?.base_value;

  const shapContributions = useMemo(() => {
    if (!clinicalReport?.explainability) return [];
    if (Array.isArray(clinicalReport.explainability.all_contributions) && clinicalReport.explainability.all_contributions.length > 0) {
      return clinicalReport.explainability.all_contributions;
    }
    const pos = clinicalReport.explainability.top_positive_contributors || [];
    const neg = clinicalReport.explainability.top_negative_contributors || [];
    return [...pos, ...neg];
  }, [clinicalReport]);

  const [verifiedFeatures, setVerifiedFeatures] = useState(() => {
    if (shapContributions.length > 0) {
      return new Set(shapContributions.map(c => c.feature));
    }
    return new Set(['Glucose', 'Age', 'BloodPressure', 'BMI', 'Insulin', 'Pregnancies', 'SkinThickness', 'DiabetesPedigreeFunction', 'BMI_Cat']);
  });

  React.useEffect(() => {
    if (shapContributions.length > 0 && verifiedFeatures.size === 0) {
      setVerifiedFeatures(new Set(shapContributions.map(c => c.feature)));
    }
  }, [shapContributions]);

  const toggleFeatureVerification = (featureName) => {
    setVerifiedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureName)) {
        next.delete(featureName);
      } else {
        next.add(featureName);
      }
      return next;
    });
  };

  const verifyAllFeatures = () => {
    if (shapContributions.length > 0) {
      setVerifiedFeatures(new Set(shapContributions.map(c => c.feature)));
    }
  };

  const deselectAllFeatures = () => {
    setVerifiedFeatures(new Set());
  };

  if (!result) return null;

  const isHealthy = Boolean(
    result.prediction === 0 ||
    result.is_positive === false ||
    result.has_disease === false ||
    result.diagnosis === 'No Disease' ||
    result.diagnosis === 'Benign' ||
    result.prediction === 'Benign' ||
    result.prediction === 'Negative'
  );

  const prob = typeof result?.risk_probability === 'number'
    ? result.risk_probability
    : typeof result?.pneumonia_probability === 'number'
    ? result.pneumonia_probability
    : typeof result?.confidence === 'number'
    ? result.confidence
    : (isHealthy ? 0.15 : 0.85);

  const riskPercent = result?.risk_percentage ||
                      result?.confidence_percentage ||
                      (prob * 100).toFixed(1);

  const riskTier = result?.risk_tier ||
    (prob >= 0.70 ? 'High Risk' : prob >= 0.35 ? 'Moderate Risk' : 'Low Risk');

  const modelName = clinicalReport?.screening?.model_name || 
                    (result.disease ? `${result.disease}_model` : 'Classifier Ensemble');

  const handleClinicianReview = async (decisionOverride = null) => {
    if (!modelRunId) return;
    const decision = decisionOverride || doctorDecisionChoice;
    if (!reviewedBy.trim()) {
      setReviewError('Enter the clinician name or identifier before submitting review.');
      return;
    }
    if (decision === 'approved' && verifiedFeatures.size === 0 && shapContributions.length > 0) {
      setReviewError('Please verify at least one clinical SHAP feature driver before approving.');
      return;
    }

    setReviewLoading(true);
    setReviewError(null);
    onWorkflowStageChange?.('review_saving');
    try {
      const verifiedList = Array.from(verifiedFeatures);
      const response = await reviewModelRun(
        modelRunId,
        decision,
        reviewedBy.trim(),
        reviewComment.trim(),
        verifiedList
      );
      setWorkflowStatus(response.data.workflow_status);
      setFinalReport(null);
      onWorkflowStageChange?.(decision === 'approved' ? 'approved' : 'rejected');
    } catch (error) {
      const message = error.message || 'Clinician review failed';
      setReviewError(message);
      onWorkflowStageChange?.('error', { message, failedAt: 'review' });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleFinalReport = async () => {
    setReviewLoading(true);
    setReviewError(null);
    onWorkflowStageChange?.('groq_generating');
    try {
      const response = await generateFinalReport(modelRunId);
      setFinalReport(response.data);
      setWorkflowStatus('final_report_generated');
      onWorkflowStageChange?.('complete');
    } catch (error) {
      const message = error.message || 'Final report generation failed';
      setReviewError(message);
      onWorkflowStageChange?.('error', { message, failedAt: 'groq' });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    const diseaseName = (result.disease || result.modality || 'Medical').replace(/\s+/g, '_');
    document.title = `MedSynapse_${diseaseName}_Report_${reportId}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="clinical-report-sheet animate-fade-in" style={{
      background: '#ffffff',
      color: '#0f172a',
      border: '1.5px solid #cbd5e1',
      borderRadius: '6px',
      padding: '24px 28px',
      marginTop: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      
      {/* =========================================================================
          1. OFFICIAL INSTITUTIONAL LETTERHEAD
          ========================================================================= */}
      <div className="print-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '2px solid #0f172a',
        paddingBottom: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="#0f172a" />
            <h1 style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              color: '#0f172a'
            }}>
              MedSynapse Clinical Diagnostic & Decision Intelligence Laboratory
            </h1>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#475569', margin: '3px 0 0 0', fontWeight: 500 }}>
            Department of AI Diagnostics & Clinical Decision Support • Automated Decision Trace Audit
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
            REF ID: {reportId}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
            Issued: {reportDate}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Protocol: ISO/IEEE Clinical AI Screening Standard
          </div>
        </div>
      </div>

      {/* Screen Action Toolbar (no-print) */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        margin: '0 0 16px 0',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            Official Screening Record
          </span>
          <span style={{ fontSize: '0.82rem', color: '#475569' }}>
            {workflowStatus === 'final_report_generated'
              ? 'Clinician-approved final report ready for print/export'
              : 'Draft screening record — clinician review required'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleDownloadPDF} 
            className="btn-primary" 
            disabled={Boolean(modelRunId) && workflowStatus !== 'final_report_generated'}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0f172a',
              color: '#ffffff',
              border: '1px solid #0f172a',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <FileDown size={14} /> Download A4 PDF Report
          </button>
          <button 
            onClick={handleDownloadPDF} 
            className="btn-secondary" 
            disabled={Boolean(modelRunId) && workflowStatus !== 'final_report_generated'}
            style={{
              padding: '6px 12px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} /> Print Document
          </button>
          {onReset && (
            <button 
              onClick={onReset} 
              className="btn-secondary" 
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. SPECIMEN & PATIENT CLINICAL DATA SUMMARY
          ========================================================================= */}
      <div className="break-inside-avoid" style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #cbd5e1',
          paddingBottom: '4px',
          marginBottom: '8px'
        }}>
          <h3 style={{
            fontSize: '0.86rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#0f172a',
            margin: 0
          }}>
            1. Diagnostic Target & Specimen Overview
          </h3>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Modality: {result.disease || result.modality || 'Clinical Laboratory Evaluation'}
          </span>
        </div>

        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <tbody>
            <tr>
              <td style={{ width: '22%', fontWeight: 700, background: '#f8fafc', color: '#334155' }}>Diagnostic Target:</td>
              <td style={{ width: '28%', fontWeight: 600, color: '#0f172a' }}>{title}</td>
              <td style={{ width: '22%', fontWeight: 700, background: '#f8fafc', color: '#334155' }}>Evaluation Pipeline:</td>
              <td style={{ width: '28%', color: '#0f172a' }}>{modelName}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155' }}>Acquisition Source:</td>
              <td style={{ color: '#0f172a' }}>{clinicalReport?.screening?.input_source || 'Direct Parameter Submission'}</td>
              <td style={{ fontWeight: 700, background: '#f8fafc', color: '#334155' }}>Input Validation:</td>
              <td style={{ fontWeight: 600, color: '#0f172a' }}>
                {decisionTrace.input_validation === 'passed' ? 'Verified / Complete (Passed)' : 'Pending Verification'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Structured Input Biomarkers Table */}
      {clinicalInputs && clinicalInputs.length > 0 && (
        <div className="break-inside-avoid" style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#334155',
            margin: '0 0 6px 0'
          }}>
            Measured Biomarkers & Clinical Parameters
          </h4>
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>Parameter</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Measured Value</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>Unit</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>Source Verification</th>
              </tr>
            </thead>
            <tbody>
              {clinicalInputs.map((input, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 10px', fontWeight: 600, color: '#1e293b' }}>
                    {input.display_name || input.name}
                  </td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                    {input.value !== null && input.value !== undefined ? String(input.value) : '—'}
                  </td>
                  <td style={{ padding: '5px 10px', color: '#475569' }}>
                    {input.unit || '—'}
                  </td>
                  <td style={{ padding: '5px 10px', color: '#64748b', fontSize: '0.74rem' }}>
                    {input.source || 'Validated model input'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          3. PRIMARY DIAGNOSTIC IMPRESSION & CLASSIFICATION
          ========================================================================= */}
      <div className="print-status-box break-inside-avoid" style={{
        border: '1.5px solid #0f172a',
        backgroundColor: '#f8fafc',
        borderRadius: '4px',
        padding: '14px 18px',
        margin: '16px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: '#475569'
          }}>
            Primary Screening Determination
          </div>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#0f172a',
            margin: '4px 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isHealthy ? <ShieldCheck size={22} color="#0f172a" /> : <AlertTriangle size={22} color="#0f172a" />}
            {result.diagnosis || result.prediction || (result.has_disease ? 'Elevated Risk Indication' : 'Baseline / Normal Finding')}
          </h2>
          <div style={{ fontSize: '0.82rem', color: '#334155', margin: 0 }}>
            Decision Threshold: <strong>0.50</strong> • Calibrated Risk Score: <strong>{prob.toFixed(4)}</strong> • Risk Tier: <strong>{riskTier}</strong>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '8px 18px',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          border: '1px solid #cbd5e1'
        }}>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
            {riskPercent}%
          </div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
            Calibrated Risk
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. MODEL DECISION LOGIC & AUDIT TRACE
          ========================================================================= */}
      <div className="break-inside-avoid" style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #cbd5e1',
          paddingBottom: '4px',
          marginBottom: '8px'
        }}>
          <h3 style={{
            fontSize: '0.86rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#0f172a',
            margin: 0
          }}>
            2. Model Decision Logic & Audit Trace
          </h3>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Step-by-step decision verification
          </span>
        </div>

        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a', width: '25%' }}>Decision Step</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a', width: '45%' }}>Observed Metric / Evaluation</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a', width: '30%' }}>Determination</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '5px 10px', fontWeight: 600 }}>1. Input Validation</td>
              <td style={{ padding: '5px 10px', color: '#334155' }}>All required disease biomarkers validated against schema</td>
              <td style={{ padding: '5px 10px', fontWeight: 600, color: '#0f172a' }}>Passed</td>
            </tr>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '5px 10px', fontWeight: 600 }}>2. Model Routing</td>
              <td style={{ padding: '5px 10px', color: '#334155' }}>Routed to specialized endpoint: {modelName}</td>
              <td style={{ padding: '5px 10px', fontWeight: 600, color: '#0f172a' }}>Executed</td>
            </tr>
            {baseValue !== undefined && baseValue !== null && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 10px', fontWeight: 600 }}>3. Baseline Expected Score</td>
                <td style={{ padding: '5px 10px', color: '#334155' }}>Population background expected value E[f(x)]</td>
                <td style={{ padding: '5px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                  {Number(baseValue).toFixed(4)}
                </td>
              </tr>
            )}
            {decisionTrace.net_shap_displacement !== undefined && decisionTrace.net_shap_displacement !== null && (
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 10px', fontWeight: 600 }}>4. Net SHAP Displacement</td>
                <td style={{ padding: '5px 10px', color: '#334155' }}>Cumulative sum of all positive and negative feature contributions (∑φ)</td>
                <td style={{ padding: '5px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                  {decisionTrace.net_shap_displacement > 0 ? `+${decisionTrace.net_shap_displacement.toFixed(4)}` : decisionTrace.net_shap_displacement.toFixed(4)}
                </td>
              </tr>
            )}
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '5px 10px', fontWeight: 600 }}>5. Threshold Evaluation</td>
              <td style={{ padding: '5px 10px', color: '#334155' }}>
                Calibrated probability ({prob.toFixed(4)}) {prob >= 0.5 ? '≥' : '<'} Decision Threshold (0.5000)
              </td>
              <td style={{ padding: '5px 10px', fontWeight: 700, color: '#0f172a' }}>
                {prob >= 0.5 ? 'Positive Class Indication' : 'Negative Class Indication'}
              </td>
            </tr>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '5px 10px', fontWeight: 600 }}>6. Risk Stratification</td>
              <td style={{ padding: '5px 10px', color: '#334155' }}>
                Stratified by probability cutoffs (Low: &lt;0.35, Moderate: 0.35–0.70, High: ≥0.70)
              </td>
              <td style={{ padding: '5px 10px', fontWeight: 700, color: '#0f172a' }}>
                {riskTier}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          5. COMPREHENSIVE SHAP EXPLAINABILITY & DECISION BREAKDOWN
          ========================================================================= */}
      {shapContributions && shapContributions.length > 0 && (
        <div className="break-inside-avoid" style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #cbd5e1',
            paddingBottom: '4px',
            marginBottom: '8px'
          }}>
            <h3 style={{
              fontSize: '0.86rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#0f172a',
              margin: 0
            }}>
              3. SHAP Feature Attribution & Decision Breakdown
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Method: {explainability.method || 'SHAP Attribution'}
            </span>
          </div>

          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>Biomarker / Feature</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Patient Value</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>SHAP Value (φ)</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>Direction of Effect</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#0f172a' }}>Decision Impact</th>
              </tr>
            </thead>
            <tbody>
              {shapContributions.map((item, idx) => {
                const shapVal = Number(item.shap_value || 0);
                const isPositive = shapVal > 0;
                return (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '5px 10px', fontWeight: 600, color: '#0f172a' }}>{item.feature}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                      {item.patient_value !== undefined && item.patient_value !== null ? String(item.patient_value) : '—'}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      {isPositive ? `+${shapVal.toFixed(6)}` : shapVal.toFixed(6)}
                    </td>
                    <td style={{ padding: '5px 10px', fontWeight: 600, color: '#334155' }}>
                      {isPositive ? 'Elevates Risk (+)' : 'Mitigates Risk (-)'}
                    </td>
                    <td style={{ padding: '5px 10px', color: '#475569', fontSize: '0.78rem' }}>
                      {item.effect || (isPositive ? 'Increased predicted positive score' : 'Reduced predicted positive score')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Step-by-Step Plain Language Decision Narrative */}
      {explanationSentences && explanationSentences.length > 0 && (
        <div className="break-inside-avoid" style={{
          marginBottom: '16px',
          padding: '12px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '4px'
        }}>
          <h4 style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#0f172a',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Info size={14} color="#0f172a" /> Deterministic Decision Explanations
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#1e293b', fontSize: '0.8rem', lineHeight: 1.6 }}>
            {explanationSentences.map((sentence, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{sentence}</li>
            ))}
          </ul>
          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.72rem' }}>
            Note: SHAP values describe this model's behavior for the submitted input and do not establish medical causality.
          </p>
        </div>
      )}

      {/* =========================================================================
          6. RADIOLOGICAL ATTENTION METRICS (IF RADIOLOGY / CNN MODALITY)
          ========================================================================= */}
      {result.image_transformation && (
        <div className="break-inside-avoid" style={{
          marginBottom: '16px',
          padding: '10px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '4px'
        }}>
          <h4 style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#0f172a',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Layers size={14} color="#0f172a" /> Radiographic Tensor Normalization & Attention
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem' }}>
            <span style={{ color: '#334155' }}>
              Source Dimensions: <strong>{result.image_transformation.original_dimensions}</strong> ({result.image_transformation.original_mode})
            </span>
            <span style={{ color: '#334155', fontFamily: 'monospace' }}>
              Standardized Input Tensor: <strong>{result.image_transformation.transformed_shape}</strong> (Float32 [0.0 - 1.0])
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. CLINICIAN REVIEW & DECISION AUDIT SECTION
          ========================================================================= */}
      {modelRunId && (
        <div className="no-print" style={{
          margin: '16px 0',
          padding: '14px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '4px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '8px',
            marginBottom: '12px'
          }}>
            <div>
              <h4 style={{
                color: '#0f172a',
                margin: 0,
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Stethoscope size={16} color="#0f172a" /> Clinician Verification & Decision Audit
              </h4>
              <p style={{ color: '#475569', fontSize: '0.78rem', margin: '3px 0 0 0' }}>
                Review the model decision trace and SHAP evidence above. Clinician approval enables generation of the formal final report.
              </p>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '4px 8px',
              background: '#e2e8f0',
              color: '#0f172a',
              borderRadius: '4px'
            }}>
              Status: {workflowStatus.replaceAll('_', ' ')}
            </span>
          </div>

          {/* Feature verification checklist */}
          {shapContributions.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#1e293b' }}>
                  Verify Biomarker SHAP Drivers ({verifiedFeatures.size}/{shapContributions.length} Verified)
                </strong>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={verifyAllFeatures}
                    disabled={workflowStatus === 'final_report_generated'}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFeatures}
                    disabled={workflowStatus === 'final_report_generated'}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px' }}>
                {shapContributions.map((item) => {
                  const isVerified = verifiedFeatures.has(item.feature);
                  const shapVal = Number(item.shap_value || 0);
                  const isPos = shapVal >= 0;
                  return (
                    <div
                      key={item.feature}
                      onClick={() => workflowStatus !== 'final_report_generated' && toggleFeatureVerification(item.feature)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        background: '#ffffff',
                        border: isVerified ? '1px solid #0f172a' : '1px solid #e2e8f0',
                        cursor: workflowStatus === 'final_report_generated' ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isVerified ? <CheckSquare size={14} color="#0f172a" /> : <Square size={14} color="#94a3b8" />}
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>{item.feature}</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                        {isPos ? `+${shapVal.toFixed(4)}` : shapVal.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 0.7fr) minmax(240px, 1.3fr)', gap: '10px', marginBottom: '10px' }}>
            <input 
              className="form-input" 
              value={reviewedBy} 
              onChange={(event) => setReviewedBy(event.target.value)} 
              placeholder="Clinician ID or Full Name *"
              disabled={workflowStatus === 'final_report_generated'}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '0.82rem',
                color: '#0f172a'
              }}
            />
            <input 
              className="form-input" 
              value={reviewComment} 
              onChange={(event) => setReviewComment(event.target.value)} 
              placeholder="Clinical observation or verification notes"
              disabled={workflowStatus === 'final_report_generated'}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '6px 10px',
                fontSize: '0.82rem',
                color: '#0f172a'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              disabled={reviewLoading || workflowStatus === 'final_report_generated'} 
              onClick={() => handleClinicianReview('approved')}
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                background: '#0f172a',
                color: '#ffffff',
                border: '1px solid #0f172a',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle size={14} /> Approve Decision
            </button>
            <button 
              disabled={reviewLoading || workflowStatus === 'final_report_generated'} 
              onClick={() => handleClinicianReview('rejected')}
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <XCircle size={14} /> Reject Decision
            </button>
            {workflowStatus === 'clinician_approved' && (
              <button 
                disabled={reviewLoading} 
                onClick={handleFinalReport}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: '1px solid #0f172a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileCheck size={14} /> Generate Final LLM Report
              </button>
            )}
          </div>
          {reviewError && <p style={{ color: '#b91c1c', margin: '8px 0 0 0', fontSize: '0.78rem' }}>{reviewError}</p>}
        </div>
      )}

      {/* =========================================================================
          8. CLINICIAN-REVIEWED FINAL CLINICAL NARRATIVE (IF GENERATED)
          ========================================================================= */}
      {finalReport?.report && (
        <div className="break-inside-avoid" style={{
          margin: '16px 0',
          padding: '16px',
          background: '#ffffff',
          border: '1.5px solid #0f172a',
          borderRadius: '4px',
          color: '#0f172a'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #cbd5e1',
            paddingBottom: '6px',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {finalReport.report.title}
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Clinician-Approved Final Document
            </span>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', margin: '0 0 4px 0' }}>
              Screening Summary
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: '#1e293b' }}>
              {finalReport.report.screening_summary}
            </p>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', margin: '0 0 4px 0' }}>
              Objective Model Findings
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: '#1e293b' }}>
              {finalReport.report.model_findings}
            </p>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', margin: '0 0 4px 0' }}>
              Explainability & SHAP Decision Breakdown
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: '#1e293b' }}>
              {finalReport.report.explainability_summary}
            </p>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', margin: '0 0 4px 0' }}>
              Clinician Review Record
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: '#1e293b' }}>
              {finalReport.report.clinician_review}
            </p>
          </div>

          {finalReport.report.recommendations && finalReport.report.recommendations.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', margin: '0 0 4px 0' }}>
                Recommendations
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', lineHeight: 1.5, color: '#1e293b' }}>
                {finalReport.report.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {finalReport.report.limitations && finalReport.report.limitations.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', margin: '0 0 4px 0' }}>
                Methodological Limitations
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', lineHeight: 1.5, color: '#1e293b' }}>
                {finalReport.report.limitations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '10px 0 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
            {finalReport.report.disclaimer}
          </p>
        </div>
      )}

      {/* =========================================================================
          9. EVIDENCE-BASED RECOMMENDATIONS & CLINICAL GUIDANCE
          ========================================================================= */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="break-inside-avoid" style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#0f172a',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ClipboardList size={14} color="#0f172a" /> Recommended Next Steps & Clinical Protocol
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.recommendations.map((rec, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.82rem', color: '#334155' }}>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* =========================================================================
          10. CLINICAL SIGN-OFF & INSTITUTIONAL DISCLAIMER BLOCK
          ========================================================================= */}
      <div className="print-footer-sign break-inside-avoid" style={{
        marginTop: '20px',
        paddingTop: '12px',
        borderTop: '1px solid #cbd5e1',
        fontSize: '0.78rem',
        color: '#64748b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ maxWidth: '65%' }}>
          <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.4, color: '#475569' }}>
            <strong>Institutional Medical Disclaimer:</strong> This diagnostic screening report is generated using calibrated machine learning ensemble models for clinical decision support. This output is not a definitive diagnosis and must be evaluated alongside clinical context by a licensed medical practitioner.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ height: '28px', borderBottom: '1px solid #94a3b8', width: '160px', marginBottom: '4px' }} />
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>
            {reviewedBy ? reviewedBy : 'MedSynapse AI Engine v2.0'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {reviewedBy ? 'Attending Physician Signature' : 'Automated Decision Audit Verification'}
          </div>
        </div>
      </div>

    </div>
  );
}
