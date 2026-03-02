'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';

export default function ReferralsList() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReferrals = async () => {
            try {
                const res = await fetch('/api/affiliate/referrals');
                const data = await res.json();
                if (res.ok) setReferrals(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReferrals();
    }, []);

    if (loading) return <div className="card text-center text-muted" style={{ padding: 'var(--space-8)' }}>Loading referrals...</div>;

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2" style={{ fontSize: 'var(--text-xl)' }}>
                    <Users size={18} style={{ color: 'var(--color-primary)' }} /> Tracked Referrals
                </h3>
                <span className="badge badge-primary">{referrals.length} Total</span>
            </div>

            {referrals.length === 0 ? (
                <div className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>
                    <p>You haven&apos;t referred anyone yet.</p>
                    <p className="text-sm mt-2">Share your link to start earning!</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>User</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Joined Date</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referrals.map(ref => {
                                const hasRented = ref.referredUser.rentals && ref.referredUser.rentals.length > 0;
                                return (
                                    <tr key={ref.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }} className="font-medium">
                                            {ref.referredUser.firstName} {ref.referredUser.lastName}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }} className="text-muted">
                                            {new Date(ref.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                            {hasRented ? (
                                                <span className="badge badge-verified flex items-center gap-1">
                                                    <CheckCircle size={14} /> Active Tenant
                                                </span>
                                            ) : (
                                                <span className="badge badge-pending flex items-center gap-1">
                                                    <Clock size={14} /> Searching
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
