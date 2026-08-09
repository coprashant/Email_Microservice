'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const emailRoutes = require('./src/routes/email.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy configuration for reverse proxy hosting
// Trust one upstream hop so client ip detection is accurate
app.set('trust proxy', 1);

// Core middleware setup
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non browser requests without origin header
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

// Route registration

// Health endpoint for uptime monitoring and service readiness
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/', (req, res) => {
  res.status(200).json({
    service: 'email-microservice',
    status: 'running',
    docs: '/health, POST /api/v1/send-email',
  });
});

app.use('/api/v1', emailRoutes);

// Not found handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// Global error handler for uncaught middleware errors
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err?.message || err);
  res.status(err?.status || 500).json({
    success: false,
    error: err?.message || 'Internal server error.',
  });
});

app.listen(PORT, () => {
  console.log(`Email microservice listening on port ${PORT}`);
});

module.exports = app;