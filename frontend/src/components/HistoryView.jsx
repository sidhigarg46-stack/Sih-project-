import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, ArrowRight, RefreshCw, ShieldCheck, CalendarDays } from 'lucide-react';
import logoImg from '../assets/logo.jpeg';

export default function HistoryView({ onSelectBatch, apiBaseUrl, onBack }) {
  const [batches, setBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All grades');
  const [priorityFilter, setPriorityFilter] = useState('All actions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBatches = useCallback(async () => {
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
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

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
    <div className="page-container history-page-container">
      <div className="history-header-bar">
        <div className="history-title-group">
          <div className="history-logo-badge">
            <img src={logoImg} alt="OnionIQ" className="history-logo-img" />
            <span className="history-sub-tag">INSPECTION ARCHIVE</span>
          </div>
          <h1 className="history-title">
            <History size={24} color="var(--haldi-gold)" />
            <span>Batch Records / इतिहास</span>
          </h1>
          <p className="history-description">
            Browse verified Digital Quality Passports and audit history.
          </p>
        </div>

        <div className="history-actions-group">
          <button
            onClick={fetchBatches}
            className="btn-mandi-secondary"
            type="button"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onBack}
            className="btn-mandi-primary"
            type="button"
          >
            <span>Back to Scanner</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="kanda-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="analysis-spinner" style={{ margin: '0 auto 1rem' }} />
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
            type="button"
          >
            Run First Scan / पहला स्कैन करें
          </button>
        </div>
      ) : (
        <>
          <div className="history-toolbar" aria-label="Filter quality passports">
            <label className="history-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by batch ID (उदा. 8b19a...)"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search by batch ID"
              />
            </label>

            <div className="history-filters-row">
              <select
                className="history-filter"
                value={gradeFilter}
                onChange={(event) => setGradeFilter(event.target.value)}
                aria-label="Filter by grade"
              >
                <option>All grades</option>
                <option>Extra</option>
                <option>Standard</option>
                <option>Commercial</option>
                <option>Reject</option>
              </select>

              <select
                className="history-filter"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                aria-label="Filter by storage or sale action"
              >
                <option>All actions</option>
                <option>Hold</option>
                <option>Sell Soon</option>
                <option>Sell First</option>
              </select>
            </div>
          </div>

          {filteredBatches.length === 0 ? (
            <div className="kanda-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No passports match these filters.</p>
            </div>
          ) : (
            <div className="history-list">
              {filteredBatches.map((b) => (
                <article
                  key={b.batch_id}
                  className="history-item"
                  onClick={() => onSelectBatch(b.batch_id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View passport for batch ${b.batch_id}`}
                >
                  <div className="history-item-main">
                    <div className="history-card-heading">
                      <ShieldCheck size={17} aria-hidden="true" />
                      <span className="history-batch-id">{b.batch_id}</span>
                      <span className={`mandi-seal ${getGradeClass(b.grade)}`}>{b.grade}</span>
                      <span className={`priority-tag ${getPriorityClass(b.sell_priority)}`}>{b.sell_priority}</span>
                    </div>

                    <div className="history-date">
                      <CalendarDays size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {new Date(b.timestamp).toLocaleString()}
                    </div>

                    <div className="history-meta">
                      <span><strong>{b.total_onions}</strong> bulbs</span>
                      <span>Avg <strong>{Number(b.avg_diameter_mm).toFixed(1)} mm</strong></span>
                      <span>Uniformity <strong>{Number(b.uniformity_score).toFixed(1)}%</strong></span>
                    </div>
                  </div>

                  <div className="history-price-col">
                    <div className="history-price">
                      <span>Passport Rate</span>
                      <div className="price-val">
                        ₹{Number(b.recommended_price).toFixed(2)}
                        <small>/kg</small>
                      </div>
                    </div>

                    <button
                      className="history-view-button"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBatch(b.batch_id);
                      }}
                      aria-label={`View passport for ${b.batch_id}`}
                    >
                      <span>View</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
