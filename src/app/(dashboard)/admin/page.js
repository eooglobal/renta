'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Users, Building, Shield, AlertTriangle, ClipboardList } from 'lucide-react';
import styles from '../tenant/dashboard.module.css';

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        activeListings: 0,
        escrowHeld: 0,
        platformRevenue: 0,
        pendingProperties: 0,
        pendingWithdrawals: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/admin/metrics');
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data.metrics);
                }
            } catch (error) {
                console.error('Failed to load admin metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    return (
        <div className="fade-in">
            <div className={styles.welcomeSection}>
                <h2>Admin Dashboard</h2>
                <p className="text-muted">
                    Welcome, {session?.user?.firstName}
                    {session?.user?.adminRole && (
                        <span className="badge badge-info ml-2" style={{ marginLeft: '8px' }}>
                            {session.user.adminRole.replace('_', ' ')}
                        </span>
                    )}
                </p>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                {(!session?.user?.adminRole || session.user.adminRole === 'SUPER_ADMIN' || session.user.adminRole === 'SUPPORT') && (
                    <Link href="/admin/users" className={styles.actionCard}>
                        <span className={styles.actionIcon}><Users size={24} /></span>
                        <div>
                            <h4>User Management</h4>
                            <p>Verify and manage user accounts</p>
                        </div>
                    </Link>
                )}
                {(!session?.user?.adminRole || session.user.adminRole === 'SUPER_ADMIN' || session.user.adminRole === 'VERIFICATION_OFFICER') && (
                    <Link href="/admin/leads" className={styles.actionCard}>
                        <span className={styles.actionIcon}><ClipboardList size={24} /></span>
                        <div>
                            <h4>Scout Leads</h4>
                            <p>Review and verify property leads</p>
                        </div>
                    </Link>
                )}
                {(!session?.user?.adminRole || session.user.adminRole === 'SUPER_ADMIN' || session.user.adminRole === 'VERIFICATION_OFFICER') && (
                    <Link href="/admin/properties" className={styles.actionCard}>
                        <span className={styles.actionIcon}><Building size={24} /></span>
                        <div>
                            <h4>Property Verification</h4>
                            <p>Review and verify property listings</p>
                        </div>
                    </Link>
                )}
                {(!session?.user?.adminRole || session.user.adminRole === 'SUPER_ADMIN') && (
                    <Link href="/admin/escrow" className={styles.actionCard}>
                        <span className={styles.actionIcon}><Shield size={24} /></span>
                        <div>
                            <h4>Escrow Management</h4>
                            <p>Monitor and manage escrow payments</p>
                        </div>
                    </Link>
                )}
                {(!session?.user?.adminRole || session.user.adminRole === 'SUPER_ADMIN' || session.user.adminRole === 'SUPPORT' || session.user.adminRole === 'VERIFICATION_OFFICER') && (
                    <Link href="/admin/disputes" className={styles.actionCard}>
                        <span className={styles.actionIcon}><AlertTriangle size={24} /></span>
                        <div>
                            <h4>Disputes</h4>
                            <p>Handle tenant/landlord disputes</p>
                        </div>
                    </Link>
                )}
            </div>

            {/* Stats */}
            <div className={`grid grid-4 ${styles.statsGrid}`}>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Total Users</span>
                    <div className={styles.statValue}>
                        {loading ? <span className="spinner" style={{ width: 24, height: 24, margin: '8px 0' }}></span> : metrics.totalUsers}
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Active Listings</span>
                    <div className={styles.statValue}>
                        {loading ? <span className="spinner" style={{ width: 24, height: 24, margin: '8px 0' }}></span> : metrics.activeListings}
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Escrow Held</span>
                    <div className={styles.statValue}>
                        {loading ? <span className="spinner" style={{ width: 24, height: 24, margin: '8px 0' }}></span> : `₦${metrics.escrowHeld.toLocaleString()}`}
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Platform Revenue</span>
                    <div className={styles.statValue}>
                        {loading ? <span className="spinner" style={{ width: 24, height: 24, margin: '8px 0' }}></span> : `₦${metrics.platformRevenue.toLocaleString()}`}
                    </div>
                </div>
            </div>

            {/* Pending Actions */}
            <div className="card">
                <h4 style={{ marginBottom: 'var(--space-4)' }}>Attention Required</h4>
                {loading ? (
                    <div className="flex justify-center" style={{ padding: 'var(--space-4) 0' }}><span className="spinner"></span></div>
                ) : (metrics.pendingProperties === 0 && metrics.pendingWithdrawals === 0) ? (
                    <div className={styles.emptyState} style={{ padding: 'var(--space-6) 0' }}>
                        <p>No pending actions at this time. All caught up!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {metrics.pendingProperties > 0 && (!session?.user?.adminRole || session.user.adminRole === 'SUPER_ADMIN' || session.user.adminRole === 'VERIFICATION_OFFICER') && (
                            <Link href="/admin/properties" className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Building size={20} className="text-yellow-600" />
                                    <div>
                                        <h5 className="font-medium text-yellow-800 m-0">Properties Awaiting Verification</h5>
                                        <p className="text-sm text-yellow-700 m-0">Review newly uploaded properties.</p>
                                    </div>
                                </div>
                                <span className="badge badge-warning">{metrics.pendingProperties} pending</span>
                            </Link>
                        )}
                        {/* We should ideally have a separate metric for scout leads, but for now we'll add the link */}
                        {(!session?.user?.adminRole || session.user.adminRole === 'SUPER_ADMIN' || session.user.adminRole === 'VERIFICATION_OFFICER') && (
                            <Link href="/admin/leads" className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <ClipboardList size={20} className="text-purple-600" />
                                    <div>
                                        <h5 className="font-medium text-purple-800 m-0">New Scout Leads</h5>
                                        <p className="text-sm text-purple-700 m-0">Review submitted leads and contact landlords.</p>
                                    </div>
                                </div>
                                <span className="badge" style={{ background: 'var(--color-primary)', color: 'var(--color-black)' }}>Action Required</span>
                            </Link>
                        )}
                        {metrics.pendingWithdrawals > 0 && (!session?.user?.adminRole || session.user.adminRole === 'SUPER_ADMIN' || session.user.adminRole === 'SUPPORT') && (
                            <Link href="/admin/escrow" className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Shield size={20} className="text-blue-600" />
                                    <div>
                                        <h5 className="font-medium text-blue-800 m-0">Withdrawal Requests</h5>
                                        <p className="text-sm text-blue-700 m-0">Process landlord and affiliate payouts.</p>
                                    </div>
                                </div>
                                <span className="badge badge-info">{metrics.pendingWithdrawals} pending</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
