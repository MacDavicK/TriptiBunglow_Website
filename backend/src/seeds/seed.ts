import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Property } from '../models/property.model';
import { AdminUser } from '../models/admin-user.model';
import { logger } from '../utils/logger';

const PROPERTIES = [
  {
    name: 'Tripti Bungalow, No. 15',
    slug: 'tripti-bungalow-15',
    description: 'A premium vacation bungalow in Thane with a large lawn, spacious living areas, fully equipped kitchen, balcony, terrace, and modern amenities. Perfect for family getaways, birthday parties, and weekend retreats for up to 50 guests.',
    ratePerNight: 4000000,
    securityDeposit: 500000,
    maxGuests: 50,
    amenities: ['2 Bedrooms', '2 Bathrooms', 'Hall', 'Kitchen', 'Balcony', 'Terrace', 'Large Lawn'],
    photos: [],
    isActive: true,
  },
  {
    name: 'Tripti Bungalow, No. 14',
    slug: 'tripti-bungalow-14',
    description: 'A spacious event-ready bungalow in Thane with a large lawn, fully equipped kitchen, balcony, terrace, and modern amenities. Ideal for family gatherings, parties, and special celebrations for up to 50 guests.',
    ratePerNight: 4000000,
    securityDeposit: 500000,
    maxGuests: 50,
    amenities: ['2 Bedrooms', '2 Bathrooms', 'Hall', 'Kitchen', 'Balcony', 'Terrace', 'Large Lawn'],
    photos: [],
    isActive: true,
  },
];

const seed = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    logger.error('MONGODB_URI not set. Cannot seed.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data (dev only)
    if (process.env.NODE_ENV !== 'production') {
      await Property.deleteMany({});
      await AdminUser.deleteMany({});
      logger.info('Cleared existing properties and admin users');
    }

    // Seed properties
    const properties = await Property.insertMany(PROPERTIES);
    logger.info(`Seeded ${properties.length} properties`);

    // Seed admin user
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Admin';

    if (adminEmail && adminPassword) {
      const admin = new AdminUser({
        email: adminEmail,
        passwordHash: adminPassword, // Will be hashed by pre-save hook
        name: adminName,
        role: 'owner',
        refreshTokens: [],
      });
      await admin.save();
      logger.info(`Seeded admin user: ${adminEmail}`);
    } else {
      logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed');
    }

    logger.info('Seed completed successfully');
  } catch (err) {
    logger.error({ err }, 'Seed failed');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

seed();
