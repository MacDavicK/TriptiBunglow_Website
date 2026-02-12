import mongoose, { Types } from 'mongoose';
import {
  checkAvailability,
  createDateHolds,
  releaseDateHolds,
  getMonthAvailability,
} from '../../src/services/availability.service';
import { Property } from '../../src/models/property.model';
import { DateHold } from '../../src/models/date-hold.model';

let propertyAId: Types.ObjectId;
let propertyBId: Types.ObjectId;

beforeEach(async () => {
  const propA = await Property.create({
    name: 'Test Property A',
    slug: 'test-a',
    ratePerNight: 2500000,
    securityDeposit: 500000,
    maxGuests: 10,
    amenities: [],
    photos: [],
  });
  const propB = await Property.create({
    name: 'Test Property B',
    slug: 'test-b',
    ratePerNight: 2500000,
    securityDeposit: 500000,
    maxGuests: 10,
    amenities: [],
    photos: [],
  });
  propertyAId = propA._id as Types.ObjectId;
  propertyBId = propB._id as Types.ObjectId;
});

describe('availability.service', () => {
  describe('checkAvailability', () => {
    it('should return empty array for available dates', async () => {
      const checkIn = new Date('2026-04-01');
      const checkOut = new Date('2026-04-03');

      const unavailable = await checkAvailability(
        propertyAId.toString(),
        checkIn,
        checkOut
      );

      expect(unavailable).toEqual([]);
    });

    it('should return unavailable dates when holds exist', async () => {
      const bookingId = new Types.ObjectId();
      await createDateHolds(
        [propertyAId.toString()],
        new Date('2026-04-01'),
        new Date('2026-04-03'),
        bookingId
      );

      const unavailable = await checkAvailability(
        propertyAId.toString(),
        new Date('2026-04-01'),
        new Date('2026-04-04')
      );

      expect(unavailable).toContain('2026-04-01');
      expect(unavailable).toContain('2026-04-02');
      expect(unavailable).not.toContain('2026-04-03');
    });
  });

  describe('createDateHolds', () => {
    it('should create holds for requested dates', async () => {
      const bookingId = new Types.ObjectId();
      await createDateHolds(
        [propertyAId.toString()],
        new Date('2026-05-01'),
        new Date('2026-05-03'),
        bookingId
      );

      const holds = await DateHold.find({ propertyId: propertyAId });
      expect(holds).toHaveLength(2);
    });

    it('should throw on overlapping holds for same property', async () => {
      const bookingId1 = new Types.ObjectId();
      const bookingId2 = new Types.ObjectId();

      await createDateHolds(
        [propertyAId.toString()],
        new Date('2026-06-01'),
        new Date('2026-06-03'),
        bookingId1
      );

      await expect(
        createDateHolds(
          [propertyAId.toString()],
          new Date('2026-06-02'),
          new Date('2026-06-04'),
          bookingId2
        )
      ).rejects.toThrow('One or more requested dates are already booked');
    });

    it('should allow holds for different properties on same dates', async () => {
      const bookingId1 = new Types.ObjectId();
      const bookingId2 = new Types.ObjectId();

      await createDateHolds(
        [propertyAId.toString()],
        new Date('2026-07-01'),
        new Date('2026-07-03'),
        bookingId1
      );

      await expect(
        createDateHolds(
          [propertyBId.toString()],
          new Date('2026-07-01'),
          new Date('2026-07-03'),
          bookingId2
        )
      ).resolves.not.toThrow();
    });
  });

  describe('releaseDateHolds', () => {
    it('should make dates available again after release', async () => {
      const bookingId = new Types.ObjectId();
      await createDateHolds(
        [propertyAId.toString()],
        new Date('2026-08-01'),
        new Date('2026-08-03'),
        bookingId
      );

      let unavailable = await checkAvailability(
        propertyAId.toString(),
        new Date('2026-08-01'),
        new Date('2026-08-03')
      );
      expect(unavailable).toHaveLength(2);

      await releaseDateHolds(bookingId);

      unavailable = await checkAvailability(
        propertyAId.toString(),
        new Date('2026-08-01'),
        new Date('2026-08-03')
      );
      expect(unavailable).toHaveLength(0);
    });
  });

  describe('getMonthAvailability', () => {
    it('should return all days of month with availability status', async () => {
      const result = await getMonthAvailability(
        propertyAId.toString(),
        2026,
        4
      );

      // April has 30 days
      expect(result).toHaveLength(30);
      expect(result.every((d) => d.available === true)).toBe(true);
    });
  });
});
