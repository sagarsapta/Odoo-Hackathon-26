import React, { useState, useMemo } from 'react';

export function DataTable({ columns, data = [], renderRow, emptyMessage = 'No records found.', pageSize = 10 }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, validPage, pageSize]);

  return (
    <div className="table-custom-wrapper shadow-sm">
      <table className="table-custom">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={col.className || ''}>
                {col.label || col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((item, idx) => renderRow(item, idx))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-5">
                <i className="fa-solid fa-folder-open fs-2 d-block mb-2 opacity-50"></i>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {data.length > pageSize && (
        <div className="d-flex justify-content-between align-items-center px-3 py-2.5 border-top bg-body-tertiary">
          <small className="text-muted">
            Showing {(validPage - 1) * pageSize + 1} to {Math.min(validPage * pageSize, data.length)} of {data.length} entries
          </small>
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-secondary-custom btn-sm px-2.5"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <i className="fa-solid fa-chevron-left me-1"></i> Prev
            </button>
            <span className="btn btn-secondary-custom btn-sm disabled px-3">
              {validPage} / {totalPages}
            </span>
            <button
              className="btn btn-secondary-custom btn-sm px-2.5"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <i className="fa-solid fa-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
