'use client';

import { useState, useEffect } from 'react';
import { formatDisplayId } from '@/lib/idFormatter';

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
                console.error('Failed to fetch referrals:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReferrals();
    }, []);

    if (loading) {
        return (
            <div className="card text-center" style={{ padding: '32px 16px', color: 'var(--text-muted)' }}>
                Loading referrals...
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                    Tracked Referrals
                </h3>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 10px', borderRadius: '12px' }}>
                    {referrals.length} Total
                </span>
            </div>

            {referrals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>You haven&apos;t referred any users yet.</p>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>Share your link to start earning 2% lifetime commissions!</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '0.775rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                <th style={{ padding: '10px 14px' }}>User ID</th>
                                <th style={{ padding: '10px 14px' }}>User Name</th>
                                <th style={{ padding: '10px 14px' }}>Joined Date</th>
                                <th style={{ padding: '10px 14px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {referrals.map(ref => {
                                const hasRented = ref.referredUser.rentals && ref.referredUser.rentals.length > 0;
                                return (
                                    <tr key={ref.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {formatDisplayId('USR', ref.referredUser.id)}
                                        </td>
                                        <td style={{ padding: '12px 14px', fontWeight: '500', color: 'var(--text-main)' }}>
                                            {ref.referredUser.firstName} {ref.referredUser.lastName}
                                        </td>
                                        <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                                            {new Date(ref.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px 14px' }}>
                                            {hasRented ? (
                                                <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: '0.75rem', fontWeight: '600', padding: '3px 8px', borderRadius: '10px' }}>
                                                    Active Tenant
                                                </span>
                                            ) : (
                                                <span style={{ background: '#F3F4F6', color: '#4B5563', fontSize: '0.75rem', fontWeight: '500', padding: '3px 8px', borderRadius: '10px' }}>
                                                    Searching
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
