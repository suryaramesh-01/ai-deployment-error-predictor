const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');
const Analysis = require('../models/Analysis');
const Issue = require('../models/Issue');
const { extractZipSafely } = require('../services/zipExtractor');
const { runAnalysis } = require('../services/analyzerEngine');
const { generateAiExplanation } = require('../services/aiService');

// Helper to remove directory recursively
function cleanupDir(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (e) {
    // ignore cleanup error
  }
}

// @route   POST /api/projects/:projectId/upload-and-analyze
// @desc    Upload project ZIP, extract safely, analyze, generate readiness score & issues
// @access  Private
router.post('/:projectId/upload-and-analyze', protect, upload.single('projectZip'), async (req, res) => {
  let extractDir = null;

  try {
    const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
    if (!project) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a ZIP file' });
    }

    const zipFilePath = req.file.path;
    const baseExtractedDir = path.join(__dirname, '..', 'extracted');
    extractDir = path.join(baseExtractedDir, `scan-${Date.now()}-${Math.round(Math.random() * 10000)}`);

    // 1. Safe extraction
    let extractStats;
    try {
      extractStats = extractZipSafely(zipFilePath, extractDir, {
        maxFiles: 1500,
        maxTotalSize: 200 * 1024 * 1024 // 200 MB
      });
    } catch (zipErr) {
      if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
      cleanupDir(extractDir);
      return res.status(400).json({
        success: false,
        message: `ZIP Extraction Security / Validation Error: ${zipErr.message}`
      });
    }

    // 2. Perform static analysis and error prediction
    const analysisResult = await runAnalysis(extractDir, project.deploymentPlatform);

    // 3. Create Analysis document
    const analysis = await Analysis.create({
      project: project._id,
      user: req.user._id,
      scanDate: new Date(),
      readinessScore: analysisResult.readinessScore,
      scoreExplanation: analysisResult.scoreExplanation,
      metrics: analysisResult.metrics,
      detectedStack: analysisResult.detectedStack,
      recommendedActions: analysisResult.recommendedActions,
      zipFileName: req.file.originalname
    });

    // 4. Create Issue documents with AI troubleshooting guidance
    const createdIssues = [];
    for (const finding of analysisResult.findings) {
      // Generate rich AI explanation & troubleshooting steps
      const aiData = await generateAiExplanation(finding);

      const issueDoc = await Issue.create({
        project: project._id,
        analysis: analysis._id,
        user: req.user._id,
        title: finding.title,
        file: finding.file,
        line: finding.line,
        severity: finding.severity,
        category: finding.category,
        type: finding.type,
        why: finding.why,
        impact: finding.impact,
        solution: finding.solution,
        status: 'Open',
        originalCode: finding.originalCode || '',
        suggestedFix: finding.suggestedFix || '',
        aiExplanation: aiData.aiExplanation,
        troubleshootingSteps: aiData.troubleshootingSteps,
        bestPractices: aiData.bestPractices
      });
      createdIssues.push(issueDoc);
    }

    // 5. Update Project metrics
    project.latestReadinessScore = analysisResult.readinessScore;
    project.healthScore = Math.max(10, analysisResult.readinessScore);
    project.lastScannedAt = new Date();
    project.uploadedZipName = req.file.originalname;

    // Auto-update project technologies if detected
    if (analysisResult.detectedStack.languages && analysisResult.detectedStack.languages.length > 0) {
      const existingTechs = new Set(project.technologies || []);
      analysisResult.detectedStack.languages.forEach(l => existingTechs.add(l));
      analysisResult.detectedStack.frameworks.forEach(f => existingTechs.add(f));
      project.technologies = Array.from(existingTechs);
    }

    await project.save();

    // 6. Safe cleanup of extracted directory and zip file
    cleanupDir(extractDir);
    if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);

    res.status(201).json({
      success: true,
      data: {
        analysis,
        issues: createdIssues,
        passedChecks: analysisResult.passedChecks
      }
    });

  } catch (err) {
    if (extractDir) cleanupDir(extractDir);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: `Analysis failed: ${err.message}` });
  }
});

