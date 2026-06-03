const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Google OAuth - start
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth - callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    // If user already has a role, go to dashboard
    if (req.user.role) {
      res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } else {
      res.redirect(`${process.env.CLIENT_URL}/select-role`);
    }
  }
);

// Update role
router.put('/role', protect, async (req, res) => {
  const { role } = req.body;
  if (!['recruiter', 'applicant'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { role },
    { new: true }
  );
  res.json(user);
});

// Get current user
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;