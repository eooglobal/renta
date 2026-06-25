import Link from 'next/link';
import { CheckCircle, MapPin, Camera, ClipboardList, Wallet, ShieldCheck, Star, ArrowRight, Users } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from '@/app/page.module.css';
import scoutStyles from './scout.module.css';

export const metadata = {
    title: 'Become a Scout — Earn by Verifying Properties | Renta',
    description: 'Join the Renta Scout Program. Physically verify apartment listings in Ilorin and earn commissions for every successful rental. Apply now.',
    openGraph: {
        title: 'Renta Scout Program — Earn by Verifying Properties',
        description: 'Earn real income by helping verify rental listings in your neighborhood. No experience needed.',
        url: 'https://userenta.com/scout-program',
        siteName: 'Renta',
        type: 'website',
    },
};

const STEPS = [
    {
        icon: <ClipboardList size={28} />,
        number: '01',
        title: 'Register as a Scout',
        desc: 'Create a free Renta account, select the "Scout" role, and complete your NIN verification.',
    },
    {
        icon: <MapPin size={28} />,
        number: '02',
        title: 'Get Assigned Leads',
        desc: 'We send you landlord leads in your chosen area — properties that need physical verification.',
    },
    {
        icon: <Camera size={28} />,
        number: '03',
        title: 'Visit & Document',
        desc: 'Visit the property, take verified photos, confirm the landlord\'s identity, and submit your report.',
    },
    {
        icon: <Wallet size={28} />,
        number: '04',
        title: 'Earn Your Commission',
        desc: 'Once a tenant rents the verified property, your commission is automatically credited to your wallet.',
    },
];

const PERKS = [
    'Earn ₦5,000–₦15,000 per verified rental',
    'No special skills or degree required',
    'Work at your own pace and schedule',
    'Build a track record and increase your rate',
    'Get paid directly to your bank account',
    'Priority assignment in your chosen neighborhood',
];

const REQUIREMENTS = [
    'Nigerian citizen with a valid NIN',
    'Smartphone with camera capability',
    'Knowledge of at least one area in Ilorin',
    'Ability to visit properties during business hours',
    'Honest and detail-oriented personality',
];

