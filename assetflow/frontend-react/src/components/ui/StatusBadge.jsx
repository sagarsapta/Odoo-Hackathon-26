import React from 'react';

export function StatusBadge({ value }) {
  const normalized = (value || '').toLowerCase().trim();

  let badgeClass = 'bg-secondary-subtle text-secondary';

  if (
    normalized === 'active' ||
    normalized === 'approved' ||
    normalized === 'confirmed' ||
    normalized === 'completed' ||
    normalized === 'resolved' ||
    normalized === 'found' ||
    normalized === 'available' ||
    normalized === 'assigned'
  ) {
    badgeClass = 'bg-success-subtle text-success';
  } else if (
    normalized.includes('pending') ||
    normalized === 'in progress' ||
    normalized === 'maintenance' ||
    normalized === 'transfer requested' ||
    normalized === 'scheduled'
  ) {
    badgeClass = 'bg-warning-subtle text-warning';
  } else if (
    normalized === 'rejected' ||
    normalized === 'cancelled' ||
    normalized === 'disposed' ||
    normalized === 'missing' ||
    normalized === 'damaged' ||
    normalized === 'overdue' ||
    normalized === 'retired'
  ) {
    badgeClass = 'bg-danger-subtle text-danger';
  } else if (normalized === 'returned') {
    badgeClass = 'bg-info-subtle text-info';
  }

  return (
    <span className={`badge ${badgeClass} rounded-pill px-2.5 py-1 fw-semibold`}>
      {value || 'Unknown'}
    </span>
  );
}

