import mongoose from 'mongoose';
import { config } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[Database] Successfully connected to MongoDB: ${config.mongoUri}`);
    return true;
  } catch (err) {
    console.warn(`[Database Warning] Could not connect to primary MongoDB URI (${config.mongoUri}): ${err.message}`);

    if (config.nodeEnv !== 'production') {
      console.log('[Database Fallback] Initializing embedded in-memory MongoDB for local review/development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        await mongoose.connect(memUri);
        console.log(`[Database Fallback] Connected to in-memory MongoDB: ${memUri}`);
        return true;
      } catch (memErr) {
        console.error('[Database Fatal] Embedded in-memory MongoDB initialization failed:', memErr.message);
        throw err;
      }
    } else {
      throw err;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('[Database] Disconnected successfully');
  } catch (err) {
    console.error('[Database] Disconnection error:', err.message);
  }
};