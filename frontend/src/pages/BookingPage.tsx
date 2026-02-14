import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useProperty } from '@/hooks/useProperties';
import { useBooking } from '@/hooks/useBooking';
import { getPaymentInfo } from '@/services/payment-info.api';
import { formatCurrency } from '@/utils/format-currency';
import { PageContainer } from '@/components/ui/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { TermsAndConditions } from '@/components/booking/TermsAndConditions';
import { DocumentUpload } from '@/components/ui/DocumentUpload';
import { Spinner } from '@/components/ui/Spinner';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { CreateBookingRequest } from '@shared/types';

const RATE_PAISE = 3000000;
const DEPOSIT_PAISE = 500000;
const IST = 'Asia/Kolkata';

/* ─── ZOD SCHEMAS ─── */

const guestDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  email: z.string().email('Invalid email address'),
  guestCount: z.number().min(1, 'At least 1 guest').max(50, 'Maximum 50 guests'),
  reasonForRenting: z.string().min(1, 'Please select a reason'),
  customReason: z.string().optional(),
});

const additionalGuestsSchema = z.object({
  guests: z
    .array(
      z.object({
        name: z.string().min(2, 'Name is required (min 2 chars)'),
        aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits'),
      })
    )
    .min(1, 'At least 1 additional guest with Aadhaar is required (minimum 2 IDs total)'),
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

const paymentSchema = z.object({
  upiReference: z.string().min(1, 'Please enter the UTR/Reference number from your UPI payment'),
});

const consentSchema = z.object({
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy terms' }),
  }),
});

type GuestDetailsValues = z.infer<typeof guestDetailsSchema>;
type AdditionalGuestsValues = z.infer<typeof additionalGuestsSchema>;
type DatesValues = z.infer<typeof datesSchema>;
type PaymentValues = z.infer<typeof paymentSchema>;

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
  return format(new Date(isoDateStr), 'yyyy-MM-dd');
}

