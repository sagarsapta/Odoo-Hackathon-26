import React, { useEffect } from 'react';

export function Modal({ title, onClose, children, size = 'modal-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop-react" onClick={onClose}>
      <div
        className={`modal-dialog ${size} w-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content shadow-lg"
          style={{
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-color)'
          }}
        >
          <div className="modal-header border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
