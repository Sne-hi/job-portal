const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// Get messages for a room
router.get('/:roomId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save a message
router.post('/', protect, async (req, res) => {
  try {
    const message = await Message.create({
      roomId: req.body.roomId,
      sender: req.user._id,
      content: req.body.content,
    });
    const populated = await message.populate('sender', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark messages as read
router.put('/:roomId/read', protect, async (req, res) => {
  try {
    await Message.updateMany(
      { roomId: req.params.roomId, sender: { $ne: req.user._id } },
      { read: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;