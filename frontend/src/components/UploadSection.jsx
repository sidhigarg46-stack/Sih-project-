import React, { useState, useRef } from 'react';
import { Camera, Upload, Coins, IndianRupee, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UploadSection({ onAnalysisComplete, apiBaseUrl }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [refType, setRefType] = useState('INR_5_COIN');
  const [knownDiameter, setKnownDiameter] = useState(23.0);
  const [basePrice, setBasePrice] = useState(30.0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleRefChange = (type) => {
    setRefType(type);
    if (type === 'INR_5_COIN') setKnownDiameter(23.0);
    else if (type === 'INR_10_COIN') setKnownDiameter(27.0);
    else if (type === 'CREDIT_CARD') setKnownDiameter(85.6);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setErrorMsg('');
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMsg('Please capture or choose an onion batch image first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');

    // Simulated progress steps for classical CV feedback
    const steps = [
      '1/4: Detecting ₹' + (refType === 'INR_5_COIN' ? '5' : '10') + ' coin to calibrate pixels-per-mm...',
      '2/4: Isolating individual onion contours via multi-channel segmentation...',
      '3/4: Screening HSV spectrum for rot & sprouting; inspecting contour convexity for cuts...',
      '4/4: Applying AGMARK classification and calculating penalty-adjusted mandi price...'
    ];

    let stepIdx = 0;
    setPipelineStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setPipelineStep(steps[stepIdx]);
      }
    }, 700);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('reference_diameter_mm', knownDiameter.toString());
      formData.append('base_market_price', basePrice.toString());

      const response = await fetch(`${apiBaseUrl}/batches/analyze`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      onAnalysisComplete(data);
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Analysis failed:', err);
      setErrorMsg(err.message || 'Inspection pipeline failed. Please ensure the image is clear.');
    } finally {
      setIsAnalyzing(false);
      setPipelineStep('');
    }
  };

  // Quick Demo Helper: Generates a test sample on-the-fly
  const handleLoadDemoSample = async () => {
    setIsAnalyzing(true);
    setErrorMsg('');
    setPipelineStep('Generating calibrated Mandi test batch (4 onions with rot, sprout & cuts)...');

    try {
      // Create canvas with 4 sample onions + 1 coin
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');

      // Light background
      ctx.fillStyle = '#EBF0F5';
      ctx.fillRect(0, 0, 1200, 900);

      // Gold Coin top-left (150, 150), radius 46
      ctx.beginPath();
      ctx.arc(150, 150, 46, 0, Math.PI * 2);
      ctx.fillStyle = '#D4AF37';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#996515';
      ctx.stroke();
      ctx.fillStyle = '#3E2723';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('₹5 COIN', 118, 155);

      // Onion 1: Healthy Red Onion (450, 300)
      ctx.beginPath();
      ctx.arc(450, 300, 100, 0, Math.PI * 2);
      ctx.fillStyle = '#A52D50';
      ctx.fill();
      ctx.strokeStyle = '#67102D';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Onion 2: Rot Defect (800, 300)
      ctx.beginPath();
      ctx.arc(800, 300, 95, 0, Math.PI * 2);
      ctx.fillStyle = '#A52D50';
      ctx.fill();
      ctx.strokeStyle = '#67102D';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Black rot spot
      ctx.beginPath();
      ctx.arc(820, 280, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#141416';
      ctx.fill();

      // Onion 3: Sprout Defect (450, 650)
      ctx.beginPath();
      ctx.arc(450, 650, 90, 0, Math.PI * 2);
      ctx.fillStyle = '#A52D50';
      ctx.fill();
      ctx.strokeStyle = '#67102D';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Green Sprout shoot
      ctx.beginPath();
      ctx.moveTo(450, 560);
      ctx.lineTo(430, 490);
      ctx.lineTo(470, 480);
      ctx.closePath();
      ctx.fillStyle = '#22C55E';
      ctx.fill();

      // Onion 4: Mechanical Cut (800, 650)
      ctx.beginPath();
      for (let deg = 0; deg <= 360; deg += 5) {
        const rad = (deg * Math.PI) / 180;
        let r = 90;
        if (deg >= 40 && deg <= 65) r = 55; // 35px inward notch
        const px = 800 + r * Math.cos(rad);
        const py = 650 + r * Math.sin(rad);
        if (deg === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#A52D50';
      ctx.fill();
      ctx.strokeStyle = '#67102D';
      ctx.lineWidth = 4;
      ctx.stroke();

      canvas.toBlob(async (blob) => {
        const testFile = new File([blob], 'mandi_sample_batch.jpg', { type: 'image/jpeg' });
        setSelectedFile(testFile);
        setPreviewUrl(URL.createObjectURL(blob));

        const formData = new FormData();
        formData.append('file', testFile);
        formData.append('reference_diameter_mm', '23.0');
        formData.append('base_market_price', basePrice.toString());

        const response = await fetch(`${apiBaseUrl}/batches/analyze`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Demo evaluation failed');
        const data = await response.json();
        onAnalysisComplete(data);
        setIsAnalyzing(false);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to run demo sample.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Intro banner with traditional Indian agricultural motif */}
      <div className="kanda-card" style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--haldi-gold)',
            background: 'var(--haldi-bg)',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            border: '1px solid rgba(217, 119, 6, 0.3)'
          }}>
            🌾 AGMARK QUALITY MANDI DOCK
          </span>
        </div>
        <h1 style={{ fontSize: '2.1rem', color: 'var(--kanda-maroon)', marginBottom: '0.4rem' }}>
          Onion Batch Grading & Valuation
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
          Place a standard reference coin in the top-left corner and spread onions in a single layer.
          Our classical computer vision pipeline determines physical diameter, shape circularity, necrosis rot, chlorophyll sprouting, and mechanical cuts.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Left Column: Camera Viewfinder with Static Placement Guide */}
        <div className="kanda-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--kanda-maroon)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={20} color="var(--kanda-crimson)" />
              Camera Viewfinder & Overlay Guide
            </h2>
          </div>

          {/* Camera Guide Viewfinder */}
          <div className="camera-guide-container">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected Batch Preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#A8A29E' }}>
                <Camera size={48} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem' }}>Camera Ready</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Tap Capture to start</p>
              </div>
            )}

            {/* Static Placement Overlay Guide */}
            <div className="camera-guide-overlay">
              {/* Reference Coin Target in Top-Left */}
              <div className="guide-corner-coin">
                <Coins size={20} color="#FBBF24" style={{ marginBottom: '2px' }} />
                <span>PLACE</span>
                <span>{refType === 'INR_5_COIN' ? '₹5 COIN' : 'REF COIN'}</span>
                <span style={{ fontSize: '0.58rem', opacity: 0.85 }}>({knownDiameter}mm)</span>
              </div>

              {/* Sample Placement Boundary */}
              <div className="guide-sample-zone">
                <span className="guide-sample-label">
                  Spread Onions Here (Single Layer)
                </span>
              </div>
            </div>
          </div>

          {/* Hidden HTML5 File & Camera Inputs */}
          {/* capture="environment" invokes rear camera on mobile phones */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />

          {/* Capture Trigger Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              className="btn-mandi-primary"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isAnalyzing}
            >
              <Camera size={18} />
              <span>Capture Photo</span>
            </button>

            <button
              className="btn-mandi-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
            >
              <Upload size={18} />
              <span>Upload File</span>
            </button>
          </div>

          {/* Quick Demo Sample Button */}
          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <button
              onClick={handleLoadDemoSample}
              disabled={isAnalyzing}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--kanda-crimson)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Sparkles size={14} color="var(--haldi-gold)" />
              <span>Load Synthetic Mandi Batch (Instant Demo)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Calibration, Pricing Baseline & Action */}
        <div className="kanda-card">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--kanda-maroon)', marginBottom: '1.25rem' }}>
            Inspection Parameters
          </h2>

          {/* Reference Coin Calibration */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              1. Calibration Reference Object
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleRefChange('INR_5_COIN')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: refType === 'INR_5_COIN' ? '2px solid var(--haldi-gold)' : '1px solid var(--card-border)',
                  background: refType === 'INR_5_COIN' ? 'var(--haldi-bg)' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: refType === 'INR_5_COIN' ? 'var(--kanda-maroon)' : 'var(--text-muted)'
                }}
              >
                ₹5 Coin (23mm)
              </button>

              <button
                type="button"
                onClick={() => handleRefChange('INR_10_COIN')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: refType === 'INR_10_COIN' ? '2px solid var(--haldi-gold)' : '1px solid var(--card-border)',
                  background: refType === 'INR_10_COIN' ? 'var(--haldi-bg)' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: refType === 'INR_10_COIN' ? 'var(--kanda-maroon)' : 'var(--text-muted)'
                }}
              >
                ₹10 Coin (27mm)
              </button>

              <button
                type="button"
                onClick={() => handleRefChange('CUSTOM_DISC')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: refType === 'CUSTOM_DISC' ? '2px solid var(--haldi-gold)' : '1px solid var(--card-border)',
                  background: refType === 'CUSTOM_DISC' ? 'var(--haldi-bg)' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: refType === 'CUSTOM_DISC' ? 'var(--kanda-maroon)' : 'var(--text-muted)'
                }}
              >
                Custom Disc
              </button>
            </div>

            {refType === 'CUSTOM_DISC' && (
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Known Diameter (mm):</span>
                <input
                  type="number"
                  step="0.5"
                  value={knownDiameter}
                  onChange={(e) => setKnownDiameter(parseFloat(e.target.value) || 20.0)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    marginTop: '0.2rem',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}
          </div>

          {/* Mandi Base Market Price */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              2. Baseline Mandi Rate (₹/kg)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                ₹
              </span>
              <input
                type="number"
                step="0.5"
                min="5"
                max="200"
                value={basePrice}
                onChange={(e) => setBasePrice(parseFloat(e.target.value) || 30.0)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--kanda-maroon)'
                }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Reference benchmark price before size uniformity bonuses or defect penalties.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div style={{
              background: '#FEE2E2',
              color: '#B91C1C',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              border: '1px solid #FCA5A5'
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Analysis Progress or Trigger */}
          {isAnalyzing ? (
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid #D97706',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                margin: '0 auto 0.75rem auto',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ fontWeight: 700, color: 'var(--kanda-maroon)', fontSize: '0.95rem' }}>
                Analyzing Batch...
              </p>
              <p style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '0.3rem' }}>
                {pipelineStep}
              </p>
            </div>
          ) : (
            <button
              className="btn-mandi-primary"
              style={{ width: '100%', padding: '1rem' }}
              onClick={handleAnalyze}
              disabled={!selectedFile}
            >
              <Sparkles size={20} />
              <span>Run AGMARK Grading & Valuation</span>
            </button>
          )}

          {/* Summary Checklist */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(112, 18, 46, 0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--card-border)'
          }}>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--kanda-crimson)', marginBottom: '0.5rem' }}>
              AGMARK Capture Rules
            </h4>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', listStyle: 'none', spaceY: '0.3rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <CheckCircle2 size={13} color="var(--emerald-fresh)" />
                Coin must lie flat in the top-left area without touching any onions.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <CheckCircle2 size={13} color="var(--emerald-fresh)" />
                Maintain uniform overhead lighting to prevent deep shadows.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={13} color="var(--emerald-fresh)" />
                Leave 1-2 cm gap between individual bulbs for optimal watershed separation.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
