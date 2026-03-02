import WalletCard from '@/components/WalletCard';

export const metadata = {
    title: 'Scout Earnings - Renta',
};

export default function ScoutEarningsPage() {
    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">Earnings & Wallet</h1>
                <p className="text-muted">Manage your 3% commissions from successful leads.</p>
            </header>

            <div className="grid lg:grid-cols-2 gap-6">
                <div>
                    <WalletCard userRole="SCOUT" />
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <div className="card-header">
                            <h3>How Commissions Work</h3>
                        </div>
                        <div className="card-body">
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">1</div>
                                    <div>
                                        <h4 className="font-bold">Submit a Lead</h4>
                                        <p className="text-sm text-muted">Upload property details and landlord contact info.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">2</div>
                                    <div>
                                        <h4 className="font-bold">Admin Verification</h4>
                                        <p className="text-sm text-muted">Our team contacts the landlord, verifies the property, and lists it.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">3</div>
                                    <div>
                                        <h4 className="font-bold">Earn 3% Commission</h4>
                                        <p className="text-sm text-muted">When a tenant pays for the property and confirms they've moved in, 3% of the rent is instantly deposited to your wallet.</p>
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