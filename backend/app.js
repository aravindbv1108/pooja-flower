const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const masterRoutes = require('./routes/masterRoutes');
const taskRoutes = require('./routes/taskRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// ======================================================
// SECURITY & CORE MIDDLEWARE
// ======================================================

app.use(helmet());

// Allow both local dev and your deployed Vercel frontend.
// Add more origins here (comma-separated in CLIENT_URL) if you add
// custom domains later.
const allowedOrigins = [
  'http://localhost:5173',
  'https://pooja-flower.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS: ' + origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(mongoSanitize());

// ======================================================
// LOGGING
// ======================================================

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ======================================================
// RATE LIMITING
// ======================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many attempts, please try again later.',
  },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ======================================================
// STATIC UPLOADS
// ======================================================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ======================================================
// API HEALTH
// ======================================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Pooja Flower API is running.',
  });
});

// ======================================================
// API ROUTES
// ======================================================

app.use('/api/auth', authRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// ======================================================
// ROOT - simple health message
// (Frontend is now hosted separately on Vercel, so this
// backend only needs to serve the API.)
// ======================================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Pooja Flower API. See /api/health for status.',
  });
});

// ======================================================
// ERROR HANDLING
// ======================================================

app.use(notFound);
app.use(errorHandler);

module.exports = app;