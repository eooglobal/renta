import ReferralLinkWidget from '@/components/ReferralLinkWidget';

export const metadata = {
    title: 'Referral Links — Renta',
};

export default function AffiliateLinksPage() {
    return (
        <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    Referral Links
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                    Generate your custom tracking link to share with potential tenants.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Link Generator Widget */}
                <ReferralLinkWidget />

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
                                Share Your Link
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                Post your link on WhatsApp, TikTok, Instagram, or blogs to direct property seekers to Renta.
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
                                Earn 2% Lifetime
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                Whenever your referred tenant pays for ANY property on Renta, 2% commission is deposited instantly to your wallet.
                            </p>
                        </div>
                    </div>

                    <div style={{
                        padding: '14px 16px',
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.825rem',
                        color: '#92400E'
                    }}>
                        <strong>Pro Tip:</strong> Share links in student groups looking for hostels or NYSC corp member forums moving to Kwara. They rent quickly!
                    </div>
                </div>
            </div>

        </div>
    );
}