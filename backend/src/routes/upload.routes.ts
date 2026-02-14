import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { uploadDocument } from '../controllers/upload.controller';

const router = Router();

// Multer config: memory storage, 10MB max, specific MIME types
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP, PDF.'));
    }
  },
});

// Rate limiter: 10 uploads per 15 minutes per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      message: 'Too many uploads. Please try again in 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/upload/document
router.post(
  '/document',
  uploadLimiter,
  upload.single('document'),
  uploadDocument
);

export { router as uploadRoutes };
