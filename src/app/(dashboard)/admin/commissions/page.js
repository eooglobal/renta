'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Percent, TrendingUp, Users, Building } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';

export default function AdminCommissionsPage() {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchCommissions = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filter) params.set('type', filter);
                const res = await fetch(`/api/admin/commissions?${params}`);
                const data = await res.json();
                setCommissions(data.commissions || []);
            } catch (error) {
                console.error('Failed to load commissions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCommissions();
    }, [filter]);

    const getTypeColor = (type) => {
        switch (type) {
            case 'PLATFORM': return 'var(--color-primary)';
            case 'SCOUT': return 'var(--color-success)';
            case 'AFFILIATE': return 'var(--color-secondary)';
            default: return 'var(--color-gray-500)';
        }
    };

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <h3>Commission Logs</h3>
                <div className="flex gap-2">
                    {['', 'PLATFORM', 'SCOUT', 'AFFILIATE'].map(type => (
                        <button key={type} onClick={() => setFilter(type)}
                            className={`btn btn-sm ${filter === type ? 'btn-primary' : 'btn-outline'}`}>
                            {type || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center" style={{ padding: '60px 0' }}>
                    <div className="spinner" style={{ width: 32, height: 32 }}></div>
                </div>
            ) : commissions.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>💰</div>
                    <h3>No commissions recorded</h3>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Recipient</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Property / Source</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissions.map(comm => (
                                <tr key={comm.id}>
                                    <td className="text-sm">{new Date(comm.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <strong>{comm.user.firstName} {comm.user.lastName}</strong>
                                        <div className="text-[10px] text-muted">{comm.user.role}</div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: getTypeColor(comm.type), color: 'white' }}>
                                            {comm.type}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <strong>₦{Number(comm.amount).toLocaleString()}</strong>
                                            <span className="text-[10px] text-muted">{Number(comm.percentage)}% of rent</span>
                                        </div>
                                    </td>
                                    <td className="text-sm">
                                        {comm.escrow?.rental?.property?.title || 'System'}
                                        <div className="text-[10px] text-muted italic">Rental #{comm.escrow?.rental?.id}</div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${comm.status === 'PAID' ? 'verified' : 'pending'}`}>
                                            {comm.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}