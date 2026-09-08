const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const Counter = require('./models/Counter');
const User = require('./models/User');
const Department = require('./models/Department');
const Organization = require('./models/Organization');
const Asset = require('./models/Asset');
const Allocation = require('./models/Allocation');
const Booking = require('./models/Booking');
const Maintenance = require('./models/Maintenance');
const Audit = require('./models/Audit');
const Notification = require('./models/Notification');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured in .env');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });

const clean = (document) => {
    if (!document) return document;
    const value = document.toObject ? document.toObject() : { ...document };
    delete value._id;
    delete value.__v;
    delete value.password;
    return value;
};
const cleanMany = (documents) => documents.map(clean);
const nowString = () => new Date().toISOString().replace('T', ' ').substring(0, 16);
const normalizeRole = (role) => (role || '').toLowerCase().replace(/[\s_]/g, '');
const canManageAllocations = (role) => ['admin', 'assetmanager', 'departmenthead'].includes(normalizeRole(role));

async function nextId(sequence, prefix) {
    const counter = await Counter.findOneAndUpdate(
        { _id: sequence }, { $inc: { value: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return `${prefix}${String(counter.value).padStart(3, '0')}`;
}

async function createNotification(data) {
    return Notification.create({ id: data.id || `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`, date: nowString(), read: false, type: 'info', ...data });
}

function authenticateToken(req, res, next) {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication token required.' });
    jwt.verify(token, JWT_SECRET, (error, user) => {
        if (error) return res.status(403).json({ message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.some((role) => normalizeRole(role) === normalizeRole(req.user?.role))) return res.status(403).json({ message: 'Access denied for this role.' });
        next();
    };
}

function handleError(res, error) {
    console.error(error);
    if (error.code === 11000) return res.status(409).json({ message: 'A record with that unique value already exists.' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Invalid request data.' });
    return res.status(500).json({ message: 'Database operation failed.' });
}

app.post('/api/dev/reset-db', authenticateToken, requireRole('Admin'), async (req, res) => {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEV_RESET !== 'true') return res.status(404).json({ message: 'Not found.' });
    try { await db.resetDatabase(); res.json({ success: true, message: 'Database reset successfully!' }); } catch (error) { handleError(res, error); }
});

async function handleRegister(req, res) {
    const { email, password, fullName, role, department } = req.body;
    if (!email || !password || !fullName) return res.status(400).json({ message: 'Full name, email, and password are required.' });
    try {
        const cleanEmail = email.trim().toLowerCase();
        if (await User.exists({ email: cleanEmail })) return res.status(400).json({ message: 'Email address is already registered.' });
        const requestedRole = (role || 'Employee').trim();
        const allowedRoles = ['Employee', 'Department Head', 'Asset Manager'];
        if (!allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === normalizeRole(requestedRole))) return res.status(400).json({ message: 'Invalid role.' });
        await User.create({ email: cleanEmail, password: await bcrypt.hash(password.trim(), 12), fullName: fullName.trim(), role: requestedRole, department: (department || 'IT').trim(), isVerified: true, status: 'Active' });
        res.status(201).json({ success: true, message: 'User registered successfully!' });
    } catch (error) { handleError(res, error); }
}
app.post('/api/auth/register', authenticateToken, requireRole('Admin'), handleRegister);
app.post('/api/auth/signup', authenticateToken, requireRole('Admin'), handleRegister);

async function handleLogin(req, res) {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email address and password are required.' });
    if (!role) return res.status(400).json({ message: 'Please select your role.' });
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
        if (!user) return res.status(404).json({ message: `No account found with email "${email}". Please check with your Administrator.` });
        if (normalizeRole(role) !== normalizeRole(user.role)) return res.status(400).json({ message: `Account found, but it is registered under the role "${user.role}". Please select "${user.role}" from the role dropdown.` });
        if (!(await bcrypt.compare(password.trim(), user.password))) return res.status(401).json({ message: 'Incorrect password. Please check your password and try again.' });
        if ((user.status || 'Active').toLowerCase() !== 'active') return res.status(403).json({ message: `Your account status is currently "${user.status}". Please contact your Administrator.` });
        const userPayload = { email: user.email, name: user.fullName, role: user.role, department: user.department, avatar: user.avatar };
        res.json({ success: true, token: jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' }), user: userPayload });
    } catch (error) { handleError(res, error); }
}
app.post('/api/auth/login', handleLogin);
app.post('/api/login', handleLogin);
app.post('/api/auth/verify-otp', (req, res) => res.json({ success: true, message: 'Verified successfully!' }));
app.post('/api/auth/resend-otp', (req, res) => res.json({ success: true, message: 'OTP sent!' }));
app.post('/api/auth/forgot-password', async (req, res) => {
    try { if (!(await User.exists({ email: (req.body.email || '').trim().toLowerCase() }))) return res.status(404).json({ message: 'User with this email not found.' }); res.json({ success: true, message: 'Password reset code simulated.' }); } catch (error) { handleError(res, error); }
});
app.post('/api/auth/reset-password', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const newPassword = (req.body.newPassword || '').trim();
    if (!email || newPassword.length < 8) return res.status(400).json({ message: 'A valid email and password of at least 8 characters are required.' });
    try { const result = await User.updateOne({ email }, { $set: { password: await bcrypt.hash(newPassword, 12) } }); if (!result.matchedCount) return res.status(404).json({ message: 'User with this email not found.' }); res.json({ success: true, message: 'Password updated successfully!' }); } catch (error) { handleError(res, error); }
});

app.get('/api/users', authenticateToken, async (req, res) => { try { res.json(cleanMany(await User.find().select('-password').sort({ fullName: 1 }).lean())); } catch (error) { handleError(res, error); } });
app.get('/api/org', authenticateToken, async (req, res) => { try { res.json(clean(await Organization.findOne().lean()) || {}); } catch (error) { handleError(res, error); } });
app.put('/api/org', authenticateToken, async (req, res) => { try { await Organization.findOneAndUpdate({}, { $set: req.body }, { upsert: true, new: true, setDefaultsOnInsert: true }); res.json({ success: true, message: 'Organization saved successfully!' }); } catch (error) { handleError(res, error); } });

app.get('/api/departments', authenticateToken, async (req, res) => { try { res.json(cleanMany(await Department.find().sort({ name: 1 }).lean())); } catch (error) { handleError(res, error); } });
app.post('/api/departments', authenticateToken, async (req, res) => { if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access Denied: Only administrators can add new departments.' }); if (!req.body.name?.trim()) return res.status(400).json({ message: 'Department name is required.' }); try { if (await Department.exists({ name: req.body.name.trim() })) return res.status(400).json({ message: 'Department already exists.' }); await Department.create({ name: req.body.name.trim() }); res.status(201).json({ success: true, message: 'Department added successfully!' }); } catch (error) { handleError(res, error); } });
app.delete('/api/departments/:name', authenticateToken, async (req, res) => { if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access Denied: Only administrators can delete departments.' }); try { await Department.deleteOne({ name: req.params.name }); res.json({ success: true, message: 'Department deleted successfully!' }); } catch (error) { handleError(res, error); } });

app.get('/api/assets', authenticateToken, async (req, res) => { try { res.json(cleanMany(await Asset.find().lean())); } catch (error) { handleError(res, error); } });
app.post('/api/assets', authenticateToken, async (req, res) => { try { const id = await nextId('assets', 'AST-'); const asset = await Asset.create({ ...req.body, id, status: req.body.status || 'Active', owner: req.body.owner || null }); res.status(201).json({ success: true, asset: clean(asset) }); } catch (error) { handleError(res, error); } });
app.put('/api/assets/:id', authenticateToken, async (req, res) => { try { const asset = await Asset.findOneAndUpdate({ id: req.params.id }, { $set: { ...req.body, id: req.params.id } }, { new: true, runValidators: true }); if (!asset) return res.status(404).json({ message: 'Asset not found.' }); res.json({ success: true, message: 'Asset updated successfully!' }); } catch (error) { handleError(res, error); } });
app.delete('/api/assets/:id', authenticateToken, async (req, res) => { try { await Asset.deleteOne({ id: req.params.id }); res.json({ success: true, message: 'Asset deleted successfully!' }); } catch (error) { handleError(res, error); } });
app.post('/api/assets/:id/return', authenticateToken, async (req, res) => { try { const asset = await Asset.findOne({ id: req.params.id }); if (!asset) return res.status(404).json({ message: 'Asset not found.' }); await Asset.updateOne({ id: req.params.id }, { $set: { owner: asset.department || null, status: 'Active' } }); await Allocation.updateMany({ assetId: req.params.id, status: 'Approved' }, { $set: { status: 'Returned' } }); res.json({ success: true, message: 'Asset returned to department stock successfully!' }); } catch (error) { handleError(res, error); } });

app.get('/api/allocations', authenticateToken, async (req, res) => { try { res.json(cleanMany(await Allocation.find().lean())); } catch (error) { handleError(res, error); } });
app.post('/api/allocations', authenticateToken, async (req, res) => {
    try {
        const userName = req.user.name || req.user.email;
        const targetAllocatedTo = req.body.allocatedTo || userName;
        const targetUser = await User.findOne({ $or: [{ fullName: targetAllocatedTo }, { email: targetAllocatedTo }] }).lean();
        const department = (await Department.findOne({ name: targetAllocatedTo }).lean())?.name || targetUser?.department || req.user.department || 'Management';
        const approved = req.user.role !== 'Employee';
        const allocation = await Allocation.create({ id: await nextId('allocations', 'ALC-'), assetId: req.body.assetId || null, assetName: req.body.assetName, allocatedTo: targetAllocatedTo, date: req.body.date || new Date().toISOString().split('T')[0], status: approved ? 'Approved' : 'Pending Department Head Approval', department, requestedBy: userName, requestedByEmail: req.user.email, targetRole: approved ? 'Approved' : 'Department Head', notes: req.body.notes || null });
        if (approved && allocation.assetId) await Asset.updateOne({ id: allocation.assetId }, { $set: { owner: targetAllocatedTo, department, status: 'Active' } });
        if (!approved) await createNotification({ title: 'New Allocation Request', message: `${targetAllocatedTo} requested allocation for ${req.body.assetName}.`, targetRole: 'Department Head' });
        res.status(201).json({ success: true, message: 'Allocation request created!' });
    } catch (error) { handleError(res, error); }
});
app.post('/api/allocations/:id/action', authenticateToken, async (req, res) => {
    const { status, assetId } = req.body;
    if (status !== 'Returned' && !canManageAllocations(req.user.role)) return res.status(403).json({ message: 'Access Denied: You cannot approve or reject allocation requests.' });
    try {
        const allocation = await Allocation.findOne({ id: req.params.id }); if (!allocation) return res.status(404).json({ message: 'Allocation not found.' });
        const finalAssetId = assetId || allocation.assetId;
        if (status === 'Approved') { if (!finalAssetId) return res.status(400).json({ message: 'A specific asset must be assigned to approve this request.' }); const asset = await Asset.findOne({ id: finalAssetId }); if (!asset) return res.status(404).json({ message: 'Asset not found.' }); allocation.assetId = finalAssetId; allocation.assetName = asset.name; await Asset.updateOne({ id: finalAssetId }, { $set: { owner: allocation.allocatedTo, department: allocation.department, status: 'Active' } }); }
        if (status === 'Returned' && finalAssetId) await Asset.updateOne({ id: finalAssetId }, { $set: { owner: allocation.department || null, status: 'Active' } });
        allocation.status = status; await allocation.save();
        const target = await User.findOne({ fullName: allocation.allocatedTo }).lean();
        await createNotification({ title: `Asset Request ${status}`, message: `Your allocation request for "${allocation.assetName}" was ${status.toLowerCase()}.`, type: status === 'Approved' ? 'success' : 'warning', targetUserEmail: target?.email || null });
        res.json({ success: true, message: `Allocation ${status.toLowerCase()} successfully!` });
    } catch (error) { handleError(res, error); }
});

app.get('/api/bookings', authenticateToken, async (req, res) => { try { res.json(cleanMany(await Booking.find().lean())); } catch (error) { handleError(res, error); } });
app.post('/api/bookings', authenticateToken, async (req, res) => {
    const { resourceName, date, startTime, endTime } = req.body;
    if (!resourceName || !date || !startTime || !endTime || startTime >= endTime) return res.status(400).json({ message: 'A valid resource, date, and time range are required.' });
    try {
        const conflict = await Booking.findOne({ resourceName, date, status: { $ne: 'Cancelled' }, startTime: { $lt: endTime }, endTime: { $gt: startTime } }).lean();
        if (conflict) return res.status(409).json({ message: `Resource "${resourceName}" is already booked for the selected time slot.` });
        await Booking.create({ id: await nextId('bookings', 'BKG-'), resourceName, bookedBy: req.user.name || req.user.email, date, startTime, endTime, status: 'Confirmed', department: req.user.department || 'IT' });
        await createNotification({ title: 'Booking Confirmed', message: `Your booking for ${resourceName} on ${date} (${startTime}-${endTime}) is confirmed.`, type: 'success', targetUserEmail: req.user.email });
        res.status(201).json({ success: true, message: 'Resource booked successfully!' });
    } catch (error) { handleError(res, error); }
});
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => { try { const booking = await Booking.findOne({ id: req.params.id }); if (!booking) return res.status(404).json({ message: 'Booking not found.' }); const canCancel = normalizeRole(req.user.role) === 'admin' || normalizeRole(req.user.role) === 'assetmanager' || booking.bookedBy === req.user.name || booking.bookedBy === req.user.email; if (!canCancel) return res.status(403).json({ message: 'You can only cancel your own bookings.' }); await booking.updateOne({ $set: { status: 'Cancelled' } }); res.json({ success: true, message: 'Booking cancelled successfully!' }); } catch (error) { handleError(res, error); } });

app.get('/api/maintenance', authenticateToken, async (req, res) => { try { res.json(cleanMany(await Maintenance.find().lean())); } catch (error) { handleError(res, error); } });
app.post('/api/maintenance', authenticateToken, async (req, res) => { try { await Maintenance.create({ ...req.body, id: await nextId('maintenance', 'MNT-'), status: 'Pending' }); await Asset.updateOne({ id: req.body.assetId }, { $set: { status: 'Maintenance' } }); res.status(201).json({ success: true, message: 'Maintenance log added successfully!' }); } catch (error) { handleError(res, error); } });
app.put('/api/maintenance/:id/status', authenticateToken, async (req, res) => { try { const log = await Maintenance.findOneAndUpdate({ id: req.params.id }, { $set: { status: req.body.status, ...(req.body.cost !== undefined ? { cost: req.body.cost } : {}) } }, { new: true }); if (!log) return res.status(404).json({ message: 'Maintenance record not found.' }); if (['Resolved', 'Completed', 'Rejected', 'Cancelled'].includes(req.body.status)) await Asset.updateOne({ id: log.assetId }, { $set: { status: 'Active' } }); res.json({ success: true, message: 'Maintenance status updated!' }); } catch (error) { handleError(res, error); } });

app.get('/api/audits', authenticateToken, async (req, res) => { try { res.json(cleanMany(await Audit.find().lean())); } catch (error) { handleError(res, error); } });
app.post('/api/audits', authenticateToken, async (req, res) => { try { await Audit.create({ ...req.body, id: await nextId('audits', 'AUD-'), progress: 0, status: 'In Progress' }); res.status(201).json({ success: true, message: 'Audit scheduled successfully!' }); } catch (error) { handleError(res, error); } });
app.put('/api/audits/:id/progress', authenticateToken, async (req, res) => { try { await Audit.updateOne({ id: req.params.id }, { $set: { progress: req.body.progress, status: req.body.progress === 100 ? 'Completed' : 'In Progress' } }); res.json({ success: true, message: 'Audit progress updated!' }); } catch (error) { handleError(res, error); } });
app.get('/api/audits/:id/state', authenticateToken, async (req, res) => { try { const audit = await Audit.findOne({ id: req.params.id }).lean(); if (!audit) return res.status(404).json({ message: 'Audit not found.' }); res.json({ state: audit.assetState || null }); } catch (error) { handleError(res, error); } });
app.put('/api/audits/:id/state', authenticateToken, async (req, res) => { try { await Audit.updateOne({ id: req.params.id }, { $set: { assetState: req.body.state || null } }); res.json({ success: true, message: 'Audit state saved!' }); } catch (error) { handleError(res, error); } });

app.get('/api/reports/analytics', authenticateToken, async (req, res) => { try { const [assets, maintenance, bookings, allocations] = await Promise.all([Asset.find().lean(), Maintenance.find().lean(), Booking.find().lean(), Allocation.find().lean()]); const deptDistribution = {}; const statusDistribution = {}; assets.forEach((asset) => { const dept = asset.department || 'Unassigned'; const status = asset.status || 'Active'; deptDistribution[dept] = (deptDistribution[dept] || 0) + 1; statusDistribution[status] = (statusDistribution[status] || 0) + 1; }); const usage = {}; bookings.filter((b) => b.status === 'Confirmed').forEach((b) => { usage[b.resourceName] = (usage[b.resourceName] || 0) + 1; }); allocations.forEach((a) => { if (a.assetName) usage[a.assetName] = (usage[a.assetName] || 0) + 1; }); const mostUsedList = Object.entries(usage).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5); const idleList = assets.filter((a) => !a.owner && a.status !== 'Disposed').slice(0, 5).map((a) => ({ id: a.id, name: a.name, location: a.location || 'Central Stock' })); res.json({ totalValuation: assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0), totalMaintenanceCost: maintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0), totalAssetsCount: assets.length, deptDistribution, statusDistribution, mostUsedList, idleList }); } catch (error) { handleError(res, error); } });

app.get('/api/notifications', authenticateToken, async (req, res) => { try { res.json(cleanMany(await Notification.find({ $or: [{ targetRole: null, targetUserEmail: null }, { targetRole: req.user.role }, { targetUserEmail: req.user.email }] }).sort({ date: -1 }).lean())); } catch (error) { handleError(res, error); } });
app.post('/api/notifications', authenticateToken, async (req, res) => { if (!['Admin', 'Asset Manager'].includes(req.user.role)) return res.status(403).json({ message: 'Access Denied: Only Admins or Asset Managers can send notifications.' }); if (!req.body.title || !req.body.message) return res.status(400).json({ message: 'Title and message are required.' }); try { await createNotification(req.body); res.status(201).json({ success: true, message: 'Notification sent successfully!' }); } catch (error) { handleError(res, error); } });
app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => { try { await Notification.updateOne({ id: req.params.id }, { $set: { read: true } }); res.json({ success: true }); } catch (error) { handleError(res, error); } });
app.delete('/api/notifications', authenticateToken, async (req, res) => { try { await Notification.deleteMany(req.user.role === 'Admin' ? {} : { targetUserEmail: req.user.email }); res.json({ success: true }); } catch (error) { handleError(res, error); } });

app.put('/api/profile', authenticateToken, async (req, res) => { try { const user = await User.findOneAndUpdate({ email: req.user.email }, { $set: Object.fromEntries(Object.entries(req.body).filter(([key]) => ['fullName', 'department', 'avatar'].includes(key))) }, { new: true }).lean(); if (!user) return res.status(404).json({ message: 'User not found.' }); res.json({ success: true, user: { email: user.email, name: user.fullName, role: user.role, department: user.department, avatar: user.avatar }, message: 'Profile updated successfully!' }); } catch (error) { handleError(res, error); } });
app.post('/api/profile/change-password', authenticateToken, async (req, res) => { try { const user = await User.findOne({ email: req.user.email }).select('+password'); if (!user || !(await bcrypt.compare(req.body.currentPassword || '', user.password))) return res.status(400).json({ message: 'Current password does not match.' }); user.password = await bcrypt.hash((req.body.newPassword || '').trim(), 12); await user.save(); res.json({ success: true, message: 'Password updated successfully!' }); } catch (error) { handleError(res, error); } });
app.put('/api/users/role', authenticateToken, async (req, res) => { if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access Denied.' }); const { email, role, department, oldHeadEmail, oldHeadStatus, oldHeadDetails } = req.body; try { if (role === 'Department Head') { if (oldHeadEmail) await User.updateOne({ email: oldHeadEmail }, { $set: { role: 'Employee', status: oldHeadStatus || 'Active', transitionDetails: oldHeadDetails || null } }); else await User.updateMany({ department, role: 'Department Head' }, { $set: { role: 'Employee', status: 'Active' } }); } await User.updateOne({ email: email.toLowerCase() }, { $set: { role, department, status: 'Active' } }); res.json({ success: true, message: 'User role and department updated!' }); } catch (error) { handleError(res, error); } });

app.use((error, req, res, next) => handleError(res, error));

db.initializeDatabase().then(() => {
    console.log('Database initialized');
    app.listen(PORT, () => console.log(`AssetFlow Server running on http://localhost:${PORT}`));
}).catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });

module.exports = app;