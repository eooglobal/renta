'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Building, DollarSign, Home } from 'lucide-react';
import styles from '../tenant/dashboard.module.css';

export default function LandlordDashboard() {
    const { data: session } = useSession();

    return (
        <div className="fade-in">
            <div className={styles.welcomeSection}>
                <h2>Welcome, {session?.user?.firstName || 'Landlord'}!</h2>
                <p className="text-muted">Manage your properties and tenants</p>
            </div>

            {/* Verification Alert Banner */}
            {session?.user?.ninStatus !== 'VERIFIED' && (
                <div className="card mb-6" style={{ background: 'var(--color-error-light)', borderLeft: '4px solid var(--color-error)' }}>
                    <div className="flex items-start gap-3">
                        <div style={{ color: 'var(--color-error)', marginTop: '2px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-error)', margin: '0 0 4px 0' }}>Action Required: Verify Your Identity</h4>
                            <p style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--text-color)' }}>
                                To list your properties, please complete your National Identity Number (NIN) verification.
                            </p>
                            <Link href="/profile" className="btn btn-sm" style={{ background: 'var(--color-error)', color: 'white', border: 'none' }}>
                                Verify Now
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <Link href="/landlord/properties/new" className={styles.actionCard}>
                    <span className={styles.actionIcon}><Plus size={24} /></span>
                    <div>
                        <h4>Add New Property</h4>
                        <p>List a new apartment for rent</p>
                    </div>
                </Link>
                <Link href="/landlord/properties" className={styles.actionCard}>
                    <span className={styles.actionIcon}><Building size={24} /></span>
                    <div>
                        <h4>My Properties</h4>
                        <p>View and manage your listings</p>
                    </div>
                </Link>
                <Link href="/landlord/payments" className={styles.actionCard}>
                    <span className={styles.actionIcon}><DollarSign size={24} /></span>
                    <div>
                        <h4>Payments</h4>
                        <p>Track rent payments and payouts</p>
                    </div>
                </Link>
            </div>

            {/* Stats */}
            <div className={`grid grid-4 ${styles.statsGrid}`}>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Total Properties</span>
                    <div className={styles.statValue}>0</div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Active Tenants</span>
                    <div className={styles.statValue}>0</div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Monthly Income</span>
                    <div className={styles.statValue}>₦0</div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Pending Verification</span>
                    <div className={styles.statValue}>0</div>
                </div>
            </div>

            {/* Recent Properties */}
            <div className={styles.propertiesHeader}>
                <h3>Your Properties</h3>
                <Link href="/landlord/properties/new" className="btn btn-primary btn-sm">
                    + Add Property
                </Link>
            </div>

            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><Home size={48} /></div>
                <h3>No properties yet</h3>
                <p>Start by adding your first property. It will be verified by our team before going live.</p>
                <Link href="/landlord/properties/new" className="btn btn-primary">
                    Add Your First Property
                </Link>
            </div>
        </div>
    );
}
