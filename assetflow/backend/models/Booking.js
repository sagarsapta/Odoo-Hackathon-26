const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    resourceName: { type: String, required: true, index: true },
    bookedBy: { type: String, required: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, required: true, default: 'Confirmed' },
    department: { type: String, required: true }
}, { timestamps: true, versionKey: false });

bookingSchema.index({ resourceName: 1, date: 1, status: 1 });
module.exports = mongoose.model('Booking', bookingSchema, 'bookings');
