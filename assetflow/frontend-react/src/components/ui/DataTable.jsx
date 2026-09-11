import React, { useState } from 'react';

export function DataTable({
  columns = [],
  data = [],
  rows = null,
  pageSize = 10,
  emptyMessage = 'No records found.',
  empty = null,
  renderRow
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const fallbackEmptyText = empty || emptyMessage;
  const colCount = columns.length || 1;

  // Normalize columns input format
  const columnHeaders = columns.map((col) => (typeof col === 'string' ? col : col.label || col.name || ''));

  // If pre-rendered rows array is supplied
  if (rows !== null && rows !== undefined) {
    return (
      <div className="table-custom-wrapper">
        <table className="table-custom">
          <thead>
            <tr>
              {columnHeaders.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(rows) && rows.length > 0 ? (
              rows
            ) : (
              <tr>
                <td colSpan={colCount} className="text-center text-muted py-4">
                  {fallbackEmptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Data array rendering with pagination
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const currentItems = data.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="table-custom-wrapper">
        <table className="table-custom">
          <thead>
            <tr>
              {columnHeaders.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item, idx) => (renderRow ? renderRow(item, startIndex + idx) : null))
            ) : (
              <tr>
                <td colSpan={colCount} className="text-center text-muted py-5">
                  <i className="fa-solid fa-inbox fs-3 d-block mb-2 opacity-50"></i>
                  {fallbackEmptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3 px-2 flex-wrap gap-2">
          <small className="text-muted">
            Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> entries
          </small>
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className="btn btn-secondary-custom"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <i className="fa-solid fa-chevron-left me-1"></i>Previous
            </button>
            <span className="btn btn-secondary-custom disabled fw-semibold px-3">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary-custom"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next<i className="fa-solid fa-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
