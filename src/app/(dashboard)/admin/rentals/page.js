"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  Building,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

const FILTERS = ["", "PENDING", "ACTIVE", "COMPLETED", "DISPUTED", "CANCELLED"];
const NAIRA = "\u20A6";

const statusConfig = {
  PENDING: { label: "Pending", badge: "badge-pending" },
  ACTIVE: { label: "Active", badge: "badge-verified" },
  COMPLETED: { label: "Completed", badge: "badge-info" },
  DISPUTED: { label: "Disputed", badge: "badge-error" },
  CANCELLED: { label: "Cancelled", badge: "badge-error" },
};

const formatMoney = (value) => `${NAIRA}${Number(value || 0).toLocaleString()}`;

const formatDate = (value, options = { day: "2-digit", month: "short", year: "numeric" }) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", options).format(new Date(value));
};

const getName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unnamed user";

const getLocation = (property) =>
  [property?.area?.name || property?.area, property?.city?.name || property?.city]
    .filter(Boolean)
    .join(", ") || "No location";

function DetailItem({ label, value, icon }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{icon}{label}</span>
      <span className="detail-value">{value || "Not provided"}</span>
    </div>
  );
}

function PersonBlock({ title, person, icon }) {
  return (
    <section className="drawer-section">
      <h4>{icon}{title}</h4>
      <DetailItem label="Name" value={getName(person)} />
      <DetailItem label="Email" value={person?.email} icon={<Mail size={13} />} />
      <DetailItem label="Phone" value={person?.phone} icon={<Phone size={13} />} />
    </section>
  );
}

