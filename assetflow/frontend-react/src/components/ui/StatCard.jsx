import React from 'react';

export function StatCard({ label, value, desc, icon, bg = 'bg-primary-subtle text-primary', onClick }) {
  const isDanger = (desc || '').toLowerCase().includes('overdue') || bg.includes('danger');
  const toneClass = isDanger ? 'text-danger' : 'text-success';

  return (
    <div className={`card-custom mb-0 h-100 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="stat-card">
        <div>
          <span className="text-muted fs-7 fw-semibold text-uppercase">{label}</span>
          <h3 className="fw-bold my-1" style={{ color: 'var(--text-color)' }}>
            {value}
          </h3>
          {desc && <span className={`small fw-medium ${toneClass}`}>{desc}</span>}
        </div>
        <div className={`stat-icon ${bg}`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
      </div>
    </div>
  );
}
