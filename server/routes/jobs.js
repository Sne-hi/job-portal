const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, recruiterOnly, applicantOnly } = require('../middleware/authMiddleware');

// Get all jobs (public)
router.get('/', async (req, res) => {
  try {
    const { search, type, location } = req.query;
    let query = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (type) query.type = type;
    if (location) query.location = { $regex: location, $options: 'i' };

    const jobs = await Job.find(query)
      .populate('recruiter', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('recruiter', 'name email avatar');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create job (recruiter only)
router.post('/', protect, recruiterOnly, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, recruiter: req.user._id });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update job (recruiter only)
router.put('/:id', protect, recruiterOnly, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiter: req.user._id },
      req.body,
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete job (recruiter only)
router.delete('/:id', protect, recruiterOnly, async (req, res) => {
  try {
    await Job.findOneAndDelete({ _id: req.params.id, recruiter: req.user._id });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Apply for a job (applicant only)
router.post('/:id/apply', protect, applicantOnly, async (req, res) => {
  try {
    const existing = await Application.findOne({
      job: req.params.id,
      applicant: req.user._id
    });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const application = await Application.create({
      job: req.params.id,
      applicant: req.user._id,
      coverLetter: req.body.coverLetter
    });
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get applications for a job (recruiter only)
router.get('/:id/applications', protect, recruiterOnly, async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.id })
      .populate('applicant', 'name email avatar');
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;