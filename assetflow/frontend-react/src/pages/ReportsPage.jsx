import React, { useState, useEffect } from 'react';
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
import { PageContainer } from '../components/layout/AppLayout';
import { SkeletonCards } from '../components/ui/SkeletonLoader';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalValuation: 0,
    totalMaintenanceCost: 0,
    totalAssetsCount: 0,
    deptDistribution: {},
    statusDistribution: {},
    mostUsedList: [],
    idleList: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dataService.reports.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.warn('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Assets Registered', analytics.totalAssetsCount || 0],
      ['Total Asset Valuation (INR)', analytics.totalValuation || 0],
      ['Total Maintenance Expenses (INR)', analytics.totalMaintenanceCost || 0],
      ['---', '---'],
      ['Department Breakdown', 'Asset Count'],
      ...Object.entries(analytics.deptDistribution || {}).map(([d, c]) => [d, c]),
      ['---', '---'],
      ['Status Breakdown', 'Count'],
      ...Object.entries(analytics.statusDistribution || {}).map(([s, c]) => [s, c])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AssetFlow_Enterprise_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  const deptLabels = Object.keys(analytics.deptDistribution || {});
  const deptValues = Object.values(analytics.deptDistribution || {});

  const deptChartData = {
    labels: deptLabels.length ? deptLabels : ['IT', 'HR', 'Finance', 'Ops'],
    datasets: [
      {
        data: deptValues.length ? deptValues : [18, 8, 12, 22],
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
      title="System Analytics"
      subtitle="Generate, review, and export financial and operational reports"
      actions={
        <div className="d-flex gap-2">
          <button className="btn btn-secondary-custom btn-sm" onClick={exportCsv}>
            <i className="fa-solid fa-file-csv me-1.5 text-success"></i>Export CSV
          </button>
          <button className="btn btn-secondary-custom btn-sm" onClick={() => window.print()}>
            <i className="fa-solid fa-file-pdf me-1.5 text-danger"></i>Export PDF / Print
          </button>
        </div>
      }
    >
      {/* Live KPI Cards matching original reports.html */}
      {loading ? (
        <SkeletonCards count={2} />
      ) : (
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card-custom mb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-7 fw-semibold text-uppercase">Total Assets Registered</span>
                  <h3 className="fw-bold my-1 text-success">{analytics.totalAssetsCount}</h3>
                  <small className="text-muted">
                    Total Valuation: <strong>₹{Number(analytics.totalValuation || 0).toLocaleString('en-IN')}</strong>
                  </small>
                </div>
                <div className="stat-icon bg-success-subtle text-success">
                  <i className="fa-solid fa-cubes"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card-custom mb-0">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-muted fs-7 fw-semibold text-uppercase">Maintenance Expenses</span>
                  <h3 className="fw-bold my-1 text-danger">
                    ₹{Number(analytics.totalMaintenanceCost || 0).toLocaleString('en-IN')}
                  </h3>
                  <small className="text-muted">Total repair & servicing expenditure</small>
                </div>
                <div className="stat-icon bg-danger-subtle text-danger">
                  <i className="fa-solid fa-wrench"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="row g-4 mb-4">
        {/* Chart 1: Department Asset Distribution */}
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <h5 className="fw-bold mb-1 d-flex align-items-center">
              <i className="fa-solid fa-chart-pie me-2 text-primary"></i>Department Asset Distribution
            </h5>
            <p className="text-muted small mb-3">Live percentage breakdown of assets per department</p>
            <div style={{ height: 280, position: 'relative' }} className="d-flex align-items-center justify-content-center">
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

        {/* Chart 2: Asset Status Breakdown */}
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <h5 className="fw-bold mb-1 d-flex align-items-center">
              <i className="fa-solid fa-chart-column me-2 text-primary"></i>Asset Status Breakdown
            </h5>
            <p className="text-muted small mb-3">Active vs In Stock vs Maintenance status counts</p>
            <div style={{ height: 280, position: 'relative' }}>
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

      {/* Live Asset Insights Grid */}
      <div className="row g-4 mb-4">
        {/* List 1: Most Used Assets */}
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-uppercase text-danger fs-7">
                <i className="fa-solid fa-fire me-2 text-danger"></i>Most Used Assets & Resources
              </h6>
              <span className="badge bg-danger-subtle text-danger rounded-pill px-2.5 py-0.5 fs-8 fw-bold">
                Live Utilization
              </span>
            </div>
            <div className="d-flex flex-column gap-2.5">
              {(analytics.mostUsedList || []).map((item) => (
                <div
                  key={item.name}
                  className="d-flex justify-content-between align-items-center p-2.5 rounded border bg-body-tertiary"
                >
                  <span className="fw-semibold" style={{ color: 'var(--text-color)' }}>
                    {item.name}
                  </span>
                  <span className="badge bg-primary rounded-pill px-2.5 py-1">
                    {item.count} Active Bookings / Loans
                  </span>
                </div>
              ))}
              {(!analytics.mostUsedList || analytics.mostUsedList.length === 0) && (
                <div className="text-muted small text-center py-4">No utilization data yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* List 2: Idle Assets in Stock */}
        <div className="col-lg-6">
          <div className="card-custom h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-uppercase text-primary fs-7">
                <i className="fa-solid fa-boxes-stacked me-2 text-primary"></i>Idle Assets Available in Stock
              </h6>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-2.5 py-0.5 fs-8 fw-bold">
                Ready to Assign
              </span>
            </div>
            <div className="d-flex flex-column gap-2.5">
              {(analytics.idleList || []).map((item) => (
                <div
                  key={item.id}
                  className="d-flex justify-content-between align-items-center p-2.5 rounded border bg-body-tertiary"
                >
                  <div>
                    <strong className="text-primary me-2">{item.id}</strong>
                    <span style={{ color: 'var(--text-color)' }}>{item.name}</span>
                  </div>
                  <small className="text-muted">Location: {item.location}</small>
                </div>
              ))}
              {(!analytics.idleList || analytics.idleList.length === 0) && (
                <div className="text-muted small text-center py-4">All registered assets are currently allocated.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
