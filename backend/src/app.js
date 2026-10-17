const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const clientsRoutes = require('./routes/clients.routes');
const servicesRoutes = require('./routes/services.routes');
const deliverablesRoutes = require('./routes/deliverables.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const calendarRoutes = require('./routes/calendar.routes');
const pingsRoutes = require('./routes/pings.routes');
const activityRoutes = require('./routes/activity.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allow inline scripts/styles in frontend
}));

const allowedOrigin = process.env.CLIENT_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', generalLimiter);

// Static uploads serving
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Static frontend serving
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Huddle TrackOS API', timestamp: new Date() });
});

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/deliverables', deliverablesRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/pings', pingsRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 for unhandled API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// SPA fallback: return index.html for non-API web routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
