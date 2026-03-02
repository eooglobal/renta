import ReferralLinkWidget from '@/components/ReferralLinkWidget';

export const metadata = {
    title: 'Referral Links - Renta',
};

export default function AffiliateLinksPage() {
    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 style={{ fontSize: 'var(--text-2xl)' }}>Referral Links</h1>
                <p className="text-muted">Generate and manage your tracking links to earn commission.</p>
            </header>

            <div className="flex flex-col gap-6">
                {/* The Link Generator */}
                <ReferralLinkWidget />

                {/* How It Works */}
                <div className="card">
                    <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-6)' }}>How the Affiliate Program Works</h3>
                    <div className="grid grid-3">
                        <div className="card" style={{ textAlign: 'center', background: 'var(--bg-secondary)' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto var(--space-4)', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)'
                            }}>1</div>
                            <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)' }}>Share Your Link</h4>
                            <p className="text-sm text-muted">Place your unique Renta URL on your WhatsApp status, TikTok, or blog to direct traffic.</p>
                        </div>
                        <div className="card" style={{ textAlign: 'center', background: 'var(--bg-secondary)' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto var(--space-4)', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)'
                            }}>2</div>
                            <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)' }}>Users Register</h4>
                            <p className="text-sm text-muted">When they sign up within 30 days of clicking, your ID is permanently tied to their account.</p>
                        </div>
                        <div className="card" style={{ textAlign: 'center', background: 'var(--bg-secondary)' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'var(--color-success-light)', color: 'var(--color-success)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto var(--space-4)', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xl)'
                            }}>₦</div>
                            <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)' }}>Earn 2% Lifetime</h4>
                            <p className="text-sm text-muted">Whenever they successfully rent ANY property on Renta, you earn a 2% commission straight to your Wallet.</p>
                        </div>
                    </div>

                    <div className="mt-6" style={{
                        padding: 'var(--space-4)',
                        background: 'var(--color-primary-light)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '4px solid var(--color-primary)'
                    }}>
                        <h4 className="font-bold" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-1)' }}>💡 Pro Tip</h4>
                        <p className="text-sm">Focus on referring students looking for hostels or corp members (NYSC) moving into town. They are highly motivated to rent quickly!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}