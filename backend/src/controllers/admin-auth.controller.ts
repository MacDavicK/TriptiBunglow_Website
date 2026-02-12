import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/admin-user.model';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';
import { logAudit } from '../services/audit.service';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const generateAccessToken = (adminId: string, role: string): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');
  return jwt.sign({ adminId, role }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await AdminUser.findOne({ email });
  if (!admin) {
    throw new AppError('Invalid email or password', 401, 'AUTH_FAILED');
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'AUTH_FAILED');
  }

  const accessToken = generateAccessToken(admin._id.toString(), admin.role);
  const refreshToken = generateRefreshToken();
  const hashedRefreshToken = hashToken(refreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Store hashed refresh token
  admin.refreshTokens.push({
    token: hashedRefreshToken,
    expiresAt,
    createdAt: new Date(),
  });

  // Limit stored refresh tokens to 5 (cleanup old ones)
  if (admin.refreshTokens.length > 5) {
    admin.refreshTokens = admin.refreshTokens.slice(-5);
  }

  await admin.save();

  await logAudit('admin.login', 'AdminUser', admin._id, admin._id.toString(), {
    ip: req.ip,
  });

  // Set refresh token as HttpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/admin/auth',
  });

  res.json({
    success: true,
    data: {
      accessToken,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    },
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new AppError('Refresh token required', 401, 'REFRESH_REQUIRED');
  }

  const hashedToken = hashToken(token);

  const admin = await AdminUser.findOne({
    'refreshTokens.token': hashedToken,
  });

  if (!admin) {
    throw new AppError('Invalid refresh token', 401, 'REFRESH_INVALID');
  }

  // Find and validate the specific refresh token
  const tokenDoc = admin.refreshTokens.find((t) => t.token === hashedToken);
  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    // Remove expired token
    admin.refreshTokens = admin.refreshTokens.filter((t) => t.token !== hashedToken);
    await admin.save();
    throw new AppError('Refresh token expired', 401, 'REFRESH_EXPIRED');
  }

  // Rotate: remove old, add new
  admin.refreshTokens = admin.refreshTokens.filter((t) => t.token !== hashedToken);

  const newRefreshToken = generateRefreshToken();
  const newHashedRefreshToken = hashToken(newRefreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  admin.refreshTokens.push({
    token: newHashedRefreshToken,
    expiresAt,
    createdAt: new Date(),
  });

  await admin.save();

  const accessToken = generateAccessToken(admin._id.toString(), admin.role);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/admin/auth',
  });

  res.json({
    success: true,
    data: { accessToken },
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    const hashedToken = hashToken(token);
    await AdminUser.updateOne(
      { 'refreshTokens.token': hashedToken },
      { $pull: { refreshTokens: { token: hashedToken } } }
    );
  }

  res.clearCookie('refreshToken', { path: '/api/admin/auth' });

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});
