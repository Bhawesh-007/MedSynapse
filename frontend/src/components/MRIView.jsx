import React, { useState, useRef } from 'react';
import { Brain, Upload, Play, RefreshCw, AlertCircle, CheckCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { predictMRI } from '../services/api';
import DiagnosticResultCard from './DiagnosticResultCard';

export default function MRIView() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const handleLoadSampleMRI = async (sampleType) => {
    setError(null);
    setLoading(true);
    try {
      // Create a sample canvas MRI scan blob
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, 300, 300);

      // Cranial skull oval
      ctx.fillStyle = '#1e1e24';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(150, 150, 110, 125, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Brain hemispheres
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(150, 150, 95, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      // Midline fissure
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150, 45);
      ctx.lineTo(150, 255);
      ctx.stroke();

      // Ventricles
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(135, 145, 8, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(165, 145, 8, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tumor anomaly if pathological sample
      if (sampleType === 'tumor') {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(185, 110, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      canvas.toBlob(async (blob) => {
        const sampleFile = new File([blob], `sample_${sampleType}_mri.png`, { type: 'image/png' });
        setFile(sampleFile);
        setPreview(URL.createObjectURL(sampleFile));

        // Auto predict
        try {
          const res = await predictMRI(sampleFile);
          setResult(res.data);
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        } catch (err) {
          setError(err.message || 'MRI analysis failed');
        } finally {
          setLoading(false);
        }
      }, 'image/png');

    } catch (err) {
      setError('Could not generate sample: ' + err.message);
      setLoading(false);
    }
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      setError('Please select or upload a brain MRI scan image.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await predictMRI(file);
      setResult(res.data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err) {
      setError(err.message || 'Brain MRI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-purple">Neuro-Oncology AI</span>
            <span className="badge badge-cyan">Xception Deep Transfer Learning</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            Brain Tumor MRI Differential Classifier
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            4-Class intracranial lesion classification: Glioma, Meningioma, Pituitary Adenoma, or Normal Healthy Brain.
          </p>
        </div>
      </div>

      {/* Demo Sample Presets */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Instant 1-Click Demo Scans:
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleLoadSampleMRI('healthy')}
          className="btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
        >
          🟢 Test Healthy Brain MRI
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleLoadSampleMRI('tumor')}
          className="btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.85rem', borderColor: 'rgba(168, 85, 247, 0.4)' }}
        >
          🟣 Test Brain Lesion / Tumor
        </button>
      </div>

      {/* Upload & Preview Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Upload Card */}
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#c084fc" /> Upload Cranial MRI Scan
          </h3>

          <label 
            style={{
              border: '2px dashed rgba(192, 132, 252, 0.4)',
              borderRadius: '12px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'rgba(168, 85, 247, 0.04)',
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
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain size={24} color="#c084fc" />
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff' }}>
                {file ? file.name : 'Select MRI Scan Image (JPEG/PNG)'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Axial, Coronal, or Sagittal MRI slice
              </p>
            </div>
          </label>

          <button
            onClick={handlePredict}
            disabled={loading || !file}
            className="btn-accent"
            style={{ width: '100%', marginTop: 'auto', padding: '12px' }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Classifying Neuro-Imaging Features...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>Classify Brain MRI Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Scan Preview Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '280px' }}>
          {preview ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <img 
                src={preview} 
                alt="Selected Brain MRI" 
                style={{
                  maxHeight: '260px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                }} 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cranial MRI Scan Loaded</span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
              <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No MRI scan loaded yet.</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Click a demo button above or upload your MRI scan to preview.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Output */}
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

      {/* Results Card */}
      <div ref={resultRef}>
        {result && (
          <DiagnosticResultCard
            result={result}
            title="Brain MRI Neuro-Oncology Assessment"
            onReset={() => { setResult(null); setFile(null); setPreview(null); }}
          />
        )}
      </div>
    </div>
  );
}
