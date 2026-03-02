import WalletCard from '@/components/WalletCard';
import ReferralsList from '@/components/ReferralsList';

export const metadata = {
    title: 'Affiliate Earnings - Renta',
};

export default function AffiliateEarningsPage() {
    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 style={{ fontSize: 'var(--text-2xl)' }}>Earnings &amp; Wallet</h1>
                <p className="text-muted">Manage your 2% commissions from successful referrals.</p>
            </header>

            <div className="flex flex-col gap-6">
                <WalletCard userRole="AFFILIATE" />
                <ReferralsList />
            </div>
        </div>
    );
}