const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  technologies: [{
    type: String,
    trim: true
  }],
  creationDate: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expectedCompletionDate: {
    type: Date
  },
  deploymentPlatform: {
    type: String,
    enum: ['AWS', 'Docker', 'Kubernetes', 'Traditional Server', 'Vercel / Netlify', 'GCP', 'Azure', 'Other'],
    default: 'Docker'
  },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
    default: 'In Progress'
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  healthScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  latestReadinessScore: {
    type: Number,
    default: null
  },
  lastScannedAt: {
    type: Date,
    default: null
  },
  uploadedZipName: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);
