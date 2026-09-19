import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { Product } from './models/Product.js';
import { seedDatabase } from './utils/seedData.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors({
  origin: config.clientUrl || 'http://localhost:5173',
  credentials: true
}));

// Request logger
app.use(morgan('dev'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (dev local fallback when Cloudinary is not configured)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Rate Limiter for Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/auth/login', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    application: 'PharmaTrack API',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Mount Main REST API
app.use('/api', apiRoutes);

// 404 Not Found Handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint '${req.originalUrl}' does not exist on PharmaTrack API.`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server and Database Connection
const startServer = async () => {
  try {
    await connectDB();

    // In dev mode, check if DB is empty and auto-seed for instant demo readiness
    if (config.nodeEnv !== 'production') {
      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        console.log('[Auto-Seed] Database is empty. Seeding initial pharmaceutical operations data...');
        await seedDatabase();
      }
    }

    const server = app.listen(config.port, () => {
      console.log(`[PharmaTrack Server] Listening on http://localhost:${config.port}`);
      console.log(`[PharmaTrack Server] Health check available at http://localhost:${config.port}/api/health`);
    });

    // Graceful process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received. Closing HTTP server...');
      server.close(() => console.log('HTTP server closed.'));
    });
  } catch (err) {
    console.error('[Server Startup Failure]', err);
    process.exit(1);
  }
};

startServer();

export default app;