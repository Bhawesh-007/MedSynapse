import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export default function Navbar({ currentTab, setTab, systemStatus, onRefreshStatus }) {
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
    }}>
      {/* Left balancing spacer to keep center logo strictly centered */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }} />

      {/* Brand Logo - Centered */}
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
            <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>9 MODULES</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Clinical AI Diagnostic Suite</p>
        </div>
      </div>

      {/* Right: System Status Indicator */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
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
