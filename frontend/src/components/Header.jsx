import React from 'react';
import { Sparkles, History, HelpCircle } from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  onShowSpecs
}) {
  return (
    <header className="kanda-header">
      <div className="header-inner">

        {/* Brand */}
        <div
          className="brand"
          onClick={() => setCurrentView('upload')}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-mark">
            🧅
          </div>

          <div className="brand-copy">

            <div className="brand-name-row">
              <span className="brand-hindi">
                कांदा गुरु
              </span>

              <span className="brand-name">
                KandaGuru
              </span>
            </div>

            <p className="brand-tagline">
              AI-assisted onion quality & mandi intelligence
            </p>

          </div>
        </div>

        {/* Navigation */}
        <nav className="header-nav">

          {/* New Inspection */}
          <button
            className={currentView === 'upload' ? 'active' : ''}
            onClick={() => setCurrentView('upload')}
          >
            <Sparkles size={16} />
            <span>New Inspection</span>
          </button>

          {/* Batch History */}
          <button
            className={currentView === 'history' ? 'active' : ''}
            onClick={() => setCurrentView('history')}
          >
            <History size={16} />
            <span>Batch History</span>
          </button>

          {/* AGMARK Specs */}
          <button
            className="specs-button"
            onClick={onShowSpecs}
          >
            <HelpCircle size={15} />
            <span>AGMARK Specs</span>
          </button>

        </nav>

      </div>
    </header>
  );
}