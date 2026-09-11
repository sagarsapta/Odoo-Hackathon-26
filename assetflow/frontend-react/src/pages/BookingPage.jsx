import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { PageContainer } from '../components/layout/AppLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { normalizeBooking } from '../services/normalizers';

const STANDARD_TIME_SLOTS = [
  { label: '08:00', start: '08:00', end: '09:00' },
  { label: '09:00', start: '09:00', end: '10:00' },
  { label: '10:00', start: '10:00', end: '11:00' },
  { label: '11:00', start: '11:00', end: '12:00' },
  { label: '12:00', start: '12:00', end: '13:00' },
  { label: '13:00', start: '13:00', end: '14:00' },
  { label: '14:00', start: '14:00', end: '15:00' },
  { label: '15:00', start: '15:00', end: '16:00' },
  { label: '16:00', start: '16:00', end: '17:00' },
  { label: '17:00', start: '17:00', end: '18:00' }
];

export function BookingPage() {
  const { user } = useAuth();
  const userName = user?.fullName || user?.name || 'Current User';
  const userDept = user?.department || 'IT';

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [assets, setAssets] = useState([]);

  // Quick reservation form state
  const [form, setForm] = useState({
    resourceName: 'Conference Room A',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00'
  });

  // Modal reservation form state
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    resourceName: 'Conference Room A',
    bookedBy: userName,
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '11:00'
  });

  const [busy, setBusy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookList, assetList] = await Promise.all([
        dataService.bookings.list(),
        dataService.assets.list()
      ]);
      setBookings(Array.isArray(bookList) ? bookList.map(normalizeBooking) : []);
      setAssets(Array.isArray(assetList) ? assetList : []);
    } catch (err) {
      console.warn('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Shared resources available for booking
  const resourceOptions = useMemo(() => {
    const fixed = ['Conference Room A', 'Conference Room B', 'Training Room', 'Executive Boardroom'];
    const hardware = assets
      .filter((a) => ['Projector', 'Networking', 'Laptop', 'Tablet'].includes(a.type))
      .map((a) => `${a.name} (${a.id})`);
    return [...fixed, ...hardware];
  }, [assets]);

  // Conflict Detection
  const hasConflict = useMemo(() => {
    return bookings.some((b) => {
      if (b.status === 'Cancelled' || b.date !== form.date) return false;
      const sameResource = (b.resourceName || '').toLowerCase() === (form.resourceName || '').toLowerCase();
      if (!sameResource) return false;
      // Overlap check
      return form.startTime < b.endTime && form.endTime > b.startTime;
    });
  }, [bookings, form]);

  // Conflicting booking details
  const conflictBooking = useMemo(() => {
    if (!hasConflict) return null;
    return bookings.find((b) => {
      if (b.status === 'Cancelled' || b.date !== form.date) return false;
      const sameResource = (b.resourceName || '').toLowerCase() === (form.resourceName || '').toLowerCase();
      return sameResource && form.startTime < b.endTime && form.endTime > b.startTime;
    });
  }, [bookings, form, hasConflict]);

  // Booked schedule for currently selected resource on selected date
  const resourceSchedule = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === 'Confirmed' &&
        (b.resourceName || '').toLowerCase() === (form.resourceName || '').toLowerCase() &&
        b.date === form.date
    );
  }, [bookings, form.resourceName, form.date]);

  // Quick reserve submit
  const handleQuickReserve = async (e) => {
    e.preventDefault();
    if (form.startTime >= form.endTime) {
      return Swal.fire('Invalid Time', 'End time must be after start time.', 'warning');
    }
    if (hasConflict) {
      return Swal.fire('Conflict Detected', `Resource is already booked by ${conflictBooking?.bookedBy}.`, 'error');
    }

    setBusy(true);
    try {
      await dataService.bookings.create({
        ...form,
        bookedBy: userName,
        department: userDept
      });
      Swal.fire('Booking Confirmed', `${form.resourceName} reserved successfully.`, 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = (booking) => {
    Swal.fire({
      title: 'Cancel Reservation?',
      text: `Cancel booking for ${booking.resourceName} on ${booking.date}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Cancel'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await dataService.bookings.cancel(booking.id);
          Swal.fire('Cancelled', 'Booking has been cancelled.', 'success');
          loadData();
        } catch (err) {
          Swal.fire('Error', err.message, 'error');
        }
      }
    });
  };

  // FullCalendar event items
  const calendarEvents = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'Confirmed')
      .map((b) => ({
        id: b.id,
        title: `${b.resourceName} - ${b.bookedBy}`,
        start: `${b.date}T${b.startTime}:00`,
        end: `${b.date}T${b.endTime}:00`,
        extendedProps: b,
        backgroundColor: '#2563EB',
        borderColor: '#1D4ED8'
      }));
  }, [bookings]);

  return (
    <PageContainer
      title="Resource Booking"
      subtitle="Schedule meeting rooms, vehicles, and hardware resources"
      actions={
        <button className="btn btn-primary-custom text-white" onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-calendar-plus me-2"></i>Book Resource
        </button>
      }
    >
      {/* Top Row: Reserve & Conflict Detector (Left) + Active Reservations (Right) */}
      <div className="row g-4 mb-4 align-items-stretch">
        {/* Left: Reserve & Conflict Detector */}
        <div className="col-xl-6 col-lg-6">
          <div className="card-custom p-4 shadow-sm h-100 d-flex flex-column mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center">
                <i className="fa-solid fa-bolt me-2 text-primary"></i>Reserve & Conflict Detector
              </h5>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 fs-8 fw-bold">
                Live Checker
              </span>
            </div>

            <form onSubmit={handleQuickReserve} className="d-flex flex-column flex-grow-1">
              <div className="mb-3">
                <label className="form-label-custom">Select Resource <span className="text-danger">*</span></label>
                <select
                  className="form-select form-control-custom"
                  value={form.resourceName}
                  onChange={(e) => setForm({ ...form, resourceName: e.target.value })}
                  required
                >
                  {resourceOptions.map((res) => (
                    <option key={res} value={res}>{res}</option>
                  ))}
                </select>
              </div>

              {/* AI Smart Resource Detection Card (Red Theme when occupied) */}
              {resourceSchedule.length > 0 && (
                <div
                  className="p-3 mb-3 border rounded-3"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderColor: 'rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1.5">
                    <span className="fs-8 fw-bold text-danger text-uppercase">
                      <i className="fa-solid fa-calendar-xmark me-1.5"></i>Booked Schedule Today
                    </span>
                    <span className="badge bg-danger text-white fs-8 rounded-pill">
                      {resourceSchedule.length} Active
                    </span>
                  </div>
                  <div className="d-flex flex-column gap-1.5 small">
                    {resourceSchedule.map((s) => (
                      <div key={s.id} className="d-flex justify-content-between text-danger">
                        <span>• {s.startTime} - {s.endTime}</span>
                        <span className="fw-semibold">{s.bookedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="row g-3 mb-3">
                <div className="col-5">
                  <label className="form-label-custom">Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control form-control-custom"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-3.5" style={{ flex: '0 0 29%', maxWidth: '29%' }}>
                  <label className="form-label-custom">Start</label>
                  <input
                    type="time"
                    className="form-control form-control-custom"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="col-3.5" style={{ flex: '0 0 29%', maxWidth: '29%' }}>
                  <label className="form-label-custom">End</label>
                  <input
                    type="time"
                    className="form-control form-control-custom"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Conflict Alert Box */}
              {hasConflict && (
                <div
                  className="alert alert-danger py-2 px-3 mb-3 rounded-2 small"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444' }}
                >
                  <i className="fa-solid fa-circle-exclamation me-1.5"></i>
                  <strong>Scheduling Conflict:</strong> {form.resourceName} is already booked by{' '}
                  <strong>{conflictBooking?.bookedBy}</strong> from {conflictBooking?.startTime} to {conflictBooking?.endTime}.
                </div>
              )}

              {/* Visual Time Slot Grid Bar matching original booking.html */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fs-8 fw-bold text-muted text-uppercase">Time Slots Availability</span>
                  <small className="fs-8 text-muted">
                    <span className="badge bg-success rounded-circle p-1"></span> Available{' '}
                    <span className="badge bg-danger rounded-circle p-1 ms-1"></span> Booked
                  </small>
                </div>
                <div className="d-flex flex-wrap gap-1.5 p-2.5 border rounded-3 bg-body-tertiary">
                  {STANDARD_TIME_SLOTS.map((slot) => {
                    const isBooked = bookings.some(
                      (b) =>
                        b.status === 'Confirmed' &&
                        (b.resourceName || '').toLowerCase() === (form.resourceName || '').toLowerCase() &&
                        b.date === form.date &&
                        slot.start < b.endTime &&
                        slot.end > b.startTime
                    );

                    const isSelected = form.startTime === slot.start && form.endTime === slot.end;

                    return (
                      <button
                        key={slot.label}
                        type="button"
                        className={`time-slot-btn ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
                        disabled={isBooked}
                        onClick={() => {
                          setForm({ ...form, startTime: slot.start, endTime: slot.end });
                        }}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary-custom text-white w-100 py-2.5 fw-bold mt-auto"
                disabled={busy || hasConflict}
              >
                <i className="fa-solid fa-calendar-check me-2"></i>Reserve Slot Now
              </button>
            </form>
          </div>
        </div>

        {/* Right: Active Reservations Ledger Card */}
        <div className="col-xl-6 col-lg-6">
          <div className="card-custom p-4 shadow-sm h-100 d-flex flex-column mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center">
                <i className="fa-solid fa-list-check me-2 text-primary"></i>Active Reservations
              </h5>
              <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-3 py-1 fs-8 fw-bold">
                Live Status
              </span>
            </div>

            {loading ? (
              <SkeletonLoader count={5} height={55} />
            ) : (
              <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: 440 }}>
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 mb-2.5 rounded-3 border d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: 'var(--card-bg)' }}
                  >
                    <div>
                      <div className="fw-bold" style={{ color: 'var(--text-color)' }}>{b.resourceName}</div>
                      <div className="text-muted small">
                        <i className="fa-regular fa-user me-1 text-primary"></i>
                        {b.bookedBy} <span className="badge bg-secondary-subtle text-secondary rounded-pill ms-1 me-1">{b.department || 'IT'}</span> • {b.date} ({b.startTime} - {b.endTime})
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <StatusBadge value={b.status} />
                      {b.status === 'Confirmed' && (
                        <button
                          className="btn btn-sm btn-outline-danger p-1 fs-8"
                          title="Cancel Reservation"
                          onClick={() => handleCancelBooking(b)}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="text-center text-muted py-5">No reservations on record.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: FullCalendar Overview */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card-custom p-4 shadow-sm mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center">
                <i className="fa-solid fa-calendar-days me-2 text-primary"></i>Resource Availability Calendar
              </h5>
              <span className="text-muted small">Full Monthly Overview</span>
            </div>

            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height={560}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              events={calendarEvents}
              eventClick={({ event }) => {
                const b = event.extendedProps;
                Swal.fire({
                  title: b.resourceName,
                  html: `
                    <div class="text-start py-2">
                      <p><strong>Booked By:</strong> ${b.bookedBy}</p>
                      <p><strong>Department:</strong> ${b.department || 'IT'}</p>
                      <p><strong>Date:</strong> ${b.date}</p>
                      <p><strong>Time Slot:</strong> ${b.startTime} - ${b.endTime}</p>
                      <p><strong>Status:</strong> ${b.status}</p>
                    </div>
                  `,
                  icon: 'info',
                  confirmButtonColor: '#2563EB'
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Book Resource Modal */}
      {showModal && (
        <Modal title="Book Resource Slot" size="modal-md" onClose={() => setShowModal(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await dataService.bookings.create({
                  ...modalForm,
                  department: userDept
                });
                Swal.fire('Confirmed', 'Resource slot reserved successfully.', 'success');
                setShowModal(false);
                loadData();
              } catch (err) {
                Swal.fire('Error', err.message, 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label-custom">Select Resource <span className="text-danger">*</span></label>
                <select
                  className="form-select form-control-custom"
                  value={modalForm.resourceName}
                  onChange={(e) => setModalForm({ ...modalForm, resourceName: e.target.value })}
                  required
                >
                  {resourceOptions.map((res) => (
                    <option key={res} value={res}>{res}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Booked By (Full Name) <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  value={modalForm.bookedBy}
                  onChange={(e) => setModalForm({ ...modalForm, bookedBy: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Reservation Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className="form-control form-control-custom"
                  value={modalForm.date}
                  onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label-custom">Start Time</label>
                  <input
                    type="time"
                    className="form-control form-control-custom"
                    value={modalForm.startTime}
                    onChange={(e) => setModalForm({ ...modalForm, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label-custom">End Time</label>
                  <input
                    type="time"
                    className="form-control form-control-custom"
                    value={modalForm.endTime}
                    onChange={(e) => setModalForm({ ...modalForm, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-top px-4 py-3">
              <button type="button" className="btn btn-secondary-custom" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary-custom text-white" disabled={busy}>
                {busy ? 'Booking...' : 'Confirm Reservation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
