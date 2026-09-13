import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  IndianRupee,
  QrCode,
  Share2,
  ArrowLeft,
  Layers,
  Eye,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  CircleAlert,
  TrendingUp,
  Maximize2,
  X
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function ResultsDashboard({
  data,
  onNewScan,
  apiBaseUrl
}) {
  const [activeTab, setActiveTab] = useState('annotated');
  const [selectedOnionId, setSelectedOnionId] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [bulbFilter, setBulbFilter] = useState('all');

  const imageSectionRef = useRef(null);

  const {
    batch,
    onions,
    price_breakdown,
    priority_breakdown,
    annotated_image_url,
    original_image_url,
    report_url,
    qr_code_base64
  } = data;

  const selectedOnion = onions.find(
    (o) => o.onion_id === selectedOnionId
  );

  const getGradeClass = (grade) => {
    switch (grade?.toLowerCase()) {
      case 'extra':
        return 'extra';
      case 'standard':
        return 'standard';
      case 'commercial':
        return 'commercial';
      default:
        return 'reject';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'hold':
        return 'hold';
      case 'sell soon':
        return 'sell-soon';
      default:
        return 'sell-first';
    }
  };

  const getRiskLabel = (risk) => {
    if (risk <= 20) return 'Low Risk';
    if (risk <= 45) return 'Moderate Risk';
    if (risk <= 70) return 'High Risk';
    return 'Critical Risk';
  };

  const inspectionScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 - Math.min(priority_breakdown.composite_risk_score * 2, 70)
      )
    )
  );

  const handleCopyReportLink = async () => {
    try {
      await navigator.clipboard.writeText(report_url);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
      }, 2500);
    } catch (error) {
      console.error('Could not copy link:', error);
    }
  };

  const handleShareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `OnionIQ Quality Passport - Batch ${batch.batch_id}`,
          text: `Onion batch ${batch.batch_id} inspected by OnionIQ: Graded ${batch.grade} with recommended rate ₹${batch.recommended_price.toFixed(2)}/kg (${batch.sell_priority}).`,
          url: report_url
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    }
    handleCopyReportLink();
  };

  const rotCount = onions.filter((o) => o.defects?.defect_rot).length;
  const sproutCount = onions.filter((o) => o.defects?.defect_sprout).length;
  const damageCount = onions.filter((o) => o.defects?.defect_damage).length;
  const cleanCount = onions.length - rotCount - sproutCount - damageCount;

  const filteredOnions = onions.filter((o) => {
    if (bulbFilter === 'clean') return !o.defects?.defect_rot && !o.defects?.defect_sprout && !o.defects?.defect_damage;
    if (bulbFilter === 'rot') return o.defects?.defect_rot;
    if (bulbFilter === 'sprout') return o.defects?.defect_sprout;
    if (bulbFilter === 'damage') return o.defects?.defect_damage;
    return true;
  });

  const handleSelectBulb = (onionId) => {
    setSelectedOnionId(onionId);
    setActiveTab('annotated');
    imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="page-container results-page-container">
      <div className="results-actions">
        <button
          className="btn-mandi-secondary"
          onClick={onNewScan}
          type="button"
        >
          <ArrowLeft size={16} />
          <span>New Inspection / नया स्कैन</span>
        </button>

        <div className="results-actions-right">
          <button
            className="passport-button"
            onClick={() => setShowQrModal(true)}
            type="button"
          >
            <QrCode size={17} />
            <span>QR Passport</span>
          </button>

          <button
            className="btn-mandi-secondary share-btn-highlight"
            onClick={handleShareReport}
            type="button"
          >
            <Share2 size={16} />
            <span>{copiedLink ? 'Link Copied!' : 'Share / साझा करें'}</span>
          </button>
        </div>
      </div>

      <section className="unified-verdict-card">
        <div className="verdict-top-bar">
          <div className="verdict-brand-badge">
            <img src={logoImg} alt="OnionIQ" className="verdict-logo" />
            <span>OFFICIAL MANDI VERDICT</span>
          </div>
          <div className="verdict-batch-tag">
            <span>Batch {batch.batch_id}</span>
          </div>
        </div>

        <div className="verdict-main-body">
          <div className="verdict-grade-block">
            <span className="verdict-mini-label">AGMARK QUALITY GRADE</span>
            <div className={`verdict-grade-pill ${getGradeClass(batch.grade)}`}>
              <ShieldCheck size={22} />
              <strong>{batch.grade}</strong>
            </div>
            <p className="verdict-grade-note">
              {batch.grade === 'Extra'
                ? 'Superior export quality • 0% rot'
                : batch.grade === 'Standard'
                ? 'Prime commercial mandi standard'
                : batch.grade === 'Commercial'
                ? 'Acceptable retail mandi standard'
                : 'Defect thresholds exceeded'}
            </p>
          </div>

          <div className="verdict-price-block">
            <span className="verdict-mini-label">RECOMMENDED MANDI RATE</span>
            <div className="verdict-price-number">
              ₹{batch.recommended_price.toFixed(2)}
              <span className="unit">/kg</span>
            </div>
            <div className="verdict-price-meta">
              Base ₹{price_breakdown.base_market_price_inr.toFixed(2)}
              {' · '}
              <span className={price_breakdown.net_penalty_percentage >= 0 ? 'penalty' : 'bonus'}>
                {price_breakdown.net_penalty_percentage >= 0 ? '-' : '+'}
                {Math.abs(price_breakdown.net_penalty_percentage)}% quality adjustment
              </span>
            </div>
          </div>

          <div className="verdict-decision-block">
            <span className="verdict-mini-label">STORAGE / SALE ACTION</span>
            <div className={`verdict-action-tag ${getPriorityClass(batch.sell_priority)}`}>
              <TrendingUp size={16} />
              <span>{batch.sell_priority}</span>
            </div>
            <div className="verdict-risk-tag">
              Risk Index: <strong>{priority_breakdown.composite_risk_score.toFixed(1)}/100</strong>
            </div>
          </div>
        </div>

        <div className="verdict-footer-bar">
          <div className="verdict-quick-stats">
            <span><strong>{batch.total_onions}</strong> bulbs</span>
            <span>Avg <strong>{batch.avg_diameter_mm.toFixed(1)} mm</strong></span>
            <span>Uniformity <strong>{batch.uniformity_score.toFixed(1)}% CV</strong></span>
            <span>Score <strong>{inspectionScore}/100</strong></span>
          </div>

          <button
            className="verdict-qr-cta"
            onClick={() => setShowQrModal(true)}
            type="button"
          >
            <QrCode size={16} />
            <span>Digital Passport</span>
          </button>
        </div>
      </section>

      <div className="kpi-grid">
        <div className="kpi-card kpi-price">
          <div className="kpi-label">
            <IndianRupee size={15} />
            Mandi Value / भाव
          </div>
          <div className="kpi-value price">
            ₹{batch.recommended_price.toFixed(2)}
            <span>/kg</span>
          </div>
          <div className="kpi-meta">
            Net {price_breakdown.net_penalty_percentage >= 0 ? 'deduction' : 'premium'}: ₹{Math.abs(price_breakdown.uniformity_adjustment_inr - price_breakdown.rot_penalty_inr - price_breakdown.sprout_penalty_inr - price_breakdown.damage_penalty_inr - price_breakdown.urs_penalty_inr).toFixed(2)}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <TrendingUp size={15} />
            Action / निर्णय
          </div>
          <div className="kpi-value decision">
            <span className={`priority-tag ${getPriorityClass(batch.sell_priority)}`}>
              {batch.sell_priority}
            </span>
          </div>
          <div className="kpi-meta">
            {batch.sell_priority === 'Hold' ? 'Safe warehouse storage' : 'Elevated shelf degradation'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <ShieldCheck size={15} />
            Quality Score / स्कोर
          </div>
          <div className="kpi-value">
            {inspectionScore}
            <span>/100</span>
          </div>
          <div className="kpi-meta">
            {getRiskLabel(priority_breakdown.composite_risk_score)}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <Layers size={15} />
            Uniformity / एकरूपता
          </div>
          <div className="kpi-value">
            {batch.uniformity_score.toFixed(1)}
            <span>% CV</span>
          </div>
          <div className="kpi-meta">
            {batch.uniformity_score <= 10
              ? 'High uniformity'
              : batch.uniformity_score <= 20
                ? 'Commercial consistency'
                : 'High size variation'}
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-title">
          Batch physical profile
        </div>
        <div className="section-subtitle">
          Measured physical characteristics across evaluated bulbs.
        </div>

        <div className="snapshot-grid">
          <div className="snapshot-item">
            <span className="snapshot-label">Bulbs Evaluated</span>
            <span className="snapshot-value">{batch.total_onions}</span>
          </div>
          <div className="snapshot-item">
            <span className="snapshot-label">Mean Diameter</span>
            <span className="snapshot-value">{batch.avg_diameter_mm.toFixed(1)} mm</span>
          </div>
          <div className="snapshot-item">
            <span className="snapshot-label">Grade A (&gt;60mm)</span>
            <span className="snapshot-value">{batch.grade_a_pct.toFixed(1)}%</span>
          </div>
          <div className="snapshot-item">
            <span className="snapshot-label">Grade B (40-60mm)</span>
            <span className="snapshot-value">{batch.grade_b_pct.toFixed(1)}%</span>
          </div>
          <div className="snapshot-item">
            <span className="snapshot-label">Under-sized (URS)</span>
            <span className="snapshot-value">{batch.urs_pct.toFixed(1)}%</span>
          </div>
        </div>
      </section>

      <div className="results-grid">
        <section className="kanda-card" ref={imageSectionRef}>
          <div className="card-heading-row">
            <div>
              <div className="section-title">
                Visual inspection
              </div>
              <div className="section-subtitle">
                Segmented onion detection and defect overlay.
              </div>
            </div>

            <div className="image-tabs">
              <button
                className={activeTab === 'annotated' ? 'image-tab active' : 'image-tab'}
                onClick={() => setActiveTab('annotated')}
                type="button"
              >
                Annotated
              </button>
              <button
                className={activeTab === 'original' ? 'image-tab active' : 'image-tab'}
                onClick={() => setActiveTab('original')}
                type="button"
              >
                Original
              </button>
            </div>
          </div>

          <div
            className="inspection-image"
            onClick={() => setShowFullscreenImage(true)}
            role="button"
            tabIndex={0}
            aria-label="Tap to view fullscreen image"
          >
            <img
              src={
                activeTab === 'annotated'
                  ? `${apiBaseUrl}${annotated_image_url}`
                  : `${apiBaseUrl}${original_image_url}`
              }
              alt="Inspected onion batch"
            />
            <div className="image-zoom-overlay-btn">
              <Maximize2 size={16} />
              <span>Tap to Zoom / बड़ा करें</span>
            </div>
          </div>

          <div className="visual-legend">
            <span>
              <i className="legend-dot healthy" />
              Healthy ({cleanCount})
            </span>
            <span>
              <i className="legend-dot rot" />
              Rot ({rotCount})
            </span>
            <span>
              <i className="legend-dot sprout" />
              Sprout ({sproutCount})
            </span>
            <span>
              <i className="legend-dot damage" />
              Damage ({damageCount})
            </span>
          </div>

          {selectedOnion && (
            <div className="selected-onion">
              <div className="selected-onion-header">
                <strong>
                  Bulb #{selectedOnion.onion_id.slice(-4)}
                </strong>
                <span
                  className={`defect-pill ${
                    selectedOnion.defects.defect_rot
                      ? 'rot'
                      : selectedOnion.defects.defect_sprout
                        ? 'sprout'
                        : selectedOnion.defects.defect_damage
                          ? 'damage'
                          : 'ok'
                  }`}
                >
                  {selectedOnion.defects.defect_rot
                    ? 'ROT DETECTED'
                    : selectedOnion.defects.defect_sprout
                      ? 'SPROUT DETECTED'
                      : selectedOnion.defects.defect_damage
                        ? 'DAMAGE DETECTED'
                        : 'HEALTHY'}
                </span>
              </div>

              <div className="selected-onion-grid">
                <span>
                  Diameter: <strong>{selectedOnion.diameter_mm} mm</strong>
                </span>
                <span>
                  Circularity: <strong>{selectedOnion.circularity}</strong>
                </span>
                <span>
                  Class: <strong>{selectedOnion.size_class}</strong>
                </span>
                {selectedOnion.confidence !== undefined && selectedOnion.confidence !== null && (
                  <span>
                    Confidence: <strong>{Math.round(selectedOnion.confidence * 100)}%</strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="kanda-card">
          <div className="section-title">
            Defect summary
          </div>
          <div className="section-subtitle">
            Condition breakdown determining grade and deductions.
          </div>

          <div className="defect-grid">
            <div className="defect-card rot-card">
              <AlertTriangle size={18} />
              <span className="defect-card-title">Rot / सड़न</span>
              <strong className="defect-card-value">{batch.rot_pct.toFixed(1)}%</strong>
              <small>{rotCount} bulbs</small>
            </div>

            <div className="defect-card sprout-card">
              <CircleAlert size={18} />
              <span className="defect-card-title">Sprouting / अंकुरण</span>
              <strong className="defect-card-value">{batch.sprout_pct.toFixed(1)}%</strong>
              <small>{sproutCount} bulbs</small>
            </div>

            <div className="defect-card damage-card">
              <AlertTriangle size={18} />
              <span className="defect-card-title">Damage / चोट</span>
              <strong className="defect-card-value">{batch.damage_pct.toFixed(1)}%</strong>
              <small>{damageCount} bulbs</small>
            </div>

            <div className="defect-card clean-card">
              <CheckCircle2 size={18} />
              <span className="defect-card-title">Clean / स्वस्थ</span>
              <strong className="defect-card-value">
                {onions.length ? ((cleanCount / onions.length) * 100).toFixed(1) : 0}%
              </strong>
              <small>{cleanCount} bulbs</small>
            </div>
          </div>

          <div className="distribution-section">
            <div className="distribution-heading">
              <span>Size distribution</span>
              <span>Share of batch</span>
            </div>

            <div className="distribution-row">
              <div className="distribution-label">
                <span>Grade A (&gt;60mm)</span>
                <strong>{batch.grade_a_pct.toFixed(1)}%</strong>
              </div>
              <div className="distribution-track">
                <div
                  className="distribution-fill grade-a"
                  style={{ width: `${batch.grade_a_pct}%` }}
                />
              </div>
            </div>

            <div className="distribution-row">
              <div className="distribution-label">
                <span>Grade B (40-60mm)</span>
                <strong>{batch.grade_b_pct.toFixed(1)}%</strong>
              </div>
              <div className="distribution-track">
                <div
                  className="distribution-fill grade-b"
                  style={{ width: `${batch.grade_b_pct}%` }}
                />
              </div>
            </div>

            <div className="distribution-row">
              <div className="distribution-label">
                <span>Under-sized / URS</span>
                <strong>{batch.urs_pct.toFixed(1)}%</strong>
              </div>
              <div className="distribution-track">
                <div
                  className="distribution-fill urs"
                  style={{ width: `${batch.urs_pct}%` }}
                />
              </div>
            </div>
          </div>
        </section>

      </div>

      <section className="kanda-card price-breakdown-card">
        <button
          className="price-breakdown-toggle"
          onClick={() => setShowPriceDetails(!showPriceDetails)}
          type="button"
        >
          <div>
            <div className="section-title">
              Why this price? / भाव विवरण
            </div>
            <div className="section-subtitle">
              Transparent breakdown of the recommended mandi valuation.
            </div>
          </div>

          <ChevronDown
            size={20}
            className={showPriceDetails ? 'rotate-chevron' : ''}
          />
        </button>

        {showPriceDetails && (
          <div className="price-breakdown-content">
            <div className="formula-box">
              {price_breakdown.formula_expression}
            </div>

            <div className="price-table">
              <div>
                <span>Mandi benchmark rate</span>
                <strong>₹{price_breakdown.base_market_price_inr.toFixed(2)}</strong>
              </div>

              <div>
                <span>Uniformity adjustment</span>
                <strong
                  className={
                    price_breakdown.uniformity_adjustment_inr >= 0
                      ? 'positive-value'
                      : 'negative-value'
                  }
                >
                  {price_breakdown.uniformity_adjustment_inr >= 0 ? '+' : ''}
                  ₹{price_breakdown.uniformity_adjustment_inr.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Rot deduction ({batch.rot_pct.toFixed(1)}%)</span>
                <strong className="negative-value">
                  -₹{price_breakdown.rot_penalty_inr.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Sprout deduction ({batch.sprout_pct.toFixed(1)}%)</span>
                <strong className="negative-value">
                  -₹{price_breakdown.sprout_penalty_inr.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Mechanical damage ({batch.damage_pct.toFixed(1)}%)</span>
                <strong className="negative-value">
                  -₹{price_breakdown.damage_penalty_inr.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>Under-sized / URS ({batch.urs_pct.toFixed(1)}%)</span>
                <strong className="negative-value">
                  -₹{price_breakdown.urs_penalty_inr.toFixed(2)}
                </strong>
              </div>

              <div className="price-final-row">
                <span>Final recommended mandi rate</span>
                <strong>
                  ₹{price_breakdown.final_recommended_price_inr.toFixed(2)}/kg
                </strong>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="passport-card">
        <div className="passport-copy">
          <div className="passport-eyebrow">
            <QrCode size={16} />
            SHAREABLE BATCH RECORD
          </div>

          <h2 className="passport-title">
            Digital Quality Passport & QR
          </h2>

          <p className="passport-description">
            Share this verifiable quality record with buyers and traders over WhatsApp
            or display the QR code at the auction weighing scale.
          </p>
        </div>

        <div className="passport-actions">
          <button
            className="passport-button"
            onClick={() => setShowQrModal(true)}
            type="button"
          >
            <QrCode size={18} />
            View QR Code
          </button>

          <button
            className="passport-button secondary"
            onClick={handleShareReport}
            type="button"
          >
            <Share2 size={17} />
            {copiedLink ? 'Link Copied' : 'Share Passport'}
          </button>
        </div>
      </section>

      <section className="kanda-card bulb-inspection-section">
        <div className="card-heading-row">
          <div>
            <div className="section-title">
              Individual bulb inspection ({filteredOnions.length})
            </div>
            <div className="section-subtitle">
              Tap any bulb to highlight its bounding box on the image.
            </div>
          </div>

          <div className="bulb-filter-chips" aria-label="Filter bulbs">
            <button
              className={`bulb-chip ${bulbFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBulbFilter('all')}
              type="button"
            >
              All ({onions.length})
            </button>
            <button
              className={`bulb-chip ${bulbFilter === 'clean' ? 'active' : ''}`}
              onClick={() => setBulbFilter('clean')}
              type="button"
            >
              Clean ({cleanCount})
            </button>
            {rotCount > 0 && (
              <button
                className={`bulb-chip rot ${bulbFilter === 'rot' ? 'active' : ''}`}
                onClick={() => setBulbFilter('rot')}
                type="button"
              >
                Rot ({rotCount})
              </button>
            )}
            {sproutCount > 0 && (
              <button
                className={`bulb-chip sprout ${bulbFilter === 'sprout' ? 'active' : ''}`}
                onClick={() => setBulbFilter('sprout')}
                type="button"
              >
                Sprout ({sproutCount})
              </button>
            )}
            {damageCount > 0 && (
              <button
                className={`bulb-chip damage ${bulbFilter === 'damage' ? 'active' : ''}`}
                onClick={() => setBulbFilter('damage')}
                type="button"
              >
                Damage ({damageCount})
              </button>
            )}
          </div>
        </div>

        <div className="mobile-bulb-card-list">
          {filteredOnions.map((o, idx) => {
            const hasRot = o.defects?.defect_rot;
            const hasSprout = o.defects?.defect_sprout;
            const hasDamage = o.defects?.defect_damage;
            const isClean = !hasRot && !hasSprout && !hasDamage;
            const isSelected = selectedOnionId === o.onion_id;

            return (
              <div
                key={o.onion_id}
                className={`mobile-bulb-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectBulb(o.onion_id)}
                role="button"
                tabIndex={0}
              >
                <div className="bulb-card-header">
                  <div className="bulb-card-id">
                    <span className="bulb-num">#{idx + 1}</span>
                    <span className="bulb-hex">{o.onion_id.slice(-5)}</span>
                  </div>

                  <span
                    className={
                      o.size_class.startsWith('Grade A')
                        ? 'class-pill grade-a-pill'
                        : o.size_class.startsWith('Grade B')
                          ? 'class-pill grade-b-pill'
                          : 'class-pill urs-pill'
                    }
                  >
                    {o.size_class}
                  </span>
                </div>

                <div className="bulb-card-metrics">
                  <div>
                    <span className="label">Diameter</span>
                    <strong>{o.diameter_mm} mm</strong>
                  </div>
                  <div>
                    <span className="label">Roundness</span>
                    <strong>{o.circularity}</strong>
                  </div>
                  {o.confidence !== undefined && o.confidence !== null && (
                    <div>
                      <span className="label">Confidence</span>
                      <strong>{Math.round(o.confidence * 100)}%</strong>
                    </div>
                  )}
                </div>

                <div className="bulb-card-footer">
                  <div className="defect-pills">
                    {hasRot && <span className="defect-pill rot">Rot</span>}
                    {hasSprout && <span className="defect-pill sprout">Sprout</span>}
                    {hasDamage && <span className="defect-pill damage">Damage</span>}
                    {isClean && <span className="defect-pill ok">Clean</span>}
                  </div>

                  <span className="view-bulb-action">
                    <Eye size={14} />
                    <span>Locate</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="desktop-table-wrapper table-wrapper">
          <table className="inspection-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bulb ID</th>
                <th>Diameter</th>
                <th>Circularity</th>
                <th>AGMARK class</th>
                <th>Defects</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredOnions.map((o, idx) => {
                const hasRot = o.defects?.defect_rot;
                const hasSprout = o.defects?.defect_sprout;
                const hasDamage = o.defects?.defect_damage;
                const isSelected = selectedOnionId === o.onion_id;

                return (
                  <tr
                    key={o.onion_id}
                    className={isSelected ? 'selected-row' : ''}
                    onClick={() => handleSelectBulb(o.onion_id)}
                  >
                    <td>{idx + 1}</td>
                    <td className="mono">{o.onion_id.slice(-6)}</td>
                    <td>
                      <strong>{o.diameter_mm}</strong> mm
                    </td>
                    <td>{o.circularity}</td>
                    <td>
                      <span
                        className={
                          o.size_class.startsWith('Grade A')
                            ? 'class-pill grade-a-pill'
                            : o.size_class.startsWith('Grade B')
                              ? 'class-pill grade-b-pill'
                              : 'class-pill urs-pill'
                        }
                      >
                        {o.size_class}
                      </span>
                    </td>
                    <td>
                      <div className="defect-pills">
                        {hasRot && <span className="defect-pill rot">Rot</span>}
                        {hasSprout && <span className="defect-pill sprout">Sprout</span>}
                        {hasDamage && <span className="defect-pill damage">Damage</span>}
                        {!hasRot && !hasSprout && !hasDamage && (
                          <span className="defect-pill ok">Clean</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="table-view-button"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBulb(o.onion_id);
                        }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showQrModal && (
        <div
          className="qr-modal-overlay"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="qr-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qr-modal-logo-wrap">
              <img src={logoImg} alt="OnionIQ Logo" className="qr-modal-logo-img" />
            </div>

            <div className="passport-eyebrow">
              DIGITAL QUALITY PASSPORT
            </div>

            <h2>
              Scan to view batch record
            </h2>

            <p>
              Buyers and mandi traders on the same
              local Wi-Fi / LAN can scan this QR code
              to view the verified inspection passport.
            </p>

            <div className="qr-code-box">
              <img
                src={qr_code_base64}
                alt="Digital Quality Passport QR Code"
              />
            </div>

            <div className="qr-url">
              <span>Passport URL</span>
              <a
                href={report_url}
                target="_blank"
                rel="noreferrer"
              >
                {report_url}
              </a>
            </div>

            <div className="qr-actions">
              <button
                className="passport-button"
                onClick={handleShareReport}
                type="button"
              >
                <Share2 size={16} />
                <span>{copiedLink ? 'Copied' : 'Share / Copy'}</span>
              </button>

              <button
                className="btn-mandi-secondary"
                onClick={() => setShowQrModal(false)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showFullscreenImage && (
        <div
          className="fullscreen-image-modal"
          onClick={() => setShowFullscreenImage(false)}
        >
          <div className="fullscreen-image-header" onClick={(e) => e.stopPropagation()}>
            <div className="image-tabs">
              <button
                className={activeTab === 'annotated' ? 'image-tab active' : 'image-tab'}
                onClick={() => setActiveTab('annotated')}
                type="button"
              >
                Annotated
              </button>
              <button
                className={activeTab === 'original' ? 'image-tab active' : 'image-tab'}
                onClick={() => setActiveTab('original')}
                type="button"
              >
                Original
              </button>
            </div>

            <button
              className="fullscreen-close-btn"
              onClick={() => setShowFullscreenImage(false)}
              type="button"
              aria-label="Close fullscreen"
            >
              <X size={22} />
            </button>
          </div>

          <div
            className="fullscreen-image-body"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                activeTab === 'annotated'
                  ? `${apiBaseUrl}${annotated_image_url}`
                  : `${apiBaseUrl}${original_image_url}`
              }
              alt="Fullscreen batch preview"
            />
          </div>
        </div>
      )}

    </div>
  );
}