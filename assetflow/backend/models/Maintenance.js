const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    assetId: { type: String, required: true, index: true },
    assetName: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, default: '' },
    cost: { type: Number, default: 0, min: 0 },
    date: { type: String, required: true },
    status: { type: String, required: true, default: 'Pending' }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Maintenance', maintenanceSchema, 'maintenances');
