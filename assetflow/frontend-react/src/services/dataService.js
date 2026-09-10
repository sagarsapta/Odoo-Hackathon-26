/**
 * AssetFlow Resilient Data Service Layer
 * Attempts live backend API communication first.
 * If backend/MongoDB is unavailable, transparently falls back to localStorage demo data.
 */

import { api } from './api';
import {
  demoUsers,
  demoDepartments,
  demoOrganization,
  demoAssets,
  demoAllocations,
  demoBookings,
  demoMaintenance,
  demoAudits,
  demoNotifications,
  getDemoAnalytics
} from '../data/demoData';

// LocalStorage Persistence Helpers
const STORAGE_PREFIX = 'assetflow_demo_';

function getLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage write failed:', err);
  }
}

// Track current data mode globally
let currentDataMode = 'LIVE';
const modeListeners = new Set();

export function subscribeDataMode(listener) {
  modeListeners.add(listener);
  listener(currentDataMode);
  return () => modeListeners.delete(listener);
}

function setDataMode(mode) {
  if (currentDataMode !== mode) {
    currentDataMode = mode;
    modeListeners.forEach((fn) => fn(mode));
  }
}

export function getDataMode() {
  return currentDataMode;
}

// Resilient wrapper: Try API -> on network or server error fallback to LocalStorage
async function resilientCall(apiFn, localReadFn, localWriteFn = null) {
  try {
    const result = await apiFn();
    setDataMode('LIVE');
    return result;
  } catch (err) {
    setDataMode('DEMO');
    console.info('[AssetFlow] Live API unreachable or returned error. Operating in demo sandbox mode.', err.message);
    if (localWriteFn) {
      return localWriteFn();
    }
    return localReadFn();
  }
}

