import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export default function Navbar({ currentTab, setTab, systemStatus, onRefreshStatus }) {
  const isOnline = systemStatus?.status === 'online';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.97)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #cbd5e1',
      padding: '0.85rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)'
    }}>
      {/* Left balancing spacer to keep center logo strictly centered */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }} />

      {/* Brand Logo - Centered & Prominently Highlighted */}
      <div 
        onClick={() => setTab('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '4px 12px',
          borderRadius: '12px',
          transition: 'transform 0.15s ease, opacity 0.15s ease'
        }}
      >
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '13px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28), 0 2px 6px rgba(15, 23, 42, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          flexShrink: 0
        }}>
          <Activity size={28} color="#10b981" strokeWidth={2.8} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '1.65rem', 
              fontWeight: 900, 
              letterSpacing: '-0.5px', 
              color: '#0f172a',
              lineHeight: 1.15
            }}>
              Med<span style={{ 
                background: 'linear-gradient(135deg, #15803d 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: '#16a34a'
              }}>Synapse</span>
            </span>
            <span 
              style={{ 
                fontSize: '0.68rem', 
                fontWeight: 800, 
                letterSpacing: '0.6px',
                padding: '3px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#15803d',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textTransform: 'uppercase'
              }}
            >
              9 Modules
            </span>
          </div>
          <p style={{ 
            fontSize: '0.78rem', 
            fontWeight: 500,
            color: '#64748b', 
            letterSpacing: '0.15px',
            margin: '2px 0 0 0'
          }}>
            Clinical AI Multi-Modal Diagnostic & Decision Suite
          </p>
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
            gap: '7px',
            padding: '7px 14px',
            borderRadius: '9999px',
            backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '0.78rem',
            fontWeight: 600,
            color: isOnline ? '#15803d' : '#b91c1c',
            cursor: 'pointer',
            boxShadow: isOnline ? '0 2px 6px rgba(16, 185, 129, 0.12)' : 'none'
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isOnline ? '#10b981' : '#f43f5e',
            display: 'inline-block',
            boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e'
          }} />
          <span>{isOnline ? '9 Models Online' : 'Connecting…'}</span>
          <RefreshCw size={12} style={{ opacity: 0.75 }} />
        </div>
      </div>
    </header>
  );
}
