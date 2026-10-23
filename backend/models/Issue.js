const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  analysis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Analysis',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  file: {
    type: String,
    default: 'unknown'
  },
  line: {
    type: Number,
    default: null
  },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['Configuration', 'Dependency', 'Security', 'Docker', 'Port', 'AWS', 'Syntax', 'Build', 'General'],
    default: 'General'
  },
  type: {
    type: String,
    enum: ['Confirmed Error', 'Predicted Risk'],
    default: 'Predicted Risk'
  },
  why: {
    type: String,
    default: ''
  },
  impact: {
    type: String,
    default: ''
  },
  solution: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Reopened'],
    default: 'Open',
    index: true
  },
  originalCode: {
    type: String,
    default: ''
  },
  suggestedFix: {
    type: String,
    default: ''
  },
  aiExplanation: {
    type: String,
    default: ''
  },
  troubleshootingSteps: [{
    type: String
  }],
  bestPractices: [{
    type: String
  }],
  isTaskCreated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Issue', issueSchema);
