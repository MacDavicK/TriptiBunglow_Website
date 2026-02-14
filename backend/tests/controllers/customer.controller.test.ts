import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../../src/app';
import { Property } from '../../src/models/property.model';
import { Booking } from '../../src/models/booking.model';
import { Customer } from '../../src/models/customer.model';
import { ConsentRecord } from '../../src/models/consent-record.model';

let bookingHumanId: string;
let customerEmail: string;
let customerId: Types.ObjectId;

beforeEach(async () => {
  const property = await Property.create({
    name: 'DPDP Test Bungalow',
    slug: 'dpdp-test-bungalow',
    ratePerNight: 2500000,
    securityDeposit: 500000,
    maxGuests: 10,
    amenities: ['WiFi'],
    photos: [],
  });

  customerEmail = 'dpdptest@example.com';

  const customer = await Customer.create({
    name: 'DPDP Test Customer',
    email: customerEmail,
    phone: '+919876543210',
    address: '456 DPDP Lane, Thane 400601',
    nationality: 'indian',
    dataRetentionExpiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
  });
  customerId = customer._id as Types.ObjectId;

  const consent = await ConsentRecord.create({
    customerId: customer._id,
    consentVersion: '1.0',
    purposesConsented: ['booking', 'communication'],
    consentText: 'I agree to the terms.',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  });

  const booking = await Booking.create({
    propertyIds: [property._id],
    customerId: customer._id,
    checkIn: new Date('2026-07-10'),
    checkOut: new Date('2026-07-12'),
    nights: 2,
    bookingType: 'standard',
    status: 'confirmed',
    totalCharged: 5500000,
    depositAmount: 500000,
    consentRecordId: consent._id,
    guestCount: 4,
    reasonForRenting: 'Weekend getaway',
    termsAcceptedAt: new Date(),
    termsVersion: '1.0',
  });

  bookingHumanId = booking.bookingId;
});

describe('GET /api/customer/my-data', () => {
  it('should return customer data for valid bookingId + email', async () => {
    const res = await request(app)
      .get('/api/customer/my-data')
      .query({ bookingId: bookingHumanId, email: customerEmail })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.customer.name).toBe('DPDP Test Customer');
    expect(res.body.data.customer.email).toBe(customerEmail);
    expect(res.body.data.customer.phone).toBe('+919876543210');
    expect(res.body.data.booking.bookingId).toBe(bookingHumanId);
    expect(res.body.data.booking.status).toBe('confirmed');
    expect(res.body.data.consent).toBeTruthy();
    expect(res.body.data.consent.consentVersion).toBe('1.0');
  });

  it('should return 403 for wrong email', async () => {
    const res = await request(app)
      .get('/api/customer/my-data')
      .query({ bookingId: bookingHumanId, email: 'wrong@example.com' })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 404 for non-existent bookingId', async () => {
    const res = await request(app)
      .get('/api/customer/my-data')
      .query({ bookingId: 'BK-nonexist', email: customerEmail })
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /api/customer/my-data', () => {
  it('should update customer name and phone', async () => {
    const res = await request(app)
      .patch('/api/customer/my-data')
      .send({
        bookingId: bookingHumanId,
        email: customerEmail,
        updates: { name: 'Updated Name', phone: '+919999999999' },
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.updatedFields).toContain('name');
    expect(res.body.data.updatedFields).toContain('phone');

    // Verify in DB
    const customer = await Customer.findById(customerId);
    expect(customer!.name).toBe('Updated Name');
    expect(customer!.phone).toBe('+919999999999');
  });
});

describe('DELETE /api/customer/my-data', () => {
  it('should anonymize customer data while keeping booking intact', async () => {
    const res = await request(app)
      .delete('/api/customer/my-data')
      .send({
        bookingId: bookingHumanId,
        email: customerEmail,
      })
      .expect(200);

    expect(res.body.success).toBe(true);

    // Customer should be anonymized
    const customer = await Customer.findById(customerId);
    expect(customer!.name).toBe('Deleted User');
    expect(customer!.email).toContain('anonymized.local');
    expect(customer!.phone).toBe('0000000000');

    // Booking should still exist and be intact
    const booking = await Booking.findOne({ bookingId: bookingHumanId });
    expect(booking).toBeTruthy();
    expect(booking!.status).toBe('confirmed');
    expect(booking!.totalCharged).toBe(5500000);
  });
});
