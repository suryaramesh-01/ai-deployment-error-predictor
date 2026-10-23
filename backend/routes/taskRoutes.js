const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a project
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId, user: req.user._id })
      .populate('issue')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/tasks/project/:projectId
// @desc    Create a new task (manually or linked to an issue)
// @access  Private
router.post('/project/:projectId', protect, async (req, res) => {
  try {
    const { title, description, priority, deadline, issueId } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const task = await Task.create({
      project: req.params.projectId,
      user: req.user._id,
      issue: issueId || null,
      title,
      description: description || '',
      priority: priority || 'Medium',
      deadline: deadline || null,
      status: 'Todo'
    });

    if (issueId) {
      await Issue.findByIdAndUpdate(issueId, { isTaskCreated: true });
    }

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/tasks/:taskId
// @desc    Update task status, priority, or deadline
// @access  Private
router.put('/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { status, title, description, priority, deadline } = req.body;
    if (status) {
      task.status = status;
      if (status === 'Done') {
        task.completedAt = new Date();
        // If linked to an issue, optionally mark issue resolved
        if (task.issue) {
          await Issue.findByIdAndUpdate(task.issue, { status: 'Resolved' });
        }
      } else {
        task.completedAt = null;
      }
    }
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;

    await task.save();

    // Update project completion percentage based on tasks
    const allTasks = await Task.find({ project: task.project });
    const doneTasks = allTasks.filter(t => t.status === 'Done').length;
    if (allTasks.length > 0) {
      const percentage = Math.round((doneTasks / allTasks.length) * 100);
      await Project.findByIdAndUpdate(task.project, { completionPercentage: percentage });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/tasks/:taskId
// @desc    Delete task
// @access  Private
router.delete('/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.issue) {
      await Issue.findByIdAndUpdate(task.issue, { isTaskCreated: false });
    }

    await Task.deleteOne({ _id: task._id });
    res.json({ success: true, message: 'Task removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
