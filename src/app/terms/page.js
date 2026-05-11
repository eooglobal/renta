import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from '../page.module.css';

export const metadata = {
  title: 'Terms of Service — Renta',
  description: 'Terms and conditions for using the Renta platform.',
};

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <LandingHeader />
      
      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-muted)' }}>Last updated: May 9, 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: '1.7' }}>
          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              By accessing or using the Renta platform ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. Renta provides a marketplace connecting landlords and tenants in Ilorin, Nigeria.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>2. Platform Role & Escrow</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Renta acts as an intermediary. We verify property listings and provide an escrow service to protect both parties. 
            </p>
            <ul style={{ paddingLeft: '24px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>Payments:</strong> All rental payments must be made through the Platform's secure payment gateway.</li>
              <li><strong>Escrow:</strong> Funds are held by Renta and only released to the Landlord after the Tenant confirms move-in or 48 hours after the move-in date, whichever comes first.</li>
              <li><strong>Service Fee:</strong> Renta charges a non-refundable 10% service fee on all successful rental transactions.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>3. User Responsibilities</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Users must provide accurate information, including legal names and valid identification (NIN) where required.
            </p>
            <ul style={{ paddingLeft: '24px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><strong>Tenants:</strong> Are responsible for inspecting properties before payment. Renta provides free inspections for this purpose.</li>
              <li><strong>Landlords:</strong> Must ensure properties are as described and available on the move-in date.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>4. Verification & Scams</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              While Renta physically verifies listings, users should still exercise caution. Never pay a landlord directly outside the Platform. Renta is not responsible for any financial loss incurred from off-platform transactions.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>5. Termination</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Renta reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or disrupt the platform experience for others.
            </p>
          </section>

          <section style={{ backgroundColor: '#f9fafb', padding: '32px', borderRadius: '16px', marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Questions?</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              If you have questions about our Terms, please contact us at <Link href="/contact" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>support@renta-app.com</Link>.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
