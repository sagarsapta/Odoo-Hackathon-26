import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { PageContainer } from '../components/layout/AppLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { SkeletonCards, SkeletonLoader } from '../components/ui/SkeletonLoader';
import { normalizeAudit } from '../services/normalizers';

export function AuditPage() {
  const { user } = useAuth();
  const userName = user?.fullName || user?.name || 'Auditor';

  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState([]);
  const [assets, setAssets] = useState([]);

  // Active Workspace
  const [activeWorkspaceAudit, setActiveWorkspaceAudit] = useState(null);
  const [checklist, setChecklist] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    auditor: userName,
    date: new Date().toISOString().slice(0, 10)
  });

  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditList, assetList] = await Promise.all([
        dataService.audits.list(),
        dataService.assets.list()
      ]);
      setAudits(Array.isArray(auditList) ? auditList.map(normalizeAudit) : []);
      setAssets(Array.isArray(assetList) ? assetList : []);
    } catch (err) {
      console.warn('Failed to load audits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const completedCount = useMemo(() => {
    return audits.filter((a) => a.status === 'Completed').length;
  }, [audits]);

  const activeCount = useMemo(() => {
    return audits.filter((a) => a.status !== 'Completed').length;
  }, [audits]);

  // Open Workspace
  const handleOpenWorkspace = async (audit) => {
    setActiveWorkspaceAudit(audit);
    if (audit.checklist && audit.checklist.length > 0) {
      setChecklist(audit.checklist);
    } else {
      // Build checklist from assets
      const sampleChecklist = assets.slice(0, 10).map((a) => ({
        id: a.id,
        name: a.name,
        expectedLocation: a.location || 'Office',
        status: 'Pending'
      }));
      setChecklist(sampleChecklist);
    }
  };

  // Toggle item verification status in workspace
  const handleVerifyItem = (index, status) => {
    const updated = [...checklist];
    updated[index] = { ...updated[index], status };
    setChecklist(updated);
  };

  // Calculate live workspace progress
  const workspaceProgress = useMemo(() => {
    if (!checklist.length) return 0;
    const verified = checklist.filter((i) => i.status && i.status !== 'Pending').length;
    return Math.round((verified / checklist.length) * 100);
  }, [checklist]);

  // Save workspace state
  const handleSaveWorkspace = async () => {
    if (!activeWorkspaceAudit) return;
    setBusy(true);
    try {
      await dataService.audits.saveState(activeWorkspaceAudit.id, checklist);
      await dataService.audits.updateProgress(activeWorkspaceAudit.id, workspaceProgress);
      Swal.fire('Progress Saved', `Audit progress updated to ${workspaceProgress}%.`, 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Schedule Audit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return Swal.fire('Error', 'Please provide an audit campaign name.', 'warning');

    setBusy(true);
    try {
      await dataService.audits.create(form);
      Swal.fire('Audit Scheduled', 'New campaign initiated.', 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { label: 'Audit ID' },
    { label: 'Campaign Name' },
    { label: 'Audit Date' },
    { label: 'Assigned Auditor' },
    { label: 'Progress' },
    { label: 'Status' },
    { label: 'Actions' }
  ];

  return (
    <PageContainer
      title="Compliance Auditing"
      subtitle="Schedule physical checks and software compliance license counts"
      actions={
        <button className="btn btn-primary-custom text-white" onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-plus me-2"></i>Schedule Audit
        </button>
      }
    >
      {/* KPI Cards matching original audit.html */}
      {loading ? (
        <SkeletonCards count={3} />
      ) : (
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card-custom mb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-7 fw-semibold text-uppercase">Audits Completed</span>
                  <h3 className="fw-bold my-1 text-success">{completedCount}</h3>
                  <small className="text-muted">Total verified campaigns</small>
                </div>
                <div className="stat-icon bg-success-subtle text-success">
                  <i className="fa-solid fa-clipboard-check"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom mb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-7 fw-semibold text-uppercase">Active Campaigns</span>
                  <h3 className="fw-bold my-1 text-warning">{activeCount}</h3>
                  <small className="text-muted">Currently undergoing checks</small>
                </div>
                <div className="stat-icon bg-warning-subtle text-warning">
                  <i className="fa-solid fa-arrows-spin"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom mb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-7 fw-semibold text-uppercase">Compliance Score</span>
                  <h3 className="fw-bold my-1 text-primary">96.8%</h3>
                  <small className="text-muted">High enterprise rating</small>
                </div>
                <div className="stat-icon bg-primary-subtle text-primary">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conditional View: Audits List vs Active Audit Workspace Panel */}
      {!activeWorkspaceAudit ? (
        <div className="card-custom mb-0">
          <h5 className="fw-bold mb-3 d-flex align-items-center">
            <i className="fa-solid fa-clipboard-list me-2 text-primary"></i>Audit Verification Campaigns
          </h5>
          {loading ? (
            <SkeletonLoader count={5} height={40} />
          ) : (
            <DataTable
              columns={columns}
              data={audits}
              pageSize={8}
              emptyMessage="No audit campaigns scheduled."
              renderRow={(item) => (
                <tr key={item.id}>
                  <td><strong className="text-primary">{item.id}</strong></td>
                  <td><strong>{item.name}</strong></td>
                  <td className="small">{item.date}</td>
                  <td>{item.auditor}</td>
                  <td style={{ width: 180 }}>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: 8 }}>
                        <div
                          className="progress-bar bg-primary"
                          role="progressbar"
                          style={{ width: `${item.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="small fw-semibold">{item.progress || 0}%</span>
                    </div>
                  </td>
                  <td><StatusBadge value={item.status} /></td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary-custom text-white px-2.5 py-1 fs-8"
                      onClick={() => handleOpenWorkspace(item)}
                    >
                      <i className="fa-solid fa-play me-1"></i>Open Workspace
                    </button>
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      ) : (
        /* Audit Workspace Panel (Screen 8 from original Mockup) */
        <div className="card-custom mb-0 p-4">
          <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>
                {activeWorkspaceAudit.name}
              </h4>
              <p className="text-muted mb-0 small">
                <i className="fa-solid fa-user-shield me-2 text-primary"></i>
                Auditor: {activeWorkspaceAudit.auditor} • Date: {activeWorkspaceAudit.date}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-secondary-custom btn-sm"
                onClick={() => setActiveWorkspaceAudit(null)}
              >
                <i className="fa-solid fa-arrow-left me-1"></i>Back to Campaigns
              </button>
              <button
                className="btn btn-primary-custom btn-sm text-white"
                onClick={handleSaveWorkspace}
                disabled={busy}
              >
                <i className="fa-solid fa-floppy-disk me-1"></i>Save Progress
              </button>
            </div>
          </div>

          {/* Progress Banner */}
          <div className="p-3 mb-4 rounded-3 border bg-body-tertiary">
            <div className="d-flex justify-content-between align-items-center mb-1.5">
              <span className="fw-bold fs-7">Campaign Verification Progress</span>
              <span className="badge bg-primary fs-7">{workspaceProgress}% Completed</span>
            </div>
            <div className="progress" style={{ height: 10 }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${workspaceProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Verification Table */}
          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Asset Item</th>
                  <th>Expected Location</th>
                  <th className="text-center" style={{ width: 280 }}>Verification Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {checklist.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <code className="d-block text-muted">{item.id}</code>
                    </td>
                    <td>{item.expectedLocation}</td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className={`btn ${item.status === 'Found' ? 'btn-success text-white' : 'btn-outline-success'}`}
                          onClick={() => handleVerifyItem(index, 'Found')}
                          title="Mark Verified & Present"
                        >
                          <i className="fa-solid fa-check me-1"></i>Found
                        </button>
                        <button
                          type="button"
                          className={`btn ${item.status === 'Missing' ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                          onClick={() => handleVerifyItem(index, 'Missing')}
                          title="Mark Missing"
                        >
                          <i className="fa-solid fa-xmark me-1"></i>Missing
                        </button>
                        <button
                          type="button"
                          className={`btn ${item.status === 'Damaged' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                          onClick={() => handleVerifyItem(index, 'Damaged')}
                          title="Mark Damaged"
                        >
                          <i className="fa-solid fa-triangle-exclamation me-1"></i>Damaged
                        </button>
                      </div>
                    </td>
                    <td>
                      <StatusBadge value={item.status || 'Pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Audit Modal */}
      {showModal && (
        <Modal title="Schedule Verification Campaign" size="modal-md" onClose={() => setShowModal(false)}>
          <form onSubmit={handleScheduleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label-custom">Campaign Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="e.g. Q4 Hardware & Network Security Audit"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Assigned Auditor <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={form.auditor}
                  onChange={(e) => setForm({ ...form, auditor: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Audit Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className="form-control form-control-custom"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-secondary-custom" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-custom text-white" disabled={busy}>
                {busy ? 'Scheduling...' : 'Schedule Campaign'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
