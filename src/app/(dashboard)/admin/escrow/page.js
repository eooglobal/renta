'use client';

import { useState, useEffect } from 'react';
import { Shield, Banknote, CheckCircle, XCircle, Search, Filter, MessageSquare, ExternalLink } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDisplayId } from '@/lib/idFormatter';

export default function AdminEscrowPage() {
    const toast = useToast();
    const [escrows, setEscrows] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('escrow'); // 'escrow' or 'withdrawals'
    const [filter, setFilter] = useState('');
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        escrowId: null,
        action: '',
        loading: false
    });

    const fetchEscrows = async () => {
        try {
            const params = new URLSearchParams();
            if (filter) params.set('status', filter);
            const res = await fetch(`/api/admin/escrow?${params}`);
            const data = await res.json();
            setEscrows(data.escrows || []);
        } catch (error) {
            console.error('Failed to load escrows:', error);
        }
    };

    const fetchWithdrawals = async () => {
        try {
            const res = await fetch('/api/admin/withdrawals');
            const data = await res.json();
            setWithdrawals(data || []);
        } catch (error) {
            console.error('Failed to load withdrawals:', error);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchEscrows(), fetchWithdrawals()]);
            setLoading(false);
        };
        loadInitialData();
    }, [filter]);

    const openEscrowConfirm = (escrowId, action) => {
        setConfirmState({
            isOpen: true,
            escrowId,
            action,
            loading: false
        });
    };

    const handleConfirmEscrowAction = async () => {
        const { escrowId, action } = confirmState;
        if (!escrowId || !action) return;

        setConfirmState(prev => ({ ...prev, loading: true }));

        try {
            const res = await fetch('/api/admin/escrow/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ escrowId, action })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Escrow Updated', data.message || `Escrow ${formatDisplayId('ESC', escrowId)} ${action.toLowerCase()} successfully.`);
                setConfirmState({ isOpen: false, escrowId: null, action: '', loading: false });
                fetchEscrows();
                fetchWithdrawals();
            } else {
                toast.error('Action Failed', data.error || 'Could not resolve escrow.');
                setConfirmState(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            toast.error('Action Error', error.message || 'Failed to update escrow status.');
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <div className="flex flex-col">
                    <h3>Financial Management</h3>
                    <p className="text-sm text-muted">Manage platform transactions and payout requests.</p>
                </div>

                <ConfirmModal
                    isOpen={confirmState.isOpen}
                    title={`Confirm Escrow ${formatDisplayId('ESC', confirmState.escrowId)}`}
                    message={`Are you sure you want to ${confirmState.action.toLowerCase()} escrow ${formatDisplayId('ESC', confirmState.escrowId)}?`}
                    confirmText={confirmState.action === 'RELEASE' ? 'Release Funds' : 'Refund Tenant'}
                    variant={confirmState.action === 'REFUND' ? 'danger' : 'primary'}
                    loading={confirmState.loading}
                    onConfirm={handleConfirmEscrowAction}
                    onClose={() => setConfirmState({ isOpen: false, escrowId: null, action: '', loading: false })}
                />
                <div className="tabs flex gap-4">
                    <button
                        onClick={() => { setActiveTab('escrow'); setFilter(''); }}
                        className={`btn ${activeTab === 'escrow' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        <Shield size={16} className="mr-2" /> Transactions
                    </button>
                    <button
                        onClick={() => { setActiveTab('withdrawals'); setFilter(''); }}
                        className={`btn ${activeTab === 'withdrawals' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        <Banknote size={16} className="mr-2" /> Payout Queue ({withdrawals.filter(w => w.status === 'PENDING').length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center" style={{ padding: '60px 0' }}>
                    <div className="spinner" style={{ width: 32, height: 32 }}></div>
                </div>
            ) : activeTab === 'escrow' ? (
                <div className="mt-6">
                    <div className="card flex justify-between items-center mb-4" style={{ padding: '1rem' }}>
                        <div className="flex gap-2">
                            {['', 'HELD', 'RELEASED', 'REFUNDED', 'DISPUTED'].map(s => (
                                <button key={s} onClick={() => setFilter(s)}
                                    className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
                                    {s || 'All'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {escrows.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}><Shield size={48} /></div>
                            <h3>No transaction records found</h3>
                            <p>Try adjusting your filters or check back later.</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Property</th>
                                        <th>Amount</th>
                                        <th>Parties</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {escrows.map(escrow => (
                                        <tr key={escrow.id}>
                                            <td>
                                                <strong>{escrow.rental.property.title}</strong>
                                                <div className="text-xs text-muted font-mono">{formatDisplayId('ESC', escrow.id)}</div>
                                            </td>
                                            <td><strong>₦{Number(escrow.amount).toLocaleString()}</strong></td>
                                            <td className="text-xs">
                                                <div><strong>L:</strong> {formatDisplayId('USR', escrow.rental.property.landlord.id)} ({escrow.rental.property.landlord.firstName} {escrow.rental.property.landlord.lastName})</div>
                                                <div><strong>T:</strong> {formatDisplayId('USR', escrow.rental.tenant.id)} ({escrow.rental.tenant.firstName} {escrow.rental.tenant.lastName})</div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${escrow.status === 'RELEASED' ? 'verified' : escrow.status === 'HELD' ? 'pending' : 'error'}`}>
                                                    {escrow.status}
                                                </span>
                                            </td>
                                            <td>
                                                {escrow.status === 'HELD' || escrow.status === 'DISPUTED' ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => openEscrowConfirm(escrow.id, 'RELEASE')} className="btn btn-sm" style={{ background: 'var(--color-success)', color: 'white' }}>Release</button>
                                                        <button onClick={() => openEscrowConfirm(escrow.id, 'REFUND')} className="btn btn-sm btn-outline text-danger">Refund</button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted">Resolved</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-6">
                    {withdrawals.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}><Banknote size={48} /></div>
                            <h3>No payout requests</h3>
                            <p>All clear! There are currently no pending withdrawal requests.</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Amount</th>
                                        <th>Bank Details</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {withdrawals.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <strong>{req.wallet?.user?.firstName} {req.wallet?.user?.lastName}</strong>
                                                <div className="badge badge-primary text-[10px]">{req.wallet?.user?.role}</div>
                                            </td>
                                            <td><strong>₦{Number(req.amount).toLocaleString()}</strong></td>
                                            <td className="text-xs">
                                                <div>{req.bankName}</div>
                                                <div className="tracking-widest">{req.bankAccount}</div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${req.status === 'PROCESSED' ? 'verified' : req.status === 'PENDING' ? 'warning' : 'error'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>
                                                {req.status === 'PENDING' ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleWithdrawalAction(req.id, 'PROCESSED')} className="btn btn-sm btn-primary">Paid</button>
                                                        <button onClick={() => handleWithdrawalAction(req.id, 'REJECTED', true)} className="btn btn-sm btn-outline text-danger">Reject</button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted">Finalized</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}