import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Play, RefreshCw, FileCode, Check } from 'lucide-react';
import { parseReportOCR, getSampleReports } from '../services/api';

export default function OCRScannerView({ onApplyParams, setTab }) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [sampleReports, setSampleReports] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('');

  // Load sample clinical reports on mount
  useEffect(() => {
    getSampleReports()
      .then(data => setSampleReports(data))
      .catch(err => console.error('Could not load samples', err));
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSelectedSampleId('');
      if (selectedFile.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleLoadSample = (sample) => {
    setSelectedSampleId(sample.id);
    setFile(null);
    setFilePreview(null);
    setRawText(sample.sample_text);
    handleProcessOCR(null, sample.sample_text);
  };

  const handleProcessOCR = async (uploadFile = file, textInput = rawText) => {
    if (!uploadFile && !textInput.trim()) {
      setError('Please choose a file or select a sample report.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await parseReportOCR({
        file: uploadFile,
        rawText: uploadFile ? '' : textInput,
        diseaseType: 'all'
      });
      setOcrResult(res);
    } catch (err) {
      setError(err.message || 'Failed to process document OCR');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToPredictor = (targetDisease) => {
    if (!ocrResult?.ready_inputs) return;
    const params = ocrResult.ready_inputs[targetDisease];
    if (params) {
      onApplyParams(targetDisease, params, ocrResult.parameters);
      setTab(targetDisease);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-cyan">Intelligent OCR Engine</span>
            <span className="badge badge-success">Tesseract 5.0 + PyMuPDF</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            Medical Lab Report Scanner & Document Parser
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Upload patient reports (PDF or Images). MedSynapse extracts clinical biomarkers, normal ranges, and auto-populates ML models.
          </p>
        </div>
      </div>

      {/* Preset Sample Reports Banner for Instant Testing */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>
            Quick Start: Load Pre-Built Clinical Lab Panels
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {sampleReports.map((s) => (
            <button
              key={s.id}
              onClick={() => handleLoadSample(s)}
              className="btn-secondary"
              style={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                padding: '10px 14px',
                border: selectedSampleId === s.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: selectedSampleId === s.id ? 'rgba(14, 165, 233, 0.15)' : 'rgba(30, 41, 59, 0.6)'
              }}
            >
              <FileText size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {s.patient}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone & Manual Text Entry */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Upload Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#38bdf8" /> Upload Document (PDF / JPG / PNG)
          </h3>

          <label 
            style={{
              border: '2px dashed rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'rgba(14, 165, 233, 0.04)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s ease'
            }}
          >
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg,.webp" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={22} color="#38bdf8" />
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
                {file ? file.name : 'Click to Browse or Drag & Drop'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports lab blood panels, metabolic tests, ECG readouts (Max 25MB)
              </p>
            </div>
          </label>

          {filePreview && (
            <div style={{ marginTop: '0.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', maxHeight: '200px' }}>
              <img src={filePreview} alt="Report Preview" style={{ width: '100%', objectFit: 'contain', maxHeight: '200px' }} />
            </div>
          )}

          <button 
            onClick={() => handleProcessOCR(file, rawText)} 
            disabled={loading || (!file && !rawText.trim())}
            className="btn-primary"
            style={{ width: '100%', marginTop: 'auto' }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Running Optical Character Recognition...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Scan & Extract Clinical Parameters</span>
              </>
            )}
          </button>
        </div>

        {/* Text Input / Raw Text Editor */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} color="#a855f7" /> Document Text / OCR Output
            </h3>
            {rawText && (
              <button 
                onClick={() => setRawText('')} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste clinical text, doctor notes, or lab printout here to parse parameters directly..."
            rows={9}
            className="form-input"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              resize: 'vertical',
              flex: 1
            }}
          />

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            💡 <em>Tip: The parser automatically identifies Glucose, Blood Pressure, BMI, Insulin, Cholesterol, Heart Rate, ECG, and Age.</em>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '10px',
          color: '#fda4af',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Extracted Parameters Results Section */}
      {ocrResult && (
        <div className="glass-panel glass-panel-glow animate-fade-in" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-success">
                  <CheckCircle2 size={13} /> {ocrResult.extracted_count} Biomarkers Identified
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Scanned {ocrResult.line_count} document lines
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                Extracted Clinical Parameters
              </h2>
            </div>

            {/* Quick Actions to Send to Models */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleTransferToPredictor('diabetes')}
                className="btn-accent"
                style={{ background: 'linear-gradient(135deg, #e11d48, #f43f5e)', padding: '10px 18px' }}
              >
                <span>Apply to Diabetes Predictor</span>
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={() => handleTransferToPredictor('heart')}
                className="btn-primary"
                style={{ padding: '10px 18px' }}
              >
                <span>Apply to Cardiac Predictor</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid of Extracted Parameter Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            {Object.entries(ocrResult.parameters || {}).map(([key, item]) => (
              <div
                key={key}
                style={{
                  padding: '14px',
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {key.replace('_', ' ')}
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    {(item.confidence * 100).toFixed(0)}% Conf
                  </span>
                </div>

                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {item.display || item.value} <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 500 }}>{item.unit || ''}</span>
                </div>

                {item.normal_range && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Standard Ref: <strong style={{ color: 'var(--text-secondary)' }}>{item.normal_range}</strong>
                  </div>
                )}

                {item.status && (
                  <div>
                    <span className={`badge ${item.status.includes('Normal') || item.status.includes('Desirable') ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                      {item.status}
                    </span>
                  </div>
                )}

                {item.matched_text && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', backgroundColor: 'rgba(15, 23, 42, 0.5)', padding: '4px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Match: "{item.matched_text}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
