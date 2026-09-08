const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    auditor: { type: String, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, required: true, default: 'In Progress' },
    assetState: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Audit', auditSchema, 'audits');
