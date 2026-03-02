'use client';

import { useState, useEffect } from 'react';
import {
    Wallet, ArrowUpRight, ArrowDownRight,
    Banknote, Lock, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';

export default function WalletCard({ userRole }) {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        bankName: '',
        bankAccount: ''
    });

    const fetchWallet = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/wallet');
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to load wallet');
            setWallet(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleWithdrawReq = async (e) => {
        e.preventDefault();
        try {
            const amountNum = Number(withdrawForm.amount);
            if (amountNum > wallet.balance) {
                alert("Insufficient funds for this withdrawal.");
                return;
            }

            const res = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(withdrawForm)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(data.message);
            setIsWithdrawing(false);
            setWithdrawForm({ amount: '', bankName: '', bankAccount: '' });
            fetchWallet(); // refresh balance
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="card text-center text-muted" style={{ padding: 'var(--space-8)' }}>Loading wallet...</div>;
    if (error) return (
        <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
            <AlertTriangle style={{ color: 'var(--color-error)', margin: '0 auto' }} />
            <p className="mt-2" style={{ color: 'var(--color-error)' }}>{error}</p>
        </div>
    );

    const parseDate = (d) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h2 style={{ fontSize: 'var(--text-2xl)' }}>Renta Wallet</h2>
                <Wallet style={{ color: 'var(--color-primary)' }} />
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1 text-center" style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-6)',
                    border: '1px solid var(--border-light)'
                }}>
                    <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-1)' }}>Available Balance</p>
                    <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                        ₦{Number(wallet.balance).toLocaleString()}
                    </h3>
                    <p className="text-xs text-muted mt-2">Ready for withdrawal</p>
                </div>
                <div className="flex-1 text-center" style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-6)',
                    border: '1px solid var(--border-light)'
                }}>
                    <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-1)' }}>Total Earned</p>
                    <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                        ₦{Number(wallet.totalEarned).toLocaleString()}
                    </h3>
                    <p className="text-xs text-muted mt-2">Lifetime earnings</p>
                </div>
            </div>

            {wallet.balance > 0 && !isWithdrawing ? (
                <button onClick={() => setIsWithdrawing(true)} className="btn btn-primary btn-full mb-6">
                    Request Withdrawal
                </button>
            ) : isWithdrawing ? (
                <div className="mb-6" style={{
                    background: 'var(--bg-secondary)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)'
                }}>
                    <h4 className="mb-4 flex items-center gap-2" style={{ fontSize: 'var(--text-base)' }}>
                        <Banknote size={16} /> Submit Withdrawal Request
                    </h4>
                    <form onSubmit={handleWithdrawReq} className="flex flex-col gap-3">
                        <input
                            type="number"
                            placeholder="Amount (₦)"
                            max={wallet.balance}
                            value={withdrawForm.amount}
                            onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                            required
                            className="form-input"
                        />
                        <input
                            type="text"
                            placeholder="Bank Name (e.g., GTBank)"
                            value={withdrawForm.bankName}
                            onChange={e => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                            required
                            className="form-input"
                        />
                        <input
                            type="text"
                            placeholder="Account Number"
                            value={withdrawForm.bankAccount}
                            onChange={e => setWithdrawForm({ ...withdrawForm, bankAccount: e.target.value })}
                            required
                            className="form-input"
                        />
                        <div className="flex gap-2 mt-2">
                            <button type="submit" className="btn btn-primary flex-1">Submit</button>
                            <button type="button" onClick={() => setIsWithdrawing(false)} className="btn btn-outline">Cancel</button>
                        </div>
                    </form>
                </div>
            ) : (
                <button disabled className="btn btn-outline btn-full mb-6 flex justify-center items-center gap-2" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <Lock size={16} /> Minimum balance required
                </button>
            )}

            <div>
                <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
                    <Clock size={16} /> Recent Transactions
                </h3>
                {wallet.transactions && wallet.transactions.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {wallet.transactions.slice(0, 5).map(tx => (
                            <div key={tx.id} className="flex justify-between items-center" style={{
                                padding: 'var(--space-3)',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        padding: 'var(--space-2)',
                                        borderRadius: '50%',
                                        background: tx.type === 'CREDIT' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                                        color: tx.type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-error)'
                                    }}>
                                        {tx.type === 'CREDIT' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{tx.description}</p>
                                        <p className="text-xs text-muted">{parseDate(tx.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="font-bold" style={{
                                    color: tx.type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-error)'
                                }}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted text-sm text-center" style={{
                        padding: 'var(--space-4)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-secondary)'
                    }}>No transactions yet.</p>
                )}
            </div>
        </div>
    );
}
