import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { can } from '../utils/rbac';
import { PageContainer } from '../components/layout/AppLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { SkeletonCards, SkeletonLoader } from '../components/ui/SkeletonLoader';

export function MaintenancePage() {
  const { user } = useAuth();
  const role = user?.role || 'Employee';
  const userName = user?.fullName || user?.name || 'Staff';

  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState([]);
  const [assets, setAssets] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    assetId: '',
    type: 'Routine Inspection',
    description: '',
    cost: 1500,
    priority: 'Medium',
    date: new Date().toISOString().slice(0, 10)
  });

  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mList, aList] = await Promise.all([
        dataService.maintenance.list(),
        dataService.assets.list()
      ]);
      setMaintenance(mList);
      setAssets(aList);
      if (aList.length > 0 && !form.assetId) {
        setForm((prev) => ({ ...prev, assetId: aList[0].id }));
      }
    } catch (err) {
      console.warn('Failed to load maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary statistics matching original maintenance.html
  const pendingCount = useMemo(() => {
    return maintenance.filter((m) => m.status === 'Pending').length;
  }, [maintenance]);

  const completedCount = useMemo(() => {
    return maintenance.filter((m) => ['Completed', 'Resolved'].includes(m.status)).length;
  }, [maintenance]);

  const totalCost = useMemo(() => {
    return maintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
  }, [maintenance]);

  // Kanban groupings
  const kanbanPending = useMemo(() => maintenance.filter((m) => m.status === 'Pending'), [maintenance]);
  const kanbanProgress = useMemo(() => maintenance.filter((m) => m.status === 'In Progress'), [maintenance]);
  const kanbanResolved = useMemo(() => maintenance.filter((m) => ['Completed', 'Resolved'].includes(m.status)), [maintenance]);

  // Schedule / Report Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === form.assetId);

    setBusy(true);
    try {
      await dataService.maintenance.create({
        ...form,
        assetName: asset?.name || 'Asset',
        technician: userName
      });
      Swal.fire('Scheduled', 'Maintenance ticket registered successfully.', 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Update status (e.g. Move to In Progress or Resolve)
  const handleUpdateStatus = async (item, targetStatus) => {
    if (targetStatus === 'Completed') {
      const { value: cost } = await Swal.fire({
        title: 'Resolve Maintenance',
        text: `Enter final incurred repair cost for ${item.assetName}:`,
        input: 'number',
        inputValue: item.cost || 0,
        showCancelButton: true,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Mark Completed'
      });

      if (cost !== undefined) {
        try {
          await dataService.maintenance.updateStatus(item.id, 'Completed', Number(cost));
          Swal.fire('Resolved', 'Maintenance task completed and asset returned to Active state.', 'success');
          loadData();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    } else {
      try {
        await dataService.maintenance.updateStatus(item.id, targetStatus);
        Swal.fire('Status Updated', `Task moved to ${targetStatus}.`, 'success');
        loadData();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const columns = [
    { label: 'Ticket ID' },
    { label: 'Asset' },
    { label: 'Issue Type' },
    { label: 'Priority' },
    { label: 'Cost (₹)' },
    { label: 'Date' },
    { label: 'Status' },
    { label: 'Action' }
  ];

  const canApprove = can(role, 'approve_maintenance') || role === 'Admin' || role === 'Asset Manager' || role === 'AssetManager';

  return (
    <PageContainer
      title="Maintenance Log"
      subtitle="Track scheduled tune-ups, routine checks, and repairs"
      actions={
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-secondary-custom ${viewMode === 'kanban' ? 'active fw-bold' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <i className="fa-solid fa-columns-gap me-2"></i>Kanban Board
            </button>
            <button
              type="button"
              className={`btn btn-secondary-custom ${viewMode === 'table' ? 'active fw-bold' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <i className="fa-solid fa-list me-2"></i>Table View
            </button>
          </div>
          <button className="btn btn-primary-custom text-white" onClick={() => setShowModal(true)}>
            <i className="fa-solid fa-screwdriver-wrench me-2"></i>
            {role === 'Employee' ? 'Report Issue' : 'Schedule Maintenance'}
          </button>
        </div>
      }
    >
      {/* Maintenance Summary Dashboard Statistics */}
      {loading ? (
        <SkeletonCards count={3} />
      ) : (
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card-custom mb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-7 fw-semibold text-uppercase">Pending Issues</span>
                  <h3 className="fw-bold my-1 text-warning">{pendingCount}</h3>
                  <small className="text-muted">Awaiting technician action</small>
                </div>
                <div className="stat-icon bg-warning-subtle text-warning">
                  <i className="fa-solid fa-clock"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom mb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-7 fw-semibold text-uppercase">Completed Tasks</span>
                  <h3 className="fw-bold my-1 text-success">{completedCount}</h3>
                  <small className="text-muted">Resolved successfully</small>
                </div>
                <div className="stat-icon bg-success-subtle text-success">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom mb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-7 fw-semibold text-uppercase">Total Expenditures</span>
                  <h3 className="fw-bold my-1 text-primary">₹{totalCost.toLocaleString('en-IN')}</h3>
                  <small className="text-muted">Total maintenance expenses</small>
                </div>
                <div className="stat-icon bg-primary-subtle text-primary">
                  <i className="fa-solid fa-money-bill-wave"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main View: Kanban vs Table */}
      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          {/* Column 1: Pending */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span>
                <i className="fa-solid fa-clock text-warning me-2"></i>Pending Requests
              </span>
              <span className="badge bg-warning text-dark rounded-pill">{kanbanPending.length}</span>
            </div>
            <div className="d-flex flex-column flex-grow-1">
              {kanbanPending.map((item) => (
                <div key={item.id} className="kanban-card pending-card">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <strong className="fs-7" style={{ color: 'var(--text-color)' }}>{item.assetName}</strong>
                    <span className="badge bg-warning-subtle text-warning border fs-8">{item.priority || 'Medium'}</span>
                  </div>
                  <small className="text-muted d-block mb-1">{item.id} • {item.type}</small>
                  {item.description && <p className="small text-muted mb-2">{item.description}</p>}
                  <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                    <span className="fw-bold fs-7 text-primary">₹{Number(item.cost || 0).toLocaleString('en-IN')}</span>
                    {canApprove && (
                      <button
                        className="btn btn-sm btn-outline-primary py-0.5 px-2 fs-8"
                        onClick={() => handleUpdateStatus(item, 'In Progress')}
                      >
                        Start Service <i className="fa-solid fa-arrow-right ms-1"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {kanbanPending.length === 0 && (
                <div className="text-center text-muted py-5 my-auto small">No pending tickets</div>
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span>
                <i className="fa-solid fa-arrows-spin text-primary me-2"></i>In Progress / Servicing
              </span>
              <span className="badge bg-primary rounded-pill">{kanbanProgress.length}</span>
            </div>
            <div className="d-flex flex-column flex-grow-1">
              {kanbanProgress.map((item) => (
                <div key={item.id} className="kanban-card progress-card">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <strong className="fs-7" style={{ color: 'var(--text-color)' }}>{item.assetName}</strong>
                    <span className="badge bg-info-subtle text-info border fs-8">{item.priority || 'Medium'}</span>
                  </div>
                  <small className="text-muted d-block mb-1">{item.id} • {item.type}</small>
                  {item.technician && <div className="small text-muted mb-2">Tech: {item.technician}</div>}
                  <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                    <span className="fw-bold fs-7 text-primary">₹{Number(item.cost || 0).toLocaleString('en-IN')}</span>
                    {canApprove && (
                      <button
                        className="btn btn-sm btn-success py-0.5 px-2 fs-8 text-white"
                        onClick={() => handleUpdateStatus(item, 'Completed')}
                      >
                        <i className="fa-solid fa-check me-1"></i>Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {kanbanProgress.length === 0 && (
                <div className="text-center text-muted py-5 my-auto small">No tickets in servicing</div>
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span>
                <i className="fa-solid fa-circle-check text-success me-2"></i>Completed & Resolved
              </span>
              <span className="badge bg-success rounded-pill">{kanbanResolved.length}</span>
            </div>
            <div className="d-flex flex-column flex-grow-1">
              {kanbanResolved.map((item) => (
                <div key={item.id} className="kanban-card resolved-card">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <strong className="fs-7" style={{ color: 'var(--text-color)' }}>{item.assetName}</strong>
                    <span className="badge bg-success-subtle text-success border fs-8">Resolved</span>
                  </div>
                  <small className="text-muted d-block mb-1">{item.id} • {item.date}</small>
                  <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                    <span className="fw-bold fs-7 text-success">Cost: ₹{Number(item.cost || 0).toLocaleString('en-IN')}</span>
                    <i className="fa-solid fa-circle-check text-success"></i>
                  </div>
                </div>
              ))}
              {kanbanResolved.length === 0 && (
                <div className="text-center text-muted py-5 my-auto small">No resolved records</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={maintenance}
          pageSize={10}
          emptyMessage="No maintenance tickets found."
          renderRow={(item) => (
            <tr key={item.id}>
              <td><strong className="text-primary">{item.id}</strong></td>
              <td><strong>{item.assetName}</strong></td>
              <td>{item.type}</td>
              <td><span className="badge bg-secondary-subtle text-secondary">{item.priority || 'Medium'}</span></td>
              <td className="fw-semibold">₹{Number(item.cost || 0).toLocaleString('en-IN')}</td>
              <td className="small">{item.date}</td>
              <td><StatusBadge value={item.status} /></td>
              <td>
                {canApprove && !['Completed', 'Resolved'].includes(item.status) && (
                  <button
                    className="btn btn-sm btn-success px-2 py-1 fs-8 text-white"
                    onClick={() => handleUpdateStatus(item, 'Completed')}
                  >
                    Resolve
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      )}

      {/* Schedule Maintenance Modal */}
      {showModal && (
        <Modal
          title={role === 'Employee' ? 'Report Asset Issue' : 'Schedule Maintenance Service'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label-custom">Select Asset <span className="text-danger">*</span></label>
                <select
                  className="form-select form-control-custom"
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  required
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.name} ({a.location || 'Central Stock'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label-custom">Maintenance / Issue Type <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="e.g. Battery Replacement, Screen Repair"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">Priority</label>
                  <select
                    className="form-select form-control-custom"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label-custom">Estimated Cost (₹ INR)</label>
                  <input
                    type="number"
                    className="form-control form-control-custom"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label-custom">Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control form-control-custom"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Description & Observations</label>
                <textarea
                  className="form-control form-control-custom"
                  rows={3}
                  placeholder="Provide details about the issue or maintenance required..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-secondary-custom" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-custom text-white" disabled={busy}>
                {busy ? 'Saving...' : 'Save Ticket'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
