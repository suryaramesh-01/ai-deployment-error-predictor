const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');
const { answerDevOpsQuestion } = require('../services/aiService');

// @route   POST /api/ai/chat
// @desc    Ask AI assistant questions about deployment, errors, Docker, AWS, etc.
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { query, projectId } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Question/query is required' });
    }

    let projectContext = null;
    if (projectId) {
      projectContext = await Project.findOne({ _id: projectId, user: req.user._id });
    }

    const answer = await answerDevOpsQuestion(query, projectContext);

    res.json({
      success: true,
      answer,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
