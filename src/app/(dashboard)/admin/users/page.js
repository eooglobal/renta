'use client';

import { useState, useEffect } from 'react';
import styles from '../../tenant/dashboard.module.css';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => { fetchUsers(); }, [filter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter) params.set('role', filter);
            const res = await fetch(`/api/admin/users?${params}`);
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId, action) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action }),
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <h3>User Management</h3>
                <div className="flex gap-2">
                    {['', 'TENANT', 'LANDLORD', 'SCOUT', 'AFFILIATE', 'ADMIN'].map(role => (
                        <button key={role} onClick={() => setFilter(role)}
                            className={`btn btn-sm ${filter === role ? 'btn-primary' : 'btn-outline'}`}>
                            {role || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center" style={{ padding: '60px 0' }}>
                    <div className="spinner" style={{ width: 32, height: 32 }}></div>
                </div>
            ) : users.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>👥</div>
                    <h3>No users found</h3>
                </div>
            ) : (
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>NIN</th>
                            <th>Status</th>
                            <th>Properties</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td><strong>{user.firstName} {user.lastName}</strong></td>
                                <td className="text-sm">{user.email}</td>
                                <td className="text-sm">{user.phone || '—'}</td>
                                <td><span className="badge badge-primary">{user.role}</span></td>
                                <td>
                                    <span className={`badge badge-${user.ninStatus === 'VERIFIED' ? 'verified' : 'pending'}`}>
                                        {user.ninStatus}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge badge-${user.status === 'ACTIVE' ? 'verified' : 'error'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="text-center">{user._count?.properties || 0}</td>
                                <td>
                                    <div className="flex gap-2">
                                        {user.status === 'ACTIVE' ? (
                                            <button className="btn btn-sm btn-outline"
                                                style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                                onClick={() => handleAction(user.id, 'suspend')}
                                                disabled={actionLoading === user.id}>
                                                Suspend
                                            </button>
                                        ) : (
                                            <button className="btn btn-sm"
                                                style={{ background: 'var(--color-success)', color: 'white' }}
                                                onClick={() => handleAction(user.id, 'activate')}
                                                disabled={actionLoading === user.id}>
                                                Activate
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
