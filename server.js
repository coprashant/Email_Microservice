'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const emailRoutes = require('./src/routes/email.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------
// Core middleware
// ---------------------------------------------------
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin header, e.g. server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

// ---------------------------------------------------
// Routes
// ---------------------------------------------------

// Health check — useful for uptime pings (e.g. UptimeRobot, Render's
// own health checks) and to prevent Render Free Tier from sleeping.
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

// ---------------------------------------------------
// 404 handler
// ---------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ---------------------------------------------------
// Global error handler (e.g. CORS rejection, JSON parse errors)
// ---------------------------------------------------
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
