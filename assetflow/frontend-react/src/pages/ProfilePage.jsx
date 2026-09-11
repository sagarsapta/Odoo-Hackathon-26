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

/**
 * Validates Indian phone number format.
 * Accepts: +91 XXXXX XXXXX, +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
 * Returns { valid: boolean, message: string }
 */
function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return { valid: true, message: '' }; // Phone is optional
  }
  // Strip all spaces, dashes, parens
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Check for Indian format: +91XXXXXXXXXX or 91XXXXXXXXXX or 0XXXXXXXXXX or just 10 digits
  const indianRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
  if (!indianRegex.test(cleaned)) {
    return {
      valid: false,
      message: 'Enter a valid Indian phone number (e.g. +91 98765 43210). Must start with 6-9 and be 10 digits.'
    };
  }
  return { valid: true, message: '' };
}

/**
 * Formats a phone number to standard Indian display: +91 XXXXX XXXXX
 */
function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Extract last 10 digits
  let digits = cleaned;
  if (digits.startsWith('+91')) digits = digits.slice(3);
  else if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone; // Return as-is if can't format
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

  // Validation error states
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [nameError, setNameError] = useState('');

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

  // Phone change handler with real-time validation
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setProfileForm({ ...profileForm, phone: value });
    if (phoneTouched) {
      const result = validatePhone(value);
      setPhoneError(result.valid ? '' : result.message);
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const result = validatePhone(profileForm.phone);
    setPhoneError(result.valid ? '' : result.message);

    // Auto-format if valid
    if (result.valid && profileForm.phone.trim()) {
      const formatted = formatPhoneDisplay(profileForm.phone);
      setProfileForm((prev) => ({ ...prev, phone: formatted }));
    }
  };

  // Name change handler with validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    setProfileForm({ ...profileForm, fullName: value });
    if (!value.trim()) {
      setNameError('Full name is required.');
    } else if (value.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
    } else {
      setNameError('');
    }
  };

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

  // Save Profile Details with validation
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();

    // Validate full name
    if (!profileForm.fullName || !profileForm.fullName.trim()) {
      setNameError('Full name is required.');
      return Swal.fire('Error', 'Full name is required.', 'warning');
    }
    if (profileForm.fullName.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      return Swal.fire('Error', 'Name must be at least 2 characters.', 'warning');
    }

    // Validate phone
    const phoneResult = validatePhone(profileForm.phone);
    if (!phoneResult.valid) {
      setPhoneError(phoneResult.message);
      setPhoneTouched(true);
      return Swal.fire('Invalid Phone', phoneResult.message, 'warning');
    }

    setBusyDetails(true);
    try {
      // Format phone before saving
      const formattedPhone = profileForm.phone.trim()
        ? formatPhoneDisplay(profileForm.phone)
        : '';

      const res = await dataService.profile.update({
        fullName: profileForm.fullName.trim(),
        department: profileForm.department,
        phone: formattedPhone,
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
    if (passwordForm.newPassword.length < 8) {
      return Swal.fire('Weak Password', 'New password must be at least 8 characters.', 'warning');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return Swal.fire('Mismatch', 'New passwords do not match.', 'warning');
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

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#F59E0B' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#3B82F6' };
    return { level: 4, label: 'Strong', color: '#10B981' };
  };

  const pwdStrength = getPasswordStrength(passwordForm.newPassword);

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
            <p className="text-muted small mb-2">{role}</p>
            <div className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 mb-2" style={{ fontSize: '0.78rem' }}>
              <i className="fa-solid fa-envelope me-1"></i>{profileForm.email}
            </div>
            {profileForm.phone && validatePhone(profileForm.phone).valid && (
              <div className="badge bg-success-subtle text-success rounded-pill px-3 py-1 d-block mx-auto" style={{ fontSize: '0.78rem', maxWidth: 220 }}>
                <i className="fa-solid fa-phone me-1"></i>{profileForm.phone}
              </div>
            )}
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
                <form onSubmit={handleDetailsSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label-custom">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-custom ${nameError ? 'is-invalid' : ''}`}
                        value={profileForm.fullName}
                        onChange={handleNameChange}
                        required
                      />
                      {nameError && (
                        <div className="invalid-feedback d-block" style={{ fontSize: '0.8rem' }}>
                          <i className="fa-solid fa-circle-exclamation me-1"></i>{nameError}
                        </div>
                      )}
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
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        <i className="fa-solid fa-lock me-1"></i>Email cannot be changed
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label-custom">
                        Phone Number
                        <span className="text-muted ms-1" style={{ fontSize: '0.75rem', fontWeight: 400 }}>
                          (Indian: +91)
                        </span>
                      </label>
                      <div className="position-relative">
                        <input
                          type="tel"
                          className={`form-control form-control-custom ${phoneError ? 'is-invalid' : (phoneTouched && profileForm.phone.trim() && !phoneError) ? 'is-valid' : ''}`}
                          placeholder="+91 98765 43210"
                          value={profileForm.phone}
                          onChange={handlePhoneChange}
                          onBlur={handlePhoneBlur}
                          maxLength={16}
                        />
                        {phoneTouched && profileForm.phone.trim() && !phoneError && (
                          <i
                            className="fa-solid fa-circle-check text-success position-absolute"
                            style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}
                          ></i>
                        )}
                      </div>
                      {phoneError && (
                        <div className="invalid-feedback d-block" style={{ fontSize: '0.8rem' }}>
                          <i className="fa-solid fa-circle-exclamation me-1"></i>{phoneError}
                        </div>
                      )}
                      {!phoneError && (
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Format: +91 XXXXX XXXXX (10-digit Indian mobile)
                        </small>
                      )}
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
                      disabled={busyDetails || !!nameError || !!phoneError}
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
                      {/* Password Strength Indicator */}
                      {passwordForm.newPassword && (
                        <div className="mt-2">
                          <div className="d-flex gap-1 mb-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                style={{
                                  height: 4,
                                  flex: 1,
                                  borderRadius: 2,
                                  backgroundColor: i <= pwdStrength.level ? pwdStrength.color : '#E2E8F0',
                                  transition: 'background-color 0.3s ease'
                                }}
                              />
                            ))}
                          </div>
                          <small style={{ color: pwdStrength.color, fontSize: '0.75rem', fontWeight: 600 }}>
                            {pwdStrength.label}
                          </small>
                        </div>
                      )}
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
                      {/* Password match indicator */}
                      {passwordForm.confirmPassword && (
                        <small
                          className="mt-1 d-block"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: passwordForm.newPassword === passwordForm.confirmPassword ? '#10B981' : '#EF4444'
                          }}
                        >
                          <i className={`fa-solid ${passwordForm.newPassword === passwordForm.confirmPassword ? 'fa-circle-check' : 'fa-circle-xmark'} me-1`}></i>
                          {passwordForm.newPassword === passwordForm.confirmPassword
                            ? 'Passwords match'
                            : 'Passwords do not match'}
                        </small>
                      )}
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
