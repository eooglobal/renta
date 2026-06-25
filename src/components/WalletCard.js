'use client';

import { useState, useEffect } from 'react';
import {
    Wallet, ArrowUpRight, ArrowDownRight,
    Banknote, Lock, Clock, CheckCircle, AlertTriangle,
    Loader2, ShieldAlert, User
} from 'lucide-react';
import Link from 'next/link';

export default function WalletCard({ userRole }) {
    const [wallet, setWallet]           = useState(null);
    const [profile, setProfile]         = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // Bank lookup state
    const [banks, setBanks]             = useState([]);
    const [banksLoading, setBanksLoading] = useState(false);
    const [resolving, setResolving]     = useState(false);
    const [resolvedName, setResolvedName] = useState('');
    const [nameConfirmed, setNameConfirmed] = useState(false);
    const [resolveError, setResolveError] = useState('');

    const [withdrawForm, setWithdrawForm] = useState({
        amount: '',
        bankCode: '',
        bankName: '',
        bankAccount: '',
        accountName: '',
    });

    const fetchWallet = async () => {
        try {
            setLoading(true);
            const [walletRes, profileRes] = await Promise.all([
                fetch('/api/wallet'),
                fetch('/api/profile'),
            ]);
            const walletData  = await walletRes.json();
            const profileData = await profileRes.json();
            if (!walletRes.ok) throw new Error(walletData.error || 'Failed to load wallet');
            setWallet(walletData);
            setProfile(profileData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchBanks = async () => {
        if (banks.length > 0) return;
        setBanksLoading(true);
        try {
            const res = await fetch('/api/banks');
            if (res.ok) setBanks(await res.json());
        } catch { /* ignore */ }
        finally { setBanksLoading(false); }
    };

    useEffect(() => { fetchWallet(); }, []);

    // Auto-resolve account name when account number reaches 10 digits and bank is selected
    useEffect(() => {
        const { bankAccount, bankCode } = withdrawForm;
        if (bankAccount.length === 10 && bankCode) {
            resolveAccountName(bankAccount, bankCode);
        } else {
            setResolvedName('');
            setNameConfirmed(false);
            setResolveError('');
        }
    }, [withdrawForm.bankAccount, withdrawForm.bankCode]);

    const resolveAccountName = async (accountNumber, bankCode) => {
        setResolving(true);
        setResolvedName('');
        setResolveError('');
        setNameConfirmed(false);
        try {
            const res = await fetch(`/api/banks/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
            const data = await res.json();
            if (res.ok && data.account_name) {
                setResolvedName(data.account_name);
            } else {
                setResolveError(data.error || 'Could not resolve account name');
            }
        } catch {
            setResolveError('Network error during account resolution');
        } finally {
            setResolving(false);
        }
    };

    const handleBankChange = (e) => {
        const code = e.target.value;
        const bank = banks.find(b => b.code === code);
        setWithdrawForm(prev => ({
            ...prev,
            bankCode: code,
            bankName: bank?.name || '',
        }));
    };

    const handleWithdrawReq = async (e) => {
        e.preventDefault();
        if (!nameConfirmed) {
            alert('Please confirm the account name before submitting.');
            return;
        }
        try {
            const amountNum = Number(withdrawForm.amount);
            if (amountNum > Number(wallet.balance)) {
                alert('Insufficient funds for this withdrawal.');
                return;
            }

            const res = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount:      withdrawForm.amount,
                    bankName:    withdrawForm.bankName,
                    bankAccount: withdrawForm.bankAccount,
                    bankCode:    withdrawForm.bankCode,
                    accountName: resolvedName,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(data.message);
            setIsWithdrawing(false);
            setWithdrawForm({ amount: '', bankCode: '', bankName: '', bankAccount: '', accountName: '' });
            setResolvedName('');
            setNameConfirmed(false);
            fetchWallet();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return (
        <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)', margin: '0 auto' }} />
        </div>
    );
    if (error) return (
        <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
            <AlertTriangle style={{ color: 'var(--color-error)', margin: '0 auto' }} />
            <p className="mt-2" style={{ color: 'var(--color-error)' }}>{error}</p>
        </div>
    );

    const parseDate = (d) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
    const isKycVerified = profile?.ninStatus === 'VERIFIED';

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>Renta Wallet</h2>
                <Wallet style={{ color: 'var(--color-primary)' }} />
            </div>

            {/* Balance cards */}
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                <div style={{
                    flex: 1, textAlign: 'center',
                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-6)', border: '1px solid var(--border-light)', minWidth: '160px'
                }}>
                    <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-1)' }}>Available Balance</p>
                    <h3 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                        ₦{Number(wallet.balance).toLocaleString()}
                    </h3>
                    <p className="text-xs text-muted mt-2">Ready for withdrawal</p>
                </div>
                <div style={{
                    flex: 1, textAlign: 'center',
                    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-6)', border: '1px solid var(--border-light)', minWidth: '160px'
                }}>
                    <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-1)' }}>Total Earned</p>
                    <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                        ₦{Number(wallet.totalEarned).toLocaleString()}
                    </h3>
                    <p className="text-xs text-muted mt-2">Lifetime earnings</p>
                </div>
            </div>

            {/* KYC gate */}
            {!isKycVerified ? (
                <div style={{
                    padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-warning-light)', border: '1px solid #fcd34d',
                    marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start'
                }}>
                    <ShieldAlert size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: '#92400e', marginBottom: 4 }}>
                            Identity Verification Required
                        </p>
                        <p style={{ fontSize: 'var(--text-xs)', color: '#78350f' }}>
                            You must complete identity verification before requesting a withdrawal.
                        </p>
                        <Link href="/profile" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            marginTop: 8, fontSize: 'var(--text-xs)', fontWeight: 700,
                            color: '#92400e', textDecoration: 'underline'
                        }}>
                            <User size={12} /> Complete Verification
                        </Link>
                    </div>
                </div>
            ) : wallet.balance > 0 && !isWithdrawing ? (
                <button
                    onClick={() => { setIsWithdrawing(true); fetchBanks(); }}
                    className="btn btn-primary btn-full"
                    style={{ marginBottom: 'var(--space-6)' }}
                >
                    Request Withdrawal
                </button>
            ) : !isWithdrawing ? (
                <button disabled className="btn btn-outline btn-full" style={{ opacity: 0.5, cursor: 'not-allowed', marginBottom: 'var(--space-6)' }}>
                    <Lock size={16} style={{ marginRight: 6 }} /> Minimum balance required
                </button>
            ) : null}

            {/* Withdrawal form */}
            {isWithdrawing && isKycVerified && (
                <div style={{
                    background: 'var(--bg-secondary)', padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
                    marginBottom: 'var(--space-6)'
                }}>
                    <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Banknote size={16} /> Withdrawal Request
                    </h4>
                    <form onSubmit={handleWithdrawReq} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {/* Amount */}
                        <div>
                            <label className="form-label">Amount (₦)</label>
                            <input
                                type="number"
                                placeholder={`Max: ₦${Number(wallet.balance).toLocaleString()}`}
                                max={wallet.balance}
                                min={1000}
                                value={withdrawForm.amount}
                                onChange={e => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                                required
                                className="form-input"
                            />
                        </div>

                        {/* Bank select */}
                        <div>
                            <label className="form-label">Bank</label>
                            <select
                                value={withdrawForm.bankCode}
                                onChange={handleBankChange}
                                required
                                className="form-input"
                                disabled={banksLoading}
                            >
                                <option value="">{banksLoading ? 'Loading banks...' : 'Select bank'}</option>
                                {banks.map(b => (
                                    <option key={b.code} value={b.code}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Account number */}
                        <div>
                            <label className="form-label">Account Number</label>
                            <input
                                type="text"
                                placeholder="10-digit account number"
                                value={withdrawForm.bankAccount}
                                onChange={e => {
                                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setWithdrawForm(prev => ({ ...prev, bankAccount: v }));
                                }}
                                required
                                maxLength={10}
                                className="form-input"
                            />
                        </div>

                        {/* Account name resolution */}
                        {resolving && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                Verifying account...
                            </div>
                        )}

                        {resolveError && (
                            <div style={{ padding: '10px 12px', background: 'var(--color-error-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
                                {resolveError}
                            </div>
                        )}

                        {resolvedName && !nameConfirmed && (
                            <div style={{
                                padding: '12px 16px', background: 'var(--color-info-light)',
                                borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe'
                            }}>
                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>
                                    Account Name: {resolvedName}
                                </p>
                                <p style={{ fontSize: 'var(--text-xs)', color: '#3b82f6', marginBottom: 10 }}>
                                    Is this the correct account holder?
                                </p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => setNameConfirmed(true)}
                                        className="btn btn-sm"
                                        style={{ background: 'var(--color-success)', color: 'white' }}
                                    >
                                        <CheckCircle size={13} style={{ marginRight: 4 }} /> Yes, confirm
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setResolvedName('');
                                            setWithdrawForm(prev => ({ ...prev, bankAccount: '', bankCode: '', bankName: '' }));
                                        }}
                                        className="btn btn-sm btn-outline"
                                        style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                    >
                                        No, change
                                    </button>
                                </div>
                            </div>
                        )}

                        {nameConfirmed && (
                            <div style={{
                                padding: '10px 14px', background: 'var(--color-success-light)',
                                borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
                                color: '#15803d', display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <CheckCircle size={14} /> Confirmed: {resolvedName}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                disabled={!nameConfirmed}
                            >
                                Submit Request
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsWithdrawing(false);
                                    setResolvedName('');
                                    setNameConfirmed(false);
                                    setWithdrawForm({ amount: '', bankCode: '', bankName: '', bankAccount: '', accountName: '' });
                                }}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Recent transactions */}
            <div>
                <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} /> Recent Transactions
                </h3>
                {wallet.transactions?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {wallet.transactions.slice(0, 5).map(tx => (
                            <div key={tx.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: 'var(--space-3)', background: 'var(--bg-primary)',
                                border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                    <div style={{
                                        padding: 'var(--space-2)', borderRadius: '50%',
                                        background: tx.type === 'CREDIT' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                                        color: tx.type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-error)'
                                    }}>
                                        {tx.type === 'CREDIT' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)', margin: 0 }}>{tx.description}</p>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>{parseDate(tx.createdAt)}</p>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 'var(--font-bold)', color: tx.type === 'CREDIT' ? 'var(--color-success)' : 'var(--color-error)' }}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₦{Number(tx.amount).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted text-sm text-center" style={{
                        padding: 'var(--space-4)', border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)'
                    }}>
                        No transactions yet.
                    </p>
                )}
            </div>
        </div>
    );
}
