'use client';

import { useState, useEffect } from 'react';
import { Banknote, CheckCircle, XCircle, User, MessageSquare } from 'lucide-react';

export default function AdminWithdrawalsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/withdrawals');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
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

    const handleAction = async (id, status, requireNotes = false) => {
        let adminNotes = '';
        if (requireNotes) {
            adminNotes = prompt(`Please enter a reason for marking this as ${status}:`);
            if (adminNotes === null) return; // cancelled prompt
        } else if (!confirm(`Are you sure you want to mark this withdrawal as ${status}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/withdrawals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, adminNotes })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(data.message);
            fetchRequests();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading withdrawal requests...</div>;
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
        <div className="fade-in">
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote className="text-primary" /> Payout Queue</h1>
                <p className="text-muted">Process withdrawals for Landlords, Scouts, and Affiliates.</p>
            </header>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="table w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b">
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
                            <tr><td colSpan="6" className="p-8 text-center text-muted">No payout requests in the queue.</td></tr>
                        ) : requests.map(req => (
                            <tr key={req.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 text-sm whitespace-nowrap">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    <div className="font-medium flex items-center gap-1">
                                        <User size={14} className="text-muted" />
                                        {req.wallet?.user?.firstName} {req.wallet?.user?.lastName}
                                    </div>
                                    <div className="text-xs font-bold text-primary mt-1">
                                        {req.wallet?.user?.role}
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
                                                onClick={() => handleAction(req.id, 'PROCESSED')}
                                                className="btn btn-primary bg-green-600 hover:bg-green-700 border-none px-3 py-1 flex items-center gap-1 text-sm"
                                            >
                                                <CheckCircle size={14} /> Paid
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'REJECTED', true)}
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
