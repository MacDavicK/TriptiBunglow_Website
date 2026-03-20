import mongoose, { Types } from 'mongoose';
import { DateHold } from './src/models/date-hold.model';
import dotenv from 'dotenv';
dotenv.config();

mongoose.set('sanitizeFilter', true);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bunglow_dev');
  
  const propertyId = new Types.ObjectId();
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 86400000);

  console.log("Method 1 (mongoose.trusted)");
  try {
    const q1 = DateHold.find({
      propertyId,
      $and: [
        { date: mongoose.trusted({ $gte: startDate }) },
        { date: mongoose.trusted({ $lt: endDate }) }
      ]
    });
    console.log("Query object:", JSON.stringify(q1.getQuery()));
    await q1.lean();
    console.log("SUCCESS");
  } catch (e: any) {
    console.error("FAILED:", e.message);
  }

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
