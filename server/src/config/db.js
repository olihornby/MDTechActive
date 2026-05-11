const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('Missing MONGO_URI in environment configuration');
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || 5000),
  });
};

module.exports = { connectToDatabase };
