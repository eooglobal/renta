import WalletCard from '@/components/WalletCard';

export const metadata = {
    title: 'Scout Earnings — Renta',
};

export default function ScoutEarningsPage() {
    return (
        <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    Earnings & Wallet
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                    Manage your 3% commission payouts from verified leads.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
                alignItems: 'start'
            }}>
                <div>
                    <WalletCard userRole="SCOUT" />
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                        How Scout Commissions Work
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-main)',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shrink: 0
                            }}>
                                1
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                                    Submit a Lead
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                    Upload property address and landlord contact information.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-main)',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shrink: 0
                            }}>
                                2
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                                    Property Verification & Listing
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                    Renta team verifies the landlord, inspects the property, and lists it.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-main)',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                shrink: 0
                            }}>
                                3
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 2px 0' }}>
                                    Automatic 3% Commission Payout
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                                    When a tenant rents the property, 3% of the rent price is credited to your wallet for instant bank withdrawal.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}