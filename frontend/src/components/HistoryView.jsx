import React, { useState, useEffect } from 'react';
import { History, Search, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

export default function HistoryView({ onSelectBatch, apiBaseUrl, onBack }) {
  const [batches, setBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All grades');
  const [priorityFilter, setPriorityFilter] = useState('All actions');
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

  const getPriorityClass = (priority) => {
    if (priority === 'Hold') return 'hold';
    if (priority === 'Sell Soon') return 'sell-soon';
    return 'sell-first';
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = batch.batch_id.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesGrade = gradeFilter === 'All grades' || batch.grade === gradeFilter;
    const matchesPriority = priorityFilter === 'All actions' || batch.sell_priority === priorityFilter;
    return matchesSearch && matchesGrade && matchesPriority;
  });

  return (
    <div style={{ maxWidth: '1080px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--kanda-maroon)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={26} color="var(--haldi-gold)" />
            <span>Evaluated Batch History</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Browse verified Digital Quality Passports for every inspected batch.
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
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No quality passports issued yet.</p>
          <button
            onClick={onBack}
            className="btn-mandi-primary"
            style={{ marginTop: '1rem' }}
          >
            Run First Scan
          </button>
        </div>
      ) : (
        <>
          <div className="history-toolbar" aria-label="Filter quality passports">
            <label className="history-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by batch ID"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search by batch ID"
              />
            </label>
            <select className="history-filter" value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} aria-label="Filter by grade">
              <option>All grades</option>
              <option>Extra</option>
              <option>Standard</option>
              <option>Commercial</option>
              <option>Reject</option>
            </select>
            <select className="history-filter" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} aria-label="Filter by storage or sale action">
              <option>All actions</option>
              <option>Hold</option>
              <option>Sell Soon</option>
              <option>Sell First</option>
            </select>
          </div>

          {filteredBatches.length === 0 ? (
            <div className="kanda-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No passports match these filters.</p>
            </div>
          ) : (
            <div className="history-list">
              {filteredBatches.map((b) => (
                <article key={b.batch_id} className="history-item">
                  <div>
                    <div className="history-card-heading">
                      <ShieldCheck size={17} aria-hidden="true" />
                      <span className="history-batch-id">{b.batch_id}</span>
                      <span className={`mandi-seal ${getGradeClass(b.grade)}`}>{b.grade}</span>
                      <span className={`priority-tag ${getPriorityClass(b.sell_priority)}`}>{b.sell_priority}</span>
                    </div>
                    <div className="history-date">Issued {new Date(b.timestamp).toLocaleString()}</div>
                    <div className="history-meta">
                      <span>{b.total_onions} onions evaluated</span>
                      <span>Average diameter {Number(b.avg_diameter_mm).toFixed(1)} mm</span>
                      <span>Size CV {Number(b.uniformity_score).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="history-price">
                    <span>Passport value</span>
                    ₹{Number(b.recommended_price).toFixed(2)}<small>/kg</small>
                  </div>
                  <button className="history-view-button" type="button" onClick={() => onSelectBatch(b.batch_id)} aria-label={`View passport for ${b.batch_id}`}>
                    <span>View passport</span>
                    <ArrowRight size={17} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
