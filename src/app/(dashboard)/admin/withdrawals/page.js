'use client';

import { useState, useEffect } from 'react';
import { Banknote, CheckCircle, XCircle, User, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDisplayId } from '@/lib/idFormatter';

export default function AdminWithdrawalsPage() {
    const toast = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Confirm modal state
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        requestId: null,
        targetStatus: '',
        adminNotes: '',
        actionLoading: false
    });

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/withdrawals');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch withdrawals');
            setRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const openConfirmModal = (requestId, targetStatus) => {
        setConfirmState({
            isOpen: true,
            requestId,
            targetStatus,
            adminNotes: '',
            actionLoading: false
        });
    };

    const handleConfirmAction = async () => {
        const { requestId, targetStatus, adminNotes } = confirmState;
        if (!requestId || !targetStatus) return;

        setConfirmState(prev => ({ ...prev, actionLoading: true }));

        try {
            const res = await fetch(`/api/admin/withdrawals/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus, adminNotes })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to process withdrawal');

            toast.success('Withdrawal Updated', `Withdrawal ${formatDisplayId('WD', requestId)} marked as ${targetStatus}.`);
            setConfirmState({ isOpen: false, requestId: null, targetStatus: '', adminNotes: '', actionLoading: false });
            fetchRequests();
        } catch (err) {
            toast.error('Action Failed', err.message || 'Could not update withdrawal request.');
            setConfirmState(prev => ({ ...prev, actionLoading: false }));
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading withdrawal requests queue...</div>;
    if (error) return <div className="p-8 text-danger text-center">{error}</div>;

    const StatusBadge = ({ status }) => {
        const mapping = {
            'PENDING': { cl: 'badge-warning', label: 'Pending Transfer' },
            'PROCESSED': { cl: 'badge-success', label: 'Paid Out' },
            'REJECTED': { cl: 'badge-danger', label: 'Rejected (Refunded)' }
        };
        const m = mapping[status] || { cl: 'badge-secondary', label: status };
        return <span className={`badge ${m.cl}`}>{m.label}</span>;
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* Header */}
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Banknote className="text-primary" /> Payout Queue
                </h1>
                <p className="text-muted">Process withdrawals for Landlords, Scouts, and Affiliates.</p>
            </header>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={`Confirm Withdrawal ${formatDisplayId('WD', confirmState.requestId)}`}
                message={`Are you sure you want to mark withdrawal request ${formatDisplayId('WD', confirmState.requestId)} as ${confirmState.targetStatus}?`}
                confirmText={confirmState.targetStatus === 'PROCESSED' ? 'Confirm Payment' : 'Reject & Refund'}
                variant={confirmState.targetStatus === 'REJECTED' ? 'danger' : 'primary'}
                loading={confirmState.actionLoading}
                onConfirm={handleConfirmAction}
                onClose={() => setConfirmState({ isOpen: false, requestId: null, targetStatus: '', adminNotes: '', actionLoading: false })}
            />

            <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <table className="table w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4">Ref Code</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Bank Details</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-muted">No payout requests in the queue.</td></tr>
                        ) : requests.map(req => (
                            <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 text-sm font-mono text-muted">
                                    {formatDisplayId('WD', req.id)}
                                </td>
                                <td className="p-4 text-sm whitespace-nowrap text-muted">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    <div className="font-medium flex items-center gap-1">
                                        <User size={14} className="text-muted" />
                                        {req.wallet?.user?.firstName} {req.wallet?.user?.lastName}
                                    </div>
                                    <div className="text-xs font-bold text-primary mt-0.5">
                                        {formatDisplayId('USR', req.wallet?.user?.id)} ({req.wallet?.user?.role})
                                    </div>
                                </td>
                                <td className="p-4 font-bold text-lg">
                                    ₦{Number(req.amount).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">{req.bankName}</div>
                                    <div className="text-sm tracking-widest">{req.bankAccount}</div>
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={req.status} />
                                    {req.adminNotes && (
                                        <div className="text-xs text-muted mt-2 flex items-start gap-1 max-w-[200px]">
                                            <MessageSquare size={12} className="shrink-0 mt-0.5" />
                                            <span className="truncate" title={req.adminNotes}>{req.adminNotes}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    {req.status === 'PENDING' ? (
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => openConfirmModal(req.id, 'PROCESSED')}
                                                className="btn btn-primary bg-green-600 hover:bg-green-700 border-none px-3 py-1 flex items-center gap-1 text-sm"
                                            >
                                                <CheckCircle size={14} /> Paid
                                            </button>
                                            <button
                                                onClick={() => openConfirmModal(req.id, 'REJECTED')}
                                                className="btn btn-outline text-danger border-danger hover:bg-red-50 px-3 py-1 flex items-center gap-1 text-sm"
                                            >
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-right text-xs text-muted">No actions available</div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
