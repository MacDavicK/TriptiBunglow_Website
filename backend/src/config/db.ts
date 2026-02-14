import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/thane-bungalow';

const CONNECTION_HINT = `
MongoDB connection failed. Common fixes:
1. MongoDB Atlas: Add your current IP to Network Access (IP whitelist):
   https://www.mongodb.com/docs/atlas/security-whitelist/
2. Local development: Use a local MongoDB and set in .env:
   MONGODB_URI=mongodb://127.0.0.1:27017/thane-bungalow
   (Ensure MongoDB is running: brew services start mongodb-community or docker run -p 27017:27017 mongo)
`.trim();

export const connectDB = async (uri?: string): Promise<void> => {
  const envUri = process.env.MONGODB_URI?.trim();
  const isDev = process.env.NODE_ENV === 'development';
  const mongoUri = uri || envUri || (isDev ? LOCAL_MONGO_URI : undefined);

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. In production it is required. In development you can use a local MongoDB.');
  }

  if (isDev && !envUri) {
    logger.info({ uri: LOCAL_MONGO_URI }, 'Using local MongoDB (MONGODB_URI not set)');
  }

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.set('sanitizeFilter', true);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      return;
    } catch (err) {
      logger.error(
        { attempt, maxRetries: MAX_RETRIES, err },
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed`
      );

      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts.\n${CONNECTION_HINT}`);
      }

      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      logger.info(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
};
