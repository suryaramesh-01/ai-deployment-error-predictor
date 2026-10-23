const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Analysis = require('../models/Analysis');
const Issue = require('../models/Issue');
const { protect } = require('../middleware/auth');
const { generateProjectReportPdf } = require('../services/pdfService');

// @route   GET /api/reports/project/:projectId/analysis/:analysisId/pdf
// @desc    Download downloadable PDF report for a project analysis
// @access  Private
router.get('/project/:projectId/analysis/:analysisId/pdf', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const analysis = await Analysis.findOne({ _id: req.params.analysisId, project: project._id });
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const issues = await Issue.find({ analysis: analysis._id }).sort({ severity: 1 });

    const pdfBuffer = await generateProjectReportPdf(project, analysis, issues);

    const safeProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Deployment_Audit_${safeProjectName}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: `PDF Generation failed: ${err.message}` });
  }
});

// @route   GET /api/reports/project/:projectId/history
// @desc    Get detailed project history and score trend over time
// @access  Private
router.get('/project/:projectId/history', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const analyses = await Analysis.find({ project: project._id }).sort({ scanDate: 1 });
    const issues = await Issue.find({ project: project._id });

    // Build timeline data
    const timeline = analyses.map((a, idx) => {
      const prevScore = idx > 0 ? analyses[idx - 1].readinessScore : a.readinessScore;
      const scoreDiff = a.readinessScore - prevScore;

      return {
        id: a._id,
        date: a.scanDate,
        readinessScore: a.readinessScore,
        scoreDiff,
        criticalCount: a.metrics?.criticalIssues || 0,
        highCount: a.metrics?.highIssues || 0,
        mediumCount: a.metrics?.mediumIssues || 0,
        lowCount: a.metrics?.lowIssues || 0,
        totalIssues: a.metrics?.totalIssues || 0,
        passedChecks: a.metrics?.passedChecks || 0,
        zipFileName: a.zipFileName
      };
    });

    res.json({
      success: true,
      project,
      timeline,
      totalScans: analyses.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
