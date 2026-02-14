import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useProperty } from '@/hooks/useProperties';
import { useBooking } from '@/hooks/useBooking';
import { createOrder } from '@/services/payment.api';
import { verifyPayment } from '@/services/payment.api';
import { openCheckout } from '@/hooks/useRazorpay';
import { formatCurrency } from '@/utils/format-currency';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { TermsAndConditions } from '@/components/booking/TermsAndConditions';
import { DocumentUpload } from '@/components/ui/DocumentUpload';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { CreateBookingRequest } from '@shared/types';

const RATE_PAISE = 2500000;
const DEPOSIT_PAISE = 500000;
const IST = 'Asia/Kolkata';

const guestDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format (e.g., ABCDE1234F)')
    .optional()
    .or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email('Invalid email address'),
  guestCount: z.number().min(1, 'At least 1 guest').max(50, 'Maximum 50 guests'),
  reasonForRenting: z.string().min(1, 'Please select a reason'),
  customReason: z.string().optional(),
});

const datesSchema = z
  .object({
    checkIn: z.string().min(1, 'Check-in date is required'),
    checkOut: z.string().min(1, 'Check-out date is required'),
    bookingType: z.enum(['standard', 'special']),
    specialRequests: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.checkIn || !data.checkOut) return true;
      return new Date(data.checkOut) > new Date(data.checkIn);
    },
    { message: 'Check-out must be after check-in', path: ['checkOut'] }
  );

const step3Schema = z.object({
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy terms' }),
  }),
});

type GuestDetailsValues = z.infer<typeof guestDetailsSchema>;
type DatesValues = z.infer<typeof datesSchema>;

const REASON_OPTIONS = [
  { value: '', label: 'Select reason' },
  { value: 'Family Gathering', label: 'Family Gathering' },
  { value: 'Birthday Party', label: 'Birthday Party' },
  { value: 'Corporate Retreat', label: 'Corporate Retreat' },
  { value: 'Wedding Function', label: 'Wedding Function' },
  { value: 'Weekend Getaway', label: 'Weekend Getaway' },
  { value: 'Festival Celebration', label: 'Festival Celebration' },
  { value: 'Other', label: 'Other' },
];

function formatDateLocalDDMMYYYY(date: Date): string {
  return format(toZonedTime(date, IST), 'dd/MM/yyyy');
}

