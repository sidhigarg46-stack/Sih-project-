import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, IndianRupee, QrCode, Share2,
  Download, Eye, ArrowLeft, CheckCircle, Info, ChevronDown,
  Layers, HelpCircle, Activity, Sparkles, AlertCircle
} from 'lucide-react';

export default function ResultsDashboard({ data, onNewScan, apiBaseUrl }) {
  const [activeTab, setActiveTab] = useState('annotated'); // 'annotated' | 'original'
  const [selectedOnionId, setSelectedOnionId] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
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

  // Selected onion details
  const selectedOnion = onions.find(o => o.onion_id === selectedOnionId);

  // Grade color helper
  const getGradeClass = (grade) => {
    switch (grade?.toLowerCase()) {
      case 'extra': return 'extra';
      case 'standard': return 'standard';
      case 'commercial': return 'commercial';
      default: return 'reject';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'hold': return 'hold';
      case 'sell soon': return 'sell-soon';
      default: return 'sell-first';
    }
  };

  const handleCopyReportLink = () => {
    navigator.clipboard.writeText(report_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '1.5rem auto', padding: '0 1rem' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={onNewScan}
          className="btn-mandi-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>New Inspection</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowQrModal(true)}
            style={{
              background: '#FFFFFF',
              color: 'var(--kanda-crimson)',
              border: '1.5px solid var(--card-border)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
          >
            <QrCode size={16} color="var(--haldi-gold)" />
            <span>Mandi Pass & QR</span>
          </button>

          <button
            onClick={handleCopyReportLink}
            style={{
              background: copiedLink ? 'var(--emerald-bg)' : '#FFFFFF',
              color: copiedLink ? 'var(--emerald-fresh)' : 'var(--text-main)',
              border: copiedLink ? '1.5px solid var(--emerald-fresh)' : '1.5px solid var(--card-border)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Share2 size={16} />
            <span>{copiedLink ? 'Link Copied!' : 'Share LAN URL'}</span>
          </button>
        </div>
      </div>

      {/* Main Indian Mandi Certificate Banner */}
      <div className="kanda-card" style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 100%)',
        border: '2px solid rgba(139, 30, 63, 0.18)',
        position: 'relative'
      }}>
        {/* Subtle Rangoli / Warli ornamental watermark */}
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '20px',
          opacity: 0.07,
          pointerEvents: 'none',
          fontSize: '120px'
        }}>
          🧅
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Batch Identifier:
              </span>
              <code style={{ background: '#F1F5F9', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--kanda-crimson)', fontWeight: 700 }}>
                {batch.batch_id}
              </code>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                • {new Date(batch.timestamp).toLocaleString()}
              </span>
            </div>

            <h1 style={{ fontSize: '1.85rem', color: 'var(--kanda-maroon)', marginBottom: '0.2rem' }}>
              Official Mandi Quality & Grading Certificate
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Evaluated strictly in accordance with AGMARK & National Horticulture Board (NHB) specifications.
            </p>
          </div>

          {/* AGMARK Official Grade Stamp */}
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              ASSIGNED AGMARK GRADE
            </span>
            <div className={`mandi-seal ${getGradeClass(batch.grade)}`}>
              <ShieldCheck size={18} style={{ marginRight: '0.4rem' }} />
              <span>GRADE: {batch.grade}</span>
            </div>
          </div>
        </div>

        <div className="jali-divider" />

        {/* 4 Essential Mandi KPI Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          {/* Price Card */}
          <div style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
            border: '1.5px solid #FDE68A',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#92400E', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>RECOMMENDED PRICE</span>
              <IndianRupee size={16} />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--kanda-maroon)', marginTop: '0.25rem' }}>
              ₹{batch.recommended_price.toFixed(2)}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#78350F', marginLeft: '4px' }}>/ kg</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.2rem' }}>
              Base: ₹{price_breakdown.base_market_price_inr.toFixed(2)} ({price_breakdown.net_penalty_percentage >= 0 ? '-' : '+'}{Math.abs(price_breakdown.net_penalty_percentage)}% net penalty)
            </div>
          </div>

          {/* Sell Priority Card */}
          <div style={{
            background: batch.sell_priority === 'Sell First' ? '#FEE2E2' : batch.sell_priority === 'Sell Soon' ? '#FEF3C7' : '#DCFCE7',
            border: batch.sell_priority === 'Sell First' ? '1.5px solid #FCA5A5' : batch.sell_priority === 'Sell Soon' ? '1.5px solid #FDE68A' : '1.5px solid #86EFAC',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
              <span style={{ color: batch.sell_priority === 'Sell First' ? '#991B1B' : '#78350F' }}>SELL PRIORITY</span>
              <Activity size={16} color={batch.sell_priority === 'Sell First' ? '#DC2626' : '#D97706'} />
            </div>
            <div style={{ marginTop: '0.35rem' }}>
              <span className={`priority-tag ${getPriorityClass(batch.sell_priority)}`}>
                {batch.sell_priority}
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Risk Index: <strong>{priority_breakdown.composite_risk_score.toFixed(1)}/100</strong>
            </div>
          </div>

          {/* Uniformity Score */}
          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>SIZE UNIFORMITY (CV)</span>
              <Layers size={16} />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--kanda-maroon)', marginTop: '0.25rem' }}>
              {batch.uniformity_score.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
              {batch.uniformity_score <= 10 ? 'High Uniformity (+5% premium)' : batch.uniformity_score <= 20 ? 'Standard Consistency' : 'High Variation (discount applied)'}
            </div>
          </div>

          {/* Sample Size & Diameter */}
          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#475569', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>SAMPLE POPULATION</span>
              <Sparkles size={16} />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--kanda-maroon)', marginTop: '0.25rem' }}>
              {batch.total_onions} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748B' }}>bulbs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
              Mean Diameter: <strong>{batch.avg_diameter_mm.toFixed(1)} mm</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Bounding Box Inspector & Mathematical Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Left Column: Interactive Visual Bounding Box Overlay */}
        <div className="kanda-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--kanda-maroon)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={18} color="var(--kanda-crimson)" />
              Computer Vision Segmentation & Bounding Boxes
            </h2>

            {/* Toggle Annotated vs Original */}
            <div style={{ background: '#F1F5F9', padding: '0.2rem', borderRadius: '6px', display: 'flex', gap: '0.2rem' }}>
              <button
                onClick={() => setActiveTab('annotated')}
                style={{
                  background: activeTab === 'annotated' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'annotated' ? 'var(--kanda-crimson)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'annotated' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Annotated Overlay
              </button>
              <button
                onClick={() => setActiveTab('original')}
                style={{
                  background: activeTab === 'original' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'original' ? 'var(--kanda-crimson)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'original' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Original Raw
              </button>
            </div>
          </div>

          {/* Visual Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#0F172A',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            aspectRatio: '4 / 3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={activeTab === 'annotated' ? `${apiBaseUrl}${annotated_image_url}` : `${apiBaseUrl}${original_image_url}`}
              alt="Evaluated Onions"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Visual Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#22C55E', borderRadius: '2px', display: 'inline-block' }} />
              Healthy Bulb (OK)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#EF4444', borderRadius: '2px', display: 'inline-block' }} />
              Rot / Necrosis (ROT)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#F59E0B', borderRadius: '2px', display: 'inline-block' }} />
              Sprouting (SPRT)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#C2410C', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#F97316', borderRadius: '2px', display: 'inline-block' }} />
              Mechanical Cut (DMG)
            </span>
          </div>

          {/* Selected Onion Quick Inspector Card */}
          {selectedOnion && (
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              background: '#FFFDF9',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--haldi-gold)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--kanda-maroon)', fontSize: '0.85rem' }}>
                  Selected Bulb #{selectedOnion.onion_id.slice(-4)} Inspector
                </span>
                <span className={`defect-pill ${selectedOnion.defects.defect_rot ? 'rot' : selectedOnion.defects.defect_sprout ? 'sprout' : selectedOnion.defects.defect_damage ? 'damage' : 'ok'}`}>
                  {selectedOnion.defects.defect_rot ? 'ROT DETECTED' : selectedOnion.defects.defect_sprout ? 'SPROUT DETECTED' : selectedOnion.defects.defect_damage ? 'CUT DAMAGE' : 'HEALTHY'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.78rem' }}>
                <div>Diameter: <strong>{selectedOnion.diameter_mm} mm</strong></div>
                <div>Circularity: <strong>{selectedOnion.circularity}</strong> (4πA/P²)</div>
                <div>Classification: <strong>{selectedOnion.size_class}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Transparent Mathematical Formula Breakdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Price Formula Breakdown */}
          <div className="kanda-card">
            <h2 style={{ fontSize: '1.15rem', color: 'var(--kanda-maroon)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IndianRupee size={18} color="var(--kanda-crimson)" />
              Transparent Pricing Formula Breakdown
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              Full mathematical derivation according to AGMARK quality deductions:
            </p>

            {/* Formula Expression Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#334155',
              marginBottom: '1rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              {price_breakdown.formula_expression}
            </div>

            {/* Step-by-step Deductions Table */}
            <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.45rem 0', color: 'var(--text-muted)' }}>Mandi Benchmark Rate</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700 }}>₹{price_breakdown.base_market_price_inr.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.45rem 0', color: 'var(--text-muted)' }}>Uniformity Adjustment (CV {batch.uniformity_score.toFixed(1)}%)</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700, color: price_breakdown.uniformity_adjustment_inr >= 0 ? '#15803D' : '#DC2626' }}>
                    {price_breakdown.uniformity_adjustment_inr >= 0 ? '+' : ''}₹{price_breakdown.uniformity_adjustment_inr.toFixed(2)}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.45rem 0', color: '#DC2626' }}>Rot Spoilage Deduction ({batch.rot_pct.toFixed(1)}%)</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>-₹{price_breakdown.rot_penalty_inr.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.45rem 0', color: '#B45309' }}>Sprouting Growth Deduction ({batch.sprout_pct.toFixed(1)}%)</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700, color: '#B45309' }}>-₹{price_breakdown.sprout_penalty_inr.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.45rem 0', color: '#EA580C' }}>Mechanical Damage Notch Deduction ({batch.damage_pct.toFixed(1)}%)</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700, color: '#EA580C' }}>-₹{price_breakdown.damage_penalty_inr.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '1.5px solid var(--haldi-gold)' }}>
                  <td style={{ padding: '0.45rem 0', color: 'var(--text-muted)' }}>Under-sized (URS &lt;40mm) Discount ({batch.urs_pct.toFixed(1)}%)</td>
                  <td style={{ padding: '0.45rem 0', textAlign: 'right', fontWeight: 700, color: '#64748B' }}>-₹{price_breakdown.urs_penalty_inr.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.65rem 0 0 0', fontWeight: 700, fontSize: '0.95rem', color: 'var(--kanda-maroon)' }}>Final Recommended Rate</td>
                  <td style={{ padding: '0.65rem 0 0 0', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: 'var(--kanda-maroon)' }}>
                    ₹{price_breakdown.final_recommended_price_inr.toFixed(2)} / kg
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sell Priority & Risk Formula */}
          <div className="kanda-card">
            <h2 style={{ fontSize: '1.15rem', color: 'var(--kanda-maroon)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="var(--kanda-crimson)" />
              Sell Priority & Storage Risk Evaluation
            </h2>
            <div style={{
              background: '#FFFDF9',
              border: '1px solid #FDE68A',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 700, marginBottom: '0.2rem' }}>
                WEIGHTED RISK INDEX FORMULA:
              </div>
              <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#78350F' }}>
                Risk = 0.50×(Rot {batch.rot_pct.toFixed(1)}%) + 0.35×(Sprout {batch.sprout_pct.toFixed(1)}%) + 0.15×(Damage {batch.damage_pct.toFixed(1)}%) = {priority_breakdown.composite_risk_score.toFixed(1)}
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: batch.sell_priority === 'Sell First' ? '#FEF2F2' : batch.sell_priority === 'Sell Soon' ? '#FFFBEB' : '#F0FDF4',
              borderLeft: `4px solid ${batch.sell_priority === 'Sell First' ? '#DC2626' : batch.sell_priority === 'Sell Soon' ? '#D97706' : '#16A34A'}`
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: batch.sell_priority === 'Sell First' ? '#991B1B' : '#92400E', marginBottom: '0.25rem' }}>
                Storage Action: {batch.sell_priority}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {priority_breakdown.decision_reasoning}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AGMARK Size & Defect Distribution Statistics */}
      <div className="kanda-card" style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--kanda-maroon)', marginBottom: '1rem' }}>
          Batch Distribution & Quality Metrics
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Size Distribution Breakdown */}
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
              AGMARK Diameter Classification
            </h3>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span>Grade A (&gt;60mm)</span>
                <strong>{batch.grade_a_pct.toFixed(1)}%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${batch.grade_a_pct}%`, height: '100%', backgroundColor: 'var(--kanda-crimson)' }} />
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span>Grade B (40 - 60mm)</span>
                <strong>{batch.grade_b_pct.toFixed(1)}%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${batch.grade_b_pct}%`, height: '100%', backgroundColor: 'var(--haldi-gold)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span>Under-sized / URS (&lt;40mm)</span>
                <strong>{batch.urs_pct.toFixed(1)}%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${batch.urs_pct}%`, height: '100%', backgroundColor: '#94A3B8' }} />
              </div>
            </div>
          </div>

          {/* Defect Breakdown */}
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
              Defect Incidence (Classical CV)
            </h3>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ color: '#DC2626' }}>Rot (Dark Necrosis HSV)</span>
                <strong style={{ color: '#DC2626' }}>{batch.rot_pct.toFixed(1)}%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${batch.rot_pct}%`, height: '100%', backgroundColor: '#DC2626' }} />
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ color: '#B45309' }}>Sprouting (Chlorophyll Green HSV)</span>
                <strong style={{ color: '#B45309' }}>{batch.sprout_pct.toFixed(1)}%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${batch.sprout_pct}%`, height: '100%', backgroundColor: '#F59E0B' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span style={{ color: '#EA580C' }}>Mechanical Cuts (Convexity Notches)</span>
                <strong style={{ color: '#EA580C' }}>{batch.damage_pct.toFixed(1)}%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${batch.damage_pct}%`, height: '100%', backgroundColor: '#EA580C' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Onion Granular Data Table */}
      <div className="kanda-card">
        <h2 style={{ fontSize: '1.25rem', color: 'var(--kanda-maroon)', marginBottom: '0.85rem' }}>
          Individual Segmented Bulb Roster ({onions.length} Bulbs)
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.65rem 0.75rem' }}>#</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Bulb ID</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Diameter (mm)</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Circularity</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>AGMARK Class</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Defect Status</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {onions.map((o, idx) => (
                <tr
                  key={o.onion_id}
                  onClick={() => setSelectedOnionId(o.onion_id)}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    background: selectedOnionId === o.onion_id ? '#FEF3C7' : idx % 2 === 0 ? '#FFFFFF' : '#FAF8F5',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace' }}>{o.onion_id.slice(-6)}</td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{o.diameter_mm} mm</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>{o.circularity}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: o.size_class.startsWith('Grade A') ? '#FCE7F3' : o.size_class.startsWith('Grade B') ? '#FEF3C7' : '#F1F5F9',
                      color: o.size_class.startsWith('Grade A') ? 'var(--kanda-crimson)' : o.size_class.startsWith('Grade B') ? '#92400E' : '#475569',
                      fontWeight: 600
                    }}>
                      {o.size_class}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {o.defects.defect_rot && <span className="defect-pill rot">Rot</span>}
                      {o.defects.defect_sprout && <span className="defect-pill sprout">Sprout</span>}
                      {o.defects.defect_damage && <span className="defect-pill damage">Damage</span>}
                      {!o.defects.defect_rot && !o.defects.defect_sprout && !o.defects.defect_damage && (
                        <span className="defect-pill ok">Clean</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOnionId(o.onion_id);
                        setActiveTab('annotated');
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--card-border)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        color: 'var(--kanda-crimson)',
                        fontWeight: 600
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shareable QR Code Modal */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(28, 25, 23, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="kanda-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🧅</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--kanda-maroon)', marginBottom: '0.3rem' }}>
              Digital Mandi Pass & QR Code
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Buyers and mandi traders on the same local Wi-Fi / LAN network can scan this QR code to view this live inspection report.
            </p>

            {/* QR Code image */}
            <div style={{
              background: '#FAF7F2',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid #D97706',
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              <img
                src={qr_code_base64}
                alt="Inspection Report QR Code"
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', wordBreak: 'break-all' }}>
              <strong>LAN URL:</strong> <a href={report_url} target="_blank" rel="noreferrer" style={{ color: 'var(--kanda-crimson)' }}>{report_url}</a>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn-mandi-primary"
                onClick={handleCopyReportLink}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                className="btn-mandi-secondary"
                onClick={() => setShowQrModal(false)}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
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
