import React, { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';

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

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

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

  // Presentation-only inspection score.
  // This is NOT an ML confidence score.
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

  // ------------------------------------------------------------
  // Defect count
  // ------------------------------------------------------------

  const rotCount = onions.filter(
    (o) => o.defects?.defect_rot
  ).length;

  const sproutCount = onions.filter(
    (o) => o.defects?.defect_sprout
  ).length;

  const damageCount = onions.filter(
    (o) => o.defects?.defect_damage
  ).length;

  const cleanCount = onions.length - rotCount - sproutCount - damageCount;

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <div className="page-container">

      {/* ====================================================== */}
      {/* TOP ACTION BAR */}
      {/* ====================================================== */}

      <div className="results-actions">

        <button
          className="btn-mandi-secondary"
          onClick={onNewScan}
        >
          <ArrowLeft size={16} />
          New Inspection
        </button>

        <div className="results-actions-right">

          <button
            className="passport-button"
            onClick={() => setShowQrModal(true)}
          >
            <QrCode size={17} />
            Digital Quality Passport
          </button>

          <button
            className="btn-mandi-secondary"
            onClick={handleCopyReportLink}
          >
            <Share2 size={16} />
            {copiedLink ? 'Link Copied' : 'Share Report'}
          </button>

        </div>
      </div>


      {/* ====================================================== */}
      {/* RESULTS HEADER */}
      {/* ====================================================== */}

      <section className="results-header">

        <div>

          <div className="results-eyebrow">
            <CheckCircle2 size={15} />
            INSPECTION COMPLETE
          </div>

          <h1 className="results-title">
            Batch quality decision
          </h1>

          <p className="results-subtitle">
            AI-assisted visual inspection converted into a
            grade, mandi value and storage decision.
          </p>

          <div className="batch-meta">

            <span>
              Batch ID:
              <strong>{batch.batch_id}</strong>
            </span>

            <span>
              {new Date(batch.timestamp).toLocaleString()}
            </span>

          </div>

        </div>

        <div className="grade-result-card">

          <span className="grade-result-label">
            AGMARK GRADE
          </span>

          <div
            className={`grade-result-value ${getGradeClass(
              batch.grade
            )}`}
          >
            <ShieldCheck size={22} />
            {batch.grade}
          </div>

        </div>

      </section>


      {/* ====================================================== */}
      {/* PRIMARY KPI CARDS */}
      {/* ====================================================== */}

      <div className="kpi-grid">

        {/* Price */}
        <div className="kpi-card kpi-price">

          <div className="kpi-label">
            <IndianRupee size={16} />
            RECOMMENDED MANDI VALUE
          </div>

          <div className="kpi-value price">
            ₹{batch.recommended_price.toFixed(2)}
            <span>/kg</span>
          </div>

          <div className="kpi-meta">
            Base ₹
            {price_breakdown.base_market_price_inr.toFixed(2)}
            {' · '}
            {price_breakdown.net_penalty_percentage >= 0
              ? '-'
              : '+'}
            {Math.abs(
              price_breakdown.net_penalty_percentage
            )}
            % adjustment
          </div>

        </div>


        {/* Sell priority */}
        <div className="kpi-card">

          <div className="kpi-label">
            <TrendingUp size={16} />
            STORAGE / SELL DECISION
          </div>

          <div className="kpi-value decision">
            <span
              className={`priority-tag ${getPriorityClass(
                batch.sell_priority
              )}`}
            >
              {batch.sell_priority}
            </span>
          </div>

          <div className="kpi-meta">
            Risk index:{' '}
            <strong>
              {priority_breakdown.composite_risk_score.toFixed(1)}
              /100
            </strong>
          </div>

        </div>


        {/* Inspection score */}
        <div className="kpi-card">

          <div className="kpi-label">
            <ShieldCheck size={16} />
            INSPECTION QUALITY SCORE
          </div>

          <div className="kpi-value">
            {inspectionScore}
            <span>/100</span>
          </div>

          <div className="kpi-meta">
            {getRiskLabel(
              priority_breakdown.composite_risk_score
            )}
          </div>

        </div>


        {/* Uniformity */}
        <div className="kpi-card">

          <div className="kpi-label">
            <Layers size={16} />
            SIZE UNIFORMITY
          </div>

          <div className="kpi-value">
            {batch.uniformity_score.toFixed(1)}
            <span>% CV</span>
          </div>

          <div className="kpi-meta">
            {batch.uniformity_score <= 10
              ? 'High uniformity'
              : batch.uniformity_score <= 20
                ? 'Standard consistency'
                : 'High variation'}
          </div>

        </div>

      </div>


      {/* ====================================================== */}
      {/* BATCH SNAPSHOT */}
      {/* ====================================================== */}

      <section className="section">

        <div className="section-title">
          Batch snapshot
        </div>

        <div className="section-subtitle">
          Key physical and quality indicators from this inspection.
        </div>

        <div className="snapshot-grid">

          <div className="snapshot-item">
            <span className="snapshot-label">
              Bulbs evaluated
            </span>
            <span className="snapshot-value">
              {batch.total_onions}
            </span>
          </div>

          <div className="snapshot-item">
            <span className="snapshot-label">
              Mean diameter
            </span>
            <span className="snapshot-value">
              {batch.avg_diameter_mm.toFixed(1)} mm
            </span>
          </div>

          <div className="snapshot-item">
            <span className="snapshot-label">
              Grade A
            </span>
            <span className="snapshot-value">
              {batch.grade_a_pct.toFixed(1)}%
            </span>
          </div>

          <div className="snapshot-item">
            <span className="snapshot-label">
              Grade B
            </span>
            <span className="snapshot-value">
              {batch.grade_b_pct.toFixed(1)}%
            </span>
          </div>

          <div className="snapshot-item">
            <span className="snapshot-label">
              Under-sized / URS
            </span>
            <span className="snapshot-value">
              {batch.urs_pct.toFixed(1)}%
            </span>
          </div>

        </div>

      </section>


      {/* ====================================================== */}
      {/* VISUAL INSPECTION + DEFECT SUMMARY */}
      {/* ====================================================== */}

      <div className="results-grid">

        {/* -------------------------------------------------- */}
        {/* IMAGE */}
        {/* -------------------------------------------------- */}

        <section className="kanda-card">

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
                className={
                  activeTab === 'annotated'
                    ? 'image-tab active'
                    : 'image-tab'
                }
                onClick={() => setActiveTab('annotated')}
              >
                Annotated
              </button>

              <button
                className={
                  activeTab === 'original'
                    ? 'image-tab active'
                    : 'image-tab'
                }
                onClick={() => setActiveTab('original')}
              >
                Original
              </button>

            </div>

          </div>


          <div className="inspection-image">

            <img
              src={
                activeTab === 'annotated'
                  ? `${apiBaseUrl}${annotated_image_url}`
                  : `${apiBaseUrl}${original_image_url}`
              }
              alt="Inspected onion batch"
            />

          </div>


          <div className="visual-legend">

            <span>
              <i className="legend-dot healthy" />
              Healthy
            </span>

            <span>
              <i className="legend-dot rot" />
              Rot
            </span>

            <span>
              <i className="legend-dot sprout" />
              Sprouting
            </span>

            <span>
              <i className="legend-dot damage" />
              Damage
            </span>

          </div>


          {/* Selected onion */}
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
                  Diameter
                  <strong>
                    {selectedOnion.diameter_mm} mm
                  </strong>
                </span>

                <span>
                  Circularity
                  <strong>
                    {selectedOnion.circularity}
                  </strong>
                </span>

                <span>
                  Class
                  <strong>
                    {selectedOnion.size_class}
                  </strong>
                </span>

                {selectedOnion.confidence !== undefined && selectedOnion.confidence !== null && (
                  <span>
                    Confidence
                    <strong>
                      {Math.round(selectedOnion.confidence * 100)}%
                    </strong>
                  </span>
                )}

              </div>

            </div>
          )}

        </section>


        {/* -------------------------------------------------- */}
        {/* DEFECT SUMMARY */}
        {/* -------------------------------------------------- */}

        <section className="kanda-card">

          <div className="section-title">
            Defect summary
          </div>

          <div className="section-subtitle">
            Detected condition indicators across the batch.
          </div>


          <div className="defect-grid">

            <div className="defect-card rot-card">
              <AlertTriangle size={18} />
              <span className="defect-card-title">
                Rot
              </span>
              <strong className="defect-card-value">
                {batch.rot_pct.toFixed(1)}%
              </strong>
              <small>
                {rotCount} bulbs
              </small>
            </div>


            <div className="defect-card sprout-card">
              <CircleAlert size={18} />
              <span className="defect-card-title">
                Sprouting
              </span>
              <strong className="defect-card-value">
                {batch.sprout_pct.toFixed(1)}%
              </strong>
              <small>
                {sproutCount} bulbs
              </small>
            </div>


            <div className="defect-card damage-card">
              <AlertTriangle size={18} />
              <span className="defect-card-title">
                Mechanical damage
              </span>
              <strong className="defect-card-value">
                {batch.damage_pct.toFixed(1)}%
              </strong>
              <small>
                {damageCount} bulbs
              </small>
            </div>


            <div className="defect-card clean-card">
              <CheckCircle2 size={18} />
              <span className="defect-card-title">
                Clean
              </span>
              <strong className="defect-card-value">
                {onions.length
                  ? ((cleanCount / onions.length) * 100).toFixed(1)
                  : 0}
                %
              </strong>
              <small>
                {cleanCount} bulbs
              </small>
            </div>

          </div>


          {/* Size distribution */}
          <div className="distribution-section">

            <div className="distribution-heading">
              <span>Size distribution</span>
              <span>Share of batch</span>
            </div>


            <div className="distribution-row">

              <div className="distribution-label">
                <span>Grade A</span>
                <strong>
                  {batch.grade_a_pct.toFixed(1)}%
                </strong>
              </div>

              <div className="distribution-track">
                <div
                  className="distribution-fill grade-a"
                  style={{
                    width: `${batch.grade_a_pct}%`
                  }}
                />
              </div>

            </div>


            <div className="distribution-row">

              <div className="distribution-label">
                <span>Grade B</span>
                <strong>
                  {batch.grade_b_pct.toFixed(1)}%
                </strong>
              </div>

              <div className="distribution-track">
                <div
                  className="distribution-fill grade-b"
                  style={{
                    width: `${batch.grade_b_pct}%`
                  }}
                />
              </div>

            </div>


            <div className="distribution-row">

              <div className="distribution-label">
                <span>URS</span>
                <strong>
                  {batch.urs_pct.toFixed(1)}%
                </strong>
              </div>

              <div className="distribution-track">
                <div
                  className="distribution-fill urs"
                  style={{
                    width: `${batch.urs_pct}%`
                  }}
                />
              </div>

            </div>

          </div>

        </section>

      </div>


      {/* ====================================================== */}
      {/* PRICE EXPLANATION */}
      {/* ====================================================== */}

      <section className="kanda-card price-breakdown-card">

        <button
          className="price-breakdown-toggle"
          onClick={() =>
            setShowPriceDetails(!showPriceDetails)
          }
        >

          <div>

            <div className="section-title">
              Why this price?
            </div>

            <div className="section-subtitle">
              Transparent breakdown of the recommended mandi value.
            </div>

          </div>

          <ChevronDown
            size={20}
            className={
              showPriceDetails
                ? 'rotate-chevron'
                : ''
            }
          />

        </button>


        {showPriceDetails && (

          <div className="price-breakdown-content">

            <div className="formula-box">
              {price_breakdown.formula_expression}
            </div>

            <div className="price-table">

              <div>
                <span>Mandi benchmark</span>
                <strong>
                  ₹
                  {price_breakdown.base_market_price_inr.toFixed(2)}
                </strong>
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
                  {price_breakdown.uniformity_adjustment_inr >= 0
                    ? '+'
                    : ''}
                  ₹
                  {price_breakdown.uniformity_adjustment_inr.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Rot deduction
                  {' '}
                  ({batch.rot_pct.toFixed(1)}%)
                </span>

                <strong className="negative-value">
                  -₹
                  {price_breakdown.rot_penalty_inr.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Sprout deduction
                  {' '}
                  ({batch.sprout_pct.toFixed(1)}%)
                </span>

                <strong className="negative-value">
                  -₹
                  {price_breakdown.sprout_penalty_inr.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Mechanical damage
                  {' '}
                  ({batch.damage_pct.toFixed(1)}%)
                </span>

                <strong className="negative-value">
                  -₹
                  {price_breakdown.damage_penalty_inr.toFixed(2)}
                </strong>
              </div>

              <div>
                <span>
                  Under-sized / URS
                  {' '}
                  ({batch.urs_pct.toFixed(1)}%)
                </span>

                <strong className="negative-value">
                  -₹
                  {price_breakdown.urs_penalty_inr.toFixed(2)}
                </strong>
              </div>

              <div className="price-final-row">
                <span>
                  Recommended mandi rate
                </span>

                <strong>
                  ₹
                  {price_breakdown.final_recommended_price_inr.toFixed(
                    2
                  )}
                  /kg
                </strong>
              </div>

            </div>

          </div>

        )}

      </section>


      {/* ====================================================== */}
      {/* STORAGE DECISION */}
      {/* ====================================================== */}

      <section className="decision-card">

        <div className="decision-icon">
          <ShieldCheck size={24} />
        </div>

        <div className="decision-content">

          <div className="decision-eyebrow">
            STORAGE / SELL RECOMMENDATION
          </div>

          <h2>
            {batch.sell_priority}
          </h2>

          <p>
            {priority_breakdown.decision_reasoning}
          </p>

        </div>

        <div className="risk-score">

          <span>Risk Index</span>

          <strong>
            {priority_breakdown.composite_risk_score.toFixed(1)}
          </strong>

          <small>/100</small>

        </div>

      </section>


      {/* ====================================================== */}
      {/* DIGITAL QUALITY PASSPORT CTA */}
      {/* ====================================================== */}

      <section className="passport-card">

        <div className="passport-copy">

          <div className="passport-eyebrow">
            <QrCode size={16} />
            SHAREABLE BATCH RECORD
          </div>

          <h2 className="passport-title">
            Create a Digital Quality Passport
          </h2>

          <p className="passport-description">
            Give buyers and mandi traders a simple,
            scannable record of this batch's grade,
            value, quality indicators and inspection details.
          </p>

        </div>

        <div className="passport-actions">

          <button
            className="passport-button"
            onClick={() => setShowQrModal(true)}
          >
            <QrCode size={18} />
            View QR Passport
          </button>

          <button
            className="passport-button secondary"
            onClick={handleCopyReportLink}
          >
            <Share2 size={17} />
            {copiedLink
              ? 'Link Copied'
              : 'Copy Passport Link'}
          </button>

        </div>

      </section>


      {/* ====================================================== */}
      {/* INDIVIDUAL ONION TABLE */}
      {/* ====================================================== */}

      <section className="kanda-card">

        <div className="section-title">
          Individual bulb inspection
        </div>

        <div className="section-subtitle">
          Click any row to inspect its measured characteristics.
        </div>

        <div className="table-wrapper">

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

              {onions.map((o, idx) => {

                const hasRot =
                  o.defects?.defect_rot;

                const hasSprout =
                  o.defects?.defect_sprout;

                const hasDamage =
                  o.defects?.defect_damage;

                return (
                  <tr
                    key={o.onion_id}
                    className={
                      selectedOnionId === o.onion_id
                        ? 'selected-row'
                        : ''
                    }
                    onClick={() =>
                      setSelectedOnionId(o.onion_id)
                    }
                  >

                    <td>
                      {idx + 1}
                    </td>

                    <td className="mono">
                      {o.onion_id.slice(-6)}
                    </td>

                    <td>
                      <strong>
                        {o.diameter_mm}
                      </strong>
                      {' '}mm
                    </td>

                    <td>
                      {o.circularity}
                    </td>

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

                        {hasRot && (
                          <span className="defect-pill rot">
                            Rot
                          </span>
                        )}

                        {hasSprout && (
                          <span className="defect-pill sprout">
                            Sprout
                          </span>
                        )}

                        {hasDamage && (
                          <span className="defect-pill damage">
                            Damage
                          </span>
                        )}

                        {!hasRot &&
                          !hasSprout &&
                          !hasDamage && (
                            <span className="defect-pill ok">
                              Clean
                            </span>
                          )}

                      </div>

                    </td>

                    <td>

                      <button
                        className="table-view-button"
                        onClick={(e) => {
                          e.stopPropagation();

                          setSelectedOnionId(
                            o.onion_id
                          );

                          setActiveTab('annotated');

                          window.scrollTo({
                            top: 350,
                            behavior: 'smooth'
                          });
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


      {/* ====================================================== */}
      {/* QR MODAL */}
      {/* ====================================================== */}

      {showQrModal && (

        <div
          className="qr-modal-overlay"
          onClick={() => setShowQrModal(false)}
        >

          <div
            className="qr-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="qr-modal-icon">
              🧅
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
              to view the inspection passport.
            </p>


            <div className="qr-code-box">

              <img
                src={qr_code_base64}
                alt="Digital Quality Passport QR Code"
              />

            </div>


            <div className="qr-url">

              <span>
                Passport URL
              </span>

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
                onClick={handleCopyReportLink}
              >
                <Share2 size={16} />
                {copiedLink
                  ? 'Copied'
                  : 'Copy Link'}
              </button>

              <button
                className="btn-mandi-secondary"
                onClick={() =>
                  setShowQrModal(false)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}