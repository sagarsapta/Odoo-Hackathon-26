import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { PageContainer } from '../components/layout/AppLayout';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SkeletonCards } from '../components/ui/SkeletonLoader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'Employee';
  const userDept = user?.department || 'IT';
  const userName = user?.fullName || user?.name || 'Rahul Sharma';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    assets: [],
    allocations: [],
    bookings: [],
    maintenance: [],
    notifications: [],
    departments: [],
    users: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [assets, allocations, bookings, maintenance, notifications, departments, users] = await Promise.all([
        dataService.assets.list(),
        dataService.allocations.list(),
        dataService.bookings.list(),
        dataService.maintenance.list(),
        dataService.notifications.list(),
        dataService.departments.list(),
        dataService.users.list()
      ]);
      setData({ assets, allocations, bookings, maintenance, notifications, departments, users });
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered views based on RBAC matching original frontend dashboard.js
  const filteredAssets = useMemo(() => {
    if (role === 'Department Head' || role === 'DepartmentHead') {
      const deptLower = (userDept || '').toLowerCase();
      return data.assets.filter(
        (a) => (a.department || '').toLowerCase().includes(deptLower) || (a.owner || '').toLowerCase().includes(deptLower)
      );
    }
    if (role === 'Employee') {
      const nameLower = userName.toLowerCase();
      return data.assets.filter((a) => (a.owner || '').toLowerCase() === nameLower);
    }
    return data.assets;
  }, [data.assets, role, userDept, userName]);

  const totalValue = useMemo(() => {
    return filteredAssets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
  }, [filteredAssets]);

  // Welcome banner titles
  const welcomeTitle = useMemo(() => {
    if (role === 'Department Head' || role === 'DepartmentHead') return `${userDept} Department`;
    if (role === 'Admin') return 'Dashboard - Admin Portal';
    return `Dashboard - ${role} Portal`;
  }, [role, userDept]);

  // Quick action items matching original dashboard.js
  const quickActions = useMemo(() => {
    if (role === 'Admin') {
      return [
        { label: 'Register Asset', icon: 'fa-plus', link: '/assets', cls: 'btn-primary-custom text-white' },
        { label: 'Create Department', icon: 'fa-sitemap', link: '/org-setup', cls: 'btn-secondary-custom' },
        { label: 'Start Audit', icon: 'fa-clipboard-check', link: '/audit', cls: 'btn-secondary-custom' },
        { label: 'View Reports', icon: 'fa-chart-pie', link: '/reports', cls: 'btn-secondary-custom' }
      ];
    }
    if (role === 'Asset Manager' || role === 'AssetManager') {
      return [
        { label: 'Register Asset', icon: 'fa-plus', link: '/assets', cls: 'btn-primary-custom text-white' },
        { label: 'Allocate Asset', icon: 'fa-right-left', link: '/allocation', cls: 'btn-secondary-custom' },
        { label: 'Approve Maintenance', icon: 'fa-screwdriver-wrench', link: '/maintenance', cls: 'btn-secondary-custom' },
        { label: 'Start Audit', icon: 'fa-clipboard-check', link: '/audit', cls: 'btn-secondary-custom' }
      ];
    }
    if (role === 'Department Head' || role === 'DepartmentHead') {
      return [
        { label: 'Approve Allocation', icon: 'fa-check-double', link: '/allocation', cls: 'btn-primary-custom text-white' },
        { label: 'Book Resource', icon: 'fa-calendar-check', link: '/booking', cls: 'btn-secondary-custom' },
        { label: 'Department Reports', icon: 'fa-chart-pie', link: '/reports', cls: 'btn-secondary-custom' }
      ];
    }
    return [
      { label: 'Book Resource', icon: 'fa-calendar-plus', link: '/booking', cls: 'btn-primary-custom text-white' },
      { label: 'Raise Maintenance', icon: 'fa-screwdriver-wrench', link: '/maintenance', cls: 'btn-secondary-custom' },
      { label: 'Request Asset', icon: 'fa-boxes-stacked', link: '/assets', cls: 'btn-secondary-custom' }
    ];
  }, [role]);

  // KPI cards list
  const kpiCards = useMemo(() => {
    if (role === 'Admin') {
      return [
        { label: 'Total Assets', val: data.assets.length, desc: `₹${totalValue.toLocaleString('en-IN')}`, icon: 'fa-boxes-stacked', bg: 'bg-primary-subtle text-primary' },
        { label: 'Total Departments', val: data.departments.length || 7, desc: 'Enterprise units', icon: 'fa-sitemap', bg: 'bg-warning-subtle text-warning' },
        { label: 'Registered Staff', val: data.users.length || 12, desc: 'Active directory accounts', icon: 'fa-users', bg: 'bg-info-subtle text-info' },
        { label: 'Active Audit Cycles', val: 1, desc: 'Compliance Audit active', icon: 'fa-clipboard-check', bg: 'bg-success-subtle text-success' }
      ];
    }
    if (role === 'Asset Manager' || role === 'AssetManager') {
      return [
        { label: 'Available Assets', val: data.assets.filter((a) => a.status === 'Available' || !a.owner).length, desc: 'Ready for allocation', icon: 'fa-circle-check', bg: 'bg-success-subtle text-success' },
        { label: 'Allocated Assets', val: data.allocations.filter((a) => a.status === 'Approved').length, desc: 'In custody with staff', icon: 'fa-right-left', bg: 'bg-info-subtle text-info' },
        { label: 'Pending Allocations', val: data.allocations.filter((a) => a.status.includes('Pending')).length, desc: 'Requires approval', icon: 'fa-clock', bg: 'bg-warning-subtle text-warning' },
        { label: 'Maintenance Requests', val: data.maintenance.filter((m) => m.status === 'Pending').length, desc: 'Unassigned jobs', icon: 'fa-screwdriver-wrench', bg: 'bg-primary-subtle text-primary' }
      ];
    }
    if (role === 'Department Head' || role === 'DepartmentHead') {
      return [
        { label: 'Department Assets', val: filteredAssets.length, desc: `${userDept} Department Resources`, icon: 'fa-boxes-stacked', bg: 'bg-primary-subtle text-primary' },
        { label: 'Pending Approvals', val: data.allocations.filter((a) => a.status.includes('Pending')).length, desc: 'Awaiting your review', icon: 'fa-right-left', bg: 'bg-warning-subtle text-warning' },
        { label: 'Department Bookings', val: data.bookings.filter((b) => b.status === 'Confirmed').length, desc: 'Active room reservations', icon: 'fa-calendar-check', bg: 'bg-success-subtle text-success' },
        { label: 'Open Issues', val: data.maintenance.filter((m) => m.status === 'Pending').length, desc: 'Under review', icon: 'fa-screwdriver-wrench', bg: 'bg-danger-subtle text-danger' }
      ];
    }
    return [
      { label: 'My Assigned Assets', val: filteredAssets.length, desc: 'In your custody', icon: 'fa-user-gear', bg: 'bg-info-subtle text-info' },
      { label: 'Department Assets', val: data.assets.filter((a) => a.department === userDept).length, desc: `${userDept} pool`, icon: 'fa-boxes-stacked', bg: 'bg-primary-subtle text-primary' },
      { label: 'Upcoming Bookings', val: data.bookings.filter((b) => b.status === 'Confirmed').length, desc: 'Your active slots', icon: 'fa-calendar-days', bg: 'bg-success-subtle text-success' },
      { label: 'My Maintenance', val: data.maintenance.filter((m) => m.status === 'Pending').length, desc: 'Reported repairs', icon: 'fa-screwdriver-wrench', bg: 'bg-warning-subtle text-warning' }
    ];
  }, [role, data, filteredAssets, totalValue, userDept]);

  // Chart data definitions
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  const depreciationChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Asset Initial Value',
        data: [150000, 180000, 220000, 210000, 250000, totalValue || 450000],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Depreciated Value',
        data: [110000, 130000, 150000, 140000, 160000, Math.round((totalValue || 450000) * 0.72)],
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  const assetTypeMap = {};
  data.assets.forEach((a) => {
    assetTypeMap[a.type] = (assetTypeMap[a.type] || 0) + 1;
  });

  const distributionChartData = {
    labels: Object.keys(assetTypeMap).slice(0, 5),
    datasets: [
      {
        data: Object.values(assetTypeMap).slice(0, 5),
        backgroundColor: ['#2563EB', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
      }
    ]
  };

  const deptAssetsChartData = {
    labels: ['Laptops', 'Monitors', 'Networking', 'Printers', 'Accessories'],
    datasets: [
      {
        label: 'Quantity',
        data: [12, 8, 4, 6, 15],
        backgroundColor: '#8B5CF6',
        borderRadius: 6
      }
    ]
  };

  return (
    <PageContainer
      title={welcomeTitle}
      subtitle="Real-time status of enterprise assets & bookings"
      actions={
        <button className="btn btn-secondary-custom" onClick={loadData}>
          <i className="fa-solid fa-rotate me-2"></i>Refresh Data
        </button>
      }
    >
      {/* Quick Actions Panel */}
      {quickActions.length > 0 && (
        <div className="card-custom mb-4 py-3">
          <h6 className="fw-bold mb-3 d-flex align-items-center">
            <i className="fa-solid fa-bolt me-2 text-warning"></i>Quick Actions
          </h6>
          <div className="d-flex flex-wrap gap-2.5">
            {quickActions.map((act) => (
              <Link key={act.label} to={act.link} className={`btn ${act.cls} d-flex align-items-center gap-2`}>
                <i className={`fa-solid ${act.icon}`}></i>
                <span>{act.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="row g-4 mb-4">
          {kpiCards.map((card) => (
            <div className="col-xl-3 col-md-6" key={card.label}>
              <StatCard label={card.label} value={card.val} desc={card.desc} icon={card.icon} bg={card.bg} />
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        {role === 'Admin' || role === 'Asset Manager' || role === 'AssetManager' ? (
          <>
            <div className="col-lg-8">
              <div className="card-custom h-100 mb-0">
                <h5 className="fw-bold mb-3 d-flex align-items-center">
                  <i className="fa-solid fa-chart-line me-2 text-primary"></i>Asset Valuation & Depreciation Trend
                </h5>
                <div style={{ height: 320, position: 'relative' }}>
                  <Line
                    data={depreciationChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { labels: { color: textColor } } },
                      scales: {
                        x: { grid: { color: gridColor }, ticks: { color: textColor } },
                        y: { grid: { color: gridColor }, ticks: { color: textColor } }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card-custom h-100 mb-0">
                <h5 className="fw-bold mb-3 d-flex align-items-center">
                  <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Asset Category Breakdown
                </h5>
                <div style={{ height: 260, position: 'relative' }} className="d-flex align-items-center justify-content-center">
                  <Doughnut
                    data={distributionChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="col-lg-6">
              <div className="card-custom h-100 mb-0">
                <h5 className="fw-bold mb-3 d-flex align-items-center">
                  <i className="fa-solid fa-chart-column me-2 text-primary"></i>Department Resource Allocation
                </h5>
                <div style={{ height: 300, position: 'relative' }}>
                  <Bar
                    data={deptAssetsChartData}
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
            <div className="col-lg-6">
              <div className="card-custom h-100 mb-0">
                <h5 className="fw-bold mb-3 d-flex align-items-center">
                  <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Status Distribution
                </h5>
                <div style={{ height: 260, position: 'relative' }} className="d-flex align-items-center justify-content-center">
                  <Doughnut
                    data={{
                      labels: ['Active', 'Available', 'Maintenance'],
                      datasets: [
                        {
                          data: [
                            data.assets.filter((a) => a.status === 'Active').length,
                            data.assets.filter((a) => a.status === 'Available' || !a.owner).length,
                            data.assets.filter((a) => a.status === 'Maintenance').length
                          ],
                          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B']
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Row: Activity Timeline + Recent Bookings */}
      <div className="row g-4 mb-4">
        {/* Activity Timeline */}
        <div className="col-lg-5">
          <div className="card-custom h-100 mb-0">
            <h5 className="fw-bold mb-3 d-flex align-items-center">
              <i className="fa-solid fa-history me-2 text-primary"></i>Recent System Activity
            </h5>
            <div className="timeline">
              {data.notifications.slice(0, 4).map((n) => (
                <div className="timeline-item" key={n.id}>
                  <span className="small fw-semibold d-block" style={{ color: 'var(--text-color)' }}>
                    {n.title}
                  </span>
                  <p className="text-muted small mb-1">{n.message}</p>
                  <small className="text-muted fs-8">
                    <i className="fa-regular fa-clock me-1"></i>
                    {n.date}
                  </small>
                </div>
              ))}
              {data.notifications.length === 0 && (
                <p className="text-muted small">No recent activity.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="col-lg-7">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center">
                <i className="fa-solid fa-calendar-check me-2 text-primary"></i>Upcoming Resource Bookings
              </h5>
              <Link to="/booking" className="text-primary text-decoration-none small fw-semibold">
                View Calendar <i className="fa-solid fa-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="table-custom-wrapper">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Booked By</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.slice(0, 4).map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.resourceName}</strong>
                      </td>
                      <td>{b.bookedBy}</td>
                      <td className="small">
                        {b.date} ({b.startTime} - {b.endTime})
                      </td>
                      <td>
                        <StatusBadge value={b.status} />
                      </td>
                    </tr>
                  ))}
                  {data.bookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">
                        No upcoming bookings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
