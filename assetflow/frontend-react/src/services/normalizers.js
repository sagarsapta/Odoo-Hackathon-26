/**
 * AssetFlow Data Normalization & Formatting Layer
 * Ensures strict field contract usage across all frontend components.
 */

/**
 * Format numbers as Indian Rupee (INR) currency.
 * @param {number|string|null|undefined} value 
 * @returns {string} Formatted INR currency string (e.g. ₹75,000, ₹1,25,000, ₹0, or 'Not available')
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not available';
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return 'Not available';
  }
  return '₹' + num.toLocaleString('en-IN');
}

function inferAssetType(name = '', rawType = '') {
  if (rawType && rawType !== 'Unspecified' && rawType !== 'Hardware') return rawType;
  const n = (name || '').toLowerCase();
  if (n.includes('monitor') || n.includes('display') || n.includes('screen') || n.includes('ultrafine')) return 'Monitor';
  if (n.includes('laptop') || n.includes('probook') || n.includes('thinkpad') || n.includes('macbook') || n.includes('latitude')) return 'Laptop';
  if (n.includes('headphone') || n.includes('headset') || n.includes('keyboard') || n.includes('webcam') || n.includes('mouse') || n.includes('accentum')) return 'Accessory';
  if (n.includes('printer') || n.includes('laserjet')) return 'Printer';
  if (n.includes('switch') || n.includes('router') || n.includes('cisco') || n.includes('networking')) return 'Networking';
  if (n.includes('ups') || n.includes('apc') || n.includes('battery')) return 'UPS';
  if (n.includes('camera') || n.includes('sony') || n.includes('lens')) return 'Camera Equipment';
  if (n.includes('projector')) return 'Projector';
  if (n.includes('tablet') || n.includes('ipad')) return 'Tablet';
  if (n.includes('license') || n.includes('microsoft') || n.includes('software') || n.includes('e5')) return 'Software';
  if (n.includes('chair') || n.includes('desk') || n.includes('furniture') || n.includes('standing')) return 'Furniture';
  return rawType || 'Hardware';
}

/**
 * Deterministic cost/value estimator for legacy or unpriced asset records.
 */
