import mongoose, { Types } from 'mongoose';
import { DateHold } from './src/models/date-hold.model';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bunglow_dev');
  console.log("Connected");
  
  const propertyId = new Types.ObjectId();
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 86400000);

  // Method 1: $and
  try {
    await DateHold.find({
      propertyId,
      $and: [
        { date: { $gte: startDate } },
        { date: { $lt: endDate } }
      ]
    }).lean();
    console.log("Method 1 Works!");
  } catch (e) {
    console.error("Method 1 FAILED:", e.message);
  }

  // Method 2: Separating to prevent merge?
  try {
    await DateHold.find({
      propertyId,
      date: { $gte: startDate },
      $and: [
        { date: { $lt: endDate } }
      ]
    }).lean();
    console.log("Method 2 Works!");
  } catch (e) {
    console.error("Method 2 FAILED:", e.message);
  }

  process.exit(0);
}

run();
