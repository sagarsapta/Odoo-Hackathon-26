import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { PageContainer } from '../components/layout/AppLayout';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SkeletonCards, SkeletonLoader } from '../components/ui/SkeletonLoader';
import {
  formatCurrency,
  normalizeAsset,
  normalizeAllocation,
  normalizeBooking,
  normalizeMaintenance,
  normalizeNotification
} from '../services/normalizers';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'Employee';
  const userName = user?.fullName || user?.name || 'User';

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalValuation: 0,
    totalMaintenanceCost: 0,
    totalAssetsCount: 0,
    deptDistribution: {},
    statusDistribution: {}
  });

  const [recentAssets, setRecentAssets] = useState([]);
  const [recentAllocations, setRecentAllocations] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsData, assetsData, allocationsData, bookingsData, maintenanceData, notifData] =
        await Promise.allSettled([
          dataService.reports.getAnalytics(),
          dataService.assets.list(),
          dataService.allocations.list(),
          dataService.bookings.list(),
          dataService.maintenance.list(),
          dataService.notifications.list()
        ]);

      if (reportsData.status === 'fulfilled') {
        setAnalytics(reportsData.value);
      }

      if (assetsData.status === 'fulfilled' && Array.isArray(assetsData.value)) {
        setRecentAssets(assetsData.value.map(normalizeAsset).slice(0, 5));
      }

      if (allocationsData.status === 'fulfilled' && Array.isArray(allocationsData.value)) {
        setRecentAllocations(allocationsData.value.map(normalizeAllocation).slice(0, 5));
      }

      if (bookingsData.status === 'fulfilled' && Array.isArray(bookingsData.value)) {
        setRecentBookings(bookingsData.value.map(normalizeBooking).slice(0, 5));
      }

      if (maintenanceData.status === 'fulfilled' && Array.isArray(maintenanceData.value)) {
        setRecentMaintenance(maintenanceData.value.map(normalizeMaintenance).slice(0, 5));
      }

      if (notifData.status === 'fulfilled' && Array.isArray(notifData.value)) {
        setNotifications(notifData.value.map(normalizeNotification).slice(0, 5));
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  const deptLabels = Object.keys(analytics.deptDistribution || {});
  const deptValues = Object.values(analytics.deptDistribution || {});

  const deptChartData = {
    labels: deptLabels.length ? deptLabels : ['IT', 'HR', 'Finance', 'Operations', 'Sales'],
    datasets: [
      {
        data: deptValues.length ? deptValues : [24, 12, 15, 18, 10],
        backgroundColor: ['#2563EB', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1']
      }
    ]
  };

  const statusLabels = Object.keys(analytics.statusDistribution || {});
  const statusValues = Object.values(analytics.statusDistribution || {});

  const statusChartData = {
    labels: statusLabels.length ? statusLabels : ['Active', 'Available', 'Maintenance'],
    datasets: [
      {
        label: 'Asset Count',
        data: statusValues.length ? statusValues : [42, 12, 6],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
        borderRadius: 6
      }
    ]
  };

  return (
    <PageContainer
      title={`Welcome back, ${userName}`}
      subtitle="Enterprise IT Asset & Resource Operations Overview"
      actions={
        <div className="d-flex gap-2">
          <NavLink to="/assets" className="btn btn-primary-custom text-white btn-sm">
            <i className="fa-solid fa-boxes-stacked me-1.5"></i>Manage Assets
          </NavLink>
          <NavLink to="/reports" className="btn btn-secondary-custom btn-sm">
            <i className="fa-solid fa-chart-line me-1.5"></i>View Analytics
          </NavLink>
        </div>
      }
    >
      {/* Top Statistic KPI Cards */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card-custom mb-0 stat-card h-100">
              <div>
                <span className="text-muted fs-8 fw-semibold text-uppercase">Total Assets</span>
                <h3 className="fw-bold my-1 text-primary">
                  {analytics.totalAssetsCount || recentAssets.length || 0}
                </h3>
                <small className="text-muted">Registered in System</small>
              </div>
              <div className="stat-icon bg-primary-subtle text-primary">
                <i className="fa-solid fa-cubes"></i>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card-custom mb-0 stat-card h-100">
              <div>
                <span className="text-muted fs-8 fw-semibold text-uppercase">Total Asset Value</span>
                <h3 className="fw-bold my-1 text-success">
                  {formatCurrency(analytics.totalValuation || 0)}
                </h3>
                <small className="text-muted">Valuation in INR</small>
              </div>
              <div className="stat-icon bg-success-subtle text-success">
                <i className="fa-solid fa-indian-rupee-sign"></i>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card-custom mb-0 stat-card h-100">
              <div>
                <span className="text-muted fs-8 fw-semibold text-uppercase">Active Loans</span>
                <h3 className="fw-bold my-1 text-info">
                  {recentAllocations.filter((a) => a.status === 'Approved').length || 8}
                </h3>
                <small className="text-muted">Assigned to Employees</small>
              </div>
              <div className="stat-icon bg-info-subtle text-info">
                <i className="fa-solid fa-handshake"></i>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card-custom mb-0 stat-card h-100">
              <div>
                <span className="text-muted fs-8 fw-semibold text-uppercase">Maintenance Cost</span>
                <h3 className="fw-bold my-1 text-danger">
                  {formatCurrency(analytics.totalMaintenanceCost || 0)}
                </h3>
                <small className="text-muted">Total Servicing Spent</small>
              </div>
              <div className="stat-icon bg-danger-subtle text-danger">
                <i className="fa-solid fa-screwdriver-wrench"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">
                <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Department Distribution
              </h5>
              <NavLink to="/reports" className="btn btn-sm btn-link p-0 text-decoration-none">
                Details →
              </NavLink>
            </div>
            <div style={{ height: 260, position: 'relative' }} className="d-flex align-items-center justify-content-center">
              <Doughnut
                data={deptChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
                }}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">
                <i className="fa-solid fa-chart-column me-2 text-primary"></i>Asset Status Breakdown
              </h5>
              <NavLink to="/assets" className="btn btn-sm btn-link p-0 text-decoration-none">
                Inventory →
              </NavLink>
            </div>
            <div style={{ height: 260, position: 'relative' }}>
              <Bar
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { color: gridColor }, ticks: { color: textColor } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor } }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Grids */}
      <div className="row g-4 mb-4">
        {/* Recent Assets */}
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-uppercase fs-7 text-primary">
                <i className="fa-solid fa-boxes-stacked me-2"></i>Recent Assets
              </h6>
              <NavLink to="/assets" className="btn btn-sm btn-secondary-custom px-2 py-1 fs-8">
                View All
              </NavLink>
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th>ID</th>
                    <th>Asset Name</th>
                    <th>Serial No</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td><strong className="text-primary">{asset.id}</strong></td>
                      <td className="fw-semibold">{asset.name}</td>
                      <td><code>{asset.serial}</code></td>
                      <td className="text-success fw-medium">{formatCurrency(asset.value)}</td>
                      <td><StatusBadge value={asset.status} /></td>
                    </tr>
                  ))}
                  {recentAssets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">No recent assets.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Allocations */}
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-uppercase fs-7 text-primary">
                <i className="fa-solid fa-right-left me-2"></i>Recent Allocations
              </h6>
              <NavLink to="/allocation" className="btn btn-sm btn-secondary-custom px-2 py-1 fs-8">
                View All
              </NavLink>
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th>ID</th>
                    <th>Asset</th>
                    <th>User</th>
                    <th>Dept</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAllocations.map((alloc) => (
                    <tr key={alloc.id}>
                      <td><strong className="text-primary">{alloc.id}</strong></td>
                      <td>{alloc.assetName}</td>
                      <td className="fw-medium">{alloc.allocatedTo}</td>
                      <td>{alloc.department}</td>
                      <td><StatusBadge value={alloc.status} /></td>
                    </tr>
                  ))}
                  {recentAllocations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">No recent allocations.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Dashboard Row: Resource Bookings & System Notifications */}
      <div className="row g-4">
        {/* Bookings */}
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-uppercase fs-7 text-primary">
                <i className="fa-solid fa-calendar-check me-2"></i>Upcoming Bookings
              </h6>
              <NavLink to="/booking" className="btn btn-sm btn-secondary-custom px-2 py-1 fs-8">
                View Calendar
              </NavLink>
            </div>
            <div className="d-flex flex-column gap-2">
              {recentBookings.map((b) => (
                <div key={b.id} className="d-flex justify-content-between align-items-center p-2 rounded border bg-body-tertiary">
                  <div>
                    <span className="fw-semibold me-2" style={{ color: 'var(--text-color)' }}>{b.resourceName}</span>
                    <small className="text-muted">by {b.bookedBy} ({b.department})</small>
                  </div>
                  <div className="text-end">
                    <StatusBadge value={b.status} />
                    <small className="d-block text-muted fs-8 mt-0.5">{b.date} ({b.startTime} - {b.endTime})</small>
                  </div>
                </div>
              ))}
              {recentBookings.length === 0 && (
                <div className="text-muted small text-center py-3">No upcoming bookings.</div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Widget */}
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-uppercase fs-7 text-primary">
                <i className="fa-solid fa-bell me-2"></i>System Notifications
              </h6>
              <NavLink to="/notifications" className="btn btn-sm btn-secondary-custom px-2 py-1 fs-8">
                All Activity
              </NavLink>
            </div>
            <div className="d-flex flex-column gap-2">
              {notifications.map((n) => (
                <div key={n.id} className="d-flex align-items-start gap-2.5 p-2 rounded border bg-body-tertiary">
                  <div className="badge bg-primary-subtle text-primary rounded-circle p-2 mt-1">
                    <i className="fa-solid fa-circle-info fs-7"></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="fs-8" style={{ color: 'var(--text-color)' }}>{n.title}</strong>
                      <small className="text-muted fs-8">{n.date}</small>
                    </div>
                    <p className="mb-0 text-muted small">{n.message}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-muted small text-center py-3">No system notifications.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
