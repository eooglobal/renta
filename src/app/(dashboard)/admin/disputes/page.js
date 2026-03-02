'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../../tenant/dashboard.module.css';

export default function AdminDisputesPage() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            // Fetch escrows specifically marked as DISPUTED
            const res = await fetch('/api/admin/escrow?status=DISPUTED');
            const data = await res.json();
            setDisputes(data.escrows || []);
        } catch (error) {
            console.error('Failed to load disputes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolution = async (escrowId, action) => {
        if (!confirm(`Are you sure you want to ${action} this escrow? This action cannot be undone.`)) return;

        setActionLoading(escrowId);
        try {
            const res = await fetch('/api/admin/escrow/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ escrowId, action }), // action: 'RELEASE' or 'REFUND'
            });

            if (res.ok) {
                fetchDisputes();
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.error}`);
            }
        } catch (error) {
            console.error('Failed to resolve dispute:', error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <h3>Dispute Resolution Center</h3>
                <p className="text-muted">Manage tenant complaints and escrow holds.</p>
            </div>

            {loading ? (
                <div className="flex justify-center" style={{ padding: '60px 0' }}>
                    <div className="spinner" style={{ width: 32, height: 32 }}></div>
                </div>
            ) : disputes.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>⚖️</div>
                    <h3>No active disputes</h3>
                    <p>All escrow payments are processing smoothly.</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {disputes.map(escrow => (
                        <div key={escrow.id} className="card">
                            <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-4)' }}>
                                <div>
                                    <h4 style={{ margin: 0, color: 'var(--color-error)' }}>Active Dispute</h4>
                                    <p className="text-sm text-muted m-0">Reported on {new Date(escrow.updatedAt).toLocaleDateString()}</p>
                                </div>
                                <span className="badge badge-error">₦{Number(escrow.amount).toLocaleString()}</span>
                            </div>

                            <div style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                                <p className="text-sm" style={{ margin: 0 }}><strong>Property:</strong> {escrow.rental.property.title}</p>
                                <p className="text-sm" style={{ margin: '4px 0 0 0' }}><strong>Tenant:</strong> {escrow.rental.tenant.firstName} {escrow.rental.tenant.lastName}</p>
                                <p className="text-sm" style={{ margin: '4px 0 0 0' }}><strong>Landlord:</strong> {escrow.rental.property.landlord.firstName} {escrow.rental.property.landlord.lastName}</p>
                            </div>

                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <h5 style={{ margin: '0 0 8px 0' }}>Complaint Details</h5>
                                <p className="text-sm bg-gray-50 p-3 rounded border" style={{ margin: 0 }}>
                                    {escrow.disputeReason || "No details provided by the tenant."}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button className="btn flex-1 btn-outline" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                    onClick={() => handleResolution(escrow.id, 'REFUND')}
                                    disabled={actionLoading === escrow.id}>
                                    Refund Tenant
                                </button>
                                <button className="btn flex-1 bg-primary text-white"
                                    onClick={() => handleResolution(escrow.id, 'RELEASE')}
                                    disabled={actionLoading === escrow.id}>
                                    Release to Landlord
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}