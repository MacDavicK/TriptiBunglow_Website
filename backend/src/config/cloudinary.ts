import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

let cloudinaryClient: typeof cloudinary | null = null;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  cloudinaryClient = cloudinary;
  logger.info('Cloudinary client initialized');
} else {
  logger.warn('Cloudinary env vars not set — image upload disabled');
}

export { cloudinaryClient as cloudinary };
