import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    // Required in production; optional in development (db.ts uses local MongoDB fallback when unset)
    MONGODB_URI: z.string().optional(),
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be a 32-byte hex string (64 chars)'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),

    // Optional — Day 6-8 integrations
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_PATH: z.string().optional(),
    GOOGLE_CALENDAR_ID: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    FROM_EMAIL: z.string().email().optional(),

    // Admin seed data
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(8).optional(),
    ADMIN_NAME: z.string().optional(),
  })
  .refine(
    (data) => data.NODE_ENV !== 'production' || (data.MONGODB_URI && data.MONGODB_URI.length > 0),
    { message: 'MONGODB_URI is required in production', path: ['MONGODB_URI'] }
  );

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.format();
  console.error('Environment variable validation failed:');
  console.error(JSON.stringify(formatted, null, 2));
  process.exit(1);
}

export const env = parsed.data;
