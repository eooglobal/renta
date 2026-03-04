'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, Edit, Trash2, Search, X, AlertCircle, Check } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';

const ROLES = ['TENANT', 'LANDLORD', 'SCOUT', 'AFFILIATE', 'ADMIN'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'VERIFICATION_OFFICER', 'SUPPORT'];

export default function AdminUsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const isSuperAdmin = session?.user?.adminRole === 'SUPER_ADMIN';

    useEffect(() => { fetchUsers(); }, [filter, searchQuery]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter) params.set('role', filter);
            if (searchQuery) params.set('search', searchQuery);
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
            else {
                const data = await res.json();
                alert(data.error || 'Action failed');
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateUser = async (formData) => {
        setModalLoading(true);
        setModalError('');
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setShowCreateModal(false);
            fetchUsers();
        } catch (err) {
            setModalError(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleEditUser = async (formData) => {
        setModalLoading(true);
        setModalError('');
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: editUser.id, ...formData }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setEditUser(null);
            fetchUsers();
        } catch (err) {
            setModalError(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        setModalLoading(true);
        setModalError('');
        try {
            const res = await fetch(`/api/admin/users?userId=${deleteUser.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setDeleteUser(null);
            fetchUsers();
        } catch (err) {
            setModalError(err.message);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <h3>User Management</h3>
                <div className="flex gap-2 items-center">
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-input"
                            style={{ paddingLeft: '36px', width: 200 }}
                        />
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    </div>

                    {/* Role Filter */}
                    {['', ...ROLES].map(role => (
                        <button key={role} onClick={() => setFilter(role)}
                            className={`btn btn-sm ${filter === role ? 'btn-primary' : 'btn-outline'}`}>
                            {role || 'All'}
                        </button>
                    ))}

                    {/* Create Button */}
                    {isSuperAdmin && (
                        <button className="btn btn-primary btn-sm" onClick={() => { setShowCreateModal(true); setModalError(''); }}>
                            <UserPlus size={16} /> Add User
                        </button>
                    )}
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
                <div className={styles.tableContainer}>
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
                                    <td>
                                        <span className="badge badge-primary">{user.role}</span>
                                        {user.adminRole && (
                                            <span className="badge badge-info" style={{ marginLeft: 4, fontSize: '0.65rem' }}>
                                                {user.adminRole.replace('_', ' ')}
                                            </span>
                                        )}
                                    </td>
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
                                            {isSuperAdmin && (
                                                <>
                                                    <button className="btn btn-sm btn-outline"
                                                        onClick={() => { setEditUser(user); setModalError(''); }}>
                                                        <Edit size={14} />
                                                    </button>
                                                    <button className="btn btn-sm btn-outline"
                                                        style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                                                        onClick={() => { setDeleteUser(user); setModalError(''); }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <UserFormModal
                    title="Create New User"
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateUser}
                    error={modalError}
                    loading={modalLoading}
                    isCreate
                />
            )}

            {/* Edit User Modal */}
            {editUser && (
                <UserFormModal
                    title={`Edit: ${editUser.firstName} ${editUser.lastName}`}
                    user={editUser}
                    onClose={() => setEditUser(null)}
                    onSubmit={handleEditUser}
                    error={modalError}
                    loading={modalLoading}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteUser && (
                <ConfirmModal
                    title="Delete User"
                    message={`Are you sure you want to permanently delete ${deleteUser.firstName} ${deleteUser.lastName} (${deleteUser.email})? This action cannot be undone.`}
                    onClose={() => setDeleteUser(null)}
                    onConfirm={handleDeleteUser}
                    error={modalError}
                    loading={modalLoading}
                />
            )}
        </div>
    );
}

// User Form Modal (Create/Edit)
function UserFormModal({ title, user, onClose, onSubmit, error, loading, isCreate }) {
    const [form, setForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        password: '',
        role: user?.role || 'TENANT',
        adminRole: user?.adminRole || '',
    });

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...form };
        if (!isCreate && !data.password) delete data.password;
        if (!isCreate) delete data.password; // Don't send password on edit
        if (data.role !== 'ADMIN') delete data.adminRole;
        onSubmit(data);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: 500, padding: '32px', position: 'relative', boxShadow: 'var(--shadow-2xl)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
                <h3 style={{ marginBottom: 24 }}>{title}</h3>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={14} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 12 }}>
                        <div>
                            <label className="form-label">First Name *</label>
                            <input className="form-input" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
                        </div>
                        <div>
                            <label className="form-label">Last Name *</label>
                            <input className="form-input" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
                        </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label className="form-label">Email *</label>
                        <input className="form-input" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label className="form-label">Phone</label>
                        <input className="form-input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                    </div>

                    {isCreate && (
                        <div style={{ marginBottom: 12 }}>
                            <label className="form-label">Password *</label>
                            <input className="form-input" type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} required={isCreate} />
                        </div>
                    )}

                    <div style={{ marginBottom: 12 }}>
                        <label className="form-label">Role *</label>
                        <select className="form-input" value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {form.role === 'ADMIN' && (
                        <div style={{ marginBottom: 12 }}>
                            <label className="form-label">Admin Role *</label>
                            <select className="form-input" value={form.adminRole} onChange={(e) => handleChange('adminRole', e.target.value)}>
                                <option value="">Select admin role...</option>
                                {ADMIN_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex gap-3" style={{ marginTop: 24 }}>
                        <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                            {loading ? 'Processing...' : isCreate ? 'Create User' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Delete Confirmation Modal
function ConfirmModal({ title, message, onClose, onConfirm, error, loading }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: 400, padding: '32px', textAlign: 'center', boxShadow: 'var(--shadow-2xl)' }}>
                <div style={{ width: 64, height: 64, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Trash2 size={28} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ marginBottom: 8 }}>{title}</h3>
                <p className="text-muted text-sm" style={{ marginBottom: 20 }}>{message}</p>

                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem', textAlign: 'left' }}>
                        <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} /> {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                    <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white' }} onClick={onConfirm} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete User'}
                    </button>
                </div>
            </div>
        </div>
    );
}