export default function ScoutPage() {
    return (
        <div className={styles.page}>
            <LandingHeader />

            {/* Hero */}
            <section className={scoutStyles.hero}>
                <div className={`container ${scoutStyles.heroInner}`}>
                    <div className={scoutStyles.heroBadge}>
                        <span className={scoutStyles.heroBadgeDot}></span>
                        Now recruiting in Ilorin
                    </div>
                    <h1 className={scoutStyles.heroTitle}>
                        Earn Money <span className={scoutStyles.highlight}>Verifying</span> Properties Near You
                    </h1>
                    <p className={scoutStyles.heroSubtitle}>
                        Renta Scouts are community members who physically verify apartment listings.
                        You visit properties, take photos, and confirm details — we pay you for every successful rental.
                    </p>
                    <div className={scoutStyles.heroCtas}>
                        <Link href="/register?role=SCOUT" className="btn btn-primary btn-lg">
                            Apply to Become a Scout <ArrowRight size={18} />
                        </Link>
                        <Link href="/login" className="btn btn-outline btn-lg">
                            Already a Scout? Log In
                        </Link>
                    </div>
                    <div className={scoutStyles.heroStats}>
                        <div className={scoutStyles.stat}>
                            <span className={scoutStyles.statNumber}>₦5K+</span>
                            <span className={scoutStyles.statLabel}>Per Verification</span>
                        </div>
                        <div className={scoutStyles.statDivider}></div>
                        <div className={scoutStyles.stat}>
                            <span className={scoutStyles.statNumber}>Flexible</span>
                            <span className={scoutStyles.statLabel}>Work Schedule</span>
                        </div>
                        <div className={scoutStyles.statDivider}></div>
                        <div className={scoutStyles.stat}>
                            <span className={scoutStyles.statNumber}>0</span>
                            <span className={scoutStyles.statLabel}>Upfront Cost</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className={scoutStyles.section}>
                <div className="container">
                    <h2 className={scoutStyles.sectionTitle}>
                        How the <span className={scoutStyles.highlight}>Scout Program</span> Works
                    </h2>
                    <p className={scoutStyles.sectionSubtitle}>
                        Four simple steps from sign-up to earning your first commission.
                    </p>
                    <div className={scoutStyles.stepsGrid}>
                        {STEPS.map((step, i) => (
                            <div key={i} className={scoutStyles.stepCard}>
                                <div className={scoutStyles.stepNum}>{step.number}</div>
                                <div className={scoutStyles.stepIcon}>{step.icon}</div>
                                <h3 className={scoutStyles.stepTitle}>{step.title}</h3>
                                <p className={scoutStyles.stepDesc}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Perks & Earnings */}
            <section className={scoutStyles.sectionAlt}>
                <div className={`container ${scoutStyles.splitGrid}`}>
                    <div className={scoutStyles.splitContent}>
                        <div className={scoutStyles.heroBadge} style={{ width: 'fit-content' }}>
                            <Star size={14} /> Scout Benefits
                        </div>
                        <h2 className={scoutStyles.sectionTitle} style={{ textAlign: 'left' }}>
                            Real Earnings, <span className={scoutStyles.highlight}>Real Flexibility</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: 1.7 }}>
                            Whether you&apos;re a student, a stay-at-home parent, or just looking for extra income,
                            the Scout Program fits into your life. The more properties you verify, the more you earn.
                        </p>
                        <ul className={scoutStyles.perksList}>
                            {PERKS.map((perk, i) => (
                                <li key={i} className={scoutStyles.perkItem}>
                                    <CheckCircle size={18} className={scoutStyles.perkIcon} />
                                    <span>{perk}</span>
                                </li>
                            ))}
                        </ul>
                        <Link href="/register?role=SCOUT" className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-6)' }}>
                            Start Earning Today
                        </Link>
                    </div>

                    {/* Earnings Calculator Card */}
                    <div className={scoutStyles.earningsCard}>
                        <div className={scoutStyles.earningsHeader}>
                            <Wallet size={24} />
                            <span>Monthly Earnings Estimate</span>
                        </div>
                        <div className={scoutStyles.earningsRows}>
                            <div className={scoutStyles.earningsRow}>
                                <span>4 verifications/month</span>
                                <strong>₦20,000</strong>
                            </div>
                            <div className={scoutStyles.earningsRow}>
                                <span>8 verifications/month</span>
                                <strong>₦40,000</strong>
                            </div>
                            <div className={scoutStyles.earningsRow}>
                                <span>12 verifications/month</span>
                                <strong>₦60,000+</strong>
                            </div>
                        </div>
                        <div className={scoutStyles.earningsNote}>
                            <ShieldCheck size={14} />
                            Commission paid automatically when rental is confirmed
                        </div>
                    </div>
                </div>
            </section>

            {/* Requirements */}
            <section className={scoutStyles.section}>
                <div className="container">
                    <h2 className={scoutStyles.sectionTitle}>
                        What You <span className={scoutStyles.highlight}>Need</span> to Join
                    </h2>
                    <p className={scoutStyles.sectionSubtitle}>
                        No formal training required. Just bring your phone, your honesty, and local knowledge.
                    </p>
                    <div className={scoutStyles.requirementsGrid}>
                        {REQUIREMENTS.map((req, i) => (
                            <div key={i} className={scoutStyles.requirementCard}>
                                <div className={scoutStyles.requirementNum}>{i + 1}</div>
                                <p>{req}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className={scoutStyles.sectionAlt}>
                <div className="container text-center">
                    <div className={scoutStyles.socialProof}>
                        <Users size={32} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-4)' }} />
                        <h3 style={{ marginBottom: 'var(--space-3)' }}>Join a Growing Community</h3>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto var(--space-6)', lineHeight: 1.7 }}>
                            Renta Scouts are trusted community members helping make the Ilorin rental market safer and
                            more transparent — one verified apartment at a time.
                        </p>
                        <div className={scoutStyles.testimonial}>
                            <p className={scoutStyles.testimonialText}>
                                &ldquo;I verified 6 apartments last month and earned ₦30,000 without leaving my neighborhood. Easy money.&rdquo;
                            </p>
                            <span className={scoutStyles.testimonialAuthor}>— Abdulahi M., Scout in Tanke</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={scoutStyles.cta}>
                <div className="container text-center">
                    <h2 className={scoutStyles.ctaTitle}>Ready to Start Earning?</h2>
                    <p className={scoutStyles.ctaSubtitle}>
                        Apply in 2 minutes. No experience needed. Get your first assignment within 48 hours.
                    </p>
                    <div className={scoutStyles.ctaButtons}>
                        <Link href="/register?role=SCOUT" className="btn btn-primary btn-lg">
                            Apply Now — It&apos;s Free
                        </Link>
                        <Link href="/contact" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                            Have Questions? Contact Us
                        </Link>
                    </div>
                </div>
            </section>

            <LandingFooter />
        </div>
    );
}
