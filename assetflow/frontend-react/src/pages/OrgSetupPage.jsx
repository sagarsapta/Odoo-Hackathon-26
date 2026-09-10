import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { PageContainer } from '../components/layout/AppLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';

export function OrgSetupPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [org, setOrg] = useState({
    name: '',
    code: '',
    industry: '',
    website: '',
    phone: '',
    address: '',
    logo: ''
  });

  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('depts'); // 'depts', 'heads', 'directory'
  const [newDeptName, setNewDeptName] = useState('');
  const [busy, setBusy] = useState(false);

  const loadOrgData = async () => {
    try {
      const [orgData, deptList, userList] = await Promise.all([
        dataService.organization.get(),
        dataService.departments.list(),
        dataService.users.list()
      ]);
      if (orgData) {
        setOrg({
          name: orgData.name || orgData.orgName || 'AssetFlow Technologies Pvt. Ltd.',
          code: orgData.code || 'AFT',
          industry: orgData.industry || 'Technology',
          website: orgData.website || 'https://assetflow.example.com',
          phone: orgData.phone || '+91 98765 43210',
          address: orgData.address || 'Surat, Gujarat',
          logo: orgData.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150'
        });
      }
      setDepartments(deptList || []);
      setUsers(userList || []);
    } catch (err) {
      console.warn('Failed to load org setup data:', err);
    }
  };

  useEffect(() => {
    loadOrgData();
  }, []);

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await dataService.organization.save(org);
      Swal.fire({
        icon: 'success',
        title: 'Organization Saved',
        text: 'Company information updated successfully.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setBusy(true);
    try {
      await dataService.departments.create(newDeptName.trim());
      Swal.fire('Department Added', `${newDeptName} created.`, 'success');
      setNewDeptName('');
      loadOrgData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDept = (deptName) => {
    Swal.fire({
      title: `Delete ${deptName}?`,
      text: 'Are you sure you want to delete this department?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Delete'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await dataService.departments.delete(deptName);
          Swal.fire('Deleted', 'Department deleted.', 'success');
          loadOrgData();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  const handleRoleChange = async (email, newRole, newDept) => {
    try {
      await dataService.users.updateRole(email, newRole, newDept);
      Swal.fire('Role Updated', `User permissions updated.`, 'success');
      loadOrgData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <PageContainer
      title="Organization Setup"
      subtitle="Configure company-wide workspace profile and identity"
    >
      <div className="row">
        <div className="col-xl-9 col-lg-11 mx-auto">
          {/* Company Information Card */}
          <div className="card-custom mb-4">
            <h5 className="fw-bold mb-4 border-bottom pb-3 d-flex align-items-center">
              <i className="fa-solid fa-sitemap me-2 text-primary"></i>Company Information
            </h5>

            <form onSubmit={handleSaveOrg}>
              {/* Logo Preview */}
              <div className="mb-4 text-center">
                <label className="form-label-custom d-block mb-3">Organization Logo</label>
                <div className="image-preview-container" style={{ width: 100, height: 100 }}>
                  <img
                    src={org.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150'}
                    alt="Org Logo"
                  />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label-custom">Organization Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    value={org.name}
                    onChange={(e) => setOrg({ ...org, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Organization Code <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    value={org.code}
                    onChange={(e) => setOrg({ ...org, code: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Industry Type</label>
                  <select
                    className="form-select form-control-custom"
                    value={org.industry}
                    onChange={(e) => setOrg({ ...org, industry: e.target.value })}
                  >
                    <option value="Technology">Technology & SaaS</option>
                    <option value="Finance">Finance & Banking</option>
                    <option value="Healthcare">Healthcare & Biotech</option>
                    <option value="Education">Education & E-learning</option>
                    <option value="Manufacturing">Manufacturing & Retail</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Company Website</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    value={org.website}
                    onChange={(e) => setOrg({ ...org, website: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Contact Phone</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    value={org.phone}
                    onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-custom">Headquarters Address</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    value={org.address}
                    onChange={(e) => setOrg({ ...org, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                <button type="submit" className="btn btn-primary-custom text-white" disabled={busy}>
                  {busy ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Admin Management Toolbar & Tabs */}
          {isAdmin && (
            <div className="card-custom mb-0">
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <ul className="nav nav-pills nav-pills-custom gap-1 flex-wrap">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'depts' ? 'active' : ''}`}
                      onClick={() => setActiveTab('depts')}
                    >
                      <i className="fa-solid fa-sitemap me-2"></i>Department Management
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'heads' ? 'active' : ''}`}
                      onClick={() => setActiveTab('heads')}
                    >
                      <i className="fa-solid fa-users-gear me-2"></i>User Roles & Dept Heads
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'directory' ? 'active' : ''}`}
                      onClick={() => setActiveTab('directory')}
                    >
                      <i className="fa-solid fa-address-book me-2"></i>Users Directory ({users.length})
                    </button>
                  </li>
                </ul>
              </div>

              {/* Tab 1: Departments */}
              {activeTab === 'depts' && (
                <div>
                  <form onSubmit={handleAddDept} className="d-flex gap-2 mb-3">
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="Add new department (e.g. Legal, R&D)..."
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary-custom text-white text-nowrap" disabled={busy}>
                      <i className="fa-solid fa-plus me-1"></i>Add Department
                    </button>
                  </form>

                  <div className="d-flex flex-column gap-2">
                    {departments.map((d) => (
                      <div
                        key={d.name}
                        className="p-2.5 rounded border d-flex justify-content-between align-items-center bg-body-tertiary"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <i className="fa-solid fa-building text-primary"></i>
                          <span className="fw-semibold" style={{ color: 'var(--text-color)' }}>{d.name}</span>
                          <span className="badge bg-secondary-subtle text-secondary fs-8">
                            {d.employeeCount || 0} Members
                          </span>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteDept(d.name)}
                          title="Delete Department"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: User Roles & Dept Heads */}
              {activeTab === 'heads' && (
                <div className="table-responsive">
                  <table className="table table-custom align-middle">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Current Role</th>
                        <th>Assign Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.email}>
                          <td><strong>{u.fullName || u.name}</strong></td>
                          <td className="small text-muted">{u.email}</td>
                          <td>{u.department}</td>
                          <td><StatusBadge value={u.role} /></td>
                          <td>
                            <select
                              className="form-select form-select-sm form-control-custom"
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.email, e.target.value, u.department)}
                              style={{ width: 170 }}
                            >
                              <option value="Admin">Admin</option>
                              <option value="Asset Manager">Asset Manager</option>
                              <option value="Department Head">Department Head</option>
                              <option value="Employee">Employee</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 3: System Users Directory */}
              {activeTab === 'directory' && (
                <DataTable
                  columns={['Name', 'Email Address', 'Department', 'Role', 'Status']}
                  data={users}
                  pageSize={8}
                  renderRow={(u) => (
                    <tr key={u.email}>
                      <td><strong>{u.fullName || u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.department}</td>
                      <td><StatusBadge value={u.role} /></td>
                      <td><span className="badge bg-success-subtle text-success">Active</span></td>
                    </tr>
                  )}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
