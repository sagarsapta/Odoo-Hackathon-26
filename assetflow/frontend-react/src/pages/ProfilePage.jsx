import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { PageContainer } from '../components/layout/AppLayout';

function getUserInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'security'

  // Details form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || user?.name || 'Rahul Sharma',
    email: user?.email || 'admin@assetflow.com',
    phone: user?.phone || '+91 98765 43210',
    department: user?.department || 'Administration',
    jobTitle: user?.jobTitle || user?.role || 'Administrator',
    avatar: user?.avatar || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password visibility toggles matching original frontend
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [busyDetails, setBusyDetails] = useState(false);
  const [busyPassword, setBusyPassword] = useState(false);

  // Avatar Upload with FileReader
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      Swal.fire('File Too Large', 'Avatar image must be smaller than 1MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      try {
        setProfileForm((prev) => ({ ...prev, avatar: base64 }));
        const res = await dataService.profile.update({ avatar: base64 });
        if (res.user) {
          updateUser(res.user);
        }
        Swal.fire({
          title: 'Avatar Updated',
          text: 'Your profile picture has been updated.',
          icon: 'success',
          confirmButtonColor: '#2563EB',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Profile Details
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName) {
      return Swal.fire('Error', 'Full name is required.', 'warning');
    }

    setBusyDetails(true);
    try {
      const res = await dataService.profile.update({
        fullName: profileForm.fullName,
        department: profileForm.department,
        phone: profileForm.phone,
        jobTitle: profileForm.jobTitle,
        avatar: profileForm.avatar
      });
      if (res.user) {
        updateUser(res.user);
      }
      Swal.fire({
        title: 'Profile Updated',
        text: 'Your profile details have been saved successfully.',
        icon: 'success',
        confirmButtonColor: '#2563EB',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusyDetails(false);
    }
  };

  // Change Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      return Swal.fire('Required', 'Please enter your current password.', 'warning');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Swal.fire('Mismatch', 'New passwords do not match.', 'warning');
    }
    if (passwordForm.newPassword.length < 8) {
      return Swal.fire('Weak Password', 'New password must be at least 8 characters.', 'warning');
    }

    setBusyPassword(true);
    try {
      await dataService.profile.changePassword(passwordForm);
      Swal.fire({
        title: 'Password Updated',
        text: 'Your security credentials were updated successfully.',
        icon: 'success',
        confirmButtonColor: '#2563EB'
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusyPassword(false);
    }
  };

  const displayName = profileForm.fullName || user?.fullName || user?.name || 'User';
  const role = user?.role || 'Employee';

  return (
    <PageContainer
      title="User Profile"
      subtitle="Manage your administrative credentials and security settings"
    >
      <div className="row g-4">
        {/* Left Column: Profile Quick Details Card */}
        <div className="col-lg-4">
          <div className="card-custom text-center py-4 mb-0">
            {/* Avatar container */}
            <div className="d-flex justify-content-center mb-3">
              <div style={{ position: 'relative' }}>
                {profileForm.avatar ? (
                  <img
                    src={profileForm.avatar}
                    alt="Avatar"
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--border-color)'
                    }}
                  />
                ) : (
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                    style={{
                      width: 140,
                      height: 140,
                      fontSize: 56,
                      fontWeight: 600,
                      border: '3px solid var(--border-color)'
                    }}
                  >
                    {getUserInitials(displayName)}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary-custom btn-sm mb-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fa-solid fa-camera me-1"></i>Change Picture
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="d-none"
              accept="image/*"
              onChange={handleAvatarFileChange}
            />

            <h4 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>
              {displayName}
            </h4>
            <p className="text-muted small mb-3">{role}</p>
            <div className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 fs-8">
              {profileForm.email}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Forms Section */}
        <div className="col-lg-8">
          <div className="card-custom p-0 overflow-hidden mb-0">
            {/* Tab Headers matching original profile.html */}
            <ul className="nav nav-tabs px-3 pt-3 border-bottom bg-body-tertiary" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link fw-bold py-2.5 ${activeTab === 'details' ? 'active' : ''}`}
                  style={{
                    border: 'none',
                    borderBottom: activeTab === 'details' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    background: 'transparent',
                    color: activeTab === 'details' ? 'var(--primary-color)' : 'var(--text-color)'
                  }}
                  onClick={() => setActiveTab('details')}
                  type="button"
                  role="tab"
                >
                  <i className="fa-solid fa-user-gear me-2"></i>My Details
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link fw-bold py-2.5 ${activeTab === 'security' ? 'active' : ''}`}
                  style={{
                    border: 'none',
                    borderBottom: activeTab === 'security' ? '2px solid var(--primary-color)' : '2px solid transparent',
                    background: 'transparent',
                    color: activeTab === 'security' ? 'var(--primary-color)' : 'var(--text-color)'
                  }}
                  onClick={() => setActiveTab('security')}
                  type="button"
                  role="tab"
                >
                  <i className="fa-solid fa-shield-halved me-2"></i>Security & Password
                </button>
              </li>
            </ul>

            {/* Tab Contents */}
            <div className="p-4">
              {/* Tab 1: My Details */}
              {activeTab === 'details' && (
                <form onSubmit={handleDetailsSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label-custom">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label-custom">
                        Contact Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-custom"
                        value={profileForm.email}
                        readOnly
                        disabled
                        style={{ opacity: 0.85 }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label-custom">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control form-control-custom"
                        placeholder="+1 (555) 000-0000"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label-custom">Job Title / Department</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="e.g. IT Operations Specialist"
                        value={profileForm.jobTitle}
                        onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary-custom text-white"
                      disabled={busyDetails}
                    >
                      {busyDetails ? 'Saving...' : 'Save Details'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Security & Password */}
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label-custom">
                        Current Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showCurrentPwd ? 'text' : 'password'}
                          className="form-control form-control-custom border-end-0"
                          placeholder="••••••••"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          required
                          style={{
                            borderRadius: 'var(--border-radius-sm) 0 0 var(--border-radius-sm)'
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary border bg-white"
                          style={{
                            borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0',
                            borderColor: 'var(--border-color)'
                          }}
                          onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        >
                          <i
                            className={`fa-solid ${showCurrentPwd ? 'fa-eye-slash' : 'fa-eye'} text-muted`}
                          ></i>
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label-custom">
                        New Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          className="form-control form-control-custom border-end-0"
                          placeholder="Min. 8 characters"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          required
                          style={{
                            borderRadius: 'var(--border-radius-sm) 0 0 var(--border-radius-sm)'
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary border bg-white"
                          style={{
                            borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0',
                            borderColor: 'var(--border-color)'
                          }}
                          onClick={() => setShowNewPwd(!showNewPwd)}
                        >
                          <i
                            className={`fa-solid ${showNewPwd ? 'fa-eye-slash' : 'fa-eye'} text-muted`}
                          ></i>
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label-custom">
                        Confirm New Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          className="form-control form-control-custom border-end-0"
                          placeholder="Re-enter password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          required
                          style={{
                            borderRadius: 'var(--border-radius-sm) 0 0 var(--border-radius-sm)'
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary border bg-white"
                          style={{
                            borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0',
                            borderColor: 'var(--border-color)'
                          }}
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        >
                          <i
                            className={`fa-solid ${showConfirmPwd ? 'fa-eye-slash' : 'fa-eye'} text-muted`}
                          ></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary-custom text-white"
                      disabled={busyPassword}
                    >
                      {busyPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
