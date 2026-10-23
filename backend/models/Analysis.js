const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
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
  scanDate: {
    type: Date,
    default: Date.now
  },
  readinessScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  scoreExplanation: {
    type: String,
    default: ''
  },
  metrics: {
    criticalIssues: { type: Number, default: 0 },
    highIssues: { type: Number, default: 0 },
    mediumIssues: { type: Number, default: 0 },
    lowIssues: { type: Number, default: 0 },
    totalIssues: { type: Number, default: 0 },
    passedChecks: { type: Number, default: 0 },
    failedChecks: { type: Number, default: 0 },
    resolvedIssues: { type: Number, default: 0 }
  },
  detectedStack: {
    languages: [{ type: String }],
    frameworks: [{ type: String }],
    hasDockerfile: { type: Boolean, default: false },
    hasCompose: { type: Boolean, default: false },
    hasEnv: { type: Boolean, default: false },
    hasPackageJson: { type: Boolean, default: false },
    hasRequirements: { type: Boolean, default: false },
    totalFilesScanned: { type: Number, default: 0 }
  },
  recommendedActions: [{
    action: { type: String },
    priority: { type: String, enum: ['Immediate', 'Recommended', 'Optional'] }
  }],
  zipFileName: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Analysis', analysisSchema);
