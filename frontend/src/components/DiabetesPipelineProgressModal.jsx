import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Circle,
  FileCheck,
  LoaderCircle,
  Sparkles,
  X,
  XCircle,
  ArrowRight,
  Activity,
} from 'lucide-react';

const STEPS = [
  {
    key: 'input',
    number: '01',
    title: 'Clinical Features Submitted',
    description: 'Patient biomarkers and report parameters validated securely.',
  },
  {
    key: 'prediction',
    number: '02',
    title: 'Ensemble Prediction & SHAP Analysis',
    description: 'Voting classifier calculates risk score and SHAP feature contributions.',
  },
  {
    key: 'review',
    number: '03',
    title: 'Clinician Verification & Review',
    description: 'Attending physician audits AI predictions and explanation evidence.',
  },
  {
    key: 'groq',
    number: '04',
    title: 'Clinical Synthesis & Report Generation',
    description: 'Structured LLM synthesis generates the final verified diagnostic report.',
  },
  {
    key: 'complete',
    number: '05',
    title: 'Diagnostic Report Finalized',
    description: 'Immutable record stored in local clinical feature store.',
  },
];

const STAGE_COPY = {
  prediction_running: {
    eyebrow: 'Analysis In Progress',
    title: 'Calculating Risk & Explainability',
    message: 'The AI ensemble is evaluating patient indicators and computing exact SHAP feature attributions.',
    currentIndex: 1,
  },
  awaiting_review: {
    eyebrow: 'Model Analysis Complete',
    title: 'Ready for Clinician Review',
    message: 'Diagnostic risk score and explainability weights are ready for medical audit.',
    currentIndex: 2,
  },
  review_saving: {
    eyebrow: 'Auditing Decision',
    title: 'Saving Review Record',
    message: 'Recording clinician verification decision and comments into the audit ledger.',
    currentIndex: 2,
  },
  approved: {
    eyebrow: 'Clinician Approved',
    title: 'Generating Final Report',
    message: 'Approved evidence is being formatted for diagnostic synthesis.',
    currentIndex: 3,
  },
  rejected: {
    eyebrow: 'Review Rejected',
    title: 'Pipeline Halted',
    message: 'The assessment was rejected by clinician. Report generation has stopped.',
    currentIndex: 2,
  },
  groq_generating: {
    eyebrow: 'Synthesis In Progress',
    title: 'Generating Clinical Summary',
    message: 'Synthesizing comprehensive diagnostic findings from approved evidence.',
    currentIndex: 3,
  },
  complete: {
    eyebrow: 'Pipeline Complete',
    title: 'Final Diagnostic Report Ready',
    message: 'Validated, clinician-approved diagnostic report is locked and available.',
    currentIndex: 4,
  },
  error: {
    eyebrow: 'Pipeline Interrupted',
    title: 'Stage Encountered an Error',
    message: 'An issue occurred during processing. Please review details below.',
    currentIndex: 1,
  },
};

const ACTIVE_STAGES = new Set(['prediction_running', 'review_saving', 'groq_generating']);

function stepStatus(stepIndex, stage, failedAt) {
  const currentIndex = STAGE_COPY[stage]?.currentIndex ?? 0;
  if (stage === 'rejected') {
    if (stepIndex < 2) return 'complete';
    if (stepIndex === 2) return 'rejected';
    return 'blocked';
  }
  if (stage === 'error') {
    const failedIndex = { input: 0, prediction: 1, review: 2, groq: 3, complete: 4 }[failedAt] ?? 1;
    if (stepIndex < failedIndex) return 'complete';
    if (stepIndex === failedIndex) return 'error';
    return 'pending';
  }
  if (stage === 'complete') return 'complete';
  if (stage === 'approved' && stepIndex === 3) return 'pending';
  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return ACTIVE_STAGES.has(stage) ? 'active' : 'current';
  return 'pending';
}

function StatusBadge({ status }) {
  if (status === 'complete') {
    return <span className="pipeline-step-badge is-complete">Completed</span>;
  }
  if (status === 'active') {
    return (
      <span className="pipeline-step-badge is-active">
        <span className="pipeline-pulse-dot" />
        In Progress
      </span>
    );
  }
  if (status === 'current') {
    return <span className="pipeline-step-badge is-current">Action Required</span>;
  }
  if (status === 'error') {
    return <span className="pipeline-step-badge is-error">Failed</span>;
  }
  if (status === 'rejected') {
    return <span className="pipeline-step-badge is-rejected">Rejected</span>;
  }
  return <span className="pipeline-step-badge is-pending">Queued</span>;
}

