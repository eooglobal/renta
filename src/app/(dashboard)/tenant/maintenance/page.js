'use client';

import { useState, useEffect } from 'react';
import { Wrench, Plus, AlertTriangle, Clock, CheckCircle, Loader2 } from 'lucide-react';

const CATEGORIES = ['Plumbing', 'Electrical', 'Appliances', 'Structural', 'Pest Control', 'Other'];

const statusConfig = {
    SUBMITTED: { label: 'Submitted', badge: 'badge-pending', icon: Clock },
    IN_PROGRESS: { label: 'In Progress', badge: 'badge-info', icon: Loader2 },
    RESOLVED: { label: 'Resolved', badge: 'badge-verified', icon: CheckCircle },
};

export default function TenantMaintenancePage() {
    const [requests, setRequests] = useState([]);
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [form, setForm] = useState({ rentalId: '', category: '', title: '', description: '' });

    useEffect(() => {
        fetchRequests();
        fetchRentals();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/tenant/maintenance');
            const data = await res.json();
            if (res.ok) setRequests(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchRentals = async () => {
        try {
            // Fetch active rentals for the dropdown
            const res = await fetch('/api/tenant/maintenance');
            // We'll use the requests to derive rental info, or make a simple fetch
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const res = await fetch('/api/tenant/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || 'Failed to submit');
            } else {
                setMessage('Request submitted successfully!');
                setForm({ rentalId: '', category: '', title: '', description: '' });
                setShowForm(false);
                fetchRequests();
            }
        } catch {
            setMessage('Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fade-in">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: 'var(--text-2xl)' }}>Maintenance Requests</h1>
                    <p className="text-muted">Report and track issues with your rented property.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : <><Plus size={16} /> Report Issue</>}
                </button>
            </header>

            {message && (
                <div className="card mb-4 flex items-center gap-2" style={{
                    background: message.includes('success') ? 'var(--color-success-light)' : 'var(--color-error-light)',
                    borderLeft: `4px solid ${message.includes('success') ? 'var(--color-success)' : 'var(--color-error)'}`,
                }}>
                    <span className="text-sm font-medium">{message}</span>
                </div>
            )}

            {/* New Request Form */}
            {showForm && (
                <div className="card mb-6">
                    <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
                        <Wrench size={18} style={{ color: 'var(--color-primary)' }} /> New Maintenance Request
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="form-label">Rental ID</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Enter your active rental ID"
                                    value={form.rentalId}
                                    onChange={e => setForm({ ...form, rentalId: e.target.value })}
                                    required
                                />
                                <span className="form-help">Find this on your &quot;My Rentals&quot; page.</span>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-input"
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select category...</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Issue Title</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Leaking kitchen tap"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                placeholder="Describe the issue in detail..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                required
                                style={{ minHeight: '100px' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </div>
            )}

            {/* Requests List */}
            {loading ? (
                <div className="card text-center text-muted" style={{ padding: 'var(--space-8)' }}>Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
                    <Wrench size={48} style={{ color: 'var(--text-light)', margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ fontSize: 'var(--text-lg)' }}>No maintenance requests yet</h3>
                    <p className="text-muted text-sm mt-2">Click &quot;Report Issue&quot; to submit your first request.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {requests.map(req => {
                        const status = statusConfig[req.status] || statusConfig.SUBMITTED;
                        const StatusIcon = status.icon;
                        return (
                            <div key={req.id} className="card">
                                <div className="flex justify-between items-start">
                                    <div style={{ flex: 1 }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`badge ${status.badge} flex items-center gap-1`}>
                                                <StatusIcon size={12} /> {status.label}
                                            </span>
                                            <span className="badge badge-primary">{req.category}</span>
                                        </div>
                                        <h4 className="font-bold" style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)' }}>{req.title}</h4>
                                        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-2)' }}>{req.description}</p>
                                        <p className="text-xs text-muted">
                                            {req.rental?.property?.title} • {new Date(req.createdAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}