import React from 'react';
import { X } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function AgmarkModal({ onClose }) {
  return (
    <div
      className="agmark-modal-overlay"
      onClick={onClose}
    >
      <div
        className="agmark-modal-card bottom-sheet-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-drag-handle" />

        <div className="sheet-header">
          <div className="sheet-header-brand">
            <img src={logoImg} alt="OnionIQ Logo" className="modal-logo-img" />
            <div>
              <h2>AGMARK Onion Grading Rules</h2>
              <span className="sheet-sub">कांदा गुणवत्ता व प्रतवारी निकष</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close specifications"
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <p className="modal-intro">
          Official prototype grading rules aligned with AGMARK / Directorate of Marketing & Inspection (DMI) standards for round onions.
        </p>

        <div className="modal-section">
          <h3>
            1. Size Classification (Diameter in mm)
          </h3>
          <div className="specs-table-wrapper">
            <table className="specs-table">
              <thead>
                <tr>
                  <th>Grade Size</th>
                  <th>Diameter</th>
                  <th>Utility & Demand</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Grade A (Large)</strong></td>
                  <td>&gt; 60 mm</td>
                  <td>Export, Hotels, Premium retail</td>
                </tr>
                <tr>
                  <td><strong>Grade B (Medium)</strong></td>
                  <td>40 mm – 60 mm</td>
                  <td>Household standard daily cooking</td>
                </tr>
                <tr>
                  <td><strong>URS (Under-sized)</strong></td>
                  <td>&lt; 40 mm</td>
                  <td>Dehydration, paste, processing discount</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-section">
          <h3>
            2. Configured Quality Tier Specifications
          </h3>
          <ul className="tier-list">
            <li>
              <span className="tier-badge extra">Extra Class</span>
              <p>Superior quality; characteristic bulb shape and color; 0% rot, 0% sprout, max 3% minor surface cuts, min 50% Grade A size, min 0.85 circularity.</p>
            </li>
            <li>
              <span className="tier-badge standard">Standard Class</span>
              <p>Good marketable commercial quality; max 2% rot, max 3% sprout, max 8% mechanical cuts, min 0.75 circularity.</p>
            </li>
            <li>
              <span className="tier-badge commercial">Commercial Class</span>
              <p>Acceptable mandi quality; max 5% rot, max 8% sprout, max 15% mechanical cuts.</p>
            </li>
            <li>
              <span className="tier-badge reject">Reject</span>
              <p>Lots with defects exceeding 5% rot or 8% sprout; unfit for commercial storage.</p>
            </li>
          </ul>
        </div>

        <div className="modal-section formula-section">
          <h4>
            3. Sell-Priority Risk Index Formula
          </h4>
          <p className="formula-code">
            <code>Risk Score = (0.50 × Rot%) + (0.35 × Sprout%) + (0.15 × Damage%)</code>
          </p>
          <div className="priority-rules-grid">
            <div>
              <strong>Sell First (तुरंत बेचें):</strong>
              <span>Risk &ge; 10.0 or Rot &ge; 3.0% (immediate fungal decay risk)</span>
            </div>
            <div>
              <strong>Sell Soon (शीघ्र बेचें):</strong>
              <span>Risk &ge; 4.5 or Sprout &ge; 5.0% (internal sprouting underway)</span>
            </div>
            <div>
              <strong>Hold (भंडारण सुरक्षित):</strong>
              <span>Risk &lt; 4.5 (sound dormancy; safe for warehouse holding)</span>
            </div>
          </div>
        </div>

        <button
          className="btn-mandi-primary modal-close-action"
          onClick={onClose}
          type="button"
        >
          Close Specifications / बंद करें
        </button>

        <p className="modal-footer-cite">
          Reference: Directorate of Marketing & Inspection (DMI), AGMARK — Official Onion Commodity Profile
        </p>
      </div>
    </div>
  );
}
