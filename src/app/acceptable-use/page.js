import Link from 'next/link';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from '../page.module.css';

export const metadata = {
  title: 'Acceptable Use Policy — Renta',
  description: 'Rules for using Renta safely, lawfully, and responsibly.',
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

export default function AcceptableUsePolicyPage() {
  return (
    <div className={styles.page}>
      <LandingHeader />

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>Acceptable Use Policy</h1>
          <p style={{ color: 'var(--text-muted)' }}>Last updated: July 1, 2026</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: '1.7' }}>
          <section>
            <h2 style={sectionTitleStyle}>1. Purpose</h2>
            <p style={paragraphStyle}>
              This Acceptable Use Policy explains what users may and may not do on Renta. It applies to tenants,
              landlords, scouts, affiliates, vendors, agents, and any other person or organization using the platform.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>2. Permitted Use</h2>
            <p style={paragraphStyle}>You may use Renta only for lawful property rental and related platform activities, including:</p>
            <ul style={listStyle}>
              <li>Searching for verified rental properties.</li>
              <li>Submitting accurate landlord, tenant, scout, affiliate, and property information.</li>
              <li>Listing properties that you own, manage, or are authorized to represent.</li>
              <li>Booking inspections, managing rental workflows, and using platform support channels responsibly.</li>
              <li>Receiving wallet payouts and commissions that are legitimately earned through the platform.</li>
            </ul>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>3. Prohibited Activities</h2>
            <p style={paragraphStyle}>You must not use Renta to:</p>
            <ul style={listStyle}>
              <li>Post false, misleading, unavailable, duplicated, stolen, or unauthorized property listings.</li>
              <li>Submit fake scout leads, fake landlord details, fake inspection information, or fabricated documents.</li>
              <li>Request or accept rent, inspection, agency, development, caution, or other fees outside the Renta platform.</li>
              <li>Impersonate another person, landlord, tenant, agent, scout, company, or government authority.</li>
              <li>Harass, threaten, discriminate against, exploit, or abuse any user, staff member, vendor, or support agent.</li>
              <li>Use the platform for fraud, money laundering, terrorist financing, scams, phishing, or other illegal activity.</li>
              <li>Attempt to bypass identity verification, property verification, security checks, or payment controls.</li>
              <li>Upload malware, spam, automated scraping tools, or content designed to disrupt platform operations.</li>
              <li>Access, test, scan, reverse-engineer, or interfere with systems without written authorization from Renta.</li>
              <li>Use Renta in a way that violates Nigerian law, third-party rights, payment processor rules, or platform policies.</li>
            </ul>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>4. Property And Vendor Conduct</h2>
            <p style={paragraphStyle}>
              Landlords, property agents, and scouts must provide accurate property details, current availability,
              real pricing, and truthful contact information. Properties must be safe, habitable, and available for
              inspection and rental as represented on the platform.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Renta may reject, suspend, freeze, remove, or investigate listings or leads that appear suspicious,
              inaccurate, unavailable, unsafe, fraudulent, or inconsistent with platform standards.
            </p>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>5. Enforcement</h2>
            <p style={paragraphStyle}>If you violate this policy, Renta may take one or more actions, including:</p>
            <ul style={listStyle}>
              <li>Warning you or requesting additional information.</li>
              <li>Removing content, listings, leads, or account privileges.</li>
              <li>Suspending, blacklisting, or terminating your account.</li>
              <li>Holding, reversing, or delaying payouts while a review is ongoing.</li>
              <li>Reporting suspected fraud or unlawful activity to payment partners, law enforcement, or regulators.</li>
            </ul>
          </section>

          <section>
            <h2 style={sectionTitleStyle}>6. Reporting Abuse</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              To report suspicious listings, payment requests, fake agents, abusive users, or other policy violations,
              please contact us through the <Link href="/contact" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Contact page</Link>.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
