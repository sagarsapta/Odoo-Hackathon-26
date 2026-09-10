import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { PageContainer } from '../components/layout/AppLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

export function AllocationPage() {
  const { user } = useAuth();
  const role = user?.role || 'Employee';
  const userName = user?.fullName || user?.name || '';
  const userDept = user?.department || 'IT';

  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('dept-queue');

  // Workspace selection & state
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [standardForm, setStandardForm] = useState({
    allocatedTo: '',
    returnDate: '',
    notes: ''
  });
  const [transferForm, setTransferForm] = useState({
    targetDepartment: '',
    reason: ''
  });

  // Modal for new allocation
  const [showNewModal, setShowNewModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    assetId: '',
    allocatedTo: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allocList, assetList, deptList, userList] = await Promise.all([
        dataService.allocations.list(),
        dataService.assets.list(),
        dataService.departments.list(),
        dataService.users.list()
      ]);
      setAllocations(allocList);
      setAssets(assetList);
      setDepartments(deptList);
      setUsers(userList);

      if (assetList.length > 0 && !selectedAssetId) {
        setSelectedAssetId(assetList[0].id);
      }
    } catch (err) {
      console.warn('Failed to load allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Selected asset analysis
  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  const hasConflict = Boolean(selectedAsset && selectedAsset.owner);

  // Allocation history for selected asset
  const assetHistory = useMemo(() => {
    if (!selectedAssetId) return [];
    return allocations.filter((a) => a.assetId === selectedAssetId);
  }, [allocations, selectedAssetId]);

  // Tab filtering
  const deptQueueAllocations = useMemo(() => {
    return allocations.filter((a) => {
      const deptMatch = (a.department || '').toLowerCase().includes(userDept.toLowerCase());
      if (role === 'Admin' || role === 'Asset Manager' || role === 'AssetManager') return true;
      return deptMatch;
    });
  }, [allocations, userDept, role]);

  const myRequestsAllocations = useMemo(() => {
    const userNames = [userName.toLowerCase(), (user?.email || '').toLowerCase()].filter(Boolean);
    return allocations.filter((a) => {
      const target = (a.allocatedTo || '').toLowerCase();
      const requester = (a.requestedBy || a.requestedByEmail || '').toLowerCase();
      return userNames.some((u) => target.includes(u) || requester.includes(u));
    });
  }, [allocations, userName, user]);

  // Standard Allocation Submit
  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!standardForm.allocatedTo) return Swal.fire('Error', 'Please select a recipient.', 'warning');

    setBusy(true);
    try {
      await dataService.allocations.create({
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        allocatedTo: standardForm.allocatedTo,
        date: new Date().toISOString().slice(0, 10),
        department: userDept,
        notes: standardForm.notes
      });
      Swal.fire('Asset Allocated', `${selectedAsset.name} assigned successfully.`, 'success');
      loadAll();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Transfer Submit
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.targetDepartment) return Swal.fire('Error', 'Please select target department.', 'warning');

    setBusy(true);
    try {
      await dataService.allocations.create({
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        allocatedTo: transferForm.targetDepartment,
        department: transferForm.targetDepartment,
        status: 'Pending Transfer Approval',
        notes: `Transfer from ${selectedAsset.department} to ${transferForm.targetDepartment}. Reason: ${transferForm.reason}`
      });
      Swal.fire('Transfer Requested', 'Transfer request dispatched for approval.', 'success');
      loadAll();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Action on Allocation record (Approve / Reject / Return)
  const handleAction = async (id, status, assetId) => {
    const actionText = status === 'Approved' ? 'Approve' : status === 'Rejected' ? 'Reject' : 'Return';
    const confirmColor = status === 'Approved' ? '#10B981' : '#EF4444';

    Swal.fire({
      title: `${actionText} Allocation?`,
      text: `Are you sure you want to mark this request as ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#64748B',
      confirmButtonText: `Yes, ${actionText}`
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dataService.allocations.action(id, status, assetId);
          Swal.fire('Updated', `Allocation record is now ${status}.`, 'success');
          loadAll();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  const columns = [
    { label: 'ID' },
    { label: 'Asset Name' },
    { label: 'Allocated To' },
    { label: 'Date' },
    { label: 'Status' },
    { label: 'Actions' }
  ];

  const canApprove = role === 'Admin' || role === 'Asset Manager' || role === 'AssetManager' || role === 'Department Head' || role === 'DepartmentHead';

  return (
    <PageContainer
      title="Asset Allocations"
      subtitle="Track assignments, loans, and team-to-team asset transfers"
      actions={
        <button className="btn btn-primary-custom text-white" onClick={() => setShowNewModal(true)}>
          <i className="fa-solid fa-plus me-2"></i>New Allocation Request
        </button>
      }
    >
      <div className="row g-4">
        {/* Left: Allocation & Transfer Workspace */}
        <div className="col-lg-5">
          <div className="card-custom h-100 mb-0">
            <h5 className="fw-bold mb-3 d-flex align-items-center">
              <i className="fa-solid fa-right-left text-primary me-2"></i>Allocation & Transfer Workspace
            </h5>

            {/* Select Asset */}
            <div className="mb-3">
              <label className="form-label-custom">Select Asset</label>
              <select
                className="form-select form-control-custom"
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} - {a.name} ({a.owner ? `Allocated: ${a.owner}` : 'Available'})
                  </option>
                ))}
              </select>
            </div>

            {/* Conflict Alert Box matching original frontend */}
            {hasConflict ? (
              <div
                className="alert alert-danger p-3 rounded-3 mb-3"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444' }}
              >
                <div className="d-flex align-items-start gap-2">
                  <i className="fa-solid fa-triangle-exclamation mt-1 fs-5"></i>
                  <div>
                    <div className="fw-bold">
                      Already Allocated to {selectedAsset.owner} ({selectedAsset.department || 'Office'})
                    </div>
                    <div className="small">Direct re-allocation is blocked — submit a transfer request below</div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Forms: Standard Allocation vs Transfer */}
            {!hasConflict ? (
              <form onSubmit={handleAllocate}>
                <div className="mb-3">
                  <label className="form-label-custom">Allocate To Staff / Department <span className="text-danger">*</span></label>
                  <select
                    className="form-select form-control-custom"
                    value={standardForm.allocatedTo}
                    onChange={(e) => setStandardForm({ ...standardForm, allocatedTo: e.target.value })}
                    required
                  >
                    <option value="">Select recipient...</option>
                    <optgroup label="Enterprise Departments">
                      {departments.map((d) => (
                        <option key={d.name} value={d.name}>{d.name} Department</option>
                      ))}
                    </optgroup>
                    <optgroup label="Registered Staff">
                      {users.map((u) => (
                        <option key={u.email} value={u.fullName || u.name}>
                          {u.fullName || u.name} ({u.department})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label-custom">Expected Return Date</label>
                  <input
                    type="date"
                    className="form-control form-control-custom"
                    value={standardForm.returnDate}
                    onChange={(e) => setStandardForm({ ...standardForm, returnDate: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label-custom">Notes / Purpose</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="e.g. Workstation setup"
                    value={standardForm.notes}
                    onChange={(e) => setStandardForm({ ...standardForm, notes: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-custom text-white w-100 py-2.5 fw-semibold"
                  disabled={busy}
                >
                  <i className="fa-solid fa-check me-2"></i>Allocate Asset
                </button>
              </form>
            ) : (
              <form onSubmit={handleTransfer}>
                <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">Transfer Request Form</h6>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label-custom small text-muted">From Department</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      value={selectedAsset?.department || 'Current'}
                      readOnly
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label-custom small text-muted">Target Department <span className="text-danger">*</span></label>
                    <select
                      className="form-select form-control-custom"
                      value={transferForm.targetDepartment}
                      onChange={(e) => setTransferForm({ ...transferForm, targetDepartment: e.target.value })}
                      required
                    >
                      <option value="">Select target...</option>
                      {departments.map((d) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label-custom small text-muted">Transfer Reason</label>
                  <textarea
                    className="form-control form-control-custom"
                    rows={3}
                    placeholder="Why is this transfer needed?"
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-custom text-white w-100 py-2.5 fw-semibold"
                  disabled={busy}
                >
                  <i className="fa-solid fa-paper-plane me-2"></i>Submit Transfer Request
                </button>
              </form>
            )}

            {/* Allocation History List */}
            {assetHistory.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-bold fs-8 text-uppercase text-muted mb-2">Custody History for this Asset</h6>
                <div className="d-flex flex-column gap-2 small">
                  {assetHistory.map((h) => (
                    <div key={h.id} className="p-2 border rounded bg-body-tertiary d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{h.allocatedTo}</strong>
                        <div className="text-muted fs-8">{h.date} • {h.notes || 'Routine allocation'}</div>
                      </div>
                      <StatusBadge value={h.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Allocations Table with 2-Tab Navigation */}
        <div className="col-lg-7">
          <div className="card-custom mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 border-bottom pb-2">
              <ul className="nav nav-pills nav-pills-custom gap-1">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'dept-queue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dept-queue')}
                  >
                    <i className="fa-solid fa-list-check me-2"></i>Department Queue ({deptQueueAllocations.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'my-requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-requests')}
                  >
                    <i className="fa-solid fa-user-tag me-2"></i>My Requests ({myRequestsAllocations.length})
                  </button>
                </li>
              </ul>
            </div>

            {loading ? (
              <SkeletonLoader count={6} height={40} />
            ) : (
              <DataTable
                columns={columns}
                data={activeTab === 'dept-queue' ? deptQueueAllocations : myRequestsAllocations}
                pageSize={8}
                emptyMessage="No allocation records found in this queue."
                renderRow={(item) => (
                  <tr key={item.id}>
                    <td>
                      <strong className="text-primary">{item.id}</strong>
                    </td>
                    <td>
                      <strong>{item.assetName}</strong>
                      {item.assetId && <small className="text-muted d-block">{item.assetId}</small>}
                    </td>
                    <td>{item.allocatedTo}</td>
                    <td className="small">{item.date}</td>
                    <td>
                      <StatusBadge value={item.status} />
                    </td>
                    <td>
                      <div className="d-flex gap-1.5 flex-wrap">
                        {canApprove && item.status.includes('Pending') && (
                          <>
                            <button
                              className="btn btn-sm btn-success px-2 py-1 fs-8"
                              onClick={() => handleAction(item.id, 'Approved', item.assetId)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger px-2 py-1 fs-8"
                              onClick={() => handleAction(item.id, 'Rejected')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {item.status === 'Approved' && (
                          <button
                            className="btn btn-sm btn-outline-danger px-2 py-1 fs-8"
                            onClick={() => handleAction(item.id, 'Returned', item.assetId)}
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* New Allocation Request Modal */}
      {showNewModal && (
        <Modal title="Create Allocation Request" onClose={() => setShowNewModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const asset = assets.find((a) => a.id === modalForm.assetId);
                await dataService.allocations.create({
                  ...modalForm,
                  assetName: asset?.name || 'Selected Asset'
                });
                Swal.fire('Created', 'Allocation request registered.', 'success');
                setShowNewModal(false);
                loadAll();
              } catch (err) {
                Swal.fire('Error', err.message, 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label-custom">Select Asset <span className="text-danger">*</span></label>
                <select
                  className="form-select form-control-custom"
                  value={modalForm.assetId}
                  onChange={(e) => setModalForm({ ...modalForm, assetId: e.target.value })}
                  required
                >
                  <option value="">Choose asset...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.name} ({a.owner ? `Allocated: ${a.owner}` : 'Available in stock'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Allocate To Staff / Department <span className="text-danger">*</span></label>
                <select
                  className="form-select form-control-custom"
                  value={modalForm.allocatedTo}
                  onChange={(e) => setModalForm({ ...modalForm, allocatedTo: e.target.value })}
                  required
                >
                  <option value="">Select recipient...</option>
                  <optgroup label="Departments">
                    {departments.map((d) => (
                      <option key={d.name} value={d.name}>{d.name} Department</option>
                    ))}
                  </optgroup>
                  <optgroup label="Employees">
                    {users.map((u) => (
                      <option key={u.email} value={u.fullName || u.name}>{u.fullName || u.name} ({u.email})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Date</label>
                <input
                  type="date"
                  className="form-control form-control-custom"
                  value={modalForm.date}
                  onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Notes</label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Purpose of allocation..."
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-secondary-custom" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-custom text-white" disabled={busy}>
                {busy ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
