'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, CheckCircle, XCircle } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDisplayId } from '@/lib/idFormatter';

export default function AdminDisputesPage() {
    const toast = useToast();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        escrowId: null,
        action: '',
        loading: false
    });

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/escrow?status=DISPUTED');
            const data = await res.json();
            setDisputes(data.escrows || []);
        } catch (error) {
            console.error('Failed to load disputes:', error);
        } finally {
            setLoading(false);
        }
    };

    const openConfirmModal = (escrowId, action) => {
        setConfirmState({
            isOpen: true,
            escrowId,
            action,
            loading: false
        });
    };

    const handleConfirmResolution = async () => {
        const { escrowId, action } = confirmState;
        if (!escrowId || !action) return;

        setConfirmState(prev => ({ ...prev, loading: true }));

        try {
            const res = await fetch('/api/admin/escrow/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ escrowId, action }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Dispute Resolved', data.message || `Dispute ${formatDisplayId('ESC', escrowId)} ${action.toLowerCase()} successfully.`);
                setConfirmState({ isOpen: false, escrowId: null, action: '', loading: false });
                fetchDisputes();
            } else {
                toast.error('Action Failed', data.error || 'Failed to resolve dispute.');
                setConfirmState(prev => ({ ...prev, loading: false }));
            }
        } catch (error) {
            toast.error('Action Error', error.message || 'Something went wrong.');
            setConfirmState(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
            
            {/* Header */}
            <div className={styles.propertiesHeader} style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                    Dispute Resolution Center
                </h3>
                <p className="text-muted" style={{ margin: 0 }}>
                    Manage tenant complaints and escrow holds.
                </p>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                title={`Resolve Dispute ${formatDisplayId('ESC', confirmState.escrowId)}`}
                message={`Are you sure you want to ${confirmState.action.toLowerCase()} funds for transaction ${formatDisplayId('ESC', confirmState.escrowId)}? This action cannot be undone.`}
                confirmText={confirmState.action === 'RELEASE' ? 'Release to Landlord' : 'Refund Tenant'}
                variant={confirmState.action === 'REFUND' ? 'danger' : 'primary'}
                loading={confirmState.loading}
                onConfirm={handleConfirmResolution}
                onClose={() => setConfirmState({ isOpen: false, escrowId: null, action: '', loading: false })}
            />

            {loading ? (
                <div className="card text-center" style={{ padding: '40px 20px', color: 'var(--text-muted)' }}>
                    Loading active disputes...
                </div>
            ) : disputes.length === 0 ? (
                <div className="card text-center" style={{ padding: '48px 24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
                        No Active Disputes
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                        All rental payments are processing smoothly with zero active disputes.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {disputes.map(escrow => (
                        <div key={escrow.id} className="card p-6 border flex flex-col md:flex-row justify-between gap-6 items-start">
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '600', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                                        {formatDisplayId('ESC', escrow.id)}
                                    </span>
                                    <span className="badge badge-error">DISPUTED</span>
                                </div>

                                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                                    {escrow.rental?.property?.title || 'Rental Property'}
                                </h4>

                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                                    <div><strong>Tenant:</strong> {formatDisplayId('USR', escrow.rental?.tenant?.id)} ({escrow.rental?.tenant?.firstName} {escrow.rental?.tenant?.lastName})</div>
                                    <div><strong>Landlord:</strong> {formatDisplayId('USR', escrow.rental?.property?.landlord?.id)} ({escrow.rental?.property?.landlord?.firstName} {escrow.rental?.property?.landlord?.lastName})</div>
                                    <div><strong>Disputed Amount:</strong> ₦{Number(escrow.amount).toLocaleString()}</div>
                                </div>

                                {escrow.disputeReason && (
                                    <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: '#92400E', fontSize: '0.85rem' }}>
                                        <strong>Reason:</strong> {escrow.disputeReason}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '200px' }}>
                                <button
                                    onClick={() => openConfirmModal(escrow.id, 'RELEASE')}
                                    className="btn btn-primary btn-sm"
                                    style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)', color: '#fff' }}
                                >
                                    Release to Landlord
                                </button>
                                <button
                                    onClick={() => openConfirmModal(escrow.id, 'REFUND')}
                                    className="btn btn-outline btn-sm"
                                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                                >
                                    Refund Tenant
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}