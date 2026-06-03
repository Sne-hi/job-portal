const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String },           // null for OAuth users
  role:     { type: String, enum: ['recruiter', 'applicant'], required: true },
  avatar:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);