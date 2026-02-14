import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import { Payment } from '../../src/models/payment.model';
import { Booking } from '../../src/models/booking.model';
import { Property } from '../../src/models/property.model';
import { Customer } from '../../src/models/customer.model';
import { ConsentRecord } from '../../src/models/consent-record.model';

// Mock Razorpay before importing the service
jest.mock('../../src/config/razorpay', () => ({
  razorpay: {
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test123',
        amount: 5500000,
        currency: 'INR',
      }),
    },
    payments: {
      refund: jest.fn().mockResolvedValue({
        id: 'rfnd_test456',
        amount: 500000,
      }),
    },
  },
}));

import * as paymentService from '../../src/services/payment.service';

let bookingId: Types.ObjectId;
let propertyId: Types.ObjectId;

beforeEach(async () => {
  // Set env vars for payment verification
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
  process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_for_hmac';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';

  const property = await Property.create({
    name: 'Payment Test Bungalow',
    slug: 'payment-test-bungalow',
    ratePerNight: 2500000,
    securityDeposit: 500000,
    maxGuests: 10,
    amenities: ['WiFi'],
    photos: [],
  });
  propertyId = property._id as Types.ObjectId;

  const customer = await Customer.create({
    name: 'Payment Test Customer',
    email: 'payment@test.com',
    phone: '+919876543210',
    address: '123 Test Street, Mumbai 400001',
    nationality: 'indian',
    dataRetentionExpiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
  });

  const consent = await ConsentRecord.create({
    customerId: customer._id,
    consentVersion: '1.0',
    purposesConsented: ['booking'],
    consentText: 'I agree.',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
  });

  const booking = await Booking.create({
    propertyIds: [propertyId],
    customerId: customer._id,
    checkIn: new Date('2026-08-01'),
    checkOut: new Date('2026-08-03'),
    nights: 2,
    bookingType: 'standard',
    status: 'hold',
    totalCharged: 5500000,
    depositAmount: 500000,
    consentRecordId: consent._id,
    guestCount: 5,
    reasonForRenting: 'Family vacation',
    termsAcceptedAt: new Date(),
    termsVersion: '1.0',
  });
  bookingId = booking._id as Types.ObjectId;
});

describe('payment.service', () => {
  describe('createOrder', () => {
    it('should create a Razorpay order and Payment document', async () => {
      const result = await paymentService.createOrder(bookingId, 5500000);

      expect(result.orderId).toBe('order_test123');
      expect(result.amount).toBe(5500000);
      expect(result.currency).toBe('INR');
      expect(result.key).toBe('rzp_test_key');

      // Payment document should exist
      const payment = await Payment.findOne({ razorpayOrderId: 'order_test123' });
      expect(payment).toBeTruthy();
      expect(payment!.amount).toBe(5500000);
      expect(payment!.status).toBe('created');

      // Booking should have razorpayOrderId
      const updatedBooking = await Booking.findById(bookingId);
      expect(updatedBooking!.razorpayOrderId).toBe('order_test123');
    });
  });

  describe('verifyPayment', () => {
    beforeEach(async () => {
      // Create an order first
      await paymentService.createOrder(bookingId, 5500000);
    });

    it('should verify a valid payment signature and update records', async () => {
      const orderId = 'order_test123';
      const paymentId = 'pay_test789';
      const body = orderId + '|' + paymentId;
      const signature = crypto
        .createHmac('sha256', 'test_secret_key_for_hmac')
        .update(body)
        .digest('hex');

      const booking = await paymentService.verifyPayment(orderId, paymentId, signature);

      expect(booking).toBeTruthy();

      // Payment should be updated
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      expect(payment!.status).toBe('captured');
      expect(payment!.razorpayPaymentId).toBe(paymentId);

      // Booking should be confirmed
      const updatedBooking = await Booking.findById(bookingId);
      expect(updatedBooking!.status).toBe('confirmed');
      expect(updatedBooking!.razorpayPaymentId).toBe(paymentId);
    });

    it('should throw on invalid signature', async () => {
      await expect(
        paymentService.verifyPayment('order_test123', 'pay_test789', 'invalid_signature_hex')
      ).rejects.toThrow();
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid webhook signature', () => {
      const body = Buffer.from('{"event":"payment.captured"}');
      const signature = crypto
        .createHmac('sha256', 'test_webhook_secret')
        .update(body)
        .digest('hex');

      expect(paymentService.verifyWebhookSignature(body, signature)).toBe(true);
    });

    it('should return false for invalid webhook signature', () => {
      const body = Buffer.from('{"event":"payment.captured"}');
      expect(paymentService.verifyWebhookSignature(body, 'bad_sig')).toBe(false);
    });
  });

  describe('processRefund', () => {
    it('should process a refund and push to Payment.refunds', async () => {
      // Create order and simulate captured payment
      await paymentService.createOrder(bookingId, 5500000);
      await Payment.updateOne(
        { razorpayOrderId: 'order_test123' },
        { status: 'captured', razorpayPaymentId: 'pay_test789' }
      );

      const result = await paymentService.processRefund('pay_test789', 500000, 'Deposit refund');

      expect(result.refundId).toBe('rfnd_test456');
      expect(result.amount).toBe(500000);

      const payment = await Payment.findOne({ razorpayPaymentId: 'pay_test789' });
      expect(payment!.refunds).toHaveLength(1);
      expect(payment!.refunds[0].refundId).toBe('rfnd_test456');
      expect(payment!.refunds[0].reason).toBe('Deposit refund');
    });
  });
});
