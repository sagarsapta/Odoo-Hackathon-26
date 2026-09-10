import axios from 'axios';

const API_BASE_URL = window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1') ||
  window.location.protocol === 'file:' ||
  window.location.origin === 'null'
  ? 'http://localhost:3000/api'
  : '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login');
    }
    const message = error.response?.data?.message || (!error.response ? 'Unable to connect to AssetFlow API.' : 'Something went wrong. Please try again.');
    return Promise.reject(new Error(message));
  }
);

const request = (method, url, data) => client({ method, url, data }).then((response) => response.data);
const normalizeBooking = (source = {}) => ({
  ...source,
  id: source.id || 'Unknown booking',
  resourceName: source.resourceName || source.resource || source.resource_name || 'Resource unavailable',
  bookedBy: source.bookedBy || source.bookedByName || source.userName || 'User unavailable',
  date: source.date || source.bookingDate || 'Date unavailable',
  startTime: source.startTime || source.start || '--:--',
  endTime: source.endTime || source.end || '--:--',
  status: source.status || 'Unknown',
  department: source.department || 'Unassigned'
});

export const api = {
  auth: {
    login: (body) => request('post', '/auth/login', body).then((data) => { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); return data; }),
    register: (body) => request('post', '/auth/register', body),
    verifyOtp: (email, otp) => request('post', '/auth/verify-otp', { email, otp }),
    resendOtp: (email) => request('post', '/auth/resend-otp', { email }),
    forgotPassword: (email) => request('post', '/auth/forgot-password', { email }),
    resetPassword: (email, otp, newPassword) => request('post', '/auth/reset-password', { email, otp, newPassword }),
    devReset: () => request('post', '/dev/reset-db')
  },
  users: { list: () => request('get', '/users'), updateRole: (email, role, department, oldHeadEmail = null, oldHeadStatus = null, oldHeadDetails = null) => request('put', '/users/role', { email, role, department, oldHeadEmail, oldHeadStatus, oldHeadDetails }) },
  organization: { get: () => request('get', '/org'), save: (body) => request('put', '/org', body) },
  departments: { list: () => request('get', '/departments'), create: (name) => request('post', '/departments', { name }), delete: (name) => request('delete', `/departments/${encodeURIComponent(name)}`) },
  assets: { list: () => request('get', '/assets'), create: (body) => request('post', '/assets', body), update: (id, body) => request('put', `/assets/${id}`, body), delete: (id) => request('delete', `/assets/${id}`), returnAsset: (id) => request('post', `/assets/${id}/return`) },
  allocations: { list: () => request('get', '/allocations'), create: (body) => request('post', '/allocations', body), action: (id, status, assetId = null) => request('post', `/allocations/${id}/action`, { status, assetId }) },
  bookings: { list: () => request('get', '/bookings').then((items) => Array.isArray(items) ? items.map(normalizeBooking) : []), create: (body) => request('post', '/bookings', body), cancel: (id) => request('delete', `/bookings/${id}`) },
  maintenance: { list: () => request('get', '/maintenance'), create: (body) => request('post', '/maintenance', body), updateStatus: (id, status, cost) => request('put', `/maintenance/${id}/status`, { status, ...(cost === undefined ? {} : { cost }) }) },
  audits: { list: () => request('get', '/audits'), create: (body) => request('post', '/audits', body), updateProgress: (id, progress) => request('put', `/audits/${id}/progress`, { progress }), getState: (id) => request('get', `/audits/${id}/state`).then((data) => data.state), saveState: (id, state) => request('put', `/audits/${id}/state`, { state }) },
  reports: { getAnalytics: () => request('get', '/reports/analytics') },
  notifications: { list: () => request('get', '/notifications'), markAsRead: (id) => request('post', `/notifications/${id}/read`), clearAll: () => request('delete', '/notifications'), create: (body) => request('post', '/notifications', body) },
  profile: { update: (body) => request('put', '/profile', body), changePassword: (body) => request('post', '/profile/change-password', body) }
};
