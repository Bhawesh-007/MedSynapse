import React from 'react';
import { 
  Activity, 
  FileText, 
  Heart, 
  Droplets, 
  Scan, 
  Eye, 
  Ribbon, 
  Brain, 
  Layers, 
  AlertTriangle, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function Navbar({ currentTab, setTab, systemStatus, onRefreshStatus }) {
  const tabs = [
    { id: 'home', label: 'Hub', icon: Activity, color: '#25854a' },
    { id: 'ocr', label: 'Lab OCR', icon: FileText, highlight: true, color: '#25854a' },
    { id: 'diabetes', label: 'Diabetes', icon: Droplets, color: '#b42318' },
    { id: 'heart', label: 'Cardiac', icon: Heart, color: '#c81e1e' },
    { id: 'xray', label: 'Pneumonia', icon: Scan, color: '#287a89' },
    { id: 'brain-tumor', label: 'Brain MRI', icon: Brain, color: '#7c3aed' },
    { id: 'breast', label: 'Breast FNA', icon: Ribbon, color: '#b83280' },
    { id: 'liver', label: 'Liver LFT', icon: Activity, color: '#d97706' },
    { id: 'kidney-stone', label: 'Kidney CT', icon: Layers, color: '#0284c7' },
    { id: 'skin-cancer', label: 'Skin Cancer', icon: AlertTriangle, color: '#dc2626' },
    { id: 'eye', label: 'Eye Fundus', icon: Eye, color: '#6b46c1' },
  ];

  const isOnline = systemStatus?.status === 'online';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #d7e7db',
      padding: '0.65rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => setTab('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)'
        }}>
          <Activity size={22} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.3px', color: '#0f172a' }}>
              Med<span style={{ color: '#25854a' }}>Synapse</span>
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>9 Modules</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Clinical AI Diagnostic Suite</p>
        </div>
      </div>

      {/* Navigation Tabs (9 Clinical Modules + OCR + Hub) */}
      <nav style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        flexWrap: 'wrap',
        maxWidth: '780px'
      }}>
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
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#0f172a' : 'var(--text-secondary)',
                backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                border: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} color={t.color || 'var(--text-muted)'} />
              <span>{t.label}</span>
              {t.highlight && (
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: '#25854a'
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div 
          onClick={onRefreshStatus}
          title="Click to refresh system status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '9999px',
            backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '0.72rem',
            fontWeight: 600,
            color: isOnline ? '#15803d' : '#b91c1c',
            cursor: 'pointer'
          }}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: isOnline ? '#10b981' : '#f43f5e',
            display: 'inline-block'
          }} />
          <span>{isOnline ? '9 Models Online' : 'Connecting…'}</span>
          <RefreshCw size={11} style={{ opacity: 0.7 }} />
        </div>
      </div>
    </header>
  );
}
