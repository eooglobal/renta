"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Building, DollarSign, Home, CheckCircle2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import styles from "../tenant/dashboard.module.css";

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isPromoted = searchParams.get("promoted") === "true";
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    monthlyIncome: 0,
    pendingVerification: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/landlord/stats");
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch landlord stats", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchStats();
  }, [session]);

  return (
    <div className="fade-in">
      {isPromoted && (
        <div
          className="dashboard-alert dashboard-alert-success mb-6"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-success" size={24} />
            <div>
              <h4 className="font-bold text-success">Payment Successful!</h4>
              <p className="text-sm text-muted">
                Your listing has been promoted and will appear at the top of
                search results.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.welcomeSection}>
        <h2>Welcome, {session?.user?.firstName || "Landlord"}!</h2>
        <p className="text-muted">Manage your properties and tenants</p>
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
                To list your properties, please complete your National Identity
                Number (NIN) verification.
              </p>
              <Link
                href="/landlord/profile"
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

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link href="/landlord/properties/new" className={styles.actionCard}>
          <span className={styles.actionIcon}>
            <Plus size={24} />
          </span>
          <div>
            <h4>Add New Property</h4>
            <p>List a new apartment for rent</p>
          </div>
        </Link>
        <Link href="/landlord/properties" className={styles.actionCard}>
          <span className={styles.actionIcon}>
            <Building size={24} />
          </span>
          <div>
            <h4>My Properties</h4>
            <p>View and manage your listings</p>
          </div>
        </Link>
        <Link href="/landlord/payments" className={styles.actionCard}>
          <span className={styles.actionIcon}>
            <DollarSign size={24} />
          </span>
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
          <div className={styles.statValue}>
            {loading ? "..." : stats.totalProperties}
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <span className="text-muted text-sm">Active Tenants</span>
          <div className={styles.statValue}>
            {loading ? "..." : stats.activeTenants}
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <span className="text-muted text-sm">Monthly Income</span>
          <div className={styles.statValue}>
            {loading
              ? "..."
              : `₦${Number(stats.monthlyIncome).toLocaleString()}`}
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <span className="text-muted text-sm">Pending Verification</span>
          <div className={styles.statValue}>
            {loading ? "..." : stats.pendingVerification}
          </div>
        </div>
      </div>

      {/* Recent Properties */}
      <div className={styles.propertiesHeader}>
        <h3>Your Properties</h3>
        <Link
          href="/landlord/properties/new"
          className="btn btn-primary btn-sm"
        >
          + Add Property
        </Link>
      </div>

      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <Home size={48} />
        </div>
        <h3>No properties yet</h3>
        <p>
          Start by adding your first property. It will be verified by our team
          before going live.
        </p>
        <Link href="/landlord/properties/new" className="btn btn-primary">
          Add Your First Property
        </Link>
      </div>
    </div>
  );
}

export default function LandlordDashboard() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse flex items-center justify-center p-20">
          Loading dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
