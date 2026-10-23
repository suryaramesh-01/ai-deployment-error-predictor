const User = require('../models/User');

const seedDemo = async () => {
  try {
    const emails = ['demo@epredict.ai', 'demo@predeploy.ai'];
    for (const email of emails) {
      const existing = await User.findOne({ email });
      if (!existing) {
        await User.create({
          name: 'Demo Developer',
          email,
          password: 'Password123!',
          role: 'developer'
        });
        console.log(`[Demo User]: Created ${email} / Password123!`);
      }
    }
  } catch (err) {
    console.error(`[Demo User Error]: ${err.message}`);
  }
};

module.exports = seedDemo;
