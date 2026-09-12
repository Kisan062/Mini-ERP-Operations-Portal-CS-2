/**
 * src/app.js - Express Application Setup
 * Wires together all middleware, routes, and error handling
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const workOrderRoutes = require('./routes/workOrder.routes');
const transferRoutes = require('./routes/transfer.routes');
const orderRoutes = require('./routes/order.routes');
const referenceRoutes = require('./routes/reference.routes');

const app = express();

// Trust reverse proxy (Render, Vercel, Heroku, AWS load balancers)
app.set('trust proxy', 1);

// ─── Connect Database ─────────────────────────────────────────────────────────
connectDB();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// Rate limiting (generous to allow active testing, evaluation, and dashboard usage)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mini ERP API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger API Documentation ────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Mini ERP API Docs',
}));

// Expose swagger spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', referenceRoutes); // /api/categories, /api/items, /api/locations, /api/batches, /api/users

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
