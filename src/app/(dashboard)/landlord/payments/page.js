import WalletCard from '@/components/WalletCard';
import { ShieldCheck, HandCoins, Building } from 'lucide-react';

export const metadata = {
    title: 'Payments - Renta Landlord',
};

export default function LandlordPaymentsPage() {
    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Payments & Wallet</h1>
                <p className="text-muted">Manage your rent payouts and view transaction history.</p>
            </header>

            <div className="grid lg:grid-cols-2 gap-6">
                <div>
                    <WalletCard userRole="LANDLORD" />
                </div>

                <div className="space-y-6">
                    <div className="card border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-primary-color" />
                            <h3 className="font-semibold text-lg m-0">Payments & Payouts Guide</h3>
                        </div>
                        <div className="p-6">
                            <ul className="flex flex-col gap-6" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1 p-2 rounded-lg" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-base mb-1" style={{ fontSize: '15px' }}>Direct Settlement</h4>
                                        <p className="text-sm text-gray-500 leading-relaxed" style={{ color: 'var(--text-muted)' }}>When a tenant pays rent, Paystack split settlement sends eligible amounts directly to verified recipients while Renta keeps a full transaction record.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1 p-2 rounded-lg" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                                        <HandCoins size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-base mb-1" style={{ fontSize: '15px' }}>Receiving Rent</h4>
                                        <p className="text-sm text-gray-500 leading-relaxed" style={{ color: 'var(--text-muted)' }}>Once the tenant is handed the keys and confirms access, the 100% full rent amount you requested is instantly credited to your Wallet.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 mt-1 p-2 rounded-lg border" style={{ background: 'var(--bg-secondary)', color: 'var(--color-black)', borderColor: 'var(--border-color)' }}>
                                        <Building size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-base mb-1" style={{ fontSize: '15px' }}>Withdrawing Funds</h4>
                                        <p className="text-sm text-gray-500 leading-relaxed" style={{ color: 'var(--text-muted)' }}>You can request a withdrawal at any time to your registered bank account. Processing usually takes 1-2 business days.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}