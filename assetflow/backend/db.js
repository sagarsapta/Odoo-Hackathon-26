const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

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
    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@assetflow.com').trim().toLowerCase();
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Password123!';
    const existingAdmin = await User.findOne({ email: adminEmail }).select('+password');

    if (!existingAdmin) {
        await User.create({
            email: adminEmail,
            password: await bcrypt.hash(adminPassword, 12),
            fullName: 'Rahul Sharma',
            role: 'Admin',
            department: 'Management',
            isVerified: true,
            status: 'Active'
        });
        console.log(`Default administrator created: ${adminEmail}`);
    }
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