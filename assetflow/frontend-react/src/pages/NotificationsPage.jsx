import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { PageContainer } from '../components/layout/AppLayout';
import { Modal } from '../components/ui/Modal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

export function NotificationsPage() {
  const { user } = useAuth();
  const role = user?.role || 'Employee';

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    targetRole: 'All'
  });
  const [busy, setBusy] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await dataService.notifications.list();
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await dataService.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn(err);
    }
  };

  const handleClearAll = async () => {
    Swal.fire({
      title: 'Clear all notifications?',
      text: 'This will remove all notification alerts from your inbox.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Clear All'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await dataService.notifications.clearAll();
          setNotifications([]);
          Swal.fire('Cleared', 'Notifications removed.', 'success');
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      return Swal.fire('Error', 'Please enter title and message.', 'warning');
    }

    setBusy(true);
    try {
      await dataService.notifications.create({
        ...form,
        targetRole: form.targetRole === 'All' ? null : form.targetRole
      });
      Swal.fire('Notification Sent', 'Alert dispatched to designated recipients.', 'success');
      setShowModal(false);
      setForm({ title: '', message: '', type: 'info', targetRole: 'All' });
      loadNotifications();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const canSend = role === 'Admin' || role === 'Asset Manager' || role === 'AssetManager';

  return (
    <PageContainer
      title="System Notifications"
      subtitle="Alerts, updates, and compliance audit notifications"
      actions={
        <div className="d-flex gap-2">
          {canSend && (
            <button className="btn btn-primary-custom text-white" onClick={() => setShowModal(true)}>
              <i className="fa-solid fa-paper-plane me-2"></i>Send Notification
            </button>
          )}
          <button className="btn btn-secondary-custom" onClick={handleClearAll}>
            <i className="fa-solid fa-trash-can me-2"></i>Clear All
          </button>
        </div>
      }
    >
      <div className="row">
        <div className="col-xl-8 col-lg-10 mx-auto">
          {loading ? (
            <SkeletonLoader count={5} height={75} />
          ) : (
            <div className="d-flex flex-column gap-3">
              {notifications.map((item) => {
                const isUnread = !item.read;
                const iconClass =
                  item.type === 'warning'
                    ? 'fa-triangle-exclamation text-warning'
                    : item.type === 'success'
                    ? 'fa-circle-check text-success'
                    : 'fa-bell text-primary';

                return (
                  <div
                    key={item.id}
                    className="card-custom p-3 mb-0"
                    style={{
                      borderLeft: isUnread ? '4px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: isUnread ? 'rgba(37, 99, 235, 0.02)' : 'var(--card-bg)',
                      cursor: isUnread ? 'pointer' : 'default',
                      transition: 'var(--transition)'
                    }}
                    onClick={() => isUnread && handleMarkAsRead(item.id)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <i className={`fa-solid ${iconClass} fs-5`}></i>
                        <span
                          className={`fs-6 ${isUnread ? 'fw-bold' : 'fw-medium'}`}
                          style={{ color: 'var(--text-color)' }}
                        >
                          {item.title}
                        </span>
                        {isUnread && (
                          <span className="badge bg-primary-subtle text-primary fs-8 rounded-pill">
                            New
                          </span>
                        )}
                      </div>
                      <small className="text-muted fs-8">
                        <i className="fa-regular fa-clock me-1"></i>
                        {item.date}
                      </small>
                    </div>
                    <p className="text-muted mb-0 ps-4 small">{item.message}</p>
                  </div>
                );
              })}

              {notifications.length === 0 && (
                <div className="card-custom text-center py-5 text-muted">
                  <i className="fa-regular fa-bell-slash fs-1 mb-3 opacity-50"></i>
                  <h5>All caught up!</h5>
                  <p className="small mb-0">You have no unread notifications or active operational alerts.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Send Notification Modal */}
      {showModal && (
        <Modal title="Broadcast System Notification" size="modal-md" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSendSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label-custom">Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="e.g. Scheduled Network Downtime"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Notification Message <span className="text-danger">*</span></label>
                <textarea
                  className="form-control form-control-custom"
                  rows={3}
                  placeholder="Type notification alert message..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label-custom">Alert Tone</label>
                  <select
                    className="form-select form-control-custom"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Yellow/Orange)</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label-custom">Target Audience</label>
                  <select
                    className="form-select form-control-custom"
                    value={form.targetRole}
                    onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  >
                    <option value="All">All Roles</option>
                    <option value="Department Head">Department Heads</option>
                    <option value="Employee">Employees Only</option>
                    <option value="Asset Manager">Asset Managers</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-secondary-custom" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-custom text-white" disabled={busy}>
                {busy ? 'Sending...' : 'Broadcast Alert'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
