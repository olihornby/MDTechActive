// Server entry point for upcoming Express configuration.
require('dotenv').config();

const app = require('./src/app');

const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  // Intentionally concise boot log for local-only development.
  console.log(`Server listening at http://${HOST}:${PORT}`);
});
