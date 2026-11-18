import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  FileText,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { queryClinicalCopilot } from '../services/api';

export default function ClinicalCopilotPanel({ 
  modelRunId, 
  result, 
  diseaseType = '', 
  onApplyReviewNote 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello Doctor. I am your MedSynapse Clinical Copilot. I am grounded in this patient’s active model run, clinical measurements, and SHAP/Grad-CAM evidence. Ask me to explain risk contributors, check clinical guidelines, or draft your review note.',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [appliedIndex, setAppliedIndex] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Suggested contextual prompts based on disease type
  const disease = (diseaseType || result?.disease || result?.modality || '').toLowerCase();
  const defaultSuggestions = disease.includes('diabetes') ? [
    'Which biomarkers contributed most to this risk score?',
    'How do these values compare with ADA screening guidelines?',
    'Draft a concise clinical review note for sign-off.',
    'What would be the effect if BMI was in the normal range?',
  ] : disease.includes('heart') ? [
    'What clinical parameters are driving this cardiac risk?',
    'Explain the significance of the ST-depression (Oldpeak) value.',
    'Draft a clinical review note for cardiologist consultation.',
    'What confirmatory diagnostic tests are recommended next?',
  ] : (disease.includes('pneumonia') || disease.includes('xray')) ? [
    'Which anatomical regions in the radiograph showed high attention?',
    'How do the model findings correlate with typical lobar consolidation?',
    'Draft a preliminary screening note for the medical team.',
    'What differential causes should be considered for these opacities?',
  ] : [
    'Explain the primary factors influencing this result.',
    'Compare observed parameters with normal reference ranges.',
    'Draft a concise clinical review note for this case.',
  ];

  const [suggestions, setSuggestions] = useState(defaultSuggestions);

  useEffect(() => {
    setSuggestions(defaultSuggestions);
  }, [diseaseType, result?.disease]);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded, loading]);

  const handleSend = async (messageText) => {
    const query = (messageText || input).trim();
    if (!query || loading || !modelRunId) return;

    setError(null);
    const updatedMessages = [...messages, { role: 'user', content: query }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Send conversational history excluding the initial greeting if it's from assistant
      const historyToSend = updatedMessages.filter((_, idx) => idx > 0 || updatedMessages[0].role === 'user');
      const response = await queryClinicalCopilot({
        modelRunId,
        messages: historyToSend.length > 0 ? historyToSend : [{ role: 'user', content: query }],
      });

      if (response?.data?.message) {
        setMessages([...updatedMessages, response.data.message]);
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          setSuggestions(response.data.suggestions);
        }
      } else {
        throw new Error('No response message received from copilot.');
      }
    } catch (err) {
      const msg = err.message || 'Failed to communicate with Clinical Copilot';
      setError(msg);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: `⚠️ Error: ${msg}. Please ensure Groq LLM is configured in the backend environment.`,
          isError: true,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApplyNote = (text, index) => {
    if (onApplyReviewNote) {
      onApplyReviewNote(text);
      setAppliedIndex(index);
      setTimeout(() => setAppliedIndex(null), 2500);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation reset. How else can I assist your clinical review of this case?',
      }
    ]);
    setError(null);
  };

  return (
    <div 
      className="no-print glass-panel"
      style={{
        margin: '1.25rem 0',
        borderRadius: '12px',
        border: '1px solid rgba(37, 133, 74, 0.3)',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(37, 133, 74, 0.08)'
      }}
    >
      {/* Copilot Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '12px 18px',
          backgroundColor: '#f5faf6',
          borderBottom: isExpanded ? '1px solid #d7e7db' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: '#25854a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111111' }}>
                MedSynapse Clinical Copilot (XAI)
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                Grounded on Run Evidence
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#4b5563' }}>
              Interactive Decision Support • SHAP Feature Attribution • Clinical Guidelines
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetChat();
            }}
            title="Reset conversation"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={14} />
          </button>
          <div style={{ color: '#25854a' }}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* Copilot Body */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Quick Suggestions Chips */}
          <div style={{
            padding: '10px 16px',
            backgroundColor: '#fafdfa',
            borderBottom: '1px solid #edf4ee',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="#25854a" /> Suggested:
            </span>
            {suggestions.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleSend(prompt)}
                style={{
                  fontSize: '0.74rem',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  border: '1px solid #c9e2cf',
                  backgroundColor: '#ffffff',
                  color: '#1b4d29',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#eaf5ed';
                    e.currentTarget.style.borderColor = '#25854a';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#c9e2cf';
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div 
            style={{
              padding: '16px',
              maxHeight: '340px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#ffffff'
            }}
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '100%'
                  }}
                >
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      maxWidth: '88%'
                    }}
                  >
                    {!isUser && (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#eaf5ed',
                        border: '1px solid #b8cdbc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#25854a',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        <Bot size={13} />
                      </div>
                    )}
                    
                    <div 
                      style={{
                        padding: '10px 14px',
                        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        backgroundColor: isUser ? '#25854a' : (msg.isError ? '#fff5f5' : '#f5faf6'),
                        color: isUser ? '#ffffff' : (msg.isError ? '#b42318' : '#1b1b1b'),
                        fontSize: '0.84rem',
                        lineHeight: 1.55,
                        border: isUser ? 'none' : (msg.isError ? '1px solid #fecdca' : '1px solid #d7e7db'),
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>

                  {/* Actions for Assistant Message */}
                  {!isUser && !msg.isError && (
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px',
                        marginLeft: '32px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          color: '#4b5563',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={12} color="#25854a" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy
                          </>
                        )}
                      </button>

                      {onApplyReviewNote && (
                        <button
                          type="button"
                          onClick={() => handleApplyNote(msg.content, index)}
                          style={{
                            background: appliedIndex === index ? '#eaf5ed' : '#ffffff',
                            border: '1px solid #c9e2cf',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            color: '#1b4d29',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          {appliedIndex === index ? (
                            <>
                              <Check size={12} color="#25854a" /> Inserted into Review Comment!
                            </>
                          ) : (
                            <>
                              <Stethoscope size={12} color="#25854a" /> Use as Review Comment
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '32px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#f5faf6',
                  border: '1px solid #d7e7db',
                  fontSize: '0.78rem',
                  color: '#25854a',
                  fontWeight: 600
                }}>
                  <RefreshCw size={13} className="spin" />
                  Analyzing clinical grounding evidence...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#f5faf6',
            borderTop: '1px solid #d7e7db'
          }}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            >
              <input
                type="text"
                className="form-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about SHAP feature impact, clinical guidance, or draft review..."
                disabled={loading}
                style={{
                  flex: 1,
                  fontSize: '0.84rem',
                  padding: '9px 12px',
                  backgroundColor: '#ffffff'
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary"
                style={{
                  padding: '9px 16px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px'
                }}
              >
                <Send size={15} />
                Send
              </button>
            </form>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '6px',
              fontSize: '0.7rem',
              color: '#6b7280'
            }}>
              <span>Grounded on model run ID: <code style={{ color: '#25854a' }}>{modelRunId?.slice(0, 8)}...</code></span>
              <span>AI decision-support for physician review • Non-diagnostic</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
