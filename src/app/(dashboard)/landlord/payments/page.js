import WalletCard from '@/components/WalletCard';
import { ShieldCheck, HandCoins, Building } from 'lucide-react';

export const metadata = {
    title: 'Payments - Renta Landlord',
};

const guideItems = [
    {
        title: 'Direct Settlement',
        body: 'When a tenant pays rent, Paystack split settlement sends eligible amounts directly to verified recipients while Renta keeps a full transaction record.',
        icon: ShieldCheck,
        chipClass: '',
    },
    {
        title: 'Receiving Rent',
        body: 'Once the tenant is handed the keys and confirms access, the 100% full rent amount you requested is instantly credited to your Wallet.',
        icon: HandCoins,
        chipClass: 'icon-chip-success',
    },
    {
        title: 'Withdrawing Funds',
        body: 'You can request a withdrawal at any time to your registered bank account. Processing usually takes 1-2 business days.',
        icon: Building,
        chipClass: 'icon-chip-muted',
    },
];

export default function LandlordPaymentsPage() {
    return (
        <div className="fade-in dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1>Payments & Wallet</h1>
                    <p>Manage your rent payouts and view transaction history.</p>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="dashboard-span-8">
                    <WalletCard userRole="LANDLORD" />
                </div>

                <aside className="dashboard-surface dashboard-span-4">
                    <div className="section-heading-row">
                        <h3 className="section-title">
                            <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
                            Payments Guide
                        </h3>
                    </div>
                    <div className="operation-list">
                        {guideItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.title} className="dashboard-panel dashboard-surface-muted">
                                    <div className="flex gap-3 items-start">
                                        <span className={`icon-chip ${item.chipClass}`}>
                                            <Icon size={18} />
                                        </span>
                                        <div>
                                            <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>{item.title}</h4>
                                            <p className="text-sm text-muted" style={{ lineHeight: 1.55 }}>{item.body}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>
        </div>
    );
}