/* ─── MAIN COMPONENT ─── */

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState('');
  const [termsVersion, setTermsVersion] = useState('');
  const [aadhaarUploadUrl, setAadhaarUploadUrl] = useState<string | undefined>();
  const [additionalGuestUploads, setAdditionalGuestUploads] = useState<Record<number, string>>({});
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | undefined>();

  const urlCheckIn = searchParams.get('checkIn') ?? '';
  const urlCheckOut = searchParams.get('checkOut') ?? '';

  const { data: property } = useProperty(slug);
  const createBookingMutation = useBooking();

  const { data: paymentInfo, isLoading: loadingPaymentInfo } = useQuery({
    queryKey: ['payment-info'],
    queryFn: getPaymentInfo,
    enabled: step >= 4,
    staleTime: 5 * 60 * 1000,
  });

  /* ─── FORMS ─── */

  const guestForm = useForm<GuestDetailsValues>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: {
      name: '',
      address: '',
      aadhaarNumber: '',
      phone: '',
      email: '',
      guestCount: 2,
      reasonForRenting: '',
      customReason: '',
    },
  });

  const additionalGuestsForm = useForm<AdditionalGuestsValues>({
    resolver: zodResolver(additionalGuestsSchema),
    defaultValues: {
      guests: [{ name: '', aadhaarNumber: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: additionalGuestsForm.control,
    name: 'guests',
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

  const paymentForm = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { upiReference: '' },
  });

  const consentForm = useForm<{ consent: boolean }>({
    resolver: zodResolver(consentSchema),
    defaultValues: { consent: false },
  });

  /* ─── COMPUTED ─── */

  const checkIn = datesForm.watch('checkIn');
  const checkOut = datesForm.watch('checkOut');
  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (24 * 60 * 60 * 1000)
        )
      : 0;
  const totalPaise = nights * RATE_PAISE + DEPOSIT_PAISE;

  /* ─── HANDLERS ─── */

  const handleTermsAccept = (accepted: boolean, version: string, acceptedAt: string) => {
    setTermsVersion(version);
    setTermsAcceptedAt(accepted ? acceptedAt : '');
  };

  const onGuestSubmit = () => setStep(2);
  const onAdditionalGuestsSubmit = () => setStep(3);
  const onDatesSubmit = () => setStep(4);
  const onPaymentSubmit = () => setStep(5);

  const onFinalSubmit = async () => {
    if (!property) {
      toast.error('Missing property');
      return;
    }

    const guest = guestForm.getValues();
    const addlGuests = additionalGuestsForm.getValues().guests;
    const dates = datesForm.getValues();
    const payment = paymentForm.getValues();

    if (!dates.checkIn || !dates.checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (!aadhaarUploadUrl) {
      toast.error('Please upload your Aadhaar document');
      return;
    }

    const reasonForRenting =
      guest.reasonForRenting === 'Other' ? guest.customReason || 'Other' : guest.reasonForRenting;

    const payload: CreateBookingRequest = {
      propertyIds: [property._id],
      checkIn: dates.checkIn,
      checkOut: dates.checkOut,
      bookingType: dates.bookingType,
      guestCount: guest.guestCount,
      specialRequests: dates.specialRequests,
      reasonForRenting,
      termsAcceptedAt,
      termsVersion,
      additionalGuests: addlGuests.map((g, i) => ({
        name: g.name,
        aadhaarNumber: g.aadhaarNumber,
        aadhaarDocumentUrl: additionalGuestUploads[i],
      })),
      upiReference: payment.upiReference,
      paymentScreenshotUrl,
      customer: {
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        address: guest.address,
        nationality: 'indian',
        idType: 'aadhaar',
        idNumber: guest.aadhaarNumber,
        aadhaarDocumentUrl: aadhaarUploadUrl,
      },
      consent: {
        consentVersion: '1.0',
        purposesConsented: ['booking', 'communication', 'legal', 'id_verification'],
        consentText:
          'I have read and accept the privacy policy. I consent to my Aadhaar details being stored securely for verification purposes.',
      },
    };

    try {
      const { bookingId } = await createBookingMutation.mutateAsync(payload);
      toast.success('Booking submitted! Awaiting payment confirmation.');
      navigate(`/booking/confirmation/${bookingId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Booking failed');
    }
  };

  /* ─── RENDER ─── */

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
    'Additional Guests',
    'Dates & Stay',
    'UPI Payment',
    'Review & Submit',
  ];

  return (
    <PageContainer>
      <div className="py-8">
        <div className="mb-8 flex flex-wrap items-center gap-1 text-sm text-gray-600">
          {stepLabels.map((label, i) => (
            <span key={label}>
              <span className={step >= i ? 'font-medium text-indigo-600' : ''}>
                {i + 1}. {label}
              </span>
              {i < stepLabels.length - 1 && <span className="ml-1">→</span>}
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
            <form onSubmit={guestForm.handleSubmit(onGuestSubmit)}>
              <h2 className="text-lg font-semibold text-gray-900">Guest Details</h2>
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
                  label="Aadhaar Card Photo"
                  documentType="aadhaar"
                  onUploadComplete={setAadhaarUploadUrl}
                  existingUrl={aadhaarUploadUrl}
                  helperText="Upload a clear photo showing your Aadhaar number (UID) and VID. Both must be visible."
                />
                {!aadhaarUploadUrl && (
                  <p className="text-xs text-amber-600">
                    Aadhaar document upload is mandatory to proceed.
                  </p>
                )}
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
                <Button type="submit" variant="primary" disabled={!aadhaarUploadUrl}>
                  Next
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={additionalGuestsForm.handleSubmit(onAdditionalGuestsSubmit)}>
              <h2 className="text-lg font-semibold text-gray-900">Additional Guest IDs</h2>
              <p className="mt-1 text-sm text-gray-600">
                At least <strong>1 additional guest's Aadhaar</strong> is required (minimum 2 IDs
                total including yours). Upload a clear photo where the Aadhaar number (UID) and VID
                are visible.
              </p>

              <div className="mt-4 space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700">Guest {index + 2}</h3>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            remove(index);
                            setAdditionalGuestUploads((prev) => {
                              const next = { ...prev };
                              delete next[index];
                              const reindexed: Record<number, string> = {};
                              Object.keys(next).forEach((k) => {
                                const ki = Number(k);
                                reindexed[ki > index ? ki - 1 : ki] = next[ki];
                              });
                              return reindexed;
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Remove guest ${index + 2}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 space-y-3">
                      <Input
                        label="Full Name"
                        {...additionalGuestsForm.register(`guests.${index}.name`)}
                        error={
                          additionalGuestsForm.formState.errors.guests?.[index]?.name?.message
                        }
                      />
                      <Input
                        label="Aadhaar Number"
                        {...additionalGuestsForm.register(`guests.${index}.aadhaarNumber`)}
                        placeholder="12 digits"
                        error={
                          additionalGuestsForm.formState.errors.guests?.[index]?.aadhaarNumber
                            ?.message
                        }
                      />
                      <DocumentUpload
                        label="Aadhaar Document (optional)"
                        documentType="aadhaar"
                        onUploadComplete={(url) => {
                          setAdditionalGuestUploads((prev) => ({ ...prev, [index]: url }));
                        }}
                        existingUrl={additionalGuestUploads[index]}
                        helperText="Upload a clear photo with Aadhaar UID and VID visible."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {fields.length < 10 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => append({ name: '', aadhaarNumber: '' })}
                  className="mt-4"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Another Guest
                </Button>
              )}

              {additionalGuestsForm.formState.errors.guests?.root && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {additionalGuestsForm.formState.errors.guests.root.message}
                </p>
              )}
              {additionalGuestsForm.formState.errors.guests?.message && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {additionalGuestsForm.formState.errors.guests.message}
                </p>
              )}

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
            <form onSubmit={datesForm.handleSubmit(onDatesSubmit)}>
              <h2 className="text-lg font-semibold text-gray-900">
                Check-in / Check-out Details
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Check-in</label>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Check-out</label>
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
                    <p>Security Deposit: {formatCurrency(DEPOSIT_PAISE)}</p>
                    <p className="mt-2 font-semibold">Total: {formatCurrency(totalPaise)}</p>
                  </div>
                )}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Booking type</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" value="standard" {...datesForm.register('bookingType')} />{' '}
                      Standard
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="special" {...datesForm.register('bookingType')} />{' '}
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
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" variant="primary">
                  Next
                </Button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}>
              <h2 className="text-lg font-semibold text-gray-900">
                Pay Security Deposit via UPI
              </h2>

              {loadingPaymentInfo ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : paymentInfo ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm">
                    <p className="font-semibold text-indigo-900">
                      Pay {formatCurrency(DEPOSIT_PAISE)} Security Deposit
                    </p>
                    <p className="mt-1 text-indigo-700">
                      The remaining stay amount of {formatCurrency(nights * RATE_PAISE)} is
                      payable at check-in.
                    </p>
                  </div>

                  {paymentInfo.qrCodeUrl && (
                    <div className="flex flex-col items-center">
                      <img
                        src={paymentInfo.qrCodeUrl}
                        alt="UPI QR Code for payment"
                        className="h-48 w-48 rounded-lg border border-gray-200"
                      />
                      <p className="mt-2 text-xs text-gray-500">Scan with any UPI app</p>
                    </div>
                  )}

                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-xs text-gray-500">Or pay to UPI ID:</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-gray-900">
                      {paymentInfo.upiId}
                    </p>
                  </div>

                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-medium">Instructions:</p>
                    <ol className="mt-1 list-inside list-decimal space-y-1 text-xs">
                      {paymentInfo.instructions.map((instr, i) => (
                        <li key={i}>{instr}</li>
                      ))}
                    </ol>
                  </div>

                  <Input
                    label="UTR / Reference Number"
                    {...paymentForm.register('upiReference')}
                    placeholder="Enter the 12-digit UTR from your UPI app"
                    error={paymentForm.formState.errors.upiReference?.message}
                  />
                  <p className="text-xs text-gray-500">
                    Find this in your UPI app under transaction details / payment history.
                  </p>

                  <DocumentUpload
                    label="Payment Screenshot (optional — speeds up verification)"
                    documentType="payment_screenshot"
                    onUploadComplete={setPaymentScreenshotUrl}
                    existingUrl={paymentScreenshotUrl}
                    helperText="Upload a screenshot showing the completed payment with UTR number visible."
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  UPI payment info could not be loaded. Please try again or contact the property
                  owner.
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" disabled={!paymentInfo}>
                  Next
                </Button>
              </div>
            </form>
          )}

          {step === 5 && (
            <form onSubmit={consentForm.handleSubmit(onFinalSubmit)}>
              <h2 className="text-lg font-semibold text-gray-900">Review & Submit</h2>
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
                  <p>Security Deposit: {formatCurrency(DEPOSIT_PAISE)}</p>
                  <p className="mt-2 font-semibold">Total: {formatCurrency(totalPaise)}</p>
                  <hr className="my-3 border-gray-200" />
                  <p>
                    Guest: {guestForm.getValues('name')} · {guestForm.getValues('email')}
                  </p>
                  <p>Phone: {guestForm.getValues('phone')}</p>
                  <p>Guests: {guestForm.getValues('guestCount')}</p>
                  <p>Additional IDs: {additionalGuestsForm.getValues('guests').length} guest(s)</p>
                  {paymentForm.getValues('upiReference') && (
                    <p>UPI Reference: {paymentForm.getValues('upiReference')}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      {...consentForm.register('consent')}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      I have read and accept the{' '}
                      <Link to="/privacy-policy" className="text-indigo-600 hover:underline">
                        Privacy Policy
                      </Link>{' '}
                      (DPDP). My Aadhaar data will be stored securely for verification purposes
                      only.
                    </span>
                  </label>
                  {consentForm.formState.errors.consent && (
                    <p className="mt-1 text-sm text-red-600">
                      {consentForm.formState.errors.consent.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(4)}>
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={createBookingMutation.isPending}
                >
                  Submit Booking
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
