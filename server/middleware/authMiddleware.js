const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

const recruiterOnly = (req, res, next) => {
  if (req.user && req.user.role === 'recruiter') return next();
  res.status(403).json({ message: 'Recruiters only' });
};

const applicantOnly = (req, res, next) => {
  if (req.user && req.user.role === 'applicant') return next();
  res.status(403).json({ message: 'Applicants only' });
};

module.exports = { protect, recruiterOnly, applicantOnly };