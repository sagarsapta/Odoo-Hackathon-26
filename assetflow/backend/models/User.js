const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: 'IT' },
    avatar: { type: String, default: null },
    isVerified: { type: Boolean, default: true },
    status: { type: String, default: 'Active' },
    transitionDetails: { type: String, default: null }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('User', userSchema, 'users');
