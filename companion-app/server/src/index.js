import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isConnected } from './db.js';
import userRoutes from './routes/userRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - supports Web, Android Capacitor, Localhost
app.use(cors({
  origin: '*', // Allow all origins for mobile app & local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SentryX Backend API',
    database: isConnected() ? 'connected' : 'disconnected / standby',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/user', userRoutes);
app.use('/api/files', fileRoutes);

// Catch-all 404 & centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  // Connect to MongoDB Atlas
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 SentryX API Server running on port ${PORT}`);
    console.log(`🔗 Local:   http://localhost:${PORT}/api/health`);
    console.log(`📱 Network: http://0.0.0.0:${PORT}/api/health`);
    console.log(`==================================================\n`);
  });
}

startServer();
