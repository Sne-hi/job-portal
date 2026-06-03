const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { protect, recruiterOnly } = require('../middleware/authMiddleware');

// Get my applications (applicant)
router.get('/my', protect, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job', 'title company location type');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application status (recruiter)
router.put('/:id/status', protect, recruiterOnly, async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;