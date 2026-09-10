import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { can } from '../utils/rbac';
import { PageContainer } from '../components/layout/AppLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

export function AssetsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const role = user?.role || 'Employee';
  const userName = user?.fullName || user?.name || '';
  const userDept = user?.department || 'IT';

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [scope, setScope] = useState(role === 'Employee' ? 'my' : 'all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAsset, setDetailAsset] = useState(null);

  // Add/Edit Form State
  const [assetForm, setAssetForm] = useState({
    name: '',
    type: 'Laptop',
    serial: '',
    value: '',
    status: 'Active',
    location: '',
    department: userDept
  });

  // Request Asset Form State
  const [requestForm, setRequestForm] = useState({
    type: 'Hardware - Laptop',
    neededDate: new Date().toISOString().slice(0, 10),
    reason: ''
  });

  const [busy, setBusy] = useState(false);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const list = await dataService.assets.list();
      setAssets(list);
    } catch (err) {
      console.warn('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  // Filter logic matching original assets.js
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // 1. Scope filter
      if (scope === 'my') {
        const ownerLower = (asset.owner || '').toLowerCase().trim();
        const userNameLower = userName.toLowerCase().trim();
        if (ownerLower !== userNameLower && !ownerLower.includes(userNameLower)) return false;
      } else if (scope === 'department') {
        const assetDept = (asset.department || '').toLowerCase().trim();
        const deptLower = userDept.toLowerCase().trim();
        if (!assetDept.includes(deptLower)) return false;
      }

      // 2. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matched =
          (asset.name || '').toLowerCase().includes(q) ||
          (asset.id || '').toLowerCase().includes(q) ||
          (asset.serial || '').toLowerCase().includes(q) ||
          (asset.location || '').toLowerCase().includes(q);
        if (!matched) return false;
      }

      // 3. Type / Category
      if (typeFilter && asset.type !== typeFilter) return false;

      // 4. Status
      if (statusFilter && asset.status !== statusFilter) return false;

      return true;
    });
  }, [assets, scope, search, typeFilter, statusFilter, userName, userDept]);

  // Open Add / Edit Modal
  const openAddEditModal = (asset = null) => {
    setSelectedAsset(asset);
    if (asset) {
      setAssetForm({
        name: asset.name || '',
        type: asset.type || 'Laptop',
        serial: asset.serial || '',
        value: asset.value || '',
        status: asset.status || 'Active',
        location: asset.location || '',
        department: asset.department || userDept
      });
    } else {
      setAssetForm({
        name: '',
        type: 'Laptop',
        serial: `AF-${Date.now().toString().slice(-6)}`,
        value: '25000',
        status: 'Active',
        location: `${userDept} Office`,
        department: userDept
      });
    }
    setShowAssetModal(true);
  };

  const handleSaveAsset = async (e) => {
    e.preventDefault();
    if (!assetForm.name || !assetForm.serial || !assetForm.value) {
      return Swal.fire('Missing Fields', 'Please fill in all required fields.', 'warning');
    }

    setBusy(true);
    try {
      if (selectedAsset) {
        await dataService.assets.update(selectedAsset.id, assetForm);
        Swal.fire({ icon: 'success', title: 'Asset Updated', timer: 1500, showConfirmButton: false });
      } else {
        await dataService.assets.create(assetForm);
        Swal.fire({ icon: 'success', title: 'Asset Registered', timer: 1500, showConfirmButton: false });
      }
      setShowAssetModal(false);
      loadAssets();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Return Asset Action
  const handleReturnAsset = (asset) => {
    Swal.fire({
      title: `Return ${asset.name}?`,
      text: `Are you sure you want to return ${asset.name} (${asset.id}) back to company stock?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Return Asset'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await dataService.assets.returnAsset(asset.id);
          Swal.fire('Returned', `${asset.name} returned to stock successfully.`, 'success');
          loadAssets();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  // Request Asset submit
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await dataService.allocations.create({
        assetName: requestForm.type,
        allocatedTo: userName,
        department: userDept,
        notes: `Needed by ${requestForm.neededDate}. Reason: ${requestForm.reason}`
      });
      Swal.fire('Request Submitted', 'Your asset request has been sent to your Department Head.', 'success');
      setShowRequestModal(false);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { label: 'Asset ID' },
    { label: 'Asset Name' },
    { label: 'Category' },
    { label: 'Serial / License' },
    { label: 'Status' },
    { label: 'Value (₹)' },
    { label: 'Location' },
    { label: 'Actions' }
  ];

  return (
    <PageContainer
      title="Asset Inventory"
      subtitle="Manage hardware, software licenses, and resources"
      actions={
        <>
          {can(role, 'register_asset') && (
            <button className="btn btn-primary-custom text-white" onClick={() => openAddEditModal()}>
              <i className="fa-solid fa-plus me-2"></i>Add Asset
            </button>
          )}
          {role === 'Employee' && (
            <button className="btn btn-primary-custom text-white" onClick={() => setShowRequestModal(true)}>
              <i className="fa-solid fa-paper-plane me-2"></i>Request Asset
            </button>
          )}
        </>
      }
    >
      {/* Filter & Search Panel */}
      <div className="card-custom mb-4 py-3">
        <div className="row g-3 align-items-center">
          {role !== 'Admin' && (
            <div className="col-md-3">
              <label className="form-label-custom text-muted fs-8 mb-1">Asset View Scope</label>
              <select
                className="form-select form-control-custom fw-semibold text-primary"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="my">💻 My Assets</option>
                <option value="department">🏢 Department Assets</option>
                <option value="all">🌐 All Company Assets</option>
              </select>
            </div>
          )}

          <div className={role === 'Admin' ? 'col-md-4' : 'col-md-3'}>
            <label className="form-label-custom text-muted fs-8 mb-1">Quick Search</label>
            <div className="position-relative">
              <input
                type="text"
                className="form-control-custom w-100 ps-4"
                placeholder="Search by name, ID, serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="fa-solid fa-search position-absolute text-muted" style={{ right: 15, top: 12 }}></i>
            </div>
          </div>

          <div className="col-md-2">
            <label className="form-label-custom text-muted fs-8 mb-1">Category</label>
            <select
              className="form-select form-control-custom"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Laptop">Laptop</option>
              <option value="Monitor">Monitor</option>
              <option value="Networking">Networking</option>
              <option value="Printer">Printer</option>
              <option value="Accessory">Accessory</option>
              <option value="Projector">Projector</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label-custom text-muted fs-8 mb-1">Status</label>
            <select
              className="form-select form-control-custom"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Available">Available</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>

          <div className="col-md-1 align-self-end">
            <button
              className="btn btn-secondary-custom w-100"
              title="Reset Filters"
              onClick={() => {
                setSearch('');
                setTypeFilter('');
                setStatusFilter('');
                setScope(role === 'Employee' ? 'my' : 'all');
              }}
            >
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      {loading ? (
        <SkeletonLoader count={8} height={45} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredAssets}
          pageSize={10}
          emptyMessage="No assets match your search criteria."
          renderRow={(asset) => (
            <tr key={asset.id}>
              <td>
                <strong
                  className="text-primary cursor-pointer"
                  onClick={() => {
                    setDetailAsset(asset);
                    setShowDetailModal(true);
                  }}
                  title="View Asset Details"
                >
                  {asset.id}
                </strong>
              </td>
              <td>
                <div className="fw-semibold" style={{ color: 'var(--text-color)' }}>
                  {asset.name}
                </div>
                {asset.owner && <small className="text-muted d-block">Custodian: {asset.owner}</small>}
              </td>
              <td>{asset.type}</td>
              <td>
                <code className="text-muted">{asset.serial || '--'}</code>
              </td>
              <td>
                <StatusBadge value={asset.status} />
              </td>
              <td className="fw-medium">₹{Number(asset.value || 0).toLocaleString('en-IN')}</td>
              <td>{asset.location || '--'}</td>
              <td>
                <div className="d-flex gap-1.5">
                  <button
                    className="btn btn-sm btn-secondary-custom p-1.5"
                    title="View Details"
                    onClick={() => {
                      setDetailAsset(asset);
                      setShowDetailModal(true);
                    }}
                  >
                    <i className="fa-solid fa-eye text-primary"></i>
                  </button>
                  {can(role, 'register_asset') && (
                    <button
                      className="btn btn-sm btn-secondary-custom p-1.5"
                      title="Edit Asset"
                      onClick={() => openAddEditModal(asset)}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                  )}
                  {asset.owner && (
                    <button
                      className="btn btn-sm btn-outline-danger p-1.5"
                      title="Return Asset"
                      onClick={() => handleReturnAsset(asset)}
                    >
                      <i className="fa-solid fa-arrow-rotate-left"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        />
      )}

      {/* Add / Edit Asset Modal */}
      {showAssetModal && (
        <Modal
          title={selectedAsset ? `Edit Asset (${selectedAsset.id})` : 'Register New Asset'}
          onClose={() => setShowAssetModal(false)}
        >
          <form onSubmit={handleSaveAsset}>
            <div className="modal-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label-custom">Asset Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="e.g. MacBook Pro 16&quot;"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Category <span className="text-danger">*</span></label>
                  <select
                    className="form-select form-control-custom"
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                    required
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Networking">Networking</option>
                    <option value="Printer">Printer</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Projector">Projector</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Serial / License Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="e.g. AF-DEMO-9912"
                    value={assetForm.serial}
                    onChange={(e) => setAssetForm({ ...assetForm, serial: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Cost Value (₹ INR) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control form-control-custom"
                    placeholder="e.g. 45000"
                    value={assetForm.value}
                    onChange={(e) => setAssetForm({ ...assetForm, value: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Status</label>
                  <select
                    className="form-select form-control-custom"
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Location</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="e.g. IT Office, Surat HQ"
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button
                type="button"
                className="btn btn-secondary-custom"
                onClick={() => setShowAssetModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-custom text-white"
                disabled={busy}
              >
                {busy ? 'Saving...' : 'Save Asset'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Asset Details Modal */}
      {showDetailModal && detailAsset && (
        <Modal
          title={`Asset Details - ${detailAsset.id}`}
          size="modal-md"
          onClose={() => setShowDetailModal(false)}
        >
          <div className="modal-body p-4">
            <div className="text-center mb-4">
              <div
                className="bg-primary-subtle text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{ width: 64, height: 64 }}
              >
                <i className="fa-solid fa-boxes-stacked fs-2"></i>
              </div>
              <h4 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>{detailAsset.name}</h4>
              <StatusBadge value={detailAsset.status} />
            </div>

            <div className="border rounded-3 p-3 bg-body-tertiary">
              <div className="row g-2 small">
                <div className="col-6 text-muted">Category:</div>
                <div className="col-6 fw-semibold text-end">{detailAsset.type}</div>

                <div className="col-6 text-muted">Serial Number:</div>
                <div className="col-6 fw-semibold text-end"><code>{detailAsset.serial}</code></div>

                <div className="col-6 text-muted">Cost Valuation:</div>
                <div className="col-6 fw-semibold text-end text-success">
                  ₹{Number(detailAsset.value || 0).toLocaleString('en-IN')}
                </div>

                <div className="col-6 text-muted">Current Custodian:</div>
                <div className="col-6 fw-semibold text-end">{detailAsset.owner || 'Unassigned (In Stock)'}</div>

                <div className="col-6 text-muted">Department:</div>
                <div className="col-6 fw-semibold text-end">{detailAsset.department || 'Central Stock'}</div>

                <div className="col-6 text-muted">Location:</div>
                <div className="col-6 fw-semibold text-end">{detailAsset.location || '--'}</div>
              </div>
            </div>
          </div>
          <div className="modal-footer border-top px-4 py-2.5">
            <button className="btn btn-secondary-custom w-100" onClick={() => setShowDetailModal(false)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Request Asset Modal */}
      {showRequestModal && (
        <Modal title="Request New Asset" size="modal-md" onClose={() => setShowRequestModal(false)}>
          <form onSubmit={handleRequestSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label-custom">Asset Type / Category <span className="text-danger">*</span></label>
                <select
                  className="form-select form-control-custom"
                  value={requestForm.type}
                  onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
                  required
                >
                  <option value="Hardware - Laptop">Hardware - Laptop</option>
                  <option value="Hardware - Monitor">Hardware - Monitor</option>
                  <option value="Hardware - Keyboard & Mouse">Hardware - Keyboard & Mouse</option>
                  <option value="Software - Development License">Software - Development License</option>
                  <option value="Furniture - Ergonomic Chair">Furniture - Ergonomic Chair</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Needed By Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className="form-control form-control-custom"
                  value={requestForm.neededDate}
                  onChange={(e) => setRequestForm({ ...requestForm, neededDate: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Reason / Justification <span className="text-danger">*</span></label>
                <textarea
                  className="form-control form-control-custom"
                  rows={3}
                  placeholder="Explain why this equipment is needed..."
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-secondary-custom" onClick={() => setShowRequestModal(false)}>
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