function StepIcon({ status }) {
  if (status === 'complete') return <Check size={16} strokeWidth={2.5} />;
  if (status === 'active') return <LoaderCircle size={17} className="animate-spin" />;
  if (status === 'error' || status === 'rejected') return <XCircle size={16} strokeWidth={2.5} />;
  return <Circle size={11} fill="currentColor" opacity={0.4} />;
}

export default function DiabetesPipelineProgressModal({
  isOpen,
  stage,
  error,
  failedAt,
  onClose,
}) {
  const copy = STAGE_COPY[stage] || STAGE_COPY.prediction_running;
  const progress = useMemo(() => {
    if (stage === 'rejected' || stage === 'error') return null;
    return Math.max(12, Math.min(100, ((copy.currentIndex + (stage === 'complete' ? 1 : 0)) / STEPS.length) * 100));
  }, [copy.currentIndex, stage]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !ACTIVE_STAGES.has(stage)) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, stage]);

  if (!isOpen) return null;

  const isActive = ACTIVE_STAGES.has(stage);
  const isComplete = stage === 'complete';
  const isRejected = stage === 'rejected';

  const modalContent = (
    <div className="pipeline-modal-backdrop" role="presentation" onClick={!isActive ? onClose : undefined}>
      <section
        className="pipeline-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diabetes-pipeline-title"
        aria-describedby="diabetes-pipeline-message"
        onClick={e => e.stopPropagation()}
      >
        {!isActive && (
          <button className="pipeline-modal-close" type="button" onClick={onClose} aria-label="Close pipeline dialog">
            <X size={18} />
          </button>
        )}

        {/* Header section */}
        <header className="pipeline-modal-header">
          <div className={`pipeline-modal-symbol ${stage === 'error' || isRejected ? 'is-error' : isComplete ? 'is-complete' : isActive ? 'is-active' : ''}`}>
            {stage === 'error' || isRejected
              ? <XCircle size={24} />
              : isComplete
                ? <FileCheck size={24} />
                : stage === 'groq_generating'
                  ? <Sparkles size={24} />
                  : <Activity size={24} />}
          </div>
          <div className="pipeline-modal-titles">
            <div className="pipeline-modal-eyebrow-row">
              <p className="pipeline-modal-eyebrow">{copy.eyebrow}</p>
              {progress !== null && (
                <span className="pipeline-modal-pct">{Math.round(progress)}% Complete</span>
              )}
            </div>
            <h2 id="diabetes-pipeline-title">{copy.title}</h2>
            <p id="diabetes-pipeline-message">{copy.message}</p>
          </div>
        </header>

        {/* Progress bar track */}
        {progress !== null && (
          <div className="pipeline-progress-track" aria-label={`Pipeline progress ${Math.round(progress)} percent`}>
            <span
              className={`pipeline-progress-fill ${isActive ? 'is-animated' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Step list */}
        <div className="pipeline-step-list" aria-live="polite">
          {STEPS.map((step, index) => {
            const status = stepStatus(index, stage, failedAt);
            return (
              <div className={`pipeline-step is-${status}`} key={step.key}>
                <div className="pipeline-step-icon">
                  <StepIcon status={status} />
                </div>
                <div className="pipeline-step-content">
                  <div className="pipeline-step-title-row">
                    <span className="pipeline-step-num">{step.number}</span>
                    <h3>{step.title}</h3>
                  </div>
                  <p>{step.description}</p>
                </div>
                <div className="pipeline-step-badge-wrap">
                  <StatusBadge status={status} />
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="pipeline-modal-error">
            <XCircle size={16} className="flex-shrink-0" />
            <div>
              <strong>Error Encountered:</strong> {error}
            </div>
          </div>
        )}

        {/* Modal footer with action button */}
        <footer className="pipeline-modal-footer">
          <span className="pipeline-modal-footer-note">
            {isActive
              ? '⚡ Processing clinical pipeline... Please keep this window open.'
              : 'Audit trail is preserved for medical record compliance.'}
          </span>
          {!isActive && (
            <button className="btn-primary pipeline-action-btn" type="button" onClick={onClose}>
              <span>
                {stage === 'awaiting_review'
                  ? 'Review Model Result'
                  : stage === 'approved'
                    ? 'Generate Final Report'
                    : isComplete
                      ? 'View Final Report'
                      : 'Close'}
              </span>
              <ArrowRight size={16} />
            </button>
          )}
        </footer>
      </section>
    </div>
  );

  return createPortal(modalContent, document.body);
}
