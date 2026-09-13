import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Coins,
  IndianRupee,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Ruler,
  ScanLine,
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function UploadSection({ onAnalysisComplete, apiBaseUrl }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [refType, setRefType] = useState('INR_10_COIN');
  const [knownDiameter, setKnownDiameter] = useState(27.0);
  const [basePrice, setBasePrice] = useState(30.0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleRefChange = (type) => {
    setRefType(type);

    if (type === 'INR_5_COIN') {
      setKnownDiameter(23.0);
    } else if (type === 'INR_10_COIN') {
      setKnownDiameter(27.0);
    } else if (type === 'CREDIT_CARD') {
      setKnownDiameter(85.6);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }

    setSelectedFile(file);
    setErrorMsg('');

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

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

    const steps = [
      `1/4: Detecting ₹${
        refType === 'INR_5_COIN' ? '5' : '10'
      } reference to calibrate image scale...`,
      '2/4: Detecting and measuring individual onions...',
      '3/4: Screening for rot, sprouting and mechanical damage...',
      '4/4: Applying AGMARK classification and calculating mandi value...',
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
      formData.append(
        'reference_diameter_mm',
        knownDiameter.toString()
      );
      formData.append(
        'base_market_price',
        basePrice.toString()
      );

      const response = await fetch(`${apiBaseUrl}/batches/analyze`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Server error (${response.status})`
        );
      }

      const data = await response.json();

      onAnalysisComplete(data);
    } catch (err) {
      clearInterval(stepInterval);

      console.error('Analysis failed:', err);

      setErrorMsg(
        err.message ||
          'Inspection pipeline failed. Please ensure the image is clear.'
      );
    } finally {
      setIsAnalyzing(false);
      setPipelineStep('');
    }
  };

  const handleLoadDemoSample = async () => {
    setIsAnalyzing(true);
    setErrorMsg('');
    setPipelineStep(
      'Generating calibrated demonstration batch...'
    );

    try {
      const canvas = document.createElement('canvas');

      canvas.width = 1200;
      canvas.height = 900;

      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#EBF0F5';
      ctx.fillRect(0, 0, 1200, 900);

      ctx.beginPath();
      ctx.arc(150, 150, 46, 0, Math.PI * 2);
      ctx.fillStyle = '#D4AF37';
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#996515';
      ctx.stroke();

      ctx.fillStyle = '#3E2723';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('₹10 COIN', 114, 155);

      ctx.beginPath();
      ctx.arc(450, 300, 100, 0, Math.PI * 2);
      ctx.fillStyle = '#A52D50';
      ctx.fill();

      ctx.strokeStyle = '#67102D';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(800, 300, 95, 0, Math.PI * 2);
      ctx.fillStyle = '#A52D50';
      ctx.fill();

      ctx.strokeStyle = '#67102D';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(820, 280, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#141416';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(450, 650, 90, 0, Math.PI * 2);
      ctx.fillStyle = '#A52D50';
      ctx.fill();

      ctx.strokeStyle = '#67102D';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(450, 560);
      ctx.lineTo(430, 490);
      ctx.lineTo(470, 480);
      ctx.closePath();

      ctx.fillStyle = '#22C55E';
      ctx.fill();

      ctx.beginPath();

      for (let deg = 0; deg <= 360; deg += 5) {
        const rad = (deg * Math.PI) / 180;

        let r = 90;

        if (deg >= 40 && deg <= 65) {
          r = 55;
        }

        const px = 800 + r * Math.cos(rad);
        const py = 650 + r * Math.sin(rad);

        if (deg === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.closePath();

      ctx.fillStyle = '#A52D50';
      ctx.fill();

      ctx.strokeStyle = '#67102D';
      ctx.lineWidth = 4;
      ctx.stroke();

      canvas.toBlob(
        async (blob) => {
          try {
            if (!blob) {
              throw new Error('Could not generate demo image.');
            }

            const testFile = new File(
              [blob],
              'mandi_sample_batch.jpg',
              {
                type: 'image/jpeg',
              }
            );

            setSelectedFile(testFile);

            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }

            setPreviewUrl(URL.createObjectURL(blob));

            setPipelineStep(
              'Sending demonstration batch to grading engine...'
            );

            const formData = new FormData();

            formData.append('file', testFile);
            formData.append(
              'reference_diameter_mm',
              '27.0'
            );
            formData.append(
              'base_market_price',
              basePrice.toString()
            );

            const response = await fetch(
              `${apiBaseUrl}/batches/analyze`,
              {
                method: 'POST',
                body: formData,
              }
            );

            if (!response.ok) {
              throw new Error('Demo evaluation failed');
            }

            const data = await response.json();

            onAnalysisComplete(data);
          } catch (err) {
            console.error(err);
            setErrorMsg(
              err.message || 'Failed to run demo sample.'
            );
          } finally {
            setIsAnalyzing(false);
            setPipelineStep('');
          }
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error(err);

      setErrorMsg('Failed to generate demo sample.');
      setIsAnalyzing(false);
      setPipelineStep('');
    }
  };

  return (
    <div className="page-container">

      <div className="mobile-quick-hero">
        <div className="mobile-quick-badge">
          <img src={logoImg} alt="OnionIQ Logo" className="mobile-hero-logo" />
          <span>AI QUALITY INSPECTION</span>
        </div>
        <h1 className="mobile-hero-heading">
          Mandi Grading & Fair Pricing
        </h1>
        <p className="mobile-hero-sub">
          Place onions in single layer with a ₹10 coin and snap a photo.
        </p>
      </div>

      <section className="inspection-hero desktop-hero">

        <div className="hero-copy">

          <div className="hero-eyebrow">
            <ScanLine size={15} />
            AI-ASSISTED QUALITY INSPECTION
          </div>

          <h1 className="hero-title">
            From one image to a
            <span> clear mandi decision.</span>
          </h1>

          <p className="hero-description">
            Capture an onion batch, let OnionIQ measure quality,
            classify the produce and estimate a transparent
            mandi value — all from a single image.
          </p>

          <div className="workflow">

            <div className="workflow-step">
              <div className="workflow-number">01</div>
              <div>
                <div className="workflow-title">
                  Capture batch
                </div>
                <div className="workflow-text">
                  Place onions in one layer with a reference coin.
                </div>
              </div>
            </div>

            <div className="workflow-step">
              <div className="workflow-number">02</div>
              <div>
                <div className="workflow-title">
                  Detect & measure
                </div>
                <div className="workflow-text">
                  Identify individual onions and physical attributes.
                </div>
              </div>
            </div>

            <div className="workflow-step">
              <div className="workflow-number">03</div>
              <div>
                <div className="workflow-title">
                  Grade & value
                </div>
                <div className="workflow-text">
                  Apply quality rules and price adjustments.
                </div>
              </div>
            </div>

            <div className="workflow-step">
              <div className="workflow-number">04</div>
              <div>
                <div className="workflow-title">
                  Share passport
                </div>
                <div className="workflow-text">
                  Generate a digital quality record with QR.
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="hero-side-card">

          <div className="hero-side-title">
            INSPECTION OUTPUT
          </div>

          <div className="hero-side-value">
            Grade + ₹/kg
          </div>

          <div className="hero-side-text">
            Standardised quality assessment,
            price reasoning and storage/sell priority.
          </div>

        </div>

      </section>

      <section className="section">

        <div className="section-title">
          Start an inspection
        </div>

        <div className="section-subtitle">
          Capture a new batch or upload an existing image.
        </div>

        <div className="upload-layout">

          <div className="kanda-card">

            <div className="card-heading-row">

              <div>
                <h2 className="card-heading">
                  <Camera size={20} />
                  Batch image
                </h2>

                <p className="card-helper">
                  Keep the reference object visible and
                  separate from the onions.
                </p>
              </div>

              {selectedFile && (
                <span className="status-chip success">
                  <CheckCircle2 size={14} />
                  Image ready
                </span>
              )}

            </div>


            <div className="camera-guide-container">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Selected onion batch"
                  className="upload-preview-image"
                />
              ) : (
                <div className="empty-camera-state">
                  <div className="camera-icon-circle">
                    <Camera size={32} />
                  </div>
                  <h3>Camera ready</h3>
                  <p>
                    Capture a fresh image or upload
                    a batch photo to begin.
                  </p>
                </div>
              )}

              <div className="camera-guide-overlay">
                <div className="guide-corner-coin">
                  <Coins size={18} />
                  <span>REFERENCE</span>
                  <strong>
                    {refType === 'INR_5_COIN'
                      ? '₹5 COIN'
                      : refType === 'INR_10_COIN'
                      ? '₹10 COIN'
                      : 'CUSTOM'}
                  </strong>
                  <small>
                    {knownDiameter} mm
                  </small>
                </div>

                <div className="guide-sample-zone">
                  <span className="guide-sample-label">
                    Onion batch area
                  </span>
                </div>
              </div>
            </div>

            <div className="upload-actions">
              <button
                className="btn-mandi-primary"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isAnalyzing}
                type="button"
              >
                <Camera size={18} />
                Capture photo
              </button>

              <button
                className="btn-mandi-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                type="button"
              >
                <Upload size={18} />
                Upload image
              </button>
            </div>

            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            <button
              className="demo-button"
              onClick={handleLoadDemoSample}
              disabled={isAnalyzing}
              type="button"
            >
              <Sparkles size={15} />
              Try synthetic mandi batch
              <ArrowRight size={14} />
            </button>

            <div className="capture-rules">

              <div className="capture-rules-header">
                <Ruler size={15} />
                Best-practice capture
              </div>

              <div className="capture-rule">

                <CheckCircle2 size={14} />

                <div>
                  <div className="capture-rule-title">
                    Reference object
                  </div>

                  <div className="capture-rule-text">
                    Keep the coin flat and visible in
                    the top-left corner.
                  </div>
                </div>

              </div>


              <div className="capture-rule">

                <CheckCircle2 size={14} />

                <div>
                  <div className="capture-rule-title">
                    Single layer
                  </div>

                  <div className="capture-rule-text">
                    Avoid overlapping onions so each
                    bulb can be separated.
                  </div>
                </div>

              </div>


              <div className="capture-rule">

                <CheckCircle2 size={14} />

                <div>
                  <div className="capture-rule-title">
                    Consistent lighting
                  </div>

                  <div className="capture-rule-text">
                    Use even overhead lighting and
                    avoid strong shadows.
                  </div>
                </div>

              </div>

            </div>

          </div>

          <div className="kanda-card">

            <div className="card-heading-row">

              <div>

                <h2 className="card-heading">
                  <Coins size={20} />
                  Inspection parameters
                </h2>

                <p className="card-helper">
                  These values calibrate the image and
                  establish the mandi pricing baseline.
                </p>

              </div>

            </div>

            <div className="field-group">

              <label className="field-label">
                Reference object
              </label>

              <p className="field-help">
                Use a known-size object to convert
                pixels into millimetres.
              </p>


              <div className="reference-options">

                <button
                  type="button"
                  className={`reference-option ${
                    refType === 'INR_5_COIN'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleRefChange('INR_5_COIN')
                  }
                >
                  <Coins size={17} />
                  <span>₹5 Coin</span>
                  <small>23 mm</small>
                </button>


                <button
                  type="button"
                  className={`reference-option ${
                    refType === 'INR_10_COIN'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleRefChange('INR_10_COIN')
                  }
                >
                  <Coins size={17} />
                  <span>₹10 Coin</span>
                  <small>27 mm</small>
                </button>


                <button
                  type="button"
                  className={`reference-option ${
                    refType === 'CUSTOM_DISC'
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleRefChange('CUSTOM_DISC')
                  }
                >
                  <Ruler size={17} />
                  <span>Custom</span>
                  <small>Set size</small>
                </button>

              </div>


              {refType === 'CUSTOM_DISC' && (
                <div className="custom-reference-field">

                  <label className="field-label">
                    Known diameter (mm)
                  </label>

                  <input
                    className="field-input"
                    type="number"
                    step="0.5"
                    min="1"
                    value={knownDiameter}
                    onChange={(e) =>
                      setKnownDiameter(
                        parseFloat(e.target.value) || 20
                      )
                    }
                  />

                </div>
              )}

            </div>

            <div className="field-group">

              <label className="field-label">
                Baseline mandi rate / आधार भाव
              </label>

              <p className="field-help">
                Market benchmark before quality deductions (per kg).
              </p>

              <div className="price-stepper-control">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setBasePrice(p => Math.max(5, p - 1))}
                  aria-label="Decrease mandi price by 1 rupee"
                >
                  <Minus size={18} />
                </button>

                <div className="price-input-wrapper">
                  <IndianRupee size={18} />
                  <input
                    className="field-input price-input"
                    type="number"
                    step="0.5"
                    min="5"
                    max="200"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(
                        parseFloat(e.target.value) || 30
                      )
                    }
                  />
                  <span>per kg</span>
                </div>

                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setBasePrice(p => Math.min(200, p + 1))}
                  aria-label="Increase mandi price by 1 rupee"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="price-preset-chips" aria-label="Mandi price presets">
                {[20, 25, 30, 35, 40].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`price-preset-chip ${basePrice === val ? 'active' : ''}`}
                    onClick={() => setBasePrice(val)}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

            </div>

            {errorMsg && (
              <div className="error-banner">

                <AlertCircle size={18} />

                <span>{errorMsg}</span>

              </div>
            )}

            {isAnalyzing ? (
              <div className="analysis-progress">

                <div className="analysis-spinner" />

                <div className="analysis-title">
                  Inspecting batch...
                </div>

                <div className="analysis-step">
                  {pipelineStep}
                </div>

              </div>
            ) : (
              <button
                className="analyze-button"
                onClick={handleAnalyze}
                disabled={!selectedFile}
              >

                <Sparkles size={19} />

                <span>
                  Run grading & valuation
                </span>

                <ArrowRight size={18} />

              </button>
            )}


            {!selectedFile && (
              <p className="analyze-helper">
                Capture or upload an image to enable
                the inspection.
              </p>
            )}

            <div className="output-preview">

              <div className="output-preview-title">
                What you'll receive
              </div>

              <div className="output-preview-grid">

                <div>
                  <strong>Grade</strong>
                  <span>AGMARK classification</span>
                </div>

                <div>
                  <strong>₹/kg</strong>
                  <span>Recommended mandi value</span>
                </div>

                <div>
                  <strong>Risk</strong>
                  <span>Defect & storage indicators</span>
                </div>

                <div>
                  <strong>QR</strong>
                  <span>Digital Quality Passport</span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {selectedFile && !isAnalyzing && (
        <div className="mobile-sticky-action-bar">
          <button
            type="button"
            className="mobile-fab-inspect"
            onClick={handleAnalyze}
          >
            <Sparkles size={18} />
            <span>Grading & Mandi Rate (₹{basePrice}/kg)</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

    </div>
  );
}