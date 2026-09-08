const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    headName: { type: String, default: null },
    headEmail: { type: String, default: null, lowercase: true, trim: true }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Department', departmentSchema, 'departments');
