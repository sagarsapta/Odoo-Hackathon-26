import React from 'react';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, normalizeAsset } from '../../services/normalizers';
import { can } from '../../utils/rbac';

export function AssetCard({ asset: rawAsset, role, onDetail, onEdit, onReturn }) {
  const asset = normalizeAsset(rawAsset);
  if (!asset) return null;

  // Icon mapping by category
  const getCategoryIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('laptop') || t.includes('computer')) return 'fa-laptop';
    if (t.includes('monitor') || t.includes('display')) return 'fa-desktop';
    if (t.includes('networking') || t.includes('switch') || t.includes('router')) return 'fa-network-wired';
    if (t.includes('printer')) return 'fa-print';
    if (t.includes('projector')) return 'fa-film';
    if (t.includes('tablet')) return 'fa-tablet-screen-button';
    if (t.includes('furniture') || t.includes('chair')) return 'fa-chair';
    if (t.includes('ups') || t.includes('battery')) return 'fa-battery-three-quarters';
    if (t.includes('software') || t.includes('license')) return 'fa-code';
    if (t.includes('accessory') || t.includes('headphone') || t.includes('mouse')) return 'fa-headphones';
    return 'fa-boxes-stacked';
  };

  return (
    <div className="card-custom h-100 mb-0 d-flex flex-column justify-content-between p-3">
      <div>
        {/* Header: Icon, Name & Status with strict flex containment */}
        <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
          <div className="d-flex align-items-center gap-2.5 overflow-hidden" style={{ minWidth: 0, flex: 1 }}>
            <div
              className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 42, height: 42 }}
            >
              <i className={`fa-solid ${getCategoryIcon(asset.type)} fs-5`}></i>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h6
                className="fw-bold mb-1 text-truncate"
                title={asset.name}
                style={{ color: 'var(--text-color)', fontSize: '0.95rem', lineHeight: 1.2 }}
              >
                {asset.name}
              </h6>
              <div className="d-flex align-items-center gap-1 flex-wrap">
                <span
                  className="badge bg-body-tertiary text-primary border text-truncate"
                  style={{ maxWidth: 130 }}
                  title={asset.id}
                >
                  {asset.id}
                </span>
                <span className="badge bg-body-tertiary text-muted border">
                  {asset.type}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge value={asset.status} />
          </div>
        </div>

        {/* Key Asset Fields Table Container */}
        <div className="border rounded-3 p-2.5 bg-body-tertiary mb-3">
          <div className="row g-1.5 small">
            <div className="col-5 text-muted">Serial No:</div>
            <div className="col-7 text-end fw-semibold overflow-hidden">
              <code className="text-primary text-truncate d-block ms-auto" style={{ maxWidth: 150 }} title={asset.serial}>
                {asset.serial}
              </code>
            </div>

            <div className="col-5 text-muted">Value:</div>
            <div className="col-7 text-end fw-bold text-success text-truncate">
              {formatCurrency(asset.value)}
            </div>

            <div className="col-5 text-muted">Department:</div>
            <div className="col-7 text-end fw-semibold text-truncate" title={asset.department}>
              {asset.department}
            </div>

            <div className="col-5 text-muted">Location:</div>
            <div className="col-7 text-end fw-semibold text-truncate" title={asset.location}>
              {asset.location}
            </div>

            <div className="col-5 text-muted">Custodian:</div>
            <div className="col-7 text-end fw-semibold text-truncate" title={asset.owner}>
              {asset.owner}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="d-flex justify-content-end align-items-center gap-2 pt-2 border-top">
        <button
          className="btn btn-sm btn-secondary-custom d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
          onClick={() => onDetail && onDetail(asset)}
          title="View Details"
        >
          <i className="fa-solid fa-eye text-primary"></i>
          <span>View</span>
        </button>

        {can(role, 'register_asset') && (
          <button
            className="btn btn-sm btn-secondary-custom d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
            onClick={() => onEdit && onEdit(asset)}
            title="Edit Asset"
          >
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Edit</span>
          </button>
        )}

        {asset.owner && asset.owner !== 'Not assigned' && (
          <button
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
            onClick={() => onReturn && onReturn(asset)}
            title="Return to Stock"
          >
            <i className="fa-solid fa-arrow-rotate-left"></i>
            <span>Return</span>
          </button>
        )}
      </div>
    </div>
  );
}
