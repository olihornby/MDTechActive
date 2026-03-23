const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('Missing MONGO_URI in environment configuration');
  }

  await mongoose.connect(mongoUri);
};

module.exports = { connectToDatabase };
