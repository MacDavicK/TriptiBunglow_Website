import { PageContainer } from '@/components/ui/PageContainer';

export function PrivacyPolicyPage() {
  return (
    <PageContainer>
      <article className="prose prose-gray mx-auto max-w-3xl py-12">
        <h1>Privacy Policy</h1>
        <p className="lead">
          This policy is published in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act).
        </p>

        <h2>1. Data Fiduciary</h2>
        <p>
          Thane Bungalows (“we”, “us”) operates the vacation bungalow booking service in Thane, Maharashtra.
          We are the Data Fiduciary for the personal data collected through this website and related services.
        </p>

        <h2>2. Data We Collect</h2>
        <p>We collect only the data necessary for your booking and stay:</p>
        <ul>
          <li>Name, email, and phone number</li>
          <li>Identity document type and number (for foreign guests, as required under the Foreigners Act)</li>
          <li>Booking dates, property, guest count, and special requests</li>
          <li>Payment and transaction records (handled by our payment processor)</li>
        </ul>

        <h2>3. Purposes</h2>
        <p>Your data is used to:</p>
        <ul>
          <li>Process and manage your booking</li>
          <li>Communicate with you (confirmations, reminders, support)</li>
          <li>Comply with legal and regulatory requirements</li>
        </ul>

        <h2>4. Third Parties</h2>
        <p>
          We share data only with: payment processors (Razorpay), email service providers, and cloud hosting
          necessary to run the service. We do not sell your personal data.
        </p>

        <h2>5. Retention</h2>
        <p>
          Customer data: up to 3 years after last booking. Booking records: 5 years. Payment records: 7 years.
          Audit logs: 1 year. After these periods, data is deleted or anonymised.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You may request access to your data, correction of inaccuracies, and erasure (subject to legal
          retention). Contact us using the details below to exercise these rights.
        </p>

        <h2>7. Grievance Officer</h2>
        <p>
          For any privacy-related complaints or queries, contact our Grievance Officer at the contact
          email provided on this website.
        </p>

        <p className="text-sm text-gray-500">
          Last updated: 2026. We may update this policy from time to time; the current version will always
          be available on this page.
        </p>
      </article>
    </PageContainer>
  );
}
