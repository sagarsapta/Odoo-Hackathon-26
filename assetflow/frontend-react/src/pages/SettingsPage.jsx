import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { PageContainer } from '../components/layout/AppLayout';

export function SettingsPage() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState(localStorage.getItem('display_lang') || 'en');
  const [notifyMaint, setNotifyMaint] = useState(localStorage.getItem('notify_maint') !== 'false');
  const [notifyBooking, setNotifyBooking] = useState(localStorage.getItem('notify_booking') !== 'false');
  const [notifyAudit, setNotifyAudit] = useState(localStorage.getItem('notify_audit') !== 'false');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('display_lang', language);
    localStorage.setItem('notify_maint', String(notifyMaint));
    localStorage.setItem('notify_booking', String(notifyBooking));
    localStorage.setItem('notify_audit', String(notifyAudit));

    Swal.fire({
      icon: 'success',
      title: 'Preferences Saved',
      text: 'Your application preferences were updated.',
      timer: 1400,
      showConfirmButton: false
    });
  };

  return (
    <PageContainer
      title="Settings"
      subtitle="Configure display, language, and notification preferences"
    >
      <div className="row">
        <div className="col-xl-7 col-lg-9 mx-auto">
          <div className="card-custom mb-0">
            <h5 className="fw-bold mb-4 border-bottom pb-3 d-flex align-items-center">
              <i className="fa-solid fa-sliders me-2 text-primary"></i>Application Preferences
            </h5>

            <form onSubmit={handleSavePreferences}>
              {/* Theme */}
              <div className="mb-4">
                <label className="form-label-custom">Visual Theme</label>
                <select
                  className="form-select form-control-custom"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="light">☀️ Light Theme (Standard Enterprise)</option>
                  <option value="dark">🌙 Dark Theme (Night Mode)</option>
                </select>
                <div className="form-text text-muted small">
                  Changes apply immediately across all application pages.
                </div>
              </div>

              {/* Language */}
              <div className="mb-4">
                <label className="form-label-custom">Display Language</label>
                <select
                  className="form-select form-control-custom"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English (US / UK)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="es">Español (Spanish)</option>
                </select>
              </div>

              {/* Notifications */}
              <div className="mb-4 border-top pt-3">
                <label className="form-label-custom mb-3">Notification Preferences</label>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="switch-maint"
                    checked={notifyMaint}
                    onChange={(e) => setNotifyMaint(e.target.checked)}
                  />
                  <label className="form-check-label fw-medium" htmlFor="switch-maint">
                    Maintenance & Repair Alerts
                  </label>
                  <div className="text-muted fs-8">Receive alerts when maintenance tickets are filed or resolved.</div>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="switch-booking"
                    checked={notifyBooking}
                    onChange={(e) => setNotifyBooking(e.target.checked)}
                  />
                  <label className="form-check-label fw-medium" htmlFor="switch-booking">
                    Resource Booking Confirmations
                  </label>
                  <div className="text-muted fs-8">Receive updates on meeting room and equipment reservations.</div>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="switch-audit"
                    checked={notifyAudit}
                    onChange={(e) => setNotifyAudit(e.target.checked)}
                  />
                  <label className="form-check-label fw-medium" htmlFor="switch-audit">
                    Audit Campaign Reminders
                  </label>
                  <div className="text-muted fs-8">Receive periodic reminders during active compliance verification cycles.</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                <button type="submit" className="btn btn-primary-custom text-white">
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
