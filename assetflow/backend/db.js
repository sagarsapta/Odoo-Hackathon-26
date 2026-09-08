const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Organization = require('./models/Organization');
const Department = require('./models/Department');
const Asset = require('./models/Asset');
const Allocation = require('./models/Allocation');
const Booking = require('./models/Booking');
const Maintenance = require('./models/Maintenance');
const Audit = require('./models/Audit');
const Notification = require('./models/Notification');

require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/assetflow_db';

async function connectDatabase() {
    mongoose.connection.on('connected', () => console.log('MongoDB connected successfully'));
    mongoose.connection.on('error', (error) => console.error('MongoDB error:', error.message));
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}

async function initializeDatabase() {
    await connectDatabase();
    const currentAssetIndexes = new Set(['_id_', 'id_1', 'serial_1']);
    const assetIndexes = await Asset.collection.listIndexes().toArray();
    for (const index of assetIndexes) {
        if (!currentAssetIndexes.has(index.name)) {
            try { await Asset.collection.dropIndex(index.name); console.log(`Removed obsolete asset index: ${index.name}`); } catch (error) {
                if (error.codeName !== 'IndexNotFound' && error.code !== 27) throw error;
            }
        }
    }
    const legacyAssets = await Asset.find({ $or: [{ id: { $exists: false } }, { id: null }] }).select('_id').lean();
    for (const asset of legacyAssets) await Asset.updateOne({ _id: asset._id }, { $set: { id: `LEGACY-AST-${asset._id.toString().slice(-8)}` } });
    await Asset.syncIndexes();
    const bookingDocuments = await Booking.collection.find({}).toArray();
    for (const booking of bookingDocuments) {
        const resourceName = booking.resourceName || booking.resource || booking.resource_name || booking.assetName;
        const bookedBy = booking.bookedBy || booking.bookedByName || booking.userName;
        const startDate = booking.startDate || booking.bookingStart;
        const endDate = booking.endDate || booking.bookingEnd;
        const startValue = booking.startTime || booking.start || startDate;
        const endValue = booking.endTime || booking.end || endDate;
        const start = startValue ? new Date(startValue) : null;
        const end = endValue ? new Date(endValue) : null;
        const date = booking.date || booking.bookingDate || (start && !Number.isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : null);
        const startTime = booking.startTime || (start && !Number.isNaN(start.getTime()) ? start.toISOString().slice(11, 16) : null);
        const endTime = booking.endTime || (end && !Number.isNaN(end.getTime()) ? end.toISOString().slice(11, 16) : null);
        if (!resourceName || !bookedBy || !date || !startTime || !endTime) continue;
        await Booking.collection.updateOne({ _id: booking._id }, { $set: {
            id: booking.id || `LEGACY-BKG-${booking._id.toString().slice(-8)}`,
            resourceName, bookedBy, date, startTime, endTime,
            status: booking.status || 'Confirmed', department: booking.department || 'IT'
        } });
    }
    const password = await bcrypt.hash('Password123!', 12);
    const demoUsers = [
        ['admin@assetflow.com', 'Rahul Sharma', 'Admin', 'Administration'],
        ['assetmanager@assetflow.com', 'Priya Patel', 'Asset Manager', 'IT'],
        ['it.head@assetflow.com', 'Amit Shah', 'Department Head', 'IT'],
        ['hr.head@assetflow.com', 'Neha Mehta', 'Department Head', 'Human Resources'],
        ['finance.head@assetflow.com', 'Raj Mehta', 'Department Head', 'Finance'],
        ['operations.head@assetflow.com', 'Karan Desai', 'Department Head', 'Operations'],
        ['employee.it@assetflow.com', 'Riya Shah', 'Employee', 'IT'],
        ['employee.hr@assetflow.com', 'Arjun Patel', 'Employee', 'Human Resources'],
        ['employee.finance@assetflow.com', 'Dev Joshi', 'Employee', 'Finance'],
        ['employee.ops@assetflow.com', 'Mehul Shah', 'Employee', 'Operations'],
        ['employee.marketing@assetflow.com', 'Anjali Desai', 'Employee', 'Marketing'],
        ['employee.sales@assetflow.com', 'Yash Patel', 'Employee', 'Sales']
    ];
    for (const [email, fullName, role, department] of demoUsers) {
        await User.updateOne({ email }, { $setOnInsert: { email, password, fullName, role, department, isVerified: true, status: 'Active' } }, { upsert: true });
    }

    const departmentNames = ['IT', 'Human Resources', 'Finance', 'Operations', 'Marketing', 'Sales', 'Administration'];
    for (const name of departmentNames) await Department.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
    await Organization.updateOne({}, { $setOnInsert: { name: 'AssetFlow Technologies Pvt. Ltd.', orgName: 'AssetFlow Technologies Pvt. Ltd.', code: 'AFT', industry: 'Information Technology', address: 'Surat, Gujarat', phone: '+91 98765 43210', website: 'https://assetflow.example.com', currency: 'INR' } }, { upsert: true });

    const assetTypes = ['Laptop', 'Monitor', 'Networking', 'Printer', 'Accessory', 'Projector', 'Tablet', 'UPS', 'Barcode Scanner', 'CCTV Monitor'];
    const assetNames = ['Dell Latitude 5440', 'HP ProBook 450', 'Lenovo ThinkPad E14', 'Dell 24-inch Monitor', 'Cisco Switch', 'HP LaserJet', 'Wireless Keyboard', 'Webcam', 'Conference Projector', 'Android Tablet'];
    const seededAssets = [];
    for (let index = 0; index < 60; index += 1) {
        const department = departmentNames[index % departmentNames.length];
        const allocated = index % 5 !== 0;
        const status = index % 10 === 0 ? 'Maintenance' : allocated ? 'Active' : 'Available';
        const asset = { id: `AST-${String(index + 1).padStart(3, '0')}`, name: assetNames[index % assetNames.length], type: assetTypes[index % assetTypes.length], serial: `AF-DEMO-${String(index + 1).padStart(4, '0')}`, status, value: 15000 + (index % 8) * 12500, location: `${department} Office`, owner: allocated ? demoUsers[(index % 9) + 1][1] : null, department };
        await Asset.updateOne({ id: asset.id }, { $setOnInsert: asset }, { upsert: true });
        seededAssets.push(asset);
    }

    const activeAssets = seededAssets.filter((asset) => asset.status === 'Active').slice(0, 8);
    for (let index = 0; index < activeAssets.length; index += 1) {
        const asset = activeAssets[index];
        await Allocation.updateOne({ id: `ALC-${String(index + 1).padStart(3, '0')}` }, { $setOnInsert: { id: `ALC-${String(index + 1).padStart(3, '0')}`, assetId: asset.id, assetName: asset.name, allocatedTo: asset.owner, date: '2026-01-15', status: 'Approved', department: asset.department, requestedBy: asset.owner, requestedByEmail: demoUsers[(index % 9) + 1][0], targetRole: 'Approved', notes: 'Demo allocation' } }, { upsert: true });
    }
    await Booking.updateOne({ id: 'BKG-001' }, { $setOnInsert: { id: 'BKG-001', resourceName: 'Conference Room A', bookedBy: 'Riya Shah', date: '2099-01-15', startTime: '10:00', endTime: '11:00', status: 'Confirmed', department: 'IT' } }, { upsert: true });
    await Booking.updateOne({ id: 'BKG-002' }, { $setOnInsert: { id: 'BKG-002', resourceName: 'Conference Room B', bookedBy: 'Neha Mehta', date: '2099-01-16', startTime: '14:00', endTime: '15:30', status: 'Confirmed', department: 'Human Resources' } }, { upsert: true });
    await Booking.updateOne({ id: 'BKG-003' }, { $setOnInsert: { id: 'BKG-003', resourceName: 'Training Room', bookedBy: 'Priya Patel', date: '2026-01-20', startTime: '09:00', endTime: '10:00', status: 'Cancelled', department: 'IT' } }, { upsert: true });
    await Maintenance.updateOne({ id: 'MNT-001' }, { $setOnInsert: { id: 'MNT-001', assetId: 'AST-001', assetName: 'Dell Latitude 5440', type: 'Battery replacement', description: 'Battery service required', cost: 4500, date: '2026-02-10', status: 'Pending' } }, { upsert: true });
    await Audit.updateOne({ id: 'AUD-001' }, { $setOnInsert: { id: 'AUD-001', name: 'Annual Asset Verification', date: '2026-03-01', auditor: 'Amit Shah', progress: 65, status: 'In Progress' } }, { upsert: true });
    await Notification.updateOne({ id: 'NTF-DEMO-001' }, { $setOnInsert: { id: 'NTF-DEMO-001', title: 'Welcome to AssetFlow', message: 'Demo data is ready for your presentation.', type: 'info', date: new Date().toISOString().replace('T', ' ').substring(0, 16), read: false, targetRole: null, targetUserEmail: null } }, { upsert: true });
}

async function resetDatabase() {
    if (process.env.NODE_ENV === 'production') throw new Error('Database reset is disabled in production.');
    const collections = ['users', 'departments', 'organizations', 'assets', 'allocations', 'bookings', 'maintenances', 'audits', 'notifications', 'counters'];
    await Promise.all(collections.map(async (name) => {
        try { await mongoose.connection.collection(name).deleteMany({}); } catch (error) {
            if (error.codeName !== 'NamespaceNotFound') throw error;
        }
    }));
    await initializeDatabase();
}

module.exports = { connectDatabase, initializeDatabase, resetDatabase };