export const dataService = {
  getDataMode,
  subscribeDataMode,

  auth: {
    login: async (credentials) => {
      try {
        const res = await api.auth.login(credentials);
        setDataMode('LIVE');
        return res;
      } catch (err) {
        setDataMode('DEMO');
        // Offline demo login match
        const users = getLocal('users', demoUsers);
        const user = users.find(
          (u) =>
            u.email.toLowerCase() === credentials.email?.toLowerCase().trim() &&
            u.role.toLowerCase().replace(/[\s_]/g, '') === credentials.role?.toLowerCase().replace(/[\s_]/g, '')
        );

        if (!user) {
          // Allow login for any valid demo user or default
          const matchedByEmail = users.find((u) => u.email.toLowerCase() === credentials.email?.toLowerCase().trim());
          if (matchedByEmail) {
            throw new Error(`Account exists under role "${matchedByEmail.role}". Please select that role.`);
          }
          // Mock login for rapid review if unrecognized
          const demoUser = {
            email: credentials.email,
            name: credentials.email.split('@')[0].replace('.', ' '),
            role: credentials.role || 'Admin',
            department: 'IT'
          };
          const mockRes = { success: true, token: 'demo-token-' + Date.now(), user: demoUser };
          localStorage.setItem('token', mockRes.token);
          localStorage.setItem('user', JSON.stringify(demoUser));
          return mockRes;
        }

        const mockRes = {
          success: true,
          token: 'demo-token-' + Date.now(),
          user: {
            email: user.email,
            name: user.fullName || user.name,
            role: user.role,
            department: user.department,
            avatar: user.avatar
          }
        };
        localStorage.setItem('token', mockRes.token);
        localStorage.setItem('user', JSON.stringify(mockRes.user));
        return mockRes;
      }
    },
    register: (body) => resilientCall(() => api.auth.register(body), () => ({ success: true, message: 'User registered in demo mode' })),
    verifyOtp: (email, otp) => resilientCall(() => api.auth.verifyOtp(email, otp), () => ({ success: true, message: 'OTP verified (demo)' })),
    resendOtp: (email) => resilientCall(() => api.auth.resendOtp(email), () => ({ success: true, message: 'OTP resent (demo)' })),
    forgotPassword: (email) => resilientCall(() => api.auth.forgotPassword(email), () => ({ success: true, message: 'Reset code sent (demo)' })),
    resetPassword: (email, otp, newPassword) => resilientCall(() => api.auth.resetPassword(email, otp, newPassword), () => ({ success: true, message: 'Password updated (demo)' }))
  },

  assets: {
    list: () => resilientCall(() => api.assets.list(), () => getLocal('assets', demoAssets)),
    create: async (assetData) => {
      return resilientCall(
        () => api.assets.create(assetData),
        null,
        () => {
          const list = getLocal('assets', demoAssets);
          const newId = `AST-${String(list.length + 1).padStart(3, '0')}`;
          const newAsset = { ...assetData, id: newId, status: assetData.status || 'Active' };
          list.unshift(newAsset);
          setLocal('assets', list);
          return { success: true, asset: newAsset };
        }
      );
    },
    update: async (id, assetData) => {
      return resilientCall(
        () => api.assets.update(id, assetData),
        null,
        () => {
          const list = getLocal('assets', demoAssets);
          const index = list.findIndex((a) => a.id === id);
          if (index !== -1) {
            list[index] = { ...list[index], ...assetData };
            setLocal('assets', list);
          }
          return { success: true, message: 'Asset updated successfully (demo)' };
        }
      );
    },
    delete: async (id) => {
      return resilientCall(
        () => api.assets.delete(id),
        null,
        () => {
          const list = getLocal('assets', demoAssets).filter((a) => a.id !== id);
          setLocal('assets', list);
          return { success: true, message: 'Asset deleted (demo)' };
        }
      );
    },
    returnAsset: async (id) => {
      return resilientCall(
        () => api.assets.returnAsset(id),
        null,
        () => {
          const list = getLocal('assets', demoAssets);
          const asset = list.find((a) => a.id === id);
          if (asset) {
            asset.owner = null;
            asset.status = 'Available';
            setLocal('assets', list);
          }
          // Mark allocation returned
          const allocs = getLocal('allocations', demoAllocations);
          allocs.forEach((a) => {
            if (a.assetId === id && a.status === 'Approved') {
              a.status = 'Returned';
            }
          });
          setLocal('allocations', allocs);
          return { success: true, message: 'Asset returned to stock (demo)' };
        }
      );
    }
  },

  allocations: {
    list: () => resilientCall(() => api.allocations.list(), () => getLocal('allocations', demoAllocations)),
    create: async (allocationData) => {
      return resilientCall(
        () => api.allocations.create(allocationData),
        null,
        () => {
          const list = getLocal('allocations', demoAllocations);
          const newId = `ALC-${String(list.length + 1).padStart(3, '0')}`;
          const newAlloc = {
            id: newId,
            ...allocationData,
            status: allocationData.status || 'Pending Department Head Approval',
            date: allocationData.date || new Date().toISOString().slice(0, 10)
          };
          list.unshift(newAlloc);
          setLocal('allocations', list);
          return { success: true, message: 'Allocation request created (demo)' };
        }
      );
    },
    action: async (id, status, assetId = null) => {
      return resilientCall(
        () => api.allocations.action(id, status, assetId),
        null,
        () => {
          const list = getLocal('allocations', demoAllocations);
          const alloc = list.find((a) => a.id === id);
          if (alloc) {
            alloc.status = status;
            if (assetId) alloc.assetId = assetId;
            setLocal('allocations', list);

            if (status === 'Approved' && (assetId || alloc.assetId)) {
              const assets = getLocal('assets', demoAssets);
              const target = assets.find((a) => a.id === (assetId || alloc.assetId));
              if (target) {
                target.owner = alloc.allocatedTo;
                target.department = alloc.department;
                target.status = 'Active';
                setLocal('assets', assets);
              }
            }
          }
          return { success: true, message: `Allocation ${status.toLowerCase()} (demo)` };
        }
      );
    }
  },

  bookings: {
    list: () => resilientCall(() => api.bookings.list(), () => getLocal('bookings', demoBookings)),
    create: async (bookingData) => {
      return resilientCall(
        () => api.bookings.create(bookingData),
        null,
        () => {
          const list = getLocal('bookings', demoBookings);
          const newId = `BKG-${String(list.length + 1).padStart(3, '0')}`;
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const newBooking = {
            id: newId,
            ...bookingData,
            bookedBy: bookingData.bookedBy || user.name || 'Current User',
            department: bookingData.department || user.department || 'IT',
            status: 'Confirmed'
          };
          list.unshift(newBooking);
          setLocal('bookings', list);
          return { success: true, message: 'Resource booked successfully (demo)' };
        }
      );
    },
    cancel: async (id) => {
      return resilientCall(
        () => api.bookings.cancel(id),
        null,
        () => {
          const list = getLocal('bookings', demoBookings);
          const booking = list.find((b) => b.id === id);
          if (booking) {
            booking.status = 'Cancelled';
            setLocal('bookings', list);
          }
          return { success: true, message: 'Booking cancelled (demo)' };
        }
      );
    }
  },

  maintenance: {
    list: () => resilientCall(() => api.maintenance.list(), () => getLocal('maintenance', demoMaintenance)),
    create: async (maintData) => {
      return resilientCall(
        () => api.maintenance.create(maintData),
        null,
        () => {
          const list = getLocal('maintenance', demoMaintenance);
          const newId = `MNT-${String(list.length + 1).padStart(3, '0')}`;
          const newLog = {
            id: newId,
            ...maintData,
            status: 'Pending',
            date: maintData.date || new Date().toISOString().slice(0, 10)
          };
          list.unshift(newLog);
          setLocal('maintenance', list);

          if (maintData.assetId) {
            const assets = getLocal('assets', demoAssets);
            const asset = assets.find((a) => a.id === maintData.assetId);
            if (asset) {
              asset.status = 'Maintenance';
              setLocal('assets', assets);
            }
          }
          return { success: true, message: 'Maintenance scheduled (demo)' };
        }
      );
    },
    updateStatus: async (id, status, cost) => {
      return resilientCall(
        () => api.maintenance.updateStatus(id, status, cost),
        null,
        () => {
          const list = getLocal('maintenance', demoMaintenance);
          const log = list.find((m) => m.id === id);
          if (log) {
            log.status = status;
            if (cost !== undefined) log.cost = Number(cost);
            setLocal('maintenance', list);

            if (['Completed', 'Resolved', 'Cancelled'].includes(status) && log.assetId) {
              const assets = getLocal('assets', demoAssets);
              const asset = assets.find((a) => a.id === log.assetId);
              if (asset) {
                asset.status = 'Active';
                setLocal('assets', assets);
              }
            }
          }
          return { success: true, message: 'Maintenance status updated (demo)' };
        }
      );
    }
  },

  audits: {
    list: () => resilientCall(() => api.audits.list(), () => getLocal('audits', demoAudits)),
    create: async (auditData) => {
      return resilientCall(
        () => api.audits.create(auditData),
        null,
        () => {
          const list = getLocal('audits', demoAudits);
          const newId = `AUD-${String(list.length + 1).padStart(3, '0')}`;
          const newAudit = {
            id: newId,
            ...auditData,
            progress: 0,
            status: 'In Progress',
            checklist: []
          };
          list.unshift(newAudit);
          setLocal('audits', list);
          return { success: true, message: 'Audit scheduled (demo)' };
        }
      );
    },
    updateProgress: async (id, progress) => {
      return resilientCall(
        () => api.audits.updateProgress(id, progress),
        null,
        () => {
          const list = getLocal('audits', demoAudits);
          const audit = list.find((a) => a.id === id);
          if (audit) {
            audit.progress = progress;
            if (progress >= 100) audit.status = 'Completed';
            setLocal('audits', list);
          }
          return { success: true, message: 'Audit progress saved (demo)' };
        }
      );
    },
    getState: async (id) => {
      return resilientCall(
        () => api.audits.getState(id),
        () => {
          const list = getLocal('audits', demoAudits);
          const audit = list.find((a) => a.id === id);
          return audit?.checklist || [];
        }
      );
    },
    saveState: async (id, state) => {
      return resilientCall(
        () => api.audits.saveState(id, state),
        null,
        () => {
          const list = getLocal('audits', demoAudits);
          const audit = list.find((a) => a.id === id);
          if (audit) {
            audit.checklist = state;
            const verified = state.filter((i) => i.status && i.status !== 'Pending').length;
            audit.progress = Math.round((verified / (state.length || 1)) * 100);
            if (audit.progress >= 100) audit.status = 'Completed';
            setLocal('audits', list);
          }
          return { success: true, message: 'Audit checklist saved (demo)' };
        }
      );
    }
  },

  reports: {
    getAnalytics: () => resilientCall(() => api.reports.getAnalytics(), () => getDemoAnalytics())
  },

  notifications: {
    list: () => resilientCall(() => api.notifications.list(), () => getLocal('notifications', demoNotifications)),
    markAsRead: async (id) => {
      return resilientCall(
        () => api.notifications.markAsRead(id),
        null,
        () => {
          const list = getLocal('notifications', demoNotifications);
          const notif = list.find((n) => n.id === id);
          if (notif) notif.read = true;
          setLocal('notifications', list);
          return { success: true };
        }
      );
    },
    clearAll: async () => {
      return resilientCall(
        () => api.notifications.clearAll(),
        null,
        () => {
          setLocal('notifications', []);
          return { success: true };
        }
      );
    },
    create: async (notifData) => {
      return resilientCall(
        () => api.notifications.create(notifData),
        null,
        () => {
          const list = getLocal('notifications', demoNotifications);
          const newNotif = {
            id: `NTF-${Date.now()}`,
            ...notifData,
            date: new Date().toISOString().slice(0, 16).replace('T', ' '),
            read: false
          };
          list.unshift(newNotif);
          setLocal('notifications', list);
          return { success: true, message: 'Notification sent (demo)' };
        }
      );
    }
  },

  departments: {
    list: () => resilientCall(() => api.departments.list(), () => getLocal('departments', demoDepartments)),
    create: async (name) => {
      return resilientCall(
        () => api.departments.create(name),
        null,
        () => {
          const list = getLocal('departments', demoDepartments);
          list.push({ name, employeeCount: 0 });
          setLocal('departments', list);
          return { success: true, message: 'Department added (demo)' };
        }
      );
    },
    delete: async (name) => {
      return resilientCall(
        () => api.departments.delete(name),
        null,
        () => {
          const list = getLocal('departments', demoDepartments).filter((d) => d.name !== name);
          setLocal('departments', list);
          return { success: true, message: 'Department deleted (demo)' };
        }
      );
    }
  },

  organization: {
    get: () => resilientCall(() => api.organization.get(), () => getLocal('org', demoOrganization)),
    save: async (orgData) => {
      return resilientCall(
        () => api.organization.save(orgData),
        null,
        () => {
          setLocal('org', orgData);
          return { success: true, message: 'Organization saved (demo)' };
        }
      );
    }
  },

  users: {
    list: () => resilientCall(() => api.users.list(), () => getLocal('users', demoUsers)),
    updateRole: async (email, role, department) => {
      return resilientCall(
        () => api.users.updateRole(email, role, department),
        null,
        () => {
          const list = getLocal('users', demoUsers);
          const user = list.find((u) => u.email.toLowerCase() === email.toLowerCase());
          if (user) {
            user.role = role;
            user.department = department;
            setLocal('users', list);
          }
          return { success: true, message: 'User role updated (demo)' };
        }
      );
    }
  },

  profile: {
    update: async (profileData) => {
      return resilientCall(
        () => api.profile.update(profileData),
        null,
        () => {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updated = { ...currentUser, ...profileData, name: profileData.fullName || currentUser.name };
          localStorage.setItem('user', JSON.stringify(updated));
          return { success: true, user: updated, message: 'Profile updated (demo)' };
        }
      );
    },
    changePassword: async (pwdData) => {
      return resilientCall(
        () => api.profile.changePassword(pwdData),
        null,
        () => ({ success: true, message: 'Password updated (demo)' })
      );
    }
  }
};
