'use client';

import { useState, useEffect } from 'react';
import { Shield, Banknote, CheckCircle, XCircle, Search, Filter, MessageSquare, ExternalLink } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';

export default function AdminEscrowPage() {
    const [escrows, setEscrows] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('escrow'); // 'escrow' or 'withdrawals'
    const [filter, setFilter] = useState('');

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

    const handleWithdrawalAction = async (id, status, requireNotes = false) => {
        let adminNotes = '';
        if (requireNotes) {
            adminNotes = prompt(`Please enter a reason for marking this as ${status}:`);
            if (adminNotes === null) return;
        } else if (!confirm(`Are you sure you want to mark this withdrawal as ${status}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/withdrawals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes })
            });
            if (res.ok) {
                alert('Withdrawal status updated.');
                fetchWithdrawals();
            }
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleEscrowAction = async (escrowId, action) => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this escrow?`)) return;

        try {
            const res = await fetch('/api/admin/escrow/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ escrowId, action })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchEscrows();
                fetchWithdrawals();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Action failed');
        }
    };

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <div className="flex flex-col">
                    <h3>Financial Management</h3>
                    <p className="text-sm text-muted">Manage platform escrow and payout requests.</p>
                </div>
                <div className="tabs flex gap-4">
                    <button
                        onClick={() => { setActiveTab('escrow'); setFilter(''); }}
                        className={`btn ${activeTab === 'escrow' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        <Shield size={16} className="mr-2" /> Escrow
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
                            <h3>No escrow records found</h3>
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
                                                <div className="text-xs text-muted">Escrow #{escrow.id}</div>
                                            </td>
                                            <td><strong>₦{Number(escrow.amount).toLocaleString()}</strong></td>
                                            <td className="text-xs">
                                                <div><strong>L:</strong> {escrow.rental.property.landlord.firstName} {escrow.rental.property.landlord.lastName}</div>
                                                <div><strong>T:</strong> {escrow.rental.tenant.firstName} {escrow.rental.tenant.lastName}</div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${escrow.status === 'RELEASED' ? 'verified' : escrow.status === 'HELD' ? 'pending' : 'error'}`}>
                                                    {escrow.status}
                                                </span>
                                            </td>
                                            <td>
                                                {escrow.status === 'HELD' || escrow.status === 'DISPUTED' ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleEscrowAction(escrow.id, 'RELEASE')} className="btn btn-sm" style={{ background: 'var(--color-success)', color: 'white' }}>Release</button>
                                                        <button onClick={() => handleEscrowAction(escrow.id, 'REFUND')} className="btn btn-sm btn-outline text-danger">Refund</button>
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