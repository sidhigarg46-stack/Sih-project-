import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  IndianRupee,
  PackageCheck,
  CalendarDays,
  Ruler,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Printer
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function DigitalQualityPassport({ data, onBack }) {
  const [copied, setCopied] = useState(false);
  const { batch, priority_breakdown, price_breakdown } = data;
  const risk = Number(priority_breakdown?.composite_risk_score || 0);
  const grade = batch.grade || '—';
  const priority = batch.sell_priority || '—';

  const priorityText = priority === 'Hold'
    ? 'Dormancy intact. Suitable for warehouse holding under monitored ventilated storage.'
    : priority === 'Sell Soon'
      ? 'Early dormancy breakdown. Prioritize sale soon to avoid storage degradation.'
      : 'Active degradation detected. Immediate auction / dispatch recommended.';

  const defectRows = [
    ['Rot / सड़न', batch.rot_pct, '%'],
    ['Sprouting / अंकुरण', batch.sprout_pct, '%'],
    ['Mechanical damage / क्षति', batch.damage_pct, '%'],
  ];

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `OnionIQ Quality Passport - Batch ${batch.batch_id}`,
          text: `Verified Onion Passport for Batch ${batch.batch_id}: Grade ${grade} at ₹${Number(batch.recommended_price).toFixed(2)}/kg (${priority}).`,
          url: url
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="passport-page">
      <div className="passport-shell">
        <div className="passport-top-nav">
          <button className="passport-back" onClick={onBack} type="button">
            <ArrowLeft size={16} />
            <span>Back / मुख्य पृष्ठ</span>
          </button>

          <div className="passport-share-buttons">
            <button className="passport-action-btn" onClick={handleShare} type="button">
              <Share2 size={16} />
              <span>{copied ? 'Link Copied!' : 'Share / साझा करें'}</span>
            </button>
            <button className="passport-action-btn secondary print-hide" onClick={handlePrint} type="button">
              <Printer size={16} />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        <div className="passport-card">
          <div className="passport-top">
            <div className="passport-brand-group">
              <div className="passport-logo-wrap">
                <img src={logoImg} alt="OnionIQ Logo" className="passport-logo-img" />
              </div>
              <div className="passport-label">DIGITAL QUALITY PASSPORT • कांदा गुणवत्ता प्रमाणपत्र</div>
            </div>
            <div className="verified-badge">
              <ShieldCheck size={18} />
              <span>VERIFIED INSPECTION</span>
            </div>
          </div>

          <div className="passport-batch">
            <span>Batch ID</span>
            <strong>{batch.batch_id}</strong>
            <small>
              <CalendarDays size={14} />
              {new Date(batch.timestamp).toLocaleString()}
            </small>
          </div>

          <div className="passport-grade">
            <span>AGMARK QUALITY GRADE</span>
            <strong className={`passport-grade-value ${String(grade).toLowerCase()}`}>
              {grade.toUpperCase()}
            </strong>
            <small>Assigned from physical batch quality measurements & defect screening</small>
          </div>

          <div className="passport-grid">
            <div className="passport-metric primary">
              <span>Recommended mandi rate / मंडी भाव</span>
              <strong>
                <IndianRupee size={22} />
                {Number(batch.recommended_price).toFixed(2)}
                <em>/kg</em>
              </strong>
            </div>

            <div className="passport-metric">
              <span>Quality score / गुणवत्ता स्कोर</span>
              <strong>
                {Math.max(0, Math.min(100, Math.round(100 - Math.min(risk * 2, 70))))}
                <em>/100</em>
              </strong>
            </div>

            <div className="passport-metric">
              <span>Average diameter / औसत व्यास</span>
              <strong>
                {Number(batch.avg_diameter_mm).toFixed(1)}
                <em> mm</em>
              </strong>
            </div>
          </div>

          <div className={`passport-action ${priority.toLowerCase().replace(' ', '-')}`}>
            <div>
              <PackageCheck size={24} />
              <div>
                <span>STORAGE / DISPATCH DECISION</span>
                <strong>{priority.toUpperCase()}</strong>
              </div>
            </div>
            <p>{priorityText}</p>
          </div>

          <section className="passport-section">
            <h2>Condition & defect screening / खराबी विवरण</h2>
            <div className="passport-defects">
              {defectRows.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{Number(value).toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="passport-section">
            <h2>Batch composition / आकार विभाजन</h2>
            <div className="composition-row">
              <div>
                <span>Grade A (&gt;60mm)</span>
                <strong>{Number(batch.grade_a_pct).toFixed(1)}%</strong>
              </div>
              <div>
                <span>Grade B (40-60mm)</span>
                <strong>{Number(batch.grade_b_pct).toFixed(1)}%</strong>
              </div>
              <div>
                <span>Under-sized / URS</span>
                <strong>{Number(batch.urs_pct).toFixed(1)}%</strong>
              </div>
            </div>
          </section>

          <section className="passport-section">
            <h2>Inspection record & consistency</h2>
            <div className="record-grid">
              <span><Ruler size={15} /> {batch.total_onions} onions evaluated</span>
              <span><CheckCircle2 size={15} /> Size CV: {Number(batch.uniformity_score).toFixed(1)}%</span>
              <span><AlertTriangle size={15} /> Composite risk index: {risk.toFixed(1)}/100</span>
            </div>
          </section>

          <div className="passport-price-note">
            <strong>Mandi Valuation Rationale:</strong>
            <span>
              Base rate ₹{Number(price_breakdown.base_market_price_inr).toFixed(2)}/kg
              {' '}+ uniformity adjustment ₹{Number(price_breakdown.uniformity_adjustment_inr).toFixed(2)}
              {' '}− defect deductions (Rot -₹{Number(price_breakdown.rot_penalty_inr).toFixed(2)}, Sprout -₹{Number(price_breakdown.sprout_penalty_inr).toFixed(2)}, Damage -₹{Number(price_breakdown.damage_penalty_inr).toFixed(2)}, URS -₹{Number(price_breakdown.urs_penalty_inr).toFixed(2)}).
            </span>
          </div>

          <footer className="passport-footer">
            OnionIQ • Computer Vision Onion Inspection • Local Offline & Mandi LAN Verified
          </footer>
        </div>
      </div>
    </div>
  );
}