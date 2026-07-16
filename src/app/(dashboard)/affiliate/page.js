"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Link as LinkIcon, DollarSign } from "lucide-react";
import styles from "../tenant/dashboard.module.css";

export default function AffiliateDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalClicks: 0,
    conversions: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/affiliate/stats");
        const data = await res.json();
        if (res.ok) setStats(data);
      } catch (error) {
        console.error("Failed to fetch affiliate stats", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchStats();
  }, [session]);

  return (
    <div className="fade-in">
      <div className={styles.welcomeSection}>
        <h2>Affiliate Dashboard</h2>
        <p className="text-muted">
          Welcome, {session?.user?.firstName}! Share listings and earn 2%
          commission on successful rentals.
        </p>
      </div>

      {/* Verification Alert Banner */}
      {session?.user?.ninStatus !== "VERIFIED" && (
        <div
          className="dashboard-alert dashboard-alert-error mb-6"
        >
          <div className="flex items-start gap-3">
            <div style={{ color: "var(--color-error)", marginTop: "2px" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "var(--color-error)",
                  margin: "0 0 4px 0",
                }}
              >
                Action Required: Verify Your Identity
              </h4>
              <p
                style={{
                  fontSize: "14px",
                  margin: "0 0 12px 0",
                  color: "var(--text-color)",
                }}
              >
                To start earning commissions, please complete your National
                Didit identity verification.
              </p>
              <Link
                href="/affiliate/profile"
                className="btn btn-sm"
                style={{
                  background: "var(--color-error)",
                  color: "white",
                  border: "none",
                }}
              >
                Verify Now
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={styles.quickActions}>
        <Link href="/affiliate/links" className={styles.actionCard}>
          <span className={styles.actionIcon}>
            <LinkIcon size={24} />
          </span>
          <div>
            <h4>Referral Links</h4>
            <p>Get your unique referral links to share</p>
          </div>
        </Link>
        <Link href="/affiliate/earnings" className={styles.actionCard}>
          <span className={styles.actionIcon}>
            <DollarSign size={24} />
          </span>
          <div>
            <h4>Earnings</h4>
            <p>View your commission and withdraw</p>
          </div>
        </Link>
      </div>

      <div className={`grid grid-3 ${styles.statsGrid}`}>
        <div className={`card ${styles.statCard}`}>
          <span className="text-muted text-sm">Total Clicks</span>
          <div className={styles.statValue}>
            {loading ? "..." : stats.totalClicks}
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <span className="text-muted text-sm">Conversions</span>
          <div className={styles.statValue}>
            {loading ? "..." : stats.conversions}
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <span className="text-muted text-sm">Total Earnings</span>
          <div className={styles.statValue}>
            {loading
              ? "..."
              : `₦${Number(stats.totalEarnings).toLocaleString()}`}
          </div>
        </div>
      </div>
    </div>
  );
}
