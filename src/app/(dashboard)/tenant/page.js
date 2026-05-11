'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, FileText, Wrench } from 'lucide-react';
import styles from './dashboard.module.css';

export default function TenantDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({ activeRentals: 0, escrowBalance: 0, savedListings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/tenant/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch stats', err);
            } finally {
                setLoading(false);
            }
        };
        if (session) fetchStats();
    }, [session]);

    return (
        <div className="fade-in">
            <div className={styles.welcomeSection}>
                <h2>Welcome back, {session?.user?.firstName || 'there'}!</h2>
                <p className="text-muted">Find your next home in Ilorin</p>
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
                                To unlock all features and ensure community safety, please complete your NIN verification.
                            </p>
                            <a href="/tenant/profile" className="btn btn-sm" style={{ background: 'var(--color-error)', color: 'white', border: 'none' }}>
                                Verify Now
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <a href="/tenant/search" className={styles.actionCard}>
                    <span className={styles.actionIcon}><Search size={24} /></span>
                    <div>
                        <h4>Find Apartments</h4>
                        <p>Browse verified listings in Tanke, Basin & Malete</p>
                    </div>
                </a>
                <a href="/tenant/rentals" className={styles.actionCard}>
                    <span className={styles.actionIcon}><FileText size={24} /></span>
                    <div>
                        <h4>My Rentals</h4>
                        <p>Track your rental status and payments</p>
                    </div>
                </a>
                <a href="/tenant/maintenance" className={styles.actionCard}>
                    <span className={styles.actionIcon}><Wrench size={24} /></span>
                    <div>
                        <h4>Maintenance</h4>
                        <p>Submit and track repair requests</p>
                    </div>
                </a>
            </div>

            {/* Stats Cards */}
            <div className={`grid grid-3 ${styles.statsGrid}`}>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Active Rentals</span>
                    <div className={styles.statValue}>{loading ? '...' : stats.activeRentals}</div>
                    <span className="text-xs text-muted">Current leases</span>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Escrow Balance</span>
                    <div className={styles.statValue}>{loading ? '...' : `₦${Number(stats.escrowBalance).toLocaleString()}`}</div>
                    <span className="text-xs text-muted">Funds being held</span>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <span className="text-muted text-sm">Saved Listings</span>
                    <div className={styles.statValue}>{loading ? '...' : stats.savedListings}</div>
                    <span className="text-xs text-muted">Comparison shortlist</span>
                </div>
            </div>
        </div>
    );
}
