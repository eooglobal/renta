'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AffiliateDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalClicks: 0,
    conversions: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  const [kycRequired, setKycRequired] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/affiliate/stats');
        const data = await res.json();
        if (res.ok) setStats(data);
      } catch (error) {
        console.error('Failed to fetch affiliate stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setKycRequired(data.kycRequired !== false);
        }
      } catch {}
    };

    if (session) {
      fetchStats();
      fetchProfile();
    }
  }, [session]);

  return (
    <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
          Affiliate Dashboard
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          Welcome back, {session?.user?.firstName || 'Affiliate'}! Share property links and earn 2% lifetime commission.
        </p>
      </div>

      {/* Verification Alert Banner */}
      {kycRequired === true && session?.user?.ninStatus !== 'VERIFIED' && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#92400E', margin: '0 0 2px 0' }}>
              Action Required: Identity Verification
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#B45309', margin: 0 }}>
              Complete identity verification to unlock full commission payouts to your bank account.
            </p>
          </div>
          <Link
            href="/affiliate/profile"
            className="btn btn-sm"
            style={{
              background: '#D97706',
              color: '#fff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: '600',
              padding: '6px 14px'
            }}
          >
            Verify Identity
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Total Clicks
          </span>
          <span style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {loading ? '...' : stats.totalClicks}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Referred Conversions
          </span>
          <span style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-main)' }}>
            {loading ? '...' : stats.conversions}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Total Earnings
          </span>
          <span style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            {loading ? '...' : `₦${Number(stats.totalEarnings).toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Quick Actions Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        <Link
          href="/affiliate/links"
          className="card"
          style={{
            padding: '20px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'border-color 0.2s',
            border: '1px solid var(--border-color)'
          }}
        >
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            Referral Links
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Generate tracking links for specific listings or landing pages.
          </p>
        </Link>

        <Link
          href="/affiliate/earnings"
          className="card"
          style={{
            padding: '20px',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'border-color 0.2s',
            border: '1px solid var(--border-color)'
          }}
        >
          <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            Earnings & Wallet
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            View commission history and initiate bank account withdrawals.
          </p>
        </Link>
      </div>

    </div>
  );
}