function formatDateForInput(isoDateStr: string): string {
  const d = new Date(isoDateStr);
  return format(d, 'yyyy-MM-dd');
}

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState('');
  const [termsVersion, setTermsVersion] = useState('');
  const [aadhaarUploadUrl, setAadhaarUploadUrl] = useState<string | undefined>();
  const [panUploadUrl, setPanUploadUrl] = useState<string | undefined>();

  const urlCheckIn = searchParams.get('checkIn') ?? '';
  const urlCheckOut = searchParams.get('checkOut') ?? '';

  const { data: property } = useProperty(slug);
  const createBookingMutation = useBooking();

  const guestForm = useForm<GuestDetailsValues>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: {
      name: '',
      address: '',
      aadhaarNumber: '',
      panNumber: '',
      phone: '',
      email: '',
      guestCount: 2,
      reasonForRenting: '',
      customReason: '',
    },
  });

  const datesForm = useForm<DatesValues>({
    resolver: zodResolver(datesSchema),
    defaultValues: {
      checkIn: urlCheckIn ? formatDateForInput(urlCheckIn) : '',
      checkOut: urlCheckOut ? formatDateForInput(urlCheckOut) : '',
      bookingType: 'standard',
      specialRequests: '',
    },
  });

  const step3Form = useForm<{ consent: boolean }>({
    resolver: zodResolver(step3Schema),
    defaultValues: { consent: false },
  });

  const checkIn = datesForm.watch('checkIn');
  const checkOut = datesForm.watch('checkOut');
  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (24 * 60 * 60 * 1000)
        )
      : 0;
  const totalPaise = nights * RATE_PAISE + DEPOSIT_PAISE;

  const handleTermsAccept = (accepted: boolean, version: string, acceptedAt: string) => {
    setTermsVersion(version);
    setTermsAcceptedAt(accepted ? acceptedAt : '');
  };

  const onStep1Submit = (_data: GuestDetailsValues) => {
    setStep(2);
  };

  const onStep2Submit = (_data: DatesValues) => {
    setStep(3);
  };

  const onStep3Submit = async () => {
    if (!property) {
      toast.error('Missing property');
      return;
    }
    const guest = guestForm.getValues();
    const dates = datesForm.getValues();
    const checkInISO = dates.checkIn;
    const checkOutISO = dates.checkOut;
    if (!checkInISO || !checkOutISO) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    const reasonForRenting =
      guest.reasonForRenting === 'Other' ? guest.customReason || 'Other' : guest.reasonForRenting;

    const payload: CreateBookingRequest = {
      propertyIds: [property._id],
      checkIn: checkInISO,
      checkOut: checkOutISO,
      bookingType: dates.bookingType,
      guestCount: guest.guestCount,
      specialRequests: dates.specialRequests,
      reasonForRenting,
      termsAcceptedAt,
      termsVersion,
      customer: {
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        address: guest.address,
        nationality: 'indian',
        idType: 'aadhaar',
        idNumber: guest.aadhaarNumber,
        panNumber: guest.panNumber && guest.panNumber.trim() ? guest.panNumber : undefined,
        aadhaarDocumentUrl: aadhaarUploadUrl,
        panDocumentUrl: panUploadUrl,
      },
      consent: {
        consentVersion: '1.0',
        purposesConsented: ['booking', 'communication', 'legal', 'id_verification'],
        consentText:
          'I have read and accept the privacy policy. I consent to my Aadhaar and PAN details being stored securely for verification purposes.',
      },
    };

    try {
      const { bookingId } = await createBookingMutation.mutateAsync(payload);
      if (dates.bookingType === 'special') {
        toast.success('Request submitted. We will contact you shortly.');
        navigate(`/booking/confirmation/${bookingId}`);
        return;
      }
      const order = await createOrder(bookingId);
      openCheckout(
        order.orderId,
        order.amount,
        order.keyId,
        async (response) => {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId,
          });
          toast.success('Payment successful!');
          navigate(`/booking/confirmation/${bookingId}`);
        },
        (err) => {
          toast.error(err instanceof Error ? err.message : 'Payment failed');
        }
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Booking failed');
    }
  };

  if (!property) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-gray-600">Loading...</div>
      </PageContainer>
    );
  }

  const stepLabels = [
    'T&C',
    'Guest Details',
    'Dates & Stay',
    'Review & Pay',
  ];

  return (
    <PageContainer>
      <div className="py-8">
        <div className="mb-8 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          {stepLabels.map((label, i) => (
            <span key={label}>
              <span className={step >= i ? 'font-medium text-indigo-600' : ''}>
                {i + 1}. {label}
              </span>
              {i < stepLabels.length - 1 && <span className="ml-2">→</span>}
            </span>
          ))}
        </div>

        <Card className="max-w-xl">
          {step === 0 && (
            <>
              <TermsAndConditions onAccept={handleTermsAccept} />
              <div className="mt-6">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(1)}
                  disabled={!termsAcceptedAt}
                >
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <form onSubmit={guestForm.handleSubmit(onStep1Submit)}>
              <h2 className="text-lg font-semibold text-gray-900">Guest details</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date of Booking
                  </label>
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
                    {formatDateLocalDDMMYYYY(new Date())}
                  </p>
                </div>
                <Input
                  label="Guest Name"
                  {...guestForm.register('name')}
                  error={guestForm.formState.errors.name?.message}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    {...guestForm.register('address')}
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    aria-invalid={Boolean(guestForm.formState.errors.address)}
                  />
                  {guestForm.formState.errors.address && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {guestForm.formState.errors.address.message}
                    </p>
                  )}
                </div>
                <Input
                  label="Aadhaar Card Number"
                  {...guestForm.register('aadhaarNumber')}
                  placeholder="12 digits"
                  error={guestForm.formState.errors.aadhaarNumber?.message}
                />
                <DocumentUpload
                  label="Aadhaar Card"
                  documentType="aadhaar"
                  onUploadComplete={setAadhaarUploadUrl}
                  existingUrl={aadhaarUploadUrl}
                />
                <Input
                  label="PAN Number (optional)"
                  {...guestForm.register('panNumber')}
                  placeholder="ABCDE1234F"
                  error={guestForm.formState.errors.panNumber?.message}
                />
                <DocumentUpload
                  label="PAN Card"
                  documentType="pan"
                  onUploadComplete={setPanUploadUrl}
                  existingUrl={panUploadUrl}
                />
                <Input
                  label="Mobile Number"
                  type="tel"
                  {...guestForm.register('phone')}
                  placeholder="10-digit Indian mobile"
                  error={guestForm.formState.errors.phone?.message}
                />
                <Input
                  label="Email Address"
                  type="email"
                  {...guestForm.register('email')}
                  error={guestForm.formState.errors.email?.message}
                />
                <Input
                  label="Total Number of Guests"
                  type="number"
                  min={1}
                  max={50}
                  {...guestForm.register('guestCount', { valueAsNumber: true })}
                  error={guestForm.formState.errors.guestCount?.message}
                />
                <Select
                  label="Reason for Renting"
                  options={REASON_OPTIONS}
                  {...guestForm.register('reasonForRenting')}
                  error={guestForm.formState.errors.reasonForRenting?.message}
                />
                {guestForm.watch('reasonForRenting') === 'Other' && (
                  <Input
                    label="Please specify"
                    {...guestForm.register('customReason')}
                    error={guestForm.formState.errors.customReason?.message}
                  />
                )}
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button type="submit" variant="primary">
                  Next
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={datesForm.handleSubmit(onStep2Submit)}>
              <h2 className="text-lg font-semibold text-gray-900">Check-in / Check-out Details</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Check-in
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      {...datesForm.register('checkIn')}
                      className="block rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    />
                    <span className="text-sm text-gray-600">12:00 PM (Noon)</span>
                  </div>
                  {datesForm.formState.errors.checkIn && (
                    <p className="mt-1 text-sm text-red-600">
                      {datesForm.formState.errors.checkIn.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Check-out
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      {...datesForm.register('checkOut')}
                      className="block rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    />
                    <span className="text-sm text-gray-600">10:00 AM</span>
                  </div>
                  {datesForm.formState.errors.checkOut && (
                    <p className="mt-1 text-sm text-red-600">
                      {datesForm.formState.errors.checkOut.message}
                    </p>
                  )}
                </div>
                {nights > 0 && (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm">
                    <p>
                      {nights} night(s) × {formatCurrency(RATE_PAISE)} ={' '}
                      {formatCurrency(nights * RATE_PAISE)}
                    </p>
                    <p>Deposit: {formatCurrency(DEPOSIT_PAISE)}</p>
                    <p className="mt-2 font-semibold">Total: {formatCurrency(totalPaise)}</p>
                  </div>
                )}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Booking type</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="standard"
                        {...datesForm.register('bookingType')}
                      />
                      Standard
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="special" {...datesForm.register('bookingType')} />
                      Special event
                    </label>
                  </div>
                </div>
                <Input
                  label="Special requests (optional)"
                  {...datesForm.register('specialRequests')}
                  error={datesForm.formState.errors.specialRequests?.message}
                />
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" variant="primary">
                  Next
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={step3Form.handleSubmit(onStep3Submit)}>
              <h2 className="text-lg font-semibold text-gray-900">Review & Pay</h2>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <p>
                    <strong>{property.name}</strong>
                  </p>
                  <p>
                    Check-in: {checkIn ? formatDateLocalDDMMYYYY(new Date(checkIn)) : '—'} (12:00
                    PM) · Check-out: {checkOut ? formatDateLocalDDMMYYYY(new Date(checkOut)) : '—'}{' '}
                    (10:00 AM)
                  </p>
                  <p>
                    {nights} night(s) × {formatCurrency(RATE_PAISE)} ={' '}
                    {formatCurrency(nights * RATE_PAISE)}
                  </p>
                  <p>Deposit: {formatCurrency(DEPOSIT_PAISE)}</p>
                  <p className="mt-2 font-semibold">Total: {formatCurrency(totalPaise)}</p>
                  <p className="mt-2 text-gray-600">
                    Guest: {guestForm.getValues('name')} · {guestForm.getValues('email')}
                  </p>
                </div>
                <div className="mt-4">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      {...step3Form.register('consent')}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      I have read and accept the{' '}
                      <Link to="/privacy-policy" className="text-indigo-600 hover:underline">
                        Privacy Policy
                      </Link>{' '}
                      (DPDP). My data will be used for booking and communication.
                    </span>
                  </label>
                  {step3Form.formState.errors.consent && (
                    <p className="mt-1 text-sm text-red-600">
                      {step3Form.formState.errors.consent.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={createBookingMutation.isPending}
                >
                  {datesForm.getValues('bookingType') === 'special'
                    ? 'Submit request'
                    : `Pay ${formatCurrency(totalPaise)}`}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
