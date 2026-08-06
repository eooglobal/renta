import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from '../page.module.css';

export const metadata = {
  title: 'Refund Policy — Renta',
  description: 'How refunds are reviewed and processed on Renta.',
};

const sectionTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const paragraphStyle = {
  color: 'var(--text-secondary)',
  marginBottom: '16px',
};

const listStyle = {
  paddingLeft: '24px',
  color: 'var(--text-secondary)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

export default function RefundPolicyPage() {
  return (
    <div className={styles.page}>
      <LandingHeader />

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>Refund Policy</h1>
          <p style={{ color: 'var(--text-muted)' }}>Last updated: July 1, 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: '1.7' }}>
          <section>
            <h2 style={sectionTitleStyle}>1. Overview</h2>
            <p style={paragraphStyle}>
              Renta uses a secure split payment system provided by our payment gateway. We do not operate an escrow system and do not hold funds on the platform. Rental funds paid through the platform are processed and remitted directly to the landlord within 24 hours.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Because funds are processed quickly, tenants must be absolutely certain they want the apartment before making payment. We strongly encourage all tenants to carefully review the landlord's video tour (which provides a better view than pictures alone) and complete a physical inspection before paying.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              This policy explains when refunds may be available and how refund requests are reviewed.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>2. Payments Covered By This Policy</h2>
            <p style={paragraphStyle}>This policy applies to payments made through official Renta payment channels, including:</p>
            <ul style={listStyle}>
              <li>Rental payments made by tenants through the platform.</li>
              <li>Rental payments related to a property transaction.</li>
              <li>Platform-controlled payment flows that can be verified in Renta records.</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)' }}>
              Payments made outside Renta, including direct transfers to landlords, agents, scouts, or third parties,
              are outside Renta's platform controls and may not be eligible for a Renta-managed refund.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>3. When A Refund May Be Approved</h2>
            <p style={paragraphStyle}>Because Renta does not hold funds in escrow, refunds are strictly limited. A refund may be considered only where:</p>
            <ul style={listStyle}>
              <li>The payment is still processing and has not yet been settled to the landlord's bank account.</li>
              <li>A duplicate or erroneous payment is confirmed by the payment provider and Renta records.</li>
              <li>The landlord voluntarily agrees to return the funds and issues the refund directly.</li>
              <li>Renta administration determines, after review, that a refund or reversal should be pursued for the tenant.</li>
            </ul>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>4. Non-Refundable Items</h2>
            <p style={paragraphStyle}>Refunds will be declined where:</p>
            <ul style={listStyle}>
              <li>The funds have already been processed and remitted to the landlord (usually within 24 hours of payment).</li>
              <li>The tenant changed their mind after making payment, but the property was accurately represented in the video tour and inspection.</li>
              <li>The tenant paid outside the Renta platform.</li>
              <li>The tenant provided false, incomplete, or misleading information during screening or KYC.</li>
              <li>The claim is submitted after settlement has already been validly completed to the landlord.</li>
              <li>The issue results from user misconduct, policy violations, or off-platform arrangements.</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)' }}>
              Platform service fees may be non-refundable on completed transactions unless Renta determines otherwise
              after a case review.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>5. How To Request A Refund</h2>
            <p style={paragraphStyle}>To request a refund, contact Renta support as soon as possible and provide:</p>
            <ul style={listStyle}>
              <li>Your full name and account email or phone number.</li>
              <li>The property title or rental reference.</li>
              <li>Payment reference, receipt, or transaction details.</li>
              <li>A clear explanation of the issue.</li>
              <li>Evidence such as screenshots, inspection notes, messages, photos, or videos where available.</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)' }}>
              You can contact us through the <Link href="/contact" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Contact page</Link>.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>6. Review And Processing Timelines</h2>
            <p style={paragraphStyle}>
              Renta will review refund requests using platform records, payment provider records, inspection details,
              communications, and any evidence submitted by the parties. We may contact the tenant, landlord, scout,
              or other relevant parties before reaching a decision.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Approved refunds are processed back through the available payment or wallet channels. Bank and payment
              provider processing times may vary and are outside Renta&apos;s direct control.
            </p>
          </section>

          <section style={{ backgroundColor: '#f9fafb', padding: '32px', borderRadius: '16px', marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Need help with a refund?</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Contact Renta support with your payment reference and rental details through our <Link href="/contact" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Contact page</Link>.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
