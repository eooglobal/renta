'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, ClipboardList, DollarSign } from 'lucide-react';
import styles from '../tenant/dashboard.module.css';

export default function ScoutDashboard() {
    const { data: session } = useSession();

    return (
        <div className="fade-in">
            <div className={styles.welcomeSection}>
                <h2>Scout Dashboard</h2>
                <p className="text-muted">Welcome, {session?.user?.firstName}! Help landlords list on Renta and earn 3% commission.</p>
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
                                To submit leads, please complete your National Identity Number (NIN) verification.
                            </p>
                            <Link href="/profile" className="btn btn-sm" style={{ background: 'var(--color-error)', color: 'white', border: 'none' }}>
                                Verify Now
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.quickActions}>
                <Link href="/scout/leads/new" className={styles.actionCard}>
                    <span className={styles.actionIcon}><Plus size={24} /></span>
                    <div>
                        <h4>Submit New Lead</h4>
                        <p>Add a new property and landlord info</p>
                    </div>
                </Link>
                <Link href="/scout/leads" className={styles.actionCard}>
                    <span className={styles.actionIcon}><ClipboardList size={24} /></span>
                    <div>
                        <h4>My Leads</h4>
                        <p>Track verification status of your leads</p>
                    </div>
                </Link>
                <Link href="/scout/earnings" className={styles.actionCard}>
                    <span className={styles.actionIcon}><DollarSign size={24} /></span>
                    <div>
                        <h4>Earnings</h4>
                        <p>View your commission history</p>
                    </div>
                </Link>
            </div>

            <div className={`grid grid-3 ${styles.statsGrid}`}>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Leads Submitted</span>
                    <div className={styles.statValue}>0</div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Verified Properties</span>
                    <div className={styles.statValue}>0</div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Total Earnings</span>
                    <div className={styles.statValue}>₦0</div>
                </div>
            </div>
        </div>
    );
}
