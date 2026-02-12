import { Router } from 'express';
import { getMyData, updateMyData, deleteMyData } from '../controllers/customer.controller';
import { validate } from '../middleware/validate.middleware';
import {
  getMyDataValidation,
  updateMyDataValidation,
  deleteMyDataValidation,
} from '../validators/customer.validator';

const router = Router();

// Customer data rights (DPDP Act)
// Authenticated via bookingId + email combination (simplified, not JWT)
router.get('/my-data', validate(getMyDataValidation), getMyData);
router.patch('/my-data', validate(updateMyDataValidation), updateMyData);
router.delete('/my-data', validate(deleteMyDataValidation), deleteMyData);

export { router as customerRoutes };
