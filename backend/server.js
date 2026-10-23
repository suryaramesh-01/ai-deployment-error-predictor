require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Initialize MongoDB connection
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve sample test archives statically
app.use('/samples', express.static(path.join(__dirname, 'samples')));

// Health check endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    service: 'AI-Based Deployment Error Prediction API'
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/projects', require('./routes/analysisRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error(`[Server Error]: ${err.stack || err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server Running]: AI Deployment Error Predictor Backend listening on http://localhost:${PORT}`);
});
