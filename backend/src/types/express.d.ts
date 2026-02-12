import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
      adminRole?: string;
    }
  }
}

export {};
