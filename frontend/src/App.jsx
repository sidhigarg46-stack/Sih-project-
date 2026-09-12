import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryView from './components/HistoryView';
import AgmarkModal from './components/AgmarkModal';
import DigitalQualityPassport from './components/DigitalQualityPassport';

export default function App() {
  const [currentView, setCurrentView] = useState('upload');
  const [analysisData, setAnalysisData] = useState(null);
  const [showSpecs, setShowSpecs] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [passportMode, setPassportMode] = useState(false);

  // Backend runs on the same machine / LAN host as the frontend
  const hostname = window.location.hostname || 'localhost';
  const apiBaseUrl = `http://${hostname}:8000`;

  // ------------------------------------------------------------
  // Detect QR / Digital Quality Passport URL
  // Example:
  // http://192.168.1.5:5173/report/BATCH_123
  // ------------------------------------------------------------
  useEffect(() => {
    const checkReportUrl = async () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      let batchIdToLoad = null;

      if (path.includes('/report/')) {
        batchIdToLoad = path
          .split('/report/')[1]
          ?.replace(/\/$/, '');
      } else if (hash.includes('/report/')) {
        batchIdToLoad = hash
          .split('/report/')[1]
          ?.replace(/\/$/, '');
      }

      if (!batchIdToLoad) return;

      setLoadingReport(true);
      setReportError('');

      try {
        const res = await fetch(
          `${apiBaseUrl}/batches/${batchIdToLoad}/report`
        );

        if (!res.ok) {
          throw new Error('Report not found');
        }

        const data = await res.json();

        setAnalysisData(data);

        // QR links open directly in Digital Quality Passport mode
        setPassportMode(true);

      } catch (err) {
        console.error(err);
        setReportError(
          `Could not load report for batch "${batchIdToLoad}".`
        );
      } finally {
        setLoadingReport(false);
      }
    };

    checkReportUrl();
  }, [apiBaseUrl]);

  // ------------------------------------------------------------
  // Select a batch from History
  // ------------------------------------------------------------
  const handleSelectBatchFromHistory = async (batchId) => {
    setLoadingReport(true);
    setReportError('');
    setPassportMode(false);

    try {
      const res = await fetch(
        `${apiBaseUrl}/batches/${batchId}/report`
      );

      if (!res.ok) {
        throw new Error('Report not found');
      }

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

  // ------------------------------------------------------------
  // New inspection
  // ------------------------------------------------------------
  const handleNewScan = () => {
    setAnalysisData(null);
    setPassportMode(false);
    setReportError('');
    setCurrentView('upload');

    window.history.pushState({}, '', '/');
  };

  // ------------------------------------------------------------
  // If opened through QR code → show passport directly
  // ------------------------------------------------------------
  if (passportMode && analysisData) {
    return (
      <DigitalQualityPassport
        data={analysisData}
        onBack={() => {
          setPassportMode(false);
          setAnalysisData(null);
          setCurrentView('upload');

          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Header
        currentView={currentView}
        setCurrentView={(view) => {
          setPassportMode(false);
          setCurrentView(view);
        }}
        onShowSpecs={() => setShowSpecs(true)}
      />

      <main
        style={{
          flex: 1,
          paddingBottom: '3rem'
        }}
      >

        {/* -------------------------------------------------- */}
        {/* Loading */}
        {/* -------------------------------------------------- */}

        {loadingReport ? (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 1rem'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #D97706',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                margin: '0 auto 1rem auto',
                animation: 'spin 1s linear infinite'
              }}
            />

            <style>
              {`
                @keyframes spin {
                  0% {
                    transform: rotate(0deg);
                  }

                  100% {
                    transform: rotate(360deg);
                  }
                }
              `}
            </style>

            <p
              style={{
                color: 'var(--kanda-maroon)',
                fontWeight: 600
              }}
            >
              Loading Digital Quality Passport...
            </p>
          </div>

        ) : reportError ? (

          /* -------------------------------------------------- */
          /* Report Error */
          /* -------------------------------------------------- */

          <div
            className="kanda-card"
            style={{
              maxWidth: '600px',
              margin: '3rem auto',
              textAlign: 'center'
            }}
          >
            <p
              style={{
                color: '#DC2626',
                marginBottom: '1rem'
              }}
            >
              {reportError}
            </p>

            <button
              className="btn-mandi-primary"
              onClick={handleNewScan}
            >
              Back to Inspection
            </button>
          </div>

        ) : currentView === 'upload' ? (

          /* -------------------------------------------------- */
          /* Upload / Inspection */
          /* -------------------------------------------------- */

          <UploadSection
            apiBaseUrl={apiBaseUrl}
            onAnalysisComplete={(data) => {
              setAnalysisData(data);
              setPassportMode(false);
              setCurrentView('results');
            }}
          />

        ) : currentView === 'results' && analysisData ? (

          /* -------------------------------------------------- */
          /* Results Dashboard */
          /* -------------------------------------------------- */

          <ResultsDashboard
            data={analysisData}
            apiBaseUrl={apiBaseUrl}
            onNewScan={handleNewScan}
          />

        ) : currentView === 'history' ? (

          /* -------------------------------------------------- */
          /* Batch History */
          /* -------------------------------------------------- */

          <HistoryView
            apiBaseUrl={apiBaseUrl}
            onSelectBatch={handleSelectBatchFromHistory}
            onBack={() => {
              setCurrentView('upload');
            }}
          />

        ) : (

          /* -------------------------------------------------- */
          /* Fallback */
          /* -------------------------------------------------- */

          <UploadSection
            apiBaseUrl={apiBaseUrl}
            onAnalysisComplete={(data) => {
              setAnalysisData(data);
              setPassportMode(false);
              setCurrentView('results');
            }}
          />
        )}

      </main>

      {/* ------------------------------------------------------ */}
      {/* Footer */}
      {/* ------------------------------------------------------ */}

      <footer
        style={{
          background: '#FAF7F2',
          borderTop: '1px solid rgba(139, 30, 63, 0.12)',
          padding: '1.25rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >

          <div>
            <strong>KandaGuru (कांदा गुरु)</strong>
            {' '}— AI-assisted onion quality grading & transparent mandi valuation.
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              color: 'var(--text-light)'
            }}
          >
            <span>Local Offline Mode</span>
            <span>AGMARK / NHB Standard</span>
            <span>SQLite Local DB</span>
          </div>

        </div>
      </footer>

      {/* AGMARK specifications modal */}
      {showSpecs && (
        <AgmarkModal
          onClose={() => setShowSpecs(false)}
        />
      )}
    </div>
  );
}