const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./common/config/swagger');
const errorHandler = require('./common/middleware/error.middleware');

// Feature routes
const authRoutes = require('./features/auth/auth.routes');
const deliveryRoutes = require('./features/delivery/delivery.routes');
const userRoutes = require('./features/user/user.routes');

const app = express();

// ─── Global Middleware ───
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Swagger Docs ───
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RTDMS API Docs',
}));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/users', userRoutes);

// ─── Health Check ───
app.get('/', (req, res) => {
  res.json({
    message: 'RTDMS API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Error Handler (must be last) ───
app.use(errorHandler);

module.exports = app;
