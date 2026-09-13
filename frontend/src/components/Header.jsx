import React from 'react';
import { Sparkles, History, HelpCircle, ScanLine } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function Header({
  currentView,
  setCurrentView,
  onShowSpecs
}) {
  return (
    <>
      <header className="kanda-header">
        <div className="header-inner">
          <div
            className="brand"
            onClick={() => setCurrentView('upload')}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-mark-img-wrap">
              <img src={logoImg} alt="OnionIQ Logo" className="brand-logo-img" />
            </div>

            <div className="brand-copy">
              <div className="brand-name-row">
                <span className="brand-name">
                  OnionIQ
                </span>
              </div>
              <p className="brand-tagline">
                AI Onion Quality Grading & Mandi Valuation
              </p>
            </div>
          </div>

          <nav className="header-nav desktop-only-nav">
            <button
              className={currentView === 'upload' ? 'active' : ''}
              onClick={() => setCurrentView('upload')}
              type="button"
            >
              <Sparkles size={16} />
              <span>New Inspection</span>
            </button>

            <button
              className={currentView === 'history' ? 'active' : ''}
              onClick={() => setCurrentView('history')}
              type="button"
            >
              <History size={16} />
              <span>Batch History</span>
            </button>

            <button
              className="specs-button"
              onClick={onShowSpecs}
              type="button"
            >
              <HelpCircle size={15} />
              <span>AGMARK Specs</span>
            </button>
          </nav>

          <div className="mobile-top-action">
            <button
              className="specs-button-mobile"
              onClick={onShowSpecs}
              aria-label="View AGMARK Specifications"
              type="button"
            >
              <HelpCircle size={16} />
              <span>नियम / Specs</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          className={`mobile-nav-btn ${currentView === 'upload' ? 'active' : ''}`}
          onClick={() => setCurrentView('upload')}
          type="button"
        >
          <div className="mobile-nav-icon-wrap">
            <ScanLine size={20} />
          </div>
          <span className="mobile-nav-title">नया स्कैन</span>
          <span className="mobile-nav-sub">New Scan</span>
        </button>

        <button
          className={`mobile-nav-btn ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentView('history')}
          type="button"
        >
          <div className="mobile-nav-icon-wrap">
            <History size={20} />
          </div>
          <span className="mobile-nav-title">इतिहास</span>
          <span className="mobile-nav-sub">History</span>
        </button>

        <button
          className="mobile-nav-btn"
          onClick={onShowSpecs}
          type="button"
        >
          <div className="mobile-nav-icon-wrap">
            <HelpCircle size={20} />
          </div>
          <span className="mobile-nav-title">ग्रेड नियम</span>
          <span className="mobile-nav-sub">AGMARK</span>
        </button>
      </nav>
    </>
  );
}