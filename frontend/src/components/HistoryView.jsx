import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, IndianRupee, ArrowRight, RefreshCw, Layers } from 'lucide-react';

export default function HistoryView({ onSelectBatch, apiBaseUrl, onBack }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBatches = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBaseUrl}/batches?limit=25`);
      if (!res.ok) throw new Error('Failed to load batch records');
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve historical batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const getGradeClass = (grade) => {
    switch (grade?.toLowerCase()) {
      case 'extra': return 'extra';
      case 'standard': return 'standard';
      case 'commercial': return 'commercial';
      default: return 'reject';
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--kanda-maroon)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={26} color="var(--haldi-gold)" />
            <span>Evaluated Batch History</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Historical inspection records stored locally in SQLite database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchBatches}
            className="btn-mandi-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onBack}
            className="btn-mandi-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <span>Back to Scanner</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="kanda-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading local database records...</p>
        </div>
      ) : error ? (
        <div className="kanda-card" style={{ textAlign: 'center', padding: '2rem', color: '#DC2626' }}>
          <p>{error}</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="kanda-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No batch inspections recorded yet.</p>
          <button
            onClick={onBack}
            className="btn-mandi-primary"
            style={{ marginTop: '1rem' }}
          >
            Run First Scan
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {batches.map((b) => (
            <div
              key={b.batch_id}
              className="kanda-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                cursor: 'pointer',
                padding: '1.25rem 1.5rem'
              }}
              onClick={() => onSelectBatch(b.batch_id)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--kanda-maroon)', fontSize: '1.05rem' }}>
                    Batch #{b.batch_id.slice(-6)}
                  </span>
                  <span className={`mandi-seal ${getGradeClass(b.grade)}`} style={{ padding: '0.2rem 0.65rem', fontSize: '0.72rem' }}>
                    {b.grade}
                  </span>
                  <span className={`priority-tag ${b.sell_priority === 'Hold' ? 'hold' : b.sell_priority === 'Sell Soon' ? 'sell-soon' : 'sell-first'}`} style={{ padding: '0.2rem 0.65rem', fontSize: '0.72rem' }}>
                    {b.sell_priority}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1.2rem' }}>
                  <span>{new Date(b.timestamp).toLocaleString()}</span>
                  <span>{b.total_onions} Bulbs Evaluated</span>
                  <span>Avg Dia: {b.avg_diameter_mm}mm</span>
                  <span>Uniformity (CV): {b.uniformity_score}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    PRICE
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--kanda-maroon)' }}>
                    ₹{b.recommended_price.toFixed(2)}/kg
                  </div>
                </div>

                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--haldi-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--haldi-gold)'
                }}>
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