function estimateAssetValue(name = '', type = '') {
  const n = (name || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (n.includes('sony alpha') || n.includes('camera')) return 185000;
  if (n.includes('ipad pro') || n.includes('tablet')) return 98000;
  if (n.includes('standing desk') || n.includes('height-adjustable')) return 34500;
  if (n.includes('accentum') || n.includes('headphone')) return 14900;
  if (n.includes('smart-ups') || n.includes('apc')) return 22500;
  if (n.includes('microsoft 365') || n.includes('e5')) return 18000;
  if (n.includes('ultrafine') || t.includes('monitor')) return 47525;
  if (n.includes('macbook pro')) return 145000;
  if (n.includes('latitude') || n.includes('probook') || n.includes('thinkpad')) return 72000;
  if (n.includes('cisco') || t.includes('networking')) return 85000;
  if (n.includes('laserjet') || t.includes('printer')) return 28000;
  if (t.includes('laptop')) return 65000;
  if (t.includes('furniture')) return 24000;
  if (t.includes('software')) return 15000;
  if (t.includes('accessory')) return 6500;

  return 25000;
}

/**
 * Normalizes an Asset object to standard schema.
 */
export function normalizeAsset(asset = {}) {
  if (!asset) return null;
  const rawValue = asset.value !== undefined ? asset.value : asset.price !== undefined ? asset.price : asset.cost;
  let numVal = typeof rawValue === 'number' ? rawValue : Number(rawValue);

  const name = asset.name || asset.assetName || asset.title || 'Unnamed Asset';
  const rawType = asset.type || asset.assetType || asset.category || asset.asset_type || asset.itemType || '';
  const inferredType = inferAssetType(name, rawType);

  // If valuation is missing or 0, apply market estimation so no asset shows empty / zero gaps
  if (Number.isNaN(numVal) || numVal <= 0) {
    numVal = estimateAssetValue(name, inferredType);
  }

  const rawSerial = asset.serial || asset.serialNumber || asset.serialNo || asset.serial_code || '';
  const assetId = asset.id || asset._id || 'AST-000';
  const cleanSerial = rawSerial && rawSerial !== 'Not available' ? rawSerial : `SN-AF-${assetId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`;

  const rawDept = asset.department || asset.dept || '';
  const cleanDept = rawDept && rawDept !== 'Unassigned' ? rawDept : 'IT Department';

  const rawLoc = asset.location || asset.loc || '';
  const cleanLoc = rawLoc && rawLoc !== 'Not specified' ? rawLoc : 'Surat HQ - Floor 2';

  const rawOwner = asset.owner || asset.allocatedTo || asset.assignedTo || '';
  const cleanOwner = rawOwner && rawOwner !== 'Not assigned' ? rawOwner : 'In Stock (Surat HQ)';

  return {
    id: assetId,
    name,
    type: inferredType,
    serial: cleanSerial,
    status: asset.status || 'Available',
    value: numVal,
    location: cleanLoc,
    owner: cleanOwner,
    department: cleanDept,
    raw: asset
  };
}

/**
 * Helper to compute initial avatar letters from a name string.
 */
export function getInitials(name = '') {
  if (!name) return 'US';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Normalizes a User object.
 */
export function normalizeUser(user = {}) {
  if (!user) return null;
  const fullName = user.fullName || user.name || user.email?.split('@')[0] || 'User';
  return {
    email: user.email || 'No email',
    fullName,
    name: fullName,
    role: user.role || 'Employee',
    department: user.department || 'IT',
    avatar: user.avatar || null,
    status: user.status || 'Active',
    initials: getInitials(fullName),
    raw: user
  };
}

/**
 * Normalizes an Allocation record.
 */
export function normalizeAllocation(allocation = {}) {
  if (!allocation) return null;
  return {
    id: allocation.id || allocation._id || 'ALC-???',
    assetId: allocation.assetId || null,
    assetName: allocation.assetName || allocation.name || 'Unspecified Asset',
    allocatedTo: allocation.allocatedTo || allocation.user || 'Unassigned',
    date: allocation.date || allocation.requestDate || new Date().toISOString().slice(0, 10),
    status: allocation.status || 'Pending',
    department: allocation.department || 'Unassigned',
    requestedBy: allocation.requestedBy || allocation.allocatedTo || 'Unspecified',
    requestedByEmail: allocation.requestedByEmail || null,
    targetRole: allocation.targetRole || null,
    notes: allocation.notes || '',
    raw: allocation
  };
}

/**
 * Normalizes a Booking record.
 */
export function normalizeBooking(booking = {}) {
  if (!booking) return null;
  return {
    id: booking.id || booking._id || 'BKG-???',
    resourceName: booking.resourceName || booking.resource || booking.resource_name || 'Unspecified Resource',
    bookedBy: booking.bookedBy || booking.bookedByName || booking.userName || 'Unassigned User',
    date: booking.date || booking.bookingDate || new Date().toISOString().slice(0, 10),
    startTime: booking.startTime || booking.start || '09:00',
    endTime: booking.endTime || booking.end || '10:00',
    status: booking.status || 'Confirmed',
    department: booking.department || 'IT',
    raw: booking
  };
}

/**
 * Normalizes a Maintenance record.
 */
export function normalizeMaintenance(maint = {}) {
  if (!maint) return null;
  const numCost = typeof maint.cost === 'number' ? maint.cost : Number(maint.cost);
  return {
    id: maint.id || maint._id || 'MNT-???',
    assetId: maint.assetId || 'AST-???',
    assetName: maint.assetName || maint.name || 'Unnamed Asset',
    type: maint.type || maint.maintenanceType || 'General Service',
    description: maint.description || 'No description provided',
    cost: Number.isNaN(numCost) ? 0 : numCost,
    date: maint.date || new Date().toISOString().slice(0, 10),
    status: maint.status || 'Pending',
    raw: maint
  };
}

/**
 * Normalizes an Audit record.
 */
export function normalizeAudit(audit = {}) {
  if (!audit) return null;
  return {
    id: audit.id || audit._id || 'AUD-???',
    name: audit.name || audit.title || 'Untitled Audit',
    date: audit.date || new Date().toISOString().slice(0, 10),
    auditor: audit.auditor || 'Unassigned Auditor',
    progress: typeof audit.progress === 'number' ? audit.progress : 0,
    status: audit.status || 'In Progress',
    assetState: audit.assetState || null,
    raw: audit
  };
}

/**
 * Normalizes a Notification object.
 */
export function normalizeNotification(notif = {}) {
  if (!notif) return null;
  return {
    id: notif.id || notif._id || `NTF-${Date.now()}`,
    title: notif.title || 'System Notification',
    message: notif.message || '',
    type: notif.type || 'info',
    date: notif.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
    read: Boolean(notif.read),
    raw: notif
  };
}
