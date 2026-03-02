'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    User, Mail, Phone, Shield, Building2, Calendar,
    Save, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Loader2
} from 'lucide-react';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPassSection, setShowPassSection] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        bankName: '',
        bankAccount: '',
        bankCode: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/profile');
                const data = await res.json();
                if (res.ok) {
                    setProfile(data);
                    setForm(prev => ({
                        ...prev,
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        phone: data.phone || '',
                        bankName: data.bankName || '',
                        bankAccount: data.bankAccount || '',
                        bankCode: data.bankCode || '',
                    }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        // Validate password if changing
        if (showPassSection && form.newPassword) {
            if (form.newPassword !== form.confirmPassword) {
                setMessage({ type: 'error', text: 'New passwords do not match.' });
                setSaving(false);
                return;
            }
            if (form.newPassword.length < 8) {
                setMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
                setSaving(false);
                return;
            }
        }

        try {
            const payload = {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                bankName: form.bankName,
                bankAccount: form.bankAccount,
                bankCode: form.bankCode,
            };

            if (showPassSection && form.newPassword) {
                payload.currentPassword = form.currentPassword;
                payload.newPassword = form.newPassword;
            }

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Update failed' });
            } else {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
                setShowPassSection(false);
            }
        } catch {
            setMessage({ type: 'error', text: 'Something went wrong.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fade-in">
                <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
                    <Loader2 size={32} style={{ color: 'var(--color-primary)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                    <p className="text-muted mt-4">Loading profile...</p>
                </div>
            </div>
        );
    }

    const roleBadgeMap = {
        TENANT: 'badge-info',
        LANDLORD: 'badge-primary',
        SCOUT: 'badge-verified',
        AFFILIATE: 'badge-pending',
        ADMIN: 'badge-error',
    };

    const ninStatusMap = {
        PENDING: { label: 'Not Verified', className: 'badge-pending' },
        VERIFIED: { label: 'Verified', className: 'badge-verified' },
        REJECTED: { label: 'Rejected', className: 'badge-error' },
    };

    const memberSince = profile ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(profile.createdAt)) : '';

    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 style={{ fontSize: 'var(--text-2xl)' }}>My Profile</h1>
                <p className="text-muted">Manage your account information and settings.</p>
            </header>

            {/* Profile Header Card */}
            <div className="card mb-6">
                <div className="flex items-center gap-4">
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'var(--color-primary)', color: 'var(--color-black)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'var(--font-extrabold)', fontSize: 'var(--text-2xl)',
                        flexShrink: 0
                    }}>
                        {profile?.firstName?.charAt(0)?.toUpperCase()}{profile?.lastName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)' }}>
                            {profile?.firstName} {profile?.lastName}
                        </h2>
                        <p className="text-sm text-muted">{profile?.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`badge ${roleBadgeMap[profile?.role] || 'badge-info'}`}>{profile?.role}</span>
                            <span className="text-xs text-muted flex items-center gap-1">
                                <Calendar size={12} /> Joined {memberSince}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="card mb-6" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
                    <div className="flex items-center gap-2">
                        <Shield size={16} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm">Account Status:</span>
                        <span className={`badge ${profile?.status === 'ACTIVE' ? 'badge-verified' : 'badge-error'}`}>
                            {profile?.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User size={16} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm">NIN Verification:</span>
                        <span className={`badge ${ninStatusMap[profile?.ninStatus]?.className || 'badge-pending'}`}>
                            {ninStatusMap[profile?.ninStatus]?.label || 'Pending'}
                        </span>
                    </div>
                    {profile?.ninNumber && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted">NIN: {profile.ninNumber}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Message */}
            {message.text && (
                <div className="card mb-6 flex items-center gap-3" style={{
                    background: message.type === 'success' ? 'var(--color-success-light)' : 'var(--color-error-light)',
                    borderLeft: `4px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
                }}>
                    {message.type === 'success' ? <CheckCircle size={18} style={{ color: 'var(--color-success)' }} /> : <AlertTriangle size={18} style={{ color: 'var(--color-error)' }} />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {/* NIN Verification Widget */}
            {(profile?.ninStatus === 'PENDING' || profile?.ninStatus === 'REJECTED') && (
                <div className="card mb-6" style={{ borderLeft: '4px solid var(--color-primary)', background: 'var(--bg-secondary)' }}>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Shield size={20} style={{ color: 'var(--color-primary)' }} />
                            <h3 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Identity Verification Required</h3>
                        </div>
                        <p className="text-sm text-muted">To build trust within the Renta community, please verify your National Identity Number (NIN). This is required to access primary features.</p>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const nin = formData.get('nin');
                            if (!nin || nin.length !== 11) {
                                setMessage({ type: 'error', text: 'NIN must be exactly 11 digits.' });
                                return;
                            }

                            const btn = e.target.querySelector('button');
                            const originalText = btn.innerHTML;
                            btn.innerHTML = 'Verifying...';
                            btn.disabled = true;

                            try {
                                const res = await fetch('/api/verification/nin', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ nin })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                    setProfile(prev => ({ ...prev, ninStatus: 'VERIFIED', ninNumber: '*'.repeat(7) + nin.slice(-4) }));
                                    setMessage({ type: 'success', text: 'Identity successfully verified!' });
                                } else {
                                    setMessage({ type: 'error', text: data.error || 'Verification failed.' });
                                    if (data.error.includes('failed')) {
                                        setProfile(prev => ({ ...prev, ninStatus: 'REJECTED' }));
                                    }
                                }
                            } catch (err) {
                                setMessage({ type: 'error', text: 'Network error during verification.' });
                            } finally {
                                btn.innerHTML = originalText;
                                btn.disabled = false;
                            }
                        }} className="flex items-end gap-3 mt-2" style={{ maxWidth: '400px' }}>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '12px' }}>11-Digit NIN</label>
                                <input type="number" name="nin" placeholder="e.g. 12345678901" className="form-input" required minLength="11" maxLength="11" />
                            </div>
                            <button type="submit" className="btn btn-primary">Verify NIN</button>
                        </form>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="card mb-6">
                    <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
                        <User size={18} style={{ color: 'var(--color-primary)' }} /> Personal Information
                    </h3>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label className="form-label">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                className="form-input"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-2">
                        <div className="form-group">
                            <label className="form-label flex items-center gap-1">
                                <Mail size={14} /> Email Address
                            </label>
                            <input
                                type="email"
                                value={profile?.email || ''}
                                disabled
                                className="form-input"
                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            />
                            <span className="form-help">Email cannot be changed.</span>
                        </div>
                        <div className="form-group">
                            <label className="form-label flex items-center gap-1">
                                <Phone size={14} /> Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., 08012345678"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="card mb-6">
                    <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
                        <Building2 size={18} style={{ color: 'var(--color-primary)' }} /> Bank Details
                    </h3>
                    <p className="text-sm text-muted mb-4">Add your bank account for receiving wallet withdrawals.</p>
                    <div className="grid grid-3">
                        <div className="form-group">
                            <label className="form-label">Bank Name</label>
                            <input
                                type="text"
                                name="bankName"
                                value={form.bankName}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., GTBank"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Account Number</label>
                            <input
                                type="text"
                                name="bankAccount"
                                value={form.bankAccount}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="0123456789"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sort / Bank Code</label>
                            <input
                                type="text"
                                name="bankCode"
                                value={form.bankCode}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g., 058"
                            />
                        </div>
                    </div>
                </div>

                {/* Password Section */}
                <div className="card mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
                            <Lock size={18} style={{ color: 'var(--color-primary)' }} /> Security
                        </h3>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setShowPassSection(!showPassSection)}
                        >
                            {showPassSection ? 'Cancel' : 'Change Password'}
                        </button>
                    </div>

                    {showPassSection && (
                        <div className="flex flex-col gap-4">
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCurrentPass ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={form.currentPassword}
                                        onChange={handleChange}
                                        className="form-input"
                                        required
                                        style={{ paddingRight: 'var(--space-10)' }}
                                    />
                                    <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)}
                                        style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showNewPass ? 'text' : 'password'}
                                            name="newPassword"
                                            value={form.newPassword}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="Min. 8 characters"
                                            required
                                            style={{ paddingRight: 'var(--space-10)' }}
                                        />
                                        <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                                            style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                            {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Repeat new password"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {!showPassSection && (
                        <p className="text-sm text-muted">Your password was last changed when you created your account. Click "Change Password" to update it.</p>
                    )}
                </div>

                {/* Save Button */}
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={saving}
                    style={{ minWidth: '200px' }}
                >
                    {saving ? (
                        <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                    ) : (
                        <><Save size={18} /> Save Changes</>
                    )}
                </button>
            </form>
        </div>
    );
}
