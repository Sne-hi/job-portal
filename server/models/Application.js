const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' },
  resume:    { type: String }, // URL or text for now
  coverLetter: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);