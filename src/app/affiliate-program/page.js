import Link from 'next/link';
import { CheckCircle, Link2, Wallet, BarChart2, Users, Gift, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from './affiliate.module.css';

export const metadata = {
    title: 'Affiliate Program — Earn Commissions by Referring Tenants | Renta',
    description: 'Join the Renta Affiliate Program. Share your referral link, refer tenants and landlords, and earn commissions on every successful rental. Apply today.',
    openGraph: {
        title: 'Renta Affiliate Program — Earn by Referring Renters',
        description: 'Share your unique referral link and earn a commission on every successful rental you bring to Renta.',
        url: 'https://userenta.com/affiliate-program',
        siteName: 'Renta',
        type: 'website',
    },
};

const HOW_IT_WORKS = [
    {
        icon: <Users size={28} />,
        number: '01',
        title: 'Register as an Affiliate',
        desc: 'Create a free Renta account, select the Affiliate role, and get your unique referral link instantly.',
    },
    {
        icon: <Link2 size={28} />,
        number: '02',
        title: 'Share Your Link',
        desc: 'Share your referral link on WhatsApp, social media, or directly to people looking for apartments.',
    },
    {
        icon: <Gift size={28} />,
        number: '03',
        title: 'Referrals Sign Up',
        desc: 'Anyone who registers using your link is tracked as your referral — automatically and securely.',
    },
    {
        icon: <Wallet size={28} />,
        number: '04',
        title: 'Earn Your Commission',
        desc: 'When your referred tenant completes their first rental payment, your commission hits your wallet.',
    },
];

const PERKS = [
    'Earn a percentage of every completed rental',
    'Unlimited referrals — no cap on your income',
    'Real-time tracking in your affiliate dashboard',
    'Instant wallet payouts — withdraw any time',
    'Works for tenants, landlords, and scouts you refer',
    'Dedicated support for affiliate partners',
];

const FAQS = [
    {
        q: 'How much do I earn per referral?',
        a: 'Affiliates earn a commission from the platform service fee when a referred user completes their first rental. The exact percentage is shown in your affiliate dashboard.',
    },
    {
        q: 'How do I track my referrals?',
        a: 'Your affiliate dashboard shows real-time data — who clicked your link, who signed up, and which rentals have been completed.',
    },
    {
        q: 'When do I get paid?',
        a: 'Commissions are credited to your Renta wallet automatically once a rental is confirmed. You can request a bank withdrawal at any time.',
    },
    {
        q: 'Is there a limit to how many people I can refer?',
        a: 'No limit at all! The more you share, the more you earn. There is no cap on your referral count or earnings.',
    },
    {
        q: 'Can I refer landlords too?',
        a: 'Yes! You earn commissions on any user — tenant, landlord, or scout — who signs up through your link and completes a qualifying action.',
    },
];

export default function AffiliatePage() {
    return (
        <div className={styles.page}>
            <LandingHeader />

            {/* Hero */}
            <section className={styles.hero}>
                <div className={`container ${styles.heroInner}`}>
                    <div className={styles.heroBadge}>
                        <Zap size={14} />
                        Instant commissions, zero upfront cost
                    </div>
                    <h1 className={styles.heroTitle}>
                        Share a Link, <span className={styles.highlight}>Earn Real Money</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        The Renta Affiliate Program rewards you for every person you bring to the platform.
                        Share your unique link, watch referrals roll in, and get paid when they rent.
                    </p>
                    <div className={styles.heroCtas}>
                        <Link href="/register?role=AFFILIATE" className="btn btn-primary btn-lg">
                            Join the Affiliate Program <ArrowRight size={18} />
                        </Link>
                        <Link href="/login" className="btn btn-outline btn-lg">
                            Already an Affiliate? Log In
                        </Link>
                    </div>

                    {/* Simulated Link Card */}
                    <div className={styles.linkCard}>
                        <div className={styles.linkCardInner}>
                            <Link2 size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span className={styles.linkPreview}>userenta.com/register?ref=<strong>your-unique-code</strong></span>
                        </div>
                        <div className={styles.linkCardBadge}>Your Link</div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className="container">
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <BarChart2 size={22} style={{ color: 'var(--color-primary)' }} />
                            <div>
                                <strong>Real-Time</strong>
                                <span>Referral Dashboard</span>
                            </div>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.statItem}>
                            <Wallet size={22} style={{ color: 'var(--color-primary)' }} />
                            <div>
                                <strong>Instant</strong>
                                <span>Wallet Payouts</span>
                            </div>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.statItem}>
                            <ShieldCheck size={22} style={{ color: 'var(--color-primary)' }} />
                            <div>
                                <strong>Secure</strong>
                                <span>Referral Tracking</span>
                            </div>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.statItem}>
                            <Gift size={22} style={{ color: 'var(--color-primary)' }} />
                            <div>
                                <strong>Unlimited</strong>
                                <span>Referral Cap</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <section className={styles.section}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>
                        How It <span className={styles.highlight}>Works</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                        Start earning in four simple steps — no technical experience required.
                    </p>
                    <div className={styles.stepsGrid}>
                        {HOW_IT_WORKS.map((step, i) => (
                            <div key={i} className={styles.stepCard}>
                                <div className={styles.stepNum}>{step.number}</div>
                                <div className={styles.stepIcon}>{step.icon}</div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDesc}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className={styles.sectionAlt}>
                <div className={`container ${styles.splitGrid}`}>
                    <div>
                        <div className={styles.heroBadge} style={{ width: 'fit-content', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-primary)' }}>
                            <Gift size={14} /> Affiliate Perks
                        </div>
                        <h2 className={styles.sectionTitle} style={{ textAlign: 'left' }}>
                            Why Affiliates <span className={styles.highlight}>Love Renta</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.7, fontSize: 'var(--text-base)' }}>
                            We built our affiliate program to be simple, transparent, and genuinely profitable.
                            No confusing tiers, no shady terms — just a clean link, a real dashboard, and real payouts.
                        </p>
                        <ul className={styles.perksList}>
                            {PERKS.map((perk, i) => (
                                <li key={i} className={styles.perkItem}>
                                    <CheckCircle size={18} className={styles.perkIcon} />
                                    <span>{perk}</span>
                                </li>
                            ))}
                        </ul>
                        <Link href="/register?role=AFFILIATE" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-6)' }}>
                            Get My Referral Link
                        </Link>
                    </div>

                    {/* Dashboard Preview */}
                    <div className={styles.dashboardMock}>
                        <div className={styles.mockHeader}>
                            <span className={styles.mockDot} style={{ background: '#EF4444' }}></span>
                            <span className={styles.mockDot} style={{ background: '#f59e0b' }}></span>
                            <span className={styles.mockDot} style={{ background: '#22c55e' }}></span>
                            <span className={styles.mockTitle}>Affiliate Dashboard</span>
                        </div>
                        <div className={styles.mockBody}>
                            <div className={styles.mockStat}>
                                <span>Total Referrals</span>
                                <strong>24</strong>
                            </div>
                            <div className={styles.mockStat}>
                                <span>Completed Rentals</span>
                                <strong>9</strong>
                            </div>
                            <div className={styles.mockStat}>
                                <span>Total Earned</span>
                                <strong style={{ color: 'var(--color-primary)' }}>₦54,000</strong>
                            </div>
                            <div className={styles.mockStat}>
                                <span>Wallet Balance</span>
                                <strong style={{ color: 'var(--color-success)' }}>₦18,500</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className={styles.section}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>
                        Frequently Asked <span className={styles.highlight}>Questions</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>Everything you need to know before you start.</p>
                    <div className={styles.faqGrid}>
                        {FAQS.map((faq, i) => (
                            <div key={i} className={styles.faqCard}>
                                <h4 className={styles.faqQ}>{faq.q}</h4>
                                <p className={styles.faqA}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.cta}>
                <div className="container text-center">
                    <h2 className={styles.ctaTitle}>Ready to Start Earning?</h2>
                    <p className={styles.ctaSubtitle}>
                        Sign up free, get your referral link, and start earning commissions today.
                    </p>
                    <div className={styles.ctaButtons}>
                        <Link href="/register?role=AFFILIATE" className="btn btn-primary btn-lg">
                            Join for Free
                        </Link>
                        <Link href="/contact" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>

            <LandingFooter />
        </div>
    );
}
