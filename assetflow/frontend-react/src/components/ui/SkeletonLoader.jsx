import React from 'react';

export function SkeletonLoader({ count = 3, height = 50 }) {
  return (
    <div className="d-flex flex-column gap-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: `${height}px`, width: '100%' }}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="row g-4 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-xl-3 col-md-6">
          <div className="card-custom mb-0 p-4">
            <div className="skeleton skeleton-title mb-2" style={{ width: '40%' }}></div>
            <div className="skeleton skeleton-title mb-2" style={{ width: '70%', height: '2rem' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}
