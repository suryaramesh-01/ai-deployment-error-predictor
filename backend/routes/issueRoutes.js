const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const Analysis = require('../models/Analysis');
const { protect } = require('../middleware/auth');
const { generateAiExplanation } = require('../services/aiService');

// @route   GET /api/issues/project/:projectId
// @desc    Get all issues for a project with optional filters
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const { status, severity, category, type, search } = req.query;
    const query = { project: req.params.projectId, user: req.user._id };

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (category) query.category = category;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { file: { $regex: search, $options: 'i' } },
        { why: { $regex: search, $options: 'i' } }
      ];
    }

    const issues = await Issue.find(query).sort({ severity: 1, createdAt: -1 });
    res.json({ success: true, count: issues.length, data: issues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/issues/:issueId
// @desc    Get single issue detail
// @access  Private
router.get('/:issueId', protect, async (req, res) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.issueId, user: req.user._id }).populate('project');
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }
    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/issues/:issueId/status
// @desc    Update issue status (Open, In Progress, Resolved, Reopened)
// @access  Private
router.put('/:issueId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open', 'In Progress', 'Resolved', 'Reopened'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const issue = await Issue.findOne({ _id: req.params.issueId, user: req.user._id });
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    issue.status = status;
    await issue.save();

    // Recalculate project health score based on resolved issues
    const allProjectIssues = await Issue.find({ project: issue.project });
    const total = allProjectIssues.length;
    const resolved = allProjectIssues.filter(i => i.status === 'Resolved').length;

    const project = await Project.findById(issue.project);
    if (project) {
      const completionFraction = total > 0 ? (resolved / total) : 1;
      project.completionPercentage = Math.round(completionFraction * 100);
      await project.save();
    }

    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/issues/:issueId/ai-explain
// @desc    Generate enhanced AI explanation and code diff for issue
// @access  Private
router.post('/:issueId/ai-explain', protect, async (req, res) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.issueId, user: req.user._id });
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const aiResult = await generateAiExplanation(issue);
    issue.aiExplanation = aiResult.aiExplanation;
    issue.troubleshootingSteps = aiResult.troubleshootingSteps;
    issue.bestPractices = aiResult.bestPractices;
    await issue.save();

    res.json({ success: true, data: issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
