import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';

export function ContactPage() {
  return (
    <PageContainer>
      <section className="py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            For bookings, inquiries, or support
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl space-y-6">
          <Card className="flex items-start gap-4">
            <Phone className="mt-0.5 h-6 w-6 flex-shrink-0 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900">Phone</p>
              <a href="tel:+919876543210" className="mt-1 text-lg text-gray-700 hover:text-indigo-600">
                +91 98765 43210
              </a>
            </div>
          </Card>

          <Card className="flex items-start gap-4">
            <MessageCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-gray-900">WhatsApp</p>
              <a
                href="https://wa.me/919876543210?text=Hi%2C%20I%27d%20like%20to%20inquire%20about%20booking%20a%20bungalow."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold text-white shadow transition hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="h-5 w-5" />
                Chat on WhatsApp
              </a>
            </div>
          </Card>

          <Card className="flex items-start gap-4">
            <Mail className="mt-0.5 h-6 w-6 flex-shrink-0 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <a href="mailto:contact@triptibungalow.com" className="mt-1 text-lg text-gray-700 hover:text-indigo-600">
                contact@triptibungalow.com
              </a>
            </div>
          </Card>

          <Card className="flex items-start gap-4">
            <MapPin className="mt-0.5 h-6 w-6 flex-shrink-0 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900">Location</p>
              <p className="mt-1 text-lg text-gray-700">
                Tripti Bungalow Colony, Thane, Maharashtra, India
              </p>
            </div>
          </Card>

          <Card className="flex items-start gap-4">
            <Clock className="mt-0.5 h-6 w-6 flex-shrink-0 text-indigo-600" />
            <div>
              <p className="font-semibold text-gray-900">Response Time</p>
              <p className="mt-1 text-lg text-gray-700">
                We typically respond within 2–4 hours during business hours (9 AM – 9 PM IST)
              </p>
            </div>
          </Card>
        </div>
      </section>
    </PageContainer>
  );
}
