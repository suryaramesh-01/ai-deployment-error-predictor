const mongoose = require('mongoose');
const seedDemo = require('./seedDemo');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_deployment_error_predictor';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    await seedDemo();
  } catch (err) {
    console.error(`[MongoDB Connection Error]: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
