import { Request, Response } from 'express';
import { cloudinary } from '../config/cloudinary';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

const ALLOWED_TYPES = ['aadhaar', 'payment_screenshot'] as const;

/**
 * POST /api/upload/document
 * Upload a document (Aadhaar or PAN) to Cloudinary.
 * Accepts multipart form data with field `document` and body field `type`.
 * Returns the Cloudinary secure URL and public ID.
 */
export const uploadDocument = catchAsync(async (req: Request, res: Response) => {
  if (!cloudinary) {
    throw new AppError('File upload service not configured', 503, 'UPLOAD_NOT_CONFIGURED');
  }

  const file = req.file;
  if (!file) {
    throw new AppError('No file provided. Use field name "document".', 400, 'NO_FILE');
  }

  const docType = req.body.type as string;
  if (!docType || !ALLOWED_TYPES.includes(docType as any)) {
    throw new AppError(
      `Invalid document type. Must be one of: ${ALLOWED_TYPES.join(', ')}`,
      400,
      'INVALID_DOC_TYPE'
    );
  }

  // Upload buffer to Cloudinary
  // cloudinary is guaranteed non-null after the guard above
  const cld = cloudinary!;
  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cld.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: `tripti-bungalow/documents/${docType}`,
        access_mode: 'authenticated',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(file.buffer);
  });

  logger.info(
    { publicId: result.public_id, docType },
    'Document uploaded to Cloudinary'
  );

  res.status(201).json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });
});
