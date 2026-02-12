import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { app } from '../../src/app';
import { Property } from '../../src/models/property.model';
import { DateHold } from '../../src/models/date-hold.model';

let propertyId: string;

const validBookingPayload = () => ({
  propertyIds: [propertyId],
  checkIn: '2026-06-15',
  checkOut: '2026-06-17',
  bookingType: 'standard',
  guestCount: 5,
  customer: {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '+919876543210',
    nationality: 'indian',
  },
  consent: {
    consentVersion: '1.0',
    purposesConsented: ['booking', 'communication'],
    consentText: 'I agree to the terms and conditions.',
  },
});

beforeEach(async () => {
  const property = await Property.create({
    name: 'Test Bungalow',
    slug: 'test-bungalow',
    ratePerNight: 2500000,
    securityDeposit: 500000,
    maxGuests: 15,
    amenities: ['WiFi'],
    photos: [],
  });
  propertyId = (property._id as Types.ObjectId).toString();
});

describe('POST /api/bookings', () => {
  it('should create a standard booking and return 201 with bookingId', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send(validBookingPayload())
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingId).toMatch(/^BK-/);
    expect(res.body.data.status).toBe('hold');
    expect(res.body.data.nights).toBe(2);
  });

  it('should return 400 for past check-in date', async () => {
    const payload = validBookingPayload();
    payload.checkIn = '2020-01-01';
    payload.checkOut = '2020-01-03';

    const res = await request(app)
      .post('/api/bookings')
      .send(payload)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should return 400 when checkOut is not after checkIn', async () => {
    const payload = validBookingPayload();
    payload.checkOut = payload.checkIn;

    const res = await request(app)
      .post('/api/bookings')
      .send(payload)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should return 409 for already-booked dates', async () => {
    // First booking succeeds
    await request(app)
      .post('/api/bookings')
      .send(validBookingPayload())
      .expect(201);

    // Second booking on same dates fails
    const res = await request(app)
      .post('/api/bookings')
      .send(validBookingPayload())
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DATES_UNAVAILABLE');
  });
});
