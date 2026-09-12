import React from 'react';
import { Sparkles, ShieldCheck, Scale, History, HelpCircle } from 'lucide-react';

export default function Header({ currentView, setCurrentView, onShowSpecs }) {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #4A071E 0%, #70122E 50%, #8B1E3F 100%)',
      color: '#FFFFFF',
      borderBottom: '3px solid #D97706',
      boxShadow: '0 8px 24px rgba(112, 18, 46, 0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.9rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand identity with Indian Mandi seal motif */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)',
            border: '2px solid #FDE68A'
          }}>
            🧅
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: "'Rozha One', serif",
                fontSize: '1.65rem',
                letterSpacing: '0.02em',
                lineHeight: 1.1,
                color: '#FEF3C7',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                कांदा गुरु
              </span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#FDE68A',
                letterSpacing: '0.04em'
              }}>
                KandaGuru
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FDE68A',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                letterSpacing: '0.05em'
              }}>
                LOCAL MVP
              </span>
            </div>
            <p style={{
              fontSize: '0.78rem',
              color: '#F5D0D6',
              letterSpacing: '0.02em',
              fontWeight: 400
            }}>
              Computer Vision Quality Grading & Mandi Valuation • AGMARK / NHB
            </p>
          </div>
        </div>

        {/* Action navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setCurrentView('upload')}
            style={{
              background: currentView === 'upload' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              color: currentView === 'upload' ? '#FDE68A' : '#FFFFFF',
              border: currentView === 'upload' ? '1.5px solid #FBBF24' : '1px solid rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={16} />
            <span>New Scan</span>
          </button>

          <button
            onClick={() => setCurrentView('history')}
            style={{
              background: currentView === 'history' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.1)',
              color: currentView === 'history' ? '#FDE68A' : '#FFFFFF',
              border: currentView === 'history' ? '1.5px solid #FBBF24' : '1px solid rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <History size={16} />
            <span>Batch History</span>
          </button>

          <button
            onClick={onShowSpecs}
            style={{
              background: 'transparent',
              color: '#FDE68A',
              border: '1px dashed rgba(251, 191, 36, 0.5)',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <HelpCircle size={15} />
            <span>AGMARK Specs</span>
          </button>
        </div>
      </div>
    </header>
  );
}