// @route   GET /api/projects/:projectId/analyses
// @desc    Get all historical analyses for a project
// @access  Private
router.get('/:projectId/analyses', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const analyses = await Analysis.find({ project: project._id }).sort({ scanDate: -1 });
    res.json({ success: true, count: analyses.length, data: analyses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/analyses/:analysisId
// @desc    Get single analysis record with issues
// @access  Private
router.get('/analyses/:analysisId', protect, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.analysisId, user: req.user._id }).populate('project');
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    const issues = await Issue.find({ analysis: analysis._id }).sort({ severity: 1 });

    res.json({
      success: true,
      data: {
        analysis,
        issues
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects/quick-upload-and-analyze
// @desc    One-click ZIP upload: creates project automatically, analyzes errors & returns fixes
// @access  Private
router.post('/quick-upload-and-analyze', protect, upload.single('projectZip'), async (req, res) => {
  let extractDir = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a ZIP file to upload' });
    }

    const zipFilePath = req.file.path;
    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const cleanProjectName = req.body.projectName?.trim() || baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const platform = req.body.deploymentPlatform || 'Docker';

    // Create or find project for this user
    let project = await Project.findOne({ name: cleanProjectName, user: req.user._id });
    if (!project) {
      project = await Project.create({
        user: req.user._id,
        name: cleanProjectName,
        description: `Project scanned from ${req.file.originalname}`,
        deploymentPlatform: platform,
        status: 'In Progress'
      });
    }

    const baseExtractedDir = path.join(__dirname, '..', 'extracted');
    extractDir = path.join(baseExtractedDir, `scan-${Date.now()}-${Math.round(Math.random() * 10000)}`);

    // Safe extraction
    let extractStats;
    try {
      extractStats = extractZipSafely(zipFilePath, extractDir, {
        maxFiles: 1500,
        maxTotalSize: 200 * 1024 * 1024
      });
    } catch (zipErr) {
      if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
      cleanupDir(extractDir);
      return res.status(400).json({
        success: false,
        message: `Security validation notice: ${zipErr.message}`
      });
    }

    // Run static analysis & error prediction
    const analysisResult = await runAnalysis(extractDir, project.deploymentPlatform);

    // Create Analysis record
    const analysis = await Analysis.create({
      project: project._id,
      user: req.user._id,
      scanDate: new Date(),
      readinessScore: analysisResult.readinessScore,
      scoreExplanation: analysisResult.scoreExplanation,
      metrics: analysisResult.metrics,
      detectedStack: analysisResult.detectedStack,
      recommendedActions: analysisResult.recommendedActions,
      zipFileName: req.file.originalname
    });

    // Create Issue records with human clear explanations
    const createdIssues = [];
    for (const finding of analysisResult.findings) {
      const aiData = await generateAiExplanation(finding);

      const issueDoc = await Issue.create({
        project: project._id,
        analysis: analysis._id,
        user: req.user._id,
        title: finding.title,
        file: finding.file,
        line: finding.line,
        severity: finding.severity,
        category: finding.category,
        type: finding.type,
        why: finding.why,
        impact: finding.impact,
        solution: finding.solution,
        status: 'Open',
        originalCode: finding.originalCode || '',
        suggestedFix: finding.suggestedFix || '',
        aiExplanation: aiData.aiExplanation,
        troubleshootingSteps: aiData.troubleshootingSteps,
        bestPractices: aiData.bestPractices
      });
      createdIssues.push(issueDoc);
    }

    // Update project metrics
    project.latestReadinessScore = analysisResult.readinessScore;
    project.healthScore = Math.max(10, analysisResult.readinessScore);
    project.lastScannedAt = new Date();
    project.uploadedZipName = req.file.originalname;

    if (analysisResult.detectedStack.languages && analysisResult.detectedStack.languages.length > 0) {
      const existingTechs = new Set(project.technologies || []);
      analysisResult.detectedStack.languages.forEach(l => existingTechs.add(l));
      analysisResult.detectedStack.frameworks.forEach(f => existingTechs.add(f));
      project.technologies = Array.from(existingTechs);
    }

    await project.save();

    cleanupDir(extractDir);
    if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);

    res.status(201).json({
      success: true,
      data: {
        project,
        analysis,
        issues: createdIssues,
        passedChecks: analysisResult.passedChecks
      }
    });

  } catch (err) {
    if (extractDir) cleanupDir(extractDir);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: `Scan failed: ${err.message}` });
  }
});

module.exports = router;
