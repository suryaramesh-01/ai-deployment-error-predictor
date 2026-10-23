const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Done'],
    default: 'Todo'
  },
  deadline: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
