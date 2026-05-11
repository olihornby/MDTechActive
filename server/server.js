require('dotenv').config();

const { connectToDatabase } = require('./src/config/db');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  let runtimeMode = 'in-memory';
  const hasMongoUri = Boolean((process.env.MONGO_URI || '').trim());

  if (hasMongoUri) {
    try {
      await connectToDatabase();
      runtimeMode = 'mongodb';
      console.log('MongoDB connected successfully.');
    } catch (error) {
      console.warn('MongoDB connection failed; falling back to in-memory mode.');
      console.warn(error.message);
      // Route modules check this at load time to decide storage mode.
      process.env.MONGO_URI = '';
    }
  } else {
    console.warn('MONGO_URI not set; running in in-memory mode.');
  }

  const app = require('./src/app');

  app.listen(PORT, HOST, () => {
    console.log(`Server listening at http://${HOST}:${PORT} (${runtimeMode} mode)`);
  });
};

startServer();
