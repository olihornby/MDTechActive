const express = require('express');
const cors = require('cors');

const apiRouter = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

const localOriginPattern = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i;
const configuredOrigins = String(process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173')
	.split(',')
	.map((origin) => origin.trim())
	.filter((origin) => localOriginPattern.test(origin));

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

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
