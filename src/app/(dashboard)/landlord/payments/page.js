import WalletCard from '@/components/WalletCard';

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
                    <div className="card">
                        <div className="card-header">
                            <h3>Escrow & Payouts Guide</h3>
                        </div>
                        <div className="card-body">
                            <ul className="space-y-4">
                                <li>
                                    <h4 className="font-bold">The Escrow System</h4>
                                    <p className="text-sm text-muted">When a tenant pays rent, the funds are held securely in Renta's escrow. This guarantees to the tenant that the property is genuine.</p>
                                </li>
                                <li>
                                    <h4 className="font-bold">Receiving Rent</h4>
                                    <p className="text-sm text-muted">Once the tenant is handed the keys and confirms access, the 100% full rent amount you requested is instantly credited to your Wallet.</p>
                                </li>
                                <li>
                                    <h4 className="font-bold">Withdrawing Funds</h4>
                                    <p className="text-sm text-muted">You can request a withdrawal at any time to your registered bank account. Processing usually takes 1-2 business days.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}