import ReferralLinkWidget from '@/components/ReferralLinkWidget';
import AffiliatePropertyListings from '@/components/AffiliatePropertyListings';

export const metadata = {
    title: 'Referral Links — Renta',
};

export default function AffiliateLinksPage() {
    return (
        <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    Referral Links & Active Listings
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                    Generate custom tracking links and promote active properties to earn 2% lifetime commission.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* General Link Generator Widget */}
                <ReferralLinkWidget />

                {/* Active Property Listings Promotion Feed & Modal */}
                <AffiliatePropertyListings />

                {/* How It Works Card */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                        How the Renta Affiliate Program Works
                    </h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px'
                    }}>
                        <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: '#E0F2FE',
                                color: '#0369A1',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '10px'
                            }}>
                                1
                            </div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                                Share Property Links
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                Post specific property links or your general link on WhatsApp, TikTok, X, or Instagram.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: '#E0F2FE',
                                color: '#0369A1',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '10px'
                            }}>
                                2
                            </div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                                Tenants Register
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                When users register after clicking your link, your affiliate ID is mapped permanently to their profile.
                            </p>
                        </div>

                        <div className="card" style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: '#D1FAE5',
                                color: '#065F46',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '10px'
                            }}>
                                3
                            </div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                                Earn 2% Commission
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                Earn 2% lifetime commission on every rent payment made by tenants you referred.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}