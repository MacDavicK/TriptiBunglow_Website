import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const RATE_PAISE = 2500000;
const DEPOSIT_PAISE = 500000;

const step1Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone required'),
  nationality: z.enum(['indian', 'foreign']),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
}).refine(
  (data) => {
    if (data.nationality === 'foreign') {
      return Boolean(data.idType && data.idNumber);
    }
    return true;
  },
  { message: 'ID type and number required for foreign guests', path: ['idNumber'] }
);

const step2Schema = z.object({
  bookingType: z.enum(['standard', 'special']),
  guestCount: z.number().min(1).max(20),
  specialRequests: z.string().optional(),
});

const step3Schema = z.object({
  consent: z.literal(true, { errorMap: () => ({ message: 'You must accept the privacy terms' }) }),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const guestsParam = searchParams.get('guests');
  const guestCountDefault = guestsParam ? Number(guestsParam) : 2;

  const { data: property } = useProperty(slug);
  const createBookingMutation = useBooking();

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nationality: 'indian',
      idType: '',
      idNumber: '',
    },
  });

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      bookingType: 'standard',
      guestCount: guestCountDefault,
      specialRequests: '',
    },
  });

  const step3Form = useForm<{ consent: boolean }>({
    resolver: zodResolver(step3Schema),
    defaultValues: { consent: false },
  });

  const nights = checkIn && checkOut
    ? Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (24 * 60 * 60 * 1000)
      )
    : 0;
  const totalPaise = nights * RATE_PAISE + DEPOSIT_PAISE;

  const onStep1Submit = (_data: Step1Values) => {
    setStep(2);
  };

  const onStep2Submit = (_data: Step2Values) => {
    setStep(3);
  };

  const onStep3Submit = async () => {
    if (!property || !checkIn || !checkOut) {
      toast.error('Missing property or dates');
      return;
    }
    const s1 = step1Form.getValues();
    const s2 = step2Form.getValues();

    const payload = {
      propertyIds: [property._id],
      checkIn,
      checkOut,
      bookingType: s2.bookingType,
      guestCount: s2.guestCount,
      specialRequests: s2.specialRequests,
      customer: {
        name: s1.name,
        email: s1.email,
        phone: s1.phone,
        nationality: s1.nationality,
        idType: s1.idType as 'aadhaar' | 'passport' | 'driving_license' | 'voter_id' | undefined,
        idNumber: s1.idNumber,
      },
      consent: {
        consentVersion: '1.0',
        purposesConsented: ['booking', 'communication', 'legal'],
        consentText: 'I have read and accept the privacy policy.',
      },
    };

    try {
      const { bookingId } = await createBookingMutation.mutateAsync(payload);
      if (s2.bookingType === 'special') {
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

  return (
    <PageContainer>
      <div className="py-8">
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-600">
          <span className={step >= 1 ? 'font-medium text-indigo-600' : ''}>1. Guest details</span>
          <span>→</span>
          <span className={step >= 2 ? 'font-medium text-indigo-600' : ''}>2. Requests</span>
          <span>→</span>
          <span className={step >= 3 ? 'font-medium text-indigo-600' : ''}>3. Review & Pay</span>
        </div>

        <Card className="max-w-xl">
          {step === 1 && (
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)}>
              <h2 className="text-lg font-semibold text-gray-900">Guest details</h2>
              <div className="mt-4 space-y-4">
                <Input label="Full name" {...step1Form.register('name')} error={step1Form.formState.errors.name?.message} />
                <Input label="Email" type="email" {...step1Form.register('email')} error={step1Form.formState.errors.email?.message} />
                <Input label="Phone" type="tel" {...step1Form.register('phone')} error={step1Form.formState.errors.phone?.message} />
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Nationality</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" value="indian" {...step1Form.register('nationality')} />
                      Indian
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="foreign" {...step1Form.register('nationality')} />
                      Foreign
                    </label>
                  </div>
                </div>
                {step1Form.watch('nationality') === 'foreign' && (
                  <>
                    <Select
                      label="ID type"
                      options={[
                        { value: 'passport', label: 'Passport' },
                        { value: 'aadhaar', label: 'Aadhaar' },
                        { value: 'driving_license', label: 'Driving License' },
                        { value: 'voter_id', label: 'Voter ID' },
                      ]}
                      {...step1Form.register('idType')}
                    />
                    <Input label="ID number" {...step1Form.register('idNumber')} error={step1Form.formState.errors.idNumber?.message} />
                  </>
                )}
              </div>
              <Button type="submit" variant="primary" className="mt-6">
                Next
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)}>
              <h2 className="text-lg font-semibold text-gray-900">Booking type & requests</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Booking type</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" value="standard" {...step2Form.register('bookingType')} />
                      Standard
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="special" {...step2Form.register('bookingType')} />
                      Special event
                    </label>
                  </div>
                </div>
                <Input
                  label="Guest count"
                  type="number"
                  min={1}
                  max={20}
                  {...step2Form.register('guestCount', { valueAsNumber: true })}
                  error={step2Form.formState.errors.guestCount?.message}
                />
                <Input
                  label="Special requests (optional)"
                  {...step2Form.register('specialRequests')}
                  error={step2Form.formState.errors.specialRequests?.message}
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
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
                <p><strong>{property.name}</strong></p>
                <p>Check-in: {checkIn} · Check-out: {checkOut}</p>
                <p>{nights} night(s) × {formatCurrency(RATE_PAISE)} = {formatCurrency(nights * RATE_PAISE)}</p>
                <p>Deposit: {formatCurrency(DEPOSIT_PAISE)}</p>
                <p className="mt-2 font-semibold">Total: {formatCurrency(totalPaise)}</p>
              </div>
              <div className="mt-4">
                <label className="flex items-start gap-2">
                  <input type="checkbox" {...step3Form.register('consent')} className="mt-1" />
                  <span className="text-sm text-gray-700">
                    I have read and accept the{' '}
                    <Link to="/privacy-policy" className="text-indigo-600 hover:underline">
                      Privacy Policy
                    </Link>{' '}
                    (DPDP). My data will be used for booking and communication.
                  </span>
                </label>
                {step3Form.formState.errors.consent && (
                  <p className="mt-1 text-sm text-red-600">{step3Form.formState.errors.consent.message}</p>
                )}
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
                  {step2Form.getValues('bookingType') === 'special'
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
