import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmatrack',
  jwtSecret: process.env.JWT_SECRET || 'pharmatrack_jwt_secret_key_prod_default_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  aiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  // Email (Nodemailer via Gmail App Password)
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  // Comma-separated admin emails to receive critical alerts
  adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
  // Cloudinary (for document storage — optional, falls back to local disk)
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
};