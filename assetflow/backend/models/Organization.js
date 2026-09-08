const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    orgName: { type: String, default: '' },
    code: { type: String, default: '' },
    industry: { type: String, default: '' },
    taxId: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    timeZone: { type: String, default: '' },
    currency: { type: String, default: '' },
    fiscalYear: { type: String, default: '' },
    logo: { type: String, default: '' }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Organization', organizationSchema, 'organizations');
