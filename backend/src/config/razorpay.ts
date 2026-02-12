import Razorpay from 'razorpay';
import { logger } from '../utils/logger';

let razorpayInstance: Razorpay | null = null;

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (keyId && keySecret) {
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  logger.info('Razorpay client initialized');
} else {
  logger.warn('Razorpay env vars not set — payment features disabled');
}

export const razorpay = razorpayInstance;
