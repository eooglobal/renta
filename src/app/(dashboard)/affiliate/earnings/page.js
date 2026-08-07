import WalletCard from '@/components/WalletCard';
import ReferralsList from '@/components/ReferralsList';

export const metadata = {
    title: 'Affiliate Earnings — Renta',
};

export default function AffiliateEarningsPage() {
    return (
        <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    Earnings & Wallet
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                    Manage your 2% commission payouts from successful tenant referrals.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <WalletCard userRole="AFFILIATE" />
                <ReferralsList />
            </div>

        </div>
    );
}