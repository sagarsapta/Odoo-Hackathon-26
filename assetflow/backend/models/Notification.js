const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    date: { type: String, required: true },
    read: { type: Boolean, default: false },
    targetRole: { type: String, default: null, index: true },
    targetUserEmail: { type: String, default: null, lowercase: true, trim: true, index: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Notification', notificationSchema, 'notifications');
