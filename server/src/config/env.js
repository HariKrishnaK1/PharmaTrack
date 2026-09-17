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
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || ''
};