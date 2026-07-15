import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from '../page.module.css';

export const metadata = {
  title: 'Dispute Resolution Policy — Renta',
  description: 'How Renta reviews and resolves tenant, landlord, property, payment, and payout disputes.',
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

export default function DisputeResolutionPolicyPage() {
  return (
    <div className={styles.page}>
      <LandingHeader />

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>Dispute Resolution Policy</h1>
          <p style={{ color: 'var(--text-muted)' }}>Last updated: July 1, 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: '1.7' }}>
          <section>
            <h2 style={sectionTitleStyle}>1. Purpose</h2>
            <p style={paragraphStyle}>
              This policy explains how Renta receives, reviews, and resolves disputes involving tenants, landlords,
              scouts, property agents, payments, inspections, withdrawals, payouts, and property listings.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>2. Types Of Disputes We Handle</h2>
            <p style={paragraphStyle}>Renta may review disputes relating to:</p>
            <ul style={listStyle}>
              <li>Property access, move-in, availability, or condition after a platform payment.</li>
              <li>Material differences between a verified listing and the actual property.</li>
              <li>Refund, reversal, or payment allocation questions.</li>
              <li>Landlord, tenant, scout, or agent misconduct on the platform.</li>
              <li>Wallet payouts, failed withdrawals, duplicate payments, or payment provider issues.</li>
              <li>Suspicious listings, fake leads, unauthorized property representation, or fraud reports.</li>
            </ul>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>3. How To Raise A Dispute</h2>
            <p style={paragraphStyle}>
              Users should raise disputes as soon as they notice an issue. A dispute should include enough information
              for Renta to identify the account, property, payment, and issue involved.
            </p>
            <ul style={listStyle}>
              <li>Use the available in-app dispute or support tools where provided.</li>
              <li>Include the property title, rental reference, payment reference, and relevant dates.</li>
              <li>Upload or provide supporting evidence such as photos, screenshots, inspection notes, messages, or receipts.</li>
              <li>Respond promptly when Renta requests more information.</li>
            </ul>
            <p style={{ color: 'var(--text-secondary)' }}>
              You may also contact support through the <Link href="/contact" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Contact page</Link>.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>4. Payments During A Dispute</h2>
            <p style={paragraphStyle}>
              Where a dispute relates to an escrow-held rental payment, Renta may keep the relevant funds on hold while
              the dispute is reviewed. Funds may be released, refunded, partially allocated, or otherwise handled based
              on the evidence, platform records, payment records, and applicable law.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Users should not attempt to resolve payment disputes through off-platform payment demands, threats, or
              unauthorized deductions.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>5. Review Process</h2>
            <p style={paragraphStyle}>Renta may take the following steps during a dispute review:</p>
            <ul style={listStyle}>
              <li>Review account records, listing details, inspection records, payment records, and support messages.</li>
              <li>Contact the tenant, landlord, scout, agent, or other relevant party for clarification.</li>
              <li>Request additional documents, photos, videos, or identity verification where needed.</li>
              <li>Pause wallet withdrawals, listing visibility, payout actions, or account privileges while review is ongoing.</li>
              <li>Make a decision based on the available evidence and platform policy.</li>
            </ul>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>6. Possible Outcomes</h2>
            <p style={paragraphStyle}>Depending on the facts, Renta may decide to:</p>
            <ul style={listStyle}>
              <li>Confirm settlement to the landlord.</li>
              <li>Pursue a refund or reversal to the tenant.</li>
              <li>Hold funds pending additional review or legal/regulatory instruction.</li>
              <li>Suspend, remove, or freeze a listing or account.</li>
              <li>Reject fraudulent, unsupported, late, or bad-faith claims.</li>
              <li>Refer suspected fraud, threats, or criminal conduct to relevant authorities.</li>
            </ul>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>7. Cooperation And Good Faith</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              All parties must cooperate honestly and promptly. Submitting false evidence, hiding relevant facts,
              intimidating another user, or attempting to bypass the platform may result in account restrictions,
              payout delays, or termination.
            </p>
          </section>

          <section style={{ backgroundColor: '#f9fafb', padding: '32px', borderRadius: '16px', marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Need to report an issue?</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Contact Renta support through our <Link href="/contact" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Contact page</Link> and include your property or payment reference.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
