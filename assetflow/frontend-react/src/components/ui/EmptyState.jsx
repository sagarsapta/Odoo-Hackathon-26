import React from 'react';

export function EmptyState({ icon = 'fa-folder-open', title = 'No records found', message = 'Try adjusting your search or filters.', actionLabel, onAction }) {
  return (
    <div className="empty-state py-5 text-center">
      <i className={`fa-solid ${icon} mb-3`} style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
      <h5 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>{title}</h5>
      <p className="text-muted mb-4 small">{message}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary-custom text-white" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
