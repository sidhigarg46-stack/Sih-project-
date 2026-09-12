import React from 'react';
import { X, ShieldCheck, Scale, CheckCircle2 } from 'lucide-react';

export default function AgmarkModal({ onClose }) {
  return (
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
      <div className="kanda-card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={22} color="var(--haldi-gold)" />
            <h2 style={{ fontSize: '1.35rem', color: 'var(--kanda-maroon)' }}>
              AGMARK-Aligned Onion Grading
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={22} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
         These are configurable, AGMARK-aligned prototype grading rules based on onion quality and size standards. Thresholds are intended for demonstration and calibration and should be validated against the applicable official standard.
        </p>

        {/* Size Classification */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--kanda-maroon)', marginBottom: '0.4rem' }}>
            1. Size Classification (Diameter in mm)
          </h3>
          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Grade Size</th>
                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Diameter Bracket</th>
                <th style={{ padding: '0.4rem', textAlign: 'left' }}>Market Utility</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.4rem', fontWeight: 600 }}>Grade A (Large)</td>
                <td style={{ padding: '0.4rem' }}>&gt; 60 mm</td>
                <td style={{ padding: '0.4rem' }}>Export & Hotel / Restaurant demand</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.4rem', fontWeight: 600 }}>Grade B (Medium)</td>
                <td style={{ padding: '0.4rem' }}>40 mm – 60 mm</td>
                <td style={{ padding: '0.4rem' }}>Household retail standard</td>
              </tr>
              <tr>
                <td style={{ padding: '0.4rem', fontWeight: 600 }}>URS (Under-sized)</td>
                <td style={{ padding: '0.4rem' }}>&lt; 40 mm</td>
                <td style={{ padding: '0.4rem' }}>Dehydration, processing or discount</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quality Classes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--kanda-maroon)', marginBottom: '0.4rem' }}>
            2. Configured Quality Tier Specifications
          </h3>
          <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', listStyle: 'none', spaceY: '0.5rem' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Extra Class:</strong> Superior quality; characteristic bulb shape and color; 0% rot, 0% sprout, max 3% minor surface cuts, min 50% Grade A size, min 0.85 circularity.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Standard Class:</strong> Good marketable commercial quality; max 2% rot, max 3% sprout, max 8% mechanical cuts, min 0.75 circularity.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Commercial Class:</strong> Acceptable mandi quality; max 5% rot, max 8% sprout, max 15% mechanical cuts.
            </li>
            <li>
              <strong>Reject:</strong> Lots with defects exceeding 5% rot or 8% sprout; unfit for standard commercial storage.
            </li>
          </ul>
        </div>

        {/* Sell Priority Formula */}
        <div style={{ background: '#FFFDF9', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--haldi-gold)', marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--kanda-maroon)', marginBottom: '0.3rem' }}>
            3. Sell-Priority Risk Formula
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <code>Risk Score = (0.50 × Rot%) + (0.35 × Sprout%) + (0.15 × Damage%)</code>
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            • <strong>Sell First:</strong> Risk &gt;= 10.0 or Rot &gt;= 3.0% (immediate fungal spread danger)<br/>
            • <strong>Sell Soon:</strong> Risk &gt;= 4.5 or Sprout &gt;= 5.0% (internal sprouting underway)<br/>
            • <strong>Hold:</strong> Risk &lt; 4.5 (sound dormancy; safe for warehouse holding)
          </p>
        </div>

        <button
          className="btn-mandi-primary"
          onClick={onClose}
          style={{ width: '100%', padding: '0.75rem' }}
        >
          Close Specifications
          <p style={{
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginTop: '0.75rem',
  textAlign: 'center'
}}>
  Reference: Directorate of Marketing & Inspection (DMI), AGMARK — Official Onion Commodity Profile
</p>
           
        </button>
      </div>
    </div>
  );
}
