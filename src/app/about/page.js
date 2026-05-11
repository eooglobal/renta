import Link from 'next/link';
import { Shield, Users, Building, Heart } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from '../page.module.css';

export const metadata = {
    title: 'About Us | Renta',
    description: 'Learn about Renta, the trusted platform for verified apartment rentals in Ilorin, Nigeria. We are eliminating scams and agent inflation.',
};

export default function AboutPage() {
    return (
        <div className={styles.page}>
            <LandingHeader />
            <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '4rem', paddingTop: '120px' }}>
            {/* Header/Hero */}
            <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '4rem 1rem', textAlign: 'center' }}>
                <div className="container">
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: '#111827' }}>
                        Restoring Trust in <span style={{ color: 'var(--color-primary)' }}>Renting</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
                        Renta was built to solve a specific problem: renting an apartment in Ilorin, Kwara State, shouldn't involve fake listings, extreme agent markups, or the constant fear of being scammed.
                    </p>
                </div>
            </div>

            <div className="container" style={{ marginTop: '4rem' }}>
                {/* The Problem & Solution */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', marginBottom: '5rem' }}>
                    <div className="card shadow-sm" style={{ padding: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>The Problem</h2>
                        <p style={{ color: '#4b5563', lineHeight: '1.8' }}>
                            For years, students and young professionals returning to or moving into Ilorin have faced a broken real estate system. Multiple "agents" add their own fees on top of already expensive rents—sometimes asking for "form fees", "agreement fees", and "inspection fees" just to show you an apartment that was rented out two weeks ago.
                            <br /><br />
                            Worse, the threat of transferring rent money to fraudulent accounts has made apartment hunting a deeply stressful experience.
                        </p>
                    </div>

                    <div className="card shadow-sm" style={{ padding: '2.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', color: '#166534' }}>Our Solution</h2>
                        <p style={{ color: '#166534', lineHeight: '1.8' }}>
                            We cut out the middlemen entirely. On Renta, property owners list their apartments directly at their true, approved prices.
                            <br /><br />
                            We physically verify every property before it goes live, and hold all rent payments in a secure Escrow account. The landlord only gets paid when you successfully move in and confirm everything is as promised. We charge a flat, transparent 10% platform fee—no hidden surprises.
                        </p>
                    </div>
                </div>

                {/* Values Section */}
                <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '3rem' }}>Our Core Values</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '50%', marginBottom: '1rem' }}>
                            <Shield size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Radical Transparency</h3>
                        <p style={{ color: '#4b5563' }}>What you see is what you pay. No hidden forms, no unexpected agent commissions.</p>
                    </div>

                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%', marginBottom: '1rem' }}>
                            <Users size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Community First</h3>
                        <p style={{ color: '#4b5563' }}>Built for the students and young professionals of Ilorin who deserve a better standard of living.</p>
                    </div>

                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#fffbeb', color: '#d97706', borderRadius: '50%', marginBottom: '1rem' }}>
                            <Building size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Quality Control</h3>
                        <p style={{ color: '#4b5563' }}>Every listing is vetted. We don't host phantom apartments or unverified landlords.</p>
                    </div>

                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#fef2f2', color: '#e11d48', borderRadius: '50%', marginBottom: '1rem' }}>
                            <Heart size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>Empowering Owners</h3>
                        <p style={{ color: '#4b5563' }}>We give landlords the tools to manage their properties and find high-quality tenants directly.</p>
                    </div>
                </div>

                {/* CTA */}
                <div style={{ marginTop: '5rem', backgroundColor: '#111827', color: 'white', padding: '4rem 2rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Ready to join the rental revolution?</h2>
                    <p style={{ color: '#9ca3af', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                        Whether you are looking for your next apartment or want to list a property you own, Renta is built for you.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link href="/register" className="btn btn-primary btn-lg">Browse Apartments</Link>
                        <Link href="/register?role=landlord" style={{ backgroundColor: 'transparent', border: '1px solid #4b5563', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.375rem', fontWeight: '600', display: 'inline-block' }}>List a Property</Link>
                    </div>
                </div>
            </div>
            </div>
            <LandingFooter />
        </div>
    );
}
