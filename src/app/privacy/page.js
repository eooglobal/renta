import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from '../page.module.css';

export const metadata = {
  title: 'Privacy Policy — Renta',
  description: 'How Renta collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <LandingHeader />
      
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)' }}>Last updated: May 9, 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: '1.7' }}>
          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>1. Information We Collect</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              We collect information to provide better services to all our users. The types of personal information we collect include:
            </p>
            <ul style={{ paddingLeft: '24px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>Account Information:</strong> Name, email address, phone number, and password.</li>
              <li><strong>Identity Verification:</strong> Government-issued ID numbers (e.g., NIN) and photos for KYC purposes.</li>
              <li><strong>Transaction Data:</strong> Details of rental payments and withdrawals made through our platform.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our website and dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>2. How We Use Your Information</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              We use the collected data for various purposes:
            </p>
            <ul style={{ paddingLeft: '24px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>To verify user identity and prevent fraud.</li>
              <li>To process payments and manage escrow funds.</li>
              <li>To facilitate communication between landlords and tenants.</li>
              <li>To provide customer support and send platform updates.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>3. Data Sharing & Security</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              We do not sell your personal information. We only share data with:
            </p>
            <ul style={{ paddingLeft: '24px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>Service Providers:</strong> Payment processors (Paystack) and identity verification partners (Smile ID).</li>
              <li><strong>Legal Requirements:</strong> When required by Nigerian law or to protect our rights.</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>
              We implement industry-standard encryption and security measures to protect your data from unauthorized access.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>4. Your Rights</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              You have the right to access, correct, or request the deletion of your personal data. You can manage most of these settings directly through your user profile or by contacting our support team.
            </p>
          </section>

          <section style={{ backgroundColor: '#f9fafb', padding: '32px', borderRadius: '16px', marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Privacy Concerns?</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              If you have questions about our Privacy Policy, please contact our Data Protection Officer at <Link href="/contact" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>privacy@userenta.com</Link>.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
