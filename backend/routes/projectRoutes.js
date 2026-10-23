const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Analysis = require('../models/Analysis');
const Issue = require('../models/Issue');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// @route   GET /api/projects/stats/dashboard
// @desc    Get aggregated dashboard stats for the current user
// @access  Private
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({ user: userId });
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const ongoingProjects = projects.filter(p => p.status === 'In Progress').length;

    // Issue statistics
    const issues = await Issue.find({ user: userId });
    const totalDetectedErrors = issues.length;
    const criticalDeploymentIssues = issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length;
    const resolvedIssues = issues.filter(i => i.status === 'Resolved').length;

    // Project health and completion calculation
    const avgHealthScore = totalProjects > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.healthScore || 100), 0) / totalProjects)
      : 100;

    const avgCompletionPercentage = totalProjects > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.completionPercentage || 0), 0) / totalProjects)
      : 0;

    // Upcoming deadlines from projects and tasks
    const now = new Date();
    const upcomingDeadlines = [];

    projects.forEach(p => {
      if (p.expectedCompletionDate && new Date(p.expectedCompletionDate) >= now) {
        upcomingDeadlines.push({
          type: 'Project Milestone',
          title: p.name,
          date: p.expectedCompletionDate,
          projectId: p._id,
          priority: p.latestReadinessScore && p.latestReadinessScore < 70 ? 'High' : 'Normal'
        });
      }
    });

    const pendingTasks = await Task.find({ user: userId, status: { $ne: 'Done' }, deadline: { $gte: now } })
      .populate('project', 'name')
      .sort({ deadline: 1 })
      .limit(5);

    pendingTasks.forEach(t => {
      upcomingDeadlines.push({
        type: 'Task Due',
        title: t.title,
        date: t.deadline,
        projectName: t.project?.name || 'Project',
        projectId: t.project?._id,
        priority: t.priority
      });
    });

    upcomingDeadlines.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Recent activities (recent analyses, created tasks, updated issues)
    const recentAnalyses = await Analysis.find({ user: userId })
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    const recentActivities = recentAnalyses.map(a => ({
      id: a._id,
      type: 'scan',
      text: `Ran deployment analysis on "${a.project?.name || 'Project'}" (Score: ${a.readinessScore}/100)`,
      date: a.createdAt,
      projectId: a.project?._id,
      score: a.readinessScore
    }));

    // Platform distribution
    const platformCounts = {};
    projects.forEach(p => {
      const plat = p.deploymentPlatform || 'Docker';
      platformCounts[plat] = (platformCounts[plat] || 0) + 1;
    });

    // Severity breakdown
    const severityBreakdown = {
      Critical: issues.filter(i => i.severity === 'Critical').length,
      High: issues.filter(i => i.severity === 'High').length,
      Medium: issues.filter(i => i.severity === 'Medium').length,
      Low: issues.filter(i => i.severity === 'Low').length
    };

    res.json({
      success: true,
      stats: {
        totalProjects,
        completedProjects,
        ongoingProjects,
        totalDetectedErrors,
        criticalDeploymentIssues,
        resolvedIssues,
        avgHealthScore,
        avgCompletionPercentage,
        upcomingDeadlines: upcomingDeadlines.slice(0, 5),
        recentActivities,
        platformCounts,
        severityBreakdown
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects
// @desc    Get all projects for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      description,
      technologies,
      creationDate,
      startDate,
      expectedCompletionDate,
      deploymentPlatform,
      status
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const project = await Project.create({
      user: req.user._id,
      name,
      description: description || '',
      technologies: Array.isArray(technologies) ? technologies : (technologies ? technologies.split(',').map(s => s.trim()) : []),
      creationDate: creationDate || Date.now(),
      startDate: startDate || Date.now(),
      expectedCompletionDate: expectedCompletionDate || null,
      deploymentPlatform: deploymentPlatform || 'Docker',
      status: status || 'In Progress',
      completionPercentage: 0,
      healthScore: 100
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project by ID with overview metrics
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get latest analysis
    const latestAnalysis = await Analysis.findOne({ project: project._id }).sort({ createdAt: -1 });

    // Get tasks
    const tasks = await Task.find({ project: project._id });
    const completedTasksCount = tasks.filter(t => t.status === 'Done').length;
    const pendingTasksCount = tasks.filter(t => t.status !== 'Done').length;

    // Get issues
    const issues = await Issue.find({ project: project._id });
    const openIssues = issues.filter(i => i.status === 'Open');
    const criticalIssues = issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved');

    res.json({
      success: true,
      data: {
        project,
        latestAnalysis,
        summary: {
          totalTasks: tasks.length,
          completedTasks: completedTasksCount,
          pendingTasks: pendingTasksCount,
          totalIssues: issues.length,
          openIssuesCount: openIssues.length,
          criticalIssuesCount: criticalIssues.length,
          resolvedIssuesCount: issues.filter(i => i.status === 'Resolved').length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project details
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const {
      name,
      description,
      technologies,
      startDate,
      expectedCompletionDate,
      deploymentPlatform,
      status,
      completionPercentage
    } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (technologies) {
      project.technologies = Array.isArray(technologies) ? technologies : technologies.split(',').map(s => s.trim());
    }
    if (startDate) project.startDate = startDate;
    if (expectedCompletionDate !== undefined) project.expectedCompletionDate = expectedCompletionDate;
    if (deploymentPlatform) project.deploymentPlatform = deploymentPlatform;
    if (status) project.status = status;
    if (completionPercentage !== undefined) project.completionPercentage = completionPercentage;

    await project.save();

    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project and its data
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await Issue.deleteMany({ project: project._id });
    await Task.deleteMany({ project: project._id });
    await Analysis.deleteMany({ project: project._id });
    await Project.deleteOne({ _id: project._id });

    res.json({ success: true, message: 'Project and all associated records deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
