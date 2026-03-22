const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./src/common/config/db');
const logger = require('./src/common/utils/logger');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Import express app
const app = require('./src/app');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Make io accessible to routes via req.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io auth & handlers
const socketAuth = require('./src/socket/socket.auth');
const setupSocket = require('./src/socket/socket.handler');

io.use(socketAuth);
setupSocket(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.server(`Running on port ${PORT}`);
  logger.server(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
