import React from 'react';
import { ShieldCheck, CheckCircle2, IndianRupee, PackageCheck, CalendarDays, Ruler, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function DigitalQualityPassport({ data, onBack }) {
  const { batch, priority_breakdown, price_breakdown } = data;
  const risk = Number(priority_breakdown?.composite_risk_score || 0);
  const grade = batch.grade || '—';
  const priority = batch.sell_priority || '—';

  const priorityText = priority === 'Hold'
    ? 'Suitable for warehouse holding under appropriate storage conditions.'
    : priority === 'Sell Soon'
      ? 'Prioritize sale soon because quality-risk indicators are rising.'
      : 'Prioritize this batch for sale because quality-risk indicators are high.';

  const defectRows = [
    ['Rot', batch.rot_pct, '%'],
    ['Sprouting', batch.sprout_pct, '%'],
    ['Mechanical damage', batch.damage_pct, '%'],
  ];

  return (
    <div className="passport-page">
      <div className="passport-shell">
        <button className="passport-back" onClick={onBack}><ArrowLeft size={16}/> Back to KandaGuru</button>

        <div className="passport-card">
          <div className="passport-top">
            <div>
              <div className="passport-brand">🧅 KandaGuru</div>
              <div className="passport-label">DIGITAL QUALITY PASSPORT</div>
            </div>
            <div className="verified-badge"><ShieldCheck size={18}/> VERIFIED INSPECTION</div>
          </div>

          <div className="passport-batch">
            <span>Batch ID</span><strong>{batch.batch_id}</strong>
            <small><CalendarDays size={14}/> {new Date(batch.timestamp).toLocaleString()}</small>
          </div>

          <div className="passport-grade">
            <span>AGMARK GRADE</span>
            <strong className={`passport-grade-value ${String(grade).toLowerCase()}`}>{grade.toUpperCase()}</strong>
            <small>Assigned from measured batch quality indicators</small>
          </div>

          <div className="passport-grid">
            <div className="passport-metric primary"><span>Recommended mandi value</span><strong><IndianRupee size={21}/>{Number(batch.recommended_price).toFixed(2)}<em>/kg</em></strong></div>
            <div className="passport-metric"><span>Inspection quality</span><strong>{Math.max(0, Math.min(100, Math.round(100 - Math.min(risk * 2, 70))))}<em>/100</em></strong></div>
            <div className="passport-metric"><span>Average diameter</span><strong>{Number(batch.avg_diameter_mm).toFixed(1)}<em> mm</em></strong></div>
          </div>

          <div className={`passport-action ${priority.toLowerCase().replace(' ', '-')}`}>
            <div><PackageCheck size={22}/><div><span>STORAGE / SELL DECISION</span><strong>{priority.toUpperCase()}</strong></div></div>
            <p>{priorityText}</p>
          </div>

          <section className="passport-section">
            <h2>Quality indicators</h2>
            <div className="passport-defects">
              {defectRows.map(([label, value]) => (
                <div key={label}><span>{label}</span><strong>{Number(value).toFixed(1)}%</strong></div>
              ))}
            </div>
          </section>

          <section className="passport-section">
            <h2>Batch composition</h2>
            <div className="composition-row">
              <div><span>Grade A</span><strong>{Number(batch.grade_a_pct).toFixed(1)}%</strong></div>
              <div><span>Grade B</span><strong>{Number(batch.grade_b_pct).toFixed(1)}%</strong></div>
              <div><span>URS</span><strong>{Number(batch.urs_pct).toFixed(1)}%</strong></div>
            </div>
          </section>

          <section className="passport-section">
            <h2>Inspection record</h2>
            <div className="record-grid">
              <span><Ruler size={15}/> {batch.total_onions} onions evaluated</span>
              <span><CheckCircle2 size={15}/> Size CV: {Number(batch.uniformity_score).toFixed(1)}%</span>
              <span><AlertTriangle size={15}/> Risk index: {risk.toFixed(1)}/100</span>
            </div>
          </section>

          <div className="passport-price-note">
            <strong>Why this price?</strong>
            <span>Base ₹{Number(price_breakdown.base_market_price_inr).toFixed(2)}/kg + uniformity adjustment ₹{Number(price_breakdown.uniformity_adjustment_inr).toFixed(2)} − defect/URS adjustments.</span>
          </div>

          <footer className="passport-footer">KandaGuru • Computer Vision Onion Inspection • Local / LAN deployment</footer>
        </div>
      </div>
    </div>
  );
}