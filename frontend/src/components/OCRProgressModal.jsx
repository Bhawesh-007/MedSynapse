import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  ScanText,
  Sparkles,
  Database,
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Circle,
  Clock,
  ArrowRight,
  Cpu,
} from 'lucide-react';

const STAGES = [
  {
    key: 'upload_reading',
    number: '01',
    title: 'Document Parsing & Page Ingestion',
    description: 'PyMuPDF and image processors extract high-resolution text buffers.',
    icon: FileText,
  },
  {
    key: 'ocr_extraction',
    number: '02',
    title: 'Tesseract OCR & Heuristic Biomarker Match',
    description: 'Optical character recognition and regex pattern matching for clinical values.',
    icon: ScanText,
  },
  {
    key: 'gemma_extraction',
    number: '03',
    title: 'Gemma 3:4B Local Feature Extraction',
    description: 'Local neural model enforces strict clinical JSON schema and validates evidence.',
    icon: Sparkles,
  },
  {
    key: 'feature_store_saving',
    number: '04',
    title: 'SQLite Feature Store & JEV Suitability Scoring',
    description: 'Persisting extraction audit ledger and matching disease model readiness.',
    icon: Database,
  },
];

function getStageIndex(stage) {
  switch (stage) {
    case 'upload_reading':
      return 0;
    case 'ocr_extraction':
      return 1;
    case 'gemma_extraction':
      return 2;
    case 'feature_store_saving':
      return 3;
    case 'complete':
      return 4;
    default:
      return 0;
  }
}

export default function OCRProgressModal({
  isOpen,
  stage = 'upload_reading',
  error = null,
  onClose,
  diseaseType = 'all',
  filename = '',
}) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && stage !== 'complete' && !error) {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isOpen, stage, error]);

  if (!isOpen) return null;

  const currentIndex = getStageIndex(stage);
  const isComplete = stage === 'complete';
  const hasError = Boolean(error);
  const progressPercent = hasError
    ? 100
    : isComplete
      ? 100
      : Math.max(15, Math.min(95, ((currentIndex + 0.6) / STAGES.length) * 100));

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins > 0 ? `${mins}m ` : ''}${secs}s`;
  };

  const modalContent = (
    <div className="pipeline-modal-backdrop" role="presentation" onClick={isComplete || hasError ? onClose : undefined}>
      <section
        className="pipeline-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ocr-pipeline-title"
        aria-describedby="ocr-pipeline-desc"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        {(isComplete || hasError) && (
          <button className="pipeline-modal-close" type="button" onClick={onClose} aria-label="Close progress modal">
            <XCircle size={18} />
          </button>
        )}

        {/* Modal Header */}
        <header className="pipeline-modal-header">
          <div className={`pipeline-modal-symbol ${hasError ? 'is-error' : isComplete ? 'is-complete' : 'is-active'}`}>
            {hasError ? (
              <XCircle size={26} />
            ) : isComplete ? (
              <CheckCircle2 size={26} />
            ) : (
              <Cpu size={26} />
            )}
          </div>
          <div className="pipeline-modal-titles">
            <div className="pipeline-modal-eyebrow-row">
              <p className="pipeline-modal-eyebrow">
                {hasError
                  ? 'OCR Pipeline Error'
                  : isComplete
                    ? 'Extraction Complete'
                    : 'Processing Lab Report'}
              </p>
              {!hasError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} color="#25854a" />
                  <span className="pipeline-modal-pct">⏱ {formatTime(elapsed)}</span>
                </div>
              )}
            </div>
            <h2 id="ocr-pipeline-title">
              {hasError
                ? 'Document Parsing Failed'
                : isComplete
                  ? 'Biomarkers & Evidence Extracted!'
                  : stage === 'gemma_extraction'
                    ? 'Gemma 3:4B Analyzing Clinical Values…'
                    : 'Extracting Clinical Parameters…'}
            </h2>
            <p id="ocr-pipeline-desc">
              {filename ? `Document: ${filename} • ` : ''}
              {hasError
                ? 'Review error output below and retry.'
                : isComplete
                  ? 'All parameters extracted and validated against medical normal ranges.'
                  : stage === 'gemma_extraction'
                    ? 'Local Gemma model is performing deep semantic extraction and schema validation.'
                    : 'Running optical scan and regex matching across laboratory biomarker panels.'}
            </p>
          </div>
        </header>

        {/* Progress Bar Track */}
        <div className="pipeline-progress-track" aria-label={`OCR progress ${Math.round(progressPercent)}%`}>
          <span
            className={`pipeline-progress-fill ${!isComplete && !hasError ? 'is-animated' : ''}`}
            style={{
              width: `${progressPercent}%`,
              background: hasError ? '#dc2626' : undefined,
            }}
          />
        </div>

        {/* Step List */}
        <div className="pipeline-step-list" aria-live="polite">
          {STAGES.map((s, index) => {
            let status = 'pending';
            if (hasError) {
              if (index < currentIndex) status = 'complete';
              else if (index === currentIndex) status = 'error';
              else status = 'pending';
            } else if (isComplete) {
              status = 'complete';
            } else {
              if (index < currentIndex) status = 'complete';
              else if (index === currentIndex) status = 'active';
              else status = 'pending';
            }

            return (
              <div className={`pipeline-step is-${status}`} key={s.key}>
                <div className="pipeline-step-icon">
                  {status === 'complete' && <CheckCircle2 size={16} strokeWidth={2.5} />}
                  {status === 'active' && <LoaderCircle size={17} className="animate-spin" />}
                  {status === 'error' && <XCircle size={16} strokeWidth={2.5} />}
                  {status === 'pending' && <Circle size={11} fill="currentColor" opacity={0.4} />}
                </div>
                <div className="pipeline-step-content">
                  <div className="pipeline-step-title-row">
                    <span className="pipeline-step-num">{s.number}</span>
                    <h3>{s.title}</h3>
                  </div>
                  <p>{s.description}</p>
                </div>
                <div className="pipeline-step-badge-wrap">
                  {status === 'complete' && (
                    <span className="pipeline-step-badge is-complete">Completed</span>
                  )}
                  {status === 'active' && (
                    <span className="pipeline-step-badge is-active">
                      <span className="pipeline-pulse-dot" />
                      In Progress
                    </span>
                  )}
                  {status === 'error' && (
                    <span className="pipeline-step-badge is-error">Failed</span>
                  )}
                  {status === 'pending' && (
                    <span className="pipeline-step-badge is-pending">Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Local Gemma Notice */}
        {!isComplete && !hasError && stage === 'gemma_extraction' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              fontSize: '0.8rem',
              color: '#166534',
              marginTop: '10px',
            }}
          >
            <Sparkles size={16} color="#16a34a" className="flex-shrink-0 animate-pulse" />
            <span>
              <strong>Local Gemma 3:4B Model Active:</strong> Deep structured extraction takes ~45–75 seconds on CPU. Please keep this tab open.
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="pipeline-modal-error">
            <XCircle size={16} className="flex-shrink-0" />
            <div>
              <strong>Extraction Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <footer className="pipeline-modal-footer">
          <span className="pipeline-modal-footer-note">
            {!isComplete && !hasError
              ? '⚡ Running local neural pipeline • Data never leaves your machine'
              : 'Extraction result logged in local SQLite feature store.'}
          </span>
          {(isComplete || hasError) && (
            <button className="btn-primary pipeline-action-btn" type="button" onClick={onClose}>
              <span>{isComplete ? 'View Extracted Results' : 'Close & Retry'}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </footer>
      </section>
    </div>
  );

  return createPortal(modalContent, document.body);
}
