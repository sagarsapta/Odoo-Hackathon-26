const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    serial: { type: String, unique: true, sparse: true, trim: true },
    status: { type: String, required: true, default: 'Active' },
    value: { type: Number, default: 0, min: 0 },
    location: { type: String, default: '' },
    owner: { type: String, default: null },
    department: { type: String, default: null }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Asset', assetSchema, 'assets');
