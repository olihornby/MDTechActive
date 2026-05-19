const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRouter = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

const configuredOrigins = String(process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

const allowedOrigins = new Set(
	configuredOrigins.length > 0 ? configuredOrigins : ['http://127.0.0.1:5173']
);

app.use(
	cors({
		origin(origin, callback) {
			if (!origin) {
				return callback(null, true);
			}

			if (allowedOrigins.has(origin)) {
				return callback(null, true);
			}

			return callback(new Error('Blocked by local-only CORS policy'));
		},
	})
);
app.use(express.json());

app.use('/api', apiRouter);

const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get(/^(?!\/api(?:\/|$)).*/, (request, response) => {
	response.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
