'use client';

import { useState, useEffect } from 'react';
import { Wrench, Clock, CheckCircle, Loader2, Phone, MapPin } from 'lucide-react';

const statusConfig = {
    SUBMITTED: { label: 'Submitted', badge: 'badge-pending', icon: Clock },
    IN_PROGRESS: { label: 'In Progress', badge: 'badge-info', icon: Loader2 },
    RESOLVED: { label: 'Resolved', badge: 'badge-verified', icon: CheckCircle },
};

export default function LandlordMaintenancePage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/landlord/maintenance');
            const data = await res.json();
            if (res.ok) setRequests(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/landlord/maintenance/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) fetchRequests();
            else alert('Failed to update status');
        } catch { alert('Something went wrong'); }
        finally { setUpdating(null); }
    };

    const pendingCount = requests.filter(r => r.status === 'SUBMITTED').length;
    const inProgressCount = requests.filter(r => r.status === 'IN_PROGRESS').length;
    const resolvedCount = requests.filter(r => r.status === 'RESOLVED').length;

    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 style={{ fontSize: 'var(--text-2xl)' }}>Maintenance Requests</h1>
                <p className="text-muted">Review and manage repair requests from your tenants.</p>
            </header>

            {/* Stats Row */}
            <div className="grid grid-3 mb-6">
                <div className="card text-center" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                    <p className="text-sm text-muted">Pending</p>
                    <h3 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-warning)' }}>{pendingCount}</h3>
                </div>
                <div className="card text-center" style={{ borderLeft: '4px solid var(--color-info)' }}>
                    <p className="text-sm text-muted">In Progress</p>
                    <h3 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-info)' }}>{inProgressCount}</h3>
                </div>
                <div className="card text-center" style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <p className="text-sm text-muted">Resolved</p>
                    <h3 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-success)' }}>{resolvedCount}</h3>
                </div>
            </div>

            {/* Request Cards */}
            {loading ? (
                <div className="card text-center text-muted" style={{ padding: 'var(--space-8)' }}>Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
                    <Wrench size={48} style={{ color: 'var(--text-light)', margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ fontSize: 'var(--text-lg)' }}>No maintenance requests</h3>
                    <p className="text-muted text-sm mt-2">Your tenants haven&apos;t reported any issues yet.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {requests.map(req => {
                        const status = statusConfig[req.status] || statusConfig.SUBMITTED;
                        const StatusIcon = status.icon;
                        return (
                            <div key={req.id} className="card">
                                <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                                    <div style={{ flex: 1, minWidth: '250px' }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`badge ${status.badge} flex items-center gap-1`}>
                                                <StatusIcon size={12} /> {status.label}
                                            </span>
                                            <span className="badge badge-primary">{req.category}</span>
                                        </div>
                                        <h4 className="font-bold" style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>{req.title}</h4>
                                        <p className="text-sm" style={{ marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>{req.description}</p>

                                        <div className="flex gap-4 mt-2" style={{ flexWrap: 'wrap' }}>
                                            <span className="text-xs text-muted flex items-center gap-1">
                                                <MapPin size={12} /> {req.rental?.property?.title}
                                            </span>
                                            <span className="text-xs text-muted flex items-center gap-1">
                                                <Phone size={12} /> {req.tenant?.firstName} {req.tenant?.lastName}
                                                {req.tenant?.phone && (
                                                    <a href={`tel:${req.tenant.phone}`} style={{ color: 'var(--color-primary)', marginLeft: 'var(--space-1)' }}>
                                                        {req.tenant.phone}
                                                    </a>
                                                )}
                                            </span>
                                            <span className="text-xs text-muted">
                                                {new Date(req.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {req.status !== 'RESOLVED' && (
                                        <div className="flex gap-2">
                                            {req.status === 'SUBMITTED' && (
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => updateStatus(req.id, 'IN_PROGRESS')}
                                                    disabled={updating === req.id}
                                                >
                                                    {updating === req.id ? '...' : 'Acknowledge'}
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={() => updateStatus(req.id, 'RESOLVED')}
                                                disabled={updating === req.id}
                                            >
                                                {updating === req.id ? '...' : 'Mark Resolved'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}