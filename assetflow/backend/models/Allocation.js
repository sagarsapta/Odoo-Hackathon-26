const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    assetId: { type: String, default: null, index: true },
    assetName: { type: String, required: true },
    allocatedTo: { type: String, required: true, index: true },
    date: { type: String, required: true },
    status: { type: String, required: true },
    department: { type: String, required: true },
    requestedBy: { type: String, default: null },
    requestedByEmail: { type: String, default: null },
    targetRole: { type: String, default: null },
    notes: { type: String, default: null }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Allocation', allocationSchema, 'allocations');
