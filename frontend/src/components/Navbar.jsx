import React from 'react';
import { Activity, FileText, Heart, Droplets, Scan, Brain, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Navbar({ currentTab, setTab, systemStatus, onRefreshStatus }) {
  const tabs = [
    { id: 'home', label: 'Dashboard Hub', icon: Activity },
    { id: 'ocr', label: 'Smart Report OCR', icon: FileText, highlight: true },
    { id: 'diabetes', label: 'Diabetes Engine', icon: Droplets, color: '#f43f5e' },
    { id: 'heart', label: 'Cardiac Health', icon: Heart, color: '#ef4444' },
    { id: 'xray', label: 'Pneumonia X-Ray', icon: Scan, color: '#38bdf8' },
    { id: 'mri', label: 'Brain Tumor MRI', icon: Brain, color: '#c084fc' },
  ];

  const isOnline = systemStatus?.status === 'online';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => setTab('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)'
        }}>
          <Activity size={24} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#ffffff' }}>
              Med<span style={{ color: '#38bdf8' }}>Synapse</span>
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>v2.0 AI</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multi-Disease Diagnostics & OCR</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 15px rgba(14, 165, 233, 0.2)' : 'none'
              }}
            >
              <Icon size={16} color={isActive ? '#38bdf8' : (t.color || 'var(--text-muted)')} />
              {t.label}
              {t.highlight && (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                  boxShadow: '0 0 8px #38bdf8'
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          onClick={onRefreshStatus}
          title="Click to refresh system status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: isOnline ? '#34d399' : '#fda4af',
            cursor: 'pointer'
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isOnline ? '#10b981' : '#f43f5e',
            boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
            display: 'inline-block'
          }} />
          <span>{isOnline ? 'AI Models Active' : 'Connecting to API...'}</span>
          <RefreshCw size={12} style={{ marginLeft: '4px', opacity: 0.7 }} />
        </div>
      </div>
    </header>
  );
}