function RentalDrawer({ rental, onClose }) {
  if (!rental) return null;

  const property = rental.property || {};
  const landlord = property.landlord || {};
  const status = statusConfig[rental.status] || { label: rental.status, badge: "badge-pending" };

  return (
    <div className="rental-drawer-overlay" onClick={onClose}>
      <aside className="rental-drawer" onClick={(event) => event.stopPropagation()} aria-label="Rental details">
        <div className="drawer-header">
          <div>
            <span className={`badge ${status.badge}`}>{status.label}</span>
            <h2>{property.title || "Rental details"}</h2>
            <p>{getLocation(property)}</p>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close rental details">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          <section className="drawer-section drawer-highlight">
            <h4><Banknote size={16} />Payment Summary</h4>
            <div className="money-grid">
              <DetailItem label="Total Paid" value={formatMoney(rental.totalPaid)} />
              <DetailItem label="Rent Amount" value={formatMoney(rental.rentAmount)} />
              <DetailItem label="Service Fee" value={formatMoney(rental.serviceFee)} />
              <DetailItem label="Payment Mode" value={rental.paymentMode || "Not recorded"} />
            </div>
          </section>

          <section className="drawer-section">
            <h4><Calendar size={16} />Rental Window</h4>
            <div className="detail-grid">
              <DetailItem label="Starts" value={formatDate(rental.startDate)} />
              <DetailItem label="Ends" value={formatDate(rental.endDate)} />
              <DetailItem label="Created" value={formatDate(rental.createdAt)} />
              <DetailItem label="Updated" value={formatDate(rental.updatedAt)} />
            </div>
          </section>

          <PersonBlock title="Tenant" person={rental.tenant} icon={<User size={16} />} />
          <PersonBlock title="Landlord" person={landlord} icon={<Building size={16} />} />

          <section className="drawer-section">
            <h4><Building size={16} />Property</h4>
            <div className="detail-grid">
              <DetailItem label="Type" value={property.type} />
              <DetailItem label="Property Status" value={property.status} />
              <DetailItem label="Annual Rent" value={formatMoney(property.rentPrice)} />
              <DetailItem label="Address" value={property.address} icon={<MapPin size={13} />} />
            </div>
          </section>

          {(rental.escrow || rental.disputeReason || rental.disputeResolutionNote) && (
            <section className="drawer-section">
              <h4><ShieldCheck size={16} />Risk & Resolution</h4>
              <div className="detail-grid">
                {rental.escrow && <DetailItem label="Escrow Status" value={rental.escrow.status} />}
                {rental.disputedAt && <DetailItem label="Disputed" value={formatDate(rental.disputedAt)} />}
                {rental.disputeResolvedAt && <DetailItem label="Resolved" value={formatDate(rental.disputeResolvedAt)} />}
              </div>
              {rental.disputeReason && <p className="drawer-note"><strong>Reason:</strong> {rental.disputeReason}</p>}
              {rental.disputeResolutionNote && <p className="drawer-note"><strong>Resolution:</strong> {rental.disputeResolutionNote}</p>}
            </section>
          )}
        </div>

        <div className="drawer-actions">
          <Link href={`/listing/${property.id}`} target="_blank" className="btn btn-outline btn-sm">
            <ExternalLink size={14} /> Open Listing
          </Link>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
        </div>
      </aside>
    </div>
  );
}

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedRental, setSelectedRental] = useState(null);

  useEffect(() => {
    const fetchRentals = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter) params.set("status", filter);
        const res = await fetch(`/api/admin/rentals?${params}`);
        const data = await res.json();
        setRentals(data.rentals || []);
      } catch (error) {
        console.error("Failed to load rentals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRentals();
  }, [filter]);

  useEffect(() => {
    if (!selectedRental) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedRental(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRental]);

  const metrics = useMemo(() => ({
    total: rentals.length,
    pending: rentals.filter((rental) => rental.status === "PENDING").length,
    active: rentals.filter((rental) => rental.status === "ACTIVE").length,
    disputed: rentals.filter((rental) => rental.status === "DISPUTED").length,
  }), [rentals]);

  return (
    <div className="fade-in dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Rental Management</h1>
          <p>Monitor leases, payments, rental parties, and dispute signals.</p>
        </div>
      </header>

      <div className="dashboard-grid mb-6">
        <div className="dashboard-panel dashboard-span-3 dashboard-surface-muted">
          <p className="text-sm text-muted">Visible Rentals</p>
          <h3>{metrics.total}</h3>
        </div>
        <div className="dashboard-panel dashboard-span-3 dashboard-surface-muted">
          <p className="text-sm text-muted">Pending</p>
          <h3>{metrics.pending}</h3>
        </div>
        <div className="dashboard-panel dashboard-span-3 dashboard-surface-muted">
          <p className="text-sm text-muted">Active</p>
          <h3>{metrics.active}</h3>
        </div>
        <div className="dashboard-panel dashboard-span-3 dashboard-surface-muted">
          <p className="text-sm text-muted">Disputed</p>
          <h3>{metrics.disputed}</h3>
        </div>
      </div>

      <div className="rental-filter-bar dashboard-surface mb-6">
        {FILTERS.map((status) => (
          <button
            key={status || "ALL"}
            type="button"
            onClick={() => setFilter(status)}
            className={`btn btn-sm ${filter === status ? "btn-primary" : "btn-outline"}`}
          >
            {status || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="operation-list">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="dashboard-surface rental-loading-row">
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              Loading rentals...
            </div>
          ))}
        </div>
      ) : rentals.length === 0 ? (
        <div className="dashboard-surface text-center" style={{ padding: "var(--space-12)" }}>
          <AlertCircle size={44} style={{ color: "var(--text-light)", margin: "0 auto var(--space-4)" }} />
          <h3 style={{ fontSize: "var(--text-lg)" }}>No rentals found</h3>
          <p className="text-sm text-muted">Try another rental status filter.</p>
        </div>
      ) : (
        <div className="operation-list">
          {rentals.map((rental) => {
            const property = rental.property || {};
            const tenantName = getName(rental.tenant);
            const landlordName = getName(property.landlord);
            const status = statusConfig[rental.status] || { label: rental.status, badge: "badge-pending" };

            return (
              <article
                key={rental.id}
                className="dashboard-surface rental-row"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRental(rental)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedRental(rental);
                }}
              >
                <div className="rental-row-main">
                  <span className="rental-icon"><FileText size={18} /></span>
                  <div style={{ minWidth: 0 }}>
                    <h3>{property.title || "Untitled property"}</h3>
                    <p className="operation-meta">
                      <span><MapPin size={12} /> {getLocation(property)}</span>
                      <span><User size={12} /> {tenantName}</span>
                      <span><Building size={12} /> {landlordName}</span>
                    </p>
                  </div>
                </div>

                <div className="rental-row-meta">
                  <div>
                    <span className="meta-label">Amount</span>
                    <strong>{formatMoney(rental.totalPaid)}</strong>
                  </div>
                  <div>
                    <span className="meta-label">Duration</span>
                    <strong>{formatDate(rental.startDate, { day: "2-digit", month: "short" })} - {formatDate(rental.endDate, { day: "2-digit", month: "short" })}</strong>
                  </div>
                  <span className={`badge ${status.badge}`}>{status.label}</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedRental(rental);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <RentalDrawer rental={selectedRental} onClose={() => setSelectedRental(null)} />

      <style jsx>{`
        .rental-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          padding: var(--space-4);
        }

        .rental-loading-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          min-height: 92px;
          color: var(--text-muted);
        }

        .rental-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: var(--space-5);
          align-items: center;
          padding: var(--space-4);
          cursor: pointer;
          transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
        }

        .rental-row:hover,
        .rental-row:focus-visible {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
          outline: none;
        }

        .rental-row-main {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          min-width: 0;
        }

        .rental-row-main h3 {
          font-size: var(--text-lg);
          margin: 0 0 var(--space-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rental-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          color: var(--color-primary);
          flex: 0 0 auto;
        }

        .rental-row-meta {
          display: grid;
          grid-template-columns: minmax(110px, auto) minmax(130px, auto) auto auto;
          align-items: center;
          gap: var(--space-4);
        }

        .meta-label {
          display: block;
          color: var(--text-muted);
          font-size: var(--text-xs);
          margin-bottom: 2px;
        }

        .rental-drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.42);
          display: flex;
          justify-content: flex-end;
        }

        .rental-drawer {
          width: min(560px, 100%);
          height: 100vh;
          background: var(--bg-primary);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-6);
          border-bottom: 1px solid var(--border-light);
        }

        .drawer-header h2 {
          font-size: var(--text-2xl);
          margin: var(--space-3) 0 var(--space-1);
        }

        .drawer-header p {
          color: var(--text-muted);
          margin: 0;
        }

        .drawer-close {
          width: 40px;
          height: 40px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .drawer-body {
          flex: 1;
          overflow: auto;
          padding: var(--space-5);
          display: grid;
          gap: var(--space-4);
        }

        .drawer-section {
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          background: var(--bg-primary);
        }

        .drawer-highlight {
          background: var(--bg-secondary);
        }

        .drawer-section h4 {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-base);
          margin: 0 0 var(--space-4);
        }

        .detail-grid,
        .money-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .detail-item {
          min-width: 0;
        }

        .detail-label {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          color: var(--text-muted);
          font-size: var(--text-xs);
          margin-bottom: 3px;
        }

        .detail-value {
          display: block;
          font-weight: var(--font-semibold);
          word-break: break-word;
        }

        .drawer-note {
          margin: var(--space-3) 0 0;
          color: var(--text-secondary);
          line-height: 1.55;
        }

        .drawer-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-5);
          border-top: 1px solid var(--border-light);
          background: var(--bg-primary);
        }

        @media (max-width: 920px) {
          .rental-row {
            grid-template-columns: 1fr;
          }

          .rental-row-meta {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .rental-row-main {
            align-items: flex-start;
          }

          .rental-row-main h3 {
            white-space: normal;
          }

          .rental-row-meta,
          .detail-grid,
          .money-grid {
            grid-template-columns: 1fr;
          }

          .rental-drawer {
            width: 100%;
          }

          .drawer-header,
          .drawer-body {
            padding: var(--space-4);
          }
        }
      `}</style>
    </div>
  );
}
