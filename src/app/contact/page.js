import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import styles from '../page.module.css';

export const metadata = {
    title: 'Contact Us | Renta',
    description: 'Get in touch with the Renta team. We provide 24/7 support for tenants, landlords, and scouts in Ilorin.',
};

export default function ContactPage() {
    return (
        <div className={styles.page}>
            <LandingHeader />
            <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '4rem', paddingTop: '120px' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '4rem 1rem', textAlign: 'center' }}>
                <div className="container">
                    <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: '#111827' }}>
                        Get in <span style={{ color: 'var(--color-primary)' }}>Touch</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                        Have questions about listing a property, dispute resolution, or just want to say hi? We'd love to hear from you.
                    </p>
                </div>
            </div>

            <div className="container" style={{ marginTop: '4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>

                    {/* Support Block */}
                    <div className="card shadow-sm" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '50%', marginBottom: '1.5rem' }}>
                            <Mail size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Email Support</h3>
                        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            For general inquiries and technical support, drop us an email. We typically respond within 24 hours.
                        </p>
                        <a href="mailto:support@renta-app.com" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none', fontSize: '1.125rem' }}>
                            support@renta-app.com
                        </a>
                    </div>

                    {/* Phone Block */}
                    <div className="card shadow-sm" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%', marginBottom: '1.5rem' }}>
                            <Phone size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>WhatsApp & Calls</h3>
                        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            Need urgent help with an ongoing inspection or escrow payment? Reach out to our direct support line.
                        </p>
                        <a href="tel:+2348000000000" style={{ color: '#059669', fontWeight: '600', textDecoration: 'none', fontSize: '1.125rem' }}>
                            +234 800 000 0000
                        </a>
                    </div>

                    {/* Address Block */}
                    <div className="card shadow-sm" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: '#fef2f2', color: '#e11d48', borderRadius: '50%', marginBottom: '1.5rem' }}>
                            <MapPin size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Office</h3>
                        <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                            Drop by our office to discuss large-scale property management or partnership opportunities.
                        </p>
                        <address style={{ fontStyle: 'normal', color: '#e11d48', fontWeight: '600', fontSize: '1.125rem' }}>
                            Tanke, Ilorin<br />Kwara State, Nigeria
                        </address>
                    </div>

                </div>

                {/* FAQ Quick Link */}
                <div style={{ backgroundColor: '#f3f4f6', borderRadius: '1rem', padding: '3rem 2rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Looking for quick answers?</h3>
                    <p style={{ color: '#4b5563', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                        Before reaching out, check if your question has been answered in our Frequently Asked Questions section.
                    </p>
                    <Link href="/register" className="btn btn-outline" style={{ backgroundColor: 'white' }}>
                        View Help Center
                    </Link>
                </div>
            </div>
            </div>
            <LandingFooter />
        </div>
    );
}
