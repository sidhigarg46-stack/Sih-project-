import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryView from './components/HistoryView';
import AgmarkModal from './components/AgmarkModal';

export default function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload' | 'results' | 'history'
  const [analysisData, setAnalysisData] = useState(null);
  const [showSpecs, setShowSpecs] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  // Dynamically configure backend host so mobile phones accessing via LAN talk to the FastAPI server
  const hostname = window.location.hostname || 'localhost';
  const apiBaseUrl = `http://${hostname}:8000`;

  // Detect if opened directly from a QR code LAN link (e.g. /report/batch_123 or #/report/batch_123)
  useEffect(() => {
    const checkReportUrl = async () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      let batchIdToLoad = null;

      if (path.includes('/report/')) {
        batchIdToLoad = path.split('/report/')[1]?.replace(/\/$/, '');
      } else if (hash.includes('/report/')) {
        batchIdToLoad = hash.split('/report/')[1]?.replace(/\/$/, '');
      }

      if (batchIdToLoad) {
        setLoadingReport(true);
        try {
          const res = await fetch(`${apiBaseUrl}/batches/${batchIdToLoad}/report`);
          if (!res.ok) throw new Error('Report not found');
          const data = await res.json();
          setAnalysisData(data);
          setCurrentView('results');
        } catch (err) {
          console.error(err);
          setReportError(`Could not load report for batch "${batchIdToLoad}".`);
        } finally {
          setLoadingReport(false);
        }
      }
    };

    checkReportUrl();
  }, [apiBaseUrl]);

  const handleSelectBatchFromHistory = async (batchId) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`${apiBaseUrl}/batches/${batchId}/report`);
      if (!res.ok) throw new Error('Report not found');
      const data = await res.json();
      setAnalysisData(data);
      setCurrentView('results');
    } catch (err) {
      console.error(err);
      alert('Failed to load batch report.');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        onShowSpecs={() => setShowSpecs(true)}
      />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {loadingReport ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #D97706',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 1rem auto',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--kanda-maroon)', fontWeight: 600 }}>Loading Digital Mandi Report...</p>
          </div>
        ) : reportError ? (
          <div className="kanda-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
            <p style={{ color: '#DC2626', marginBottom: '1rem' }}>{reportError}</p>
            <button
              className="btn-mandi-primary"
              onClick={() => {
                setReportError('');
                setCurrentView('upload');
                window.history.pushState({}, '', '/');
              }}
            >
              Back to Inspection Dock
            </button>
          </div>
        ) : currentView === 'upload' ? (
          <UploadSection
            apiBaseUrl={apiBaseUrl}
            onAnalysisComplete={(data) => {
              setAnalysisData(data);
              setCurrentView('results');
            }}
          />
        ) : currentView === 'results' && analysisData ? (
          <ResultsDashboard
            data={analysisData}
            apiBaseUrl={apiBaseUrl}
            onNewScan={() => {
              setCurrentView('upload');
              window.history.pushState({}, '', '/');
            }}
          />
        ) : currentView === 'history' ? (
          <HistoryView
            apiBaseUrl={apiBaseUrl}
            onSelectBatch={handleSelectBatchFromHistory}
            onBack={() => setCurrentView('upload')}
          />
        ) : (
          <UploadSection
            apiBaseUrl={apiBaseUrl}
            onAnalysisComplete={(data) => {
              setAnalysisData(data);
              setCurrentView('results');
            }}
          />
        )}
      </main>

      {/* Traditional footer */}
      <footer style={{
        background: '#FAF7F2',
        borderTop: '1px solid rgba(139, 30, 63, 0.12)',
        padding: '1.25rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <strong>KandaGuru (कांदा गुरु)</strong> — Classical Computer Vision Quality Grading & Transparent Mandi Valuation System.
          </div>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-light)' }}>
            <span>Local Offline Mode</span>
            <span>AGMARK / NHB Standard</span>
            <span>SQLite Local DB</span>
          </div>
        </div>
      </footer>

      {showSpecs && <AgmarkModal onClose={() => setShowSpecs(false)} />}
    </div>
  );
}
