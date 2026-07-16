"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Calendar,
  ExternalLink,
  AlertCircle,
  Search,
  Loader2,
  Home,
  Mail,
} from "lucide-react";
import Link from "next/link";

const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(date));

export default function AdminPromotionsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [promotionSettings, setPromotionSettings] = useState({
    promotionPrice: 5000,
    promotionDurationDays: 7,
  });

  const fetchPromotions = async () => {
    try {
      const res = await fetch("/api/admin/promotions");
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
        setPromotionSettings(
          data.settings || { promotionPrice: 5000, promotionDurationDays: 7 },
        );
      }
    } catch (err) {
      console.error("Failed to fetch promotions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const toggleFeature = async (propertyId, currentState) => {
    setActionLoading(propertyId);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          isFeatured: !currentState,
          days: promotionSettings.promotionDurationDays,
        }),
      });

      if (res.ok) await fetchPromotions();
    } catch (err) {
      console.error("Failed to toggle feature status", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      property.title?.toLowerCase().includes(query) ||
      property.landlord?.email?.toLowerCase().includes(query) ||
      property.landlord?.firstName?.toLowerCase().includes(query) ||
      property.landlord?.lastName?.toLowerCase().includes(query)
    );
  });

  const featuredCount = properties.filter((property) => property.isFeatured).length;

  return (
    <div className="fade-in dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Promotion Management</h1>
          <p>Manage featured listings and boost property visibility.</p>
        </div>
        <div className="dashboard-panel dashboard-surface-muted" style={{ minWidth: 220 }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted font-bold" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Active Featured
              </p>
              <h3 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>{featuredCount}</h3>
            </div>
            <span className="icon-chip">
              <Star size={20} fill="currentColor" />
            </span>
          </div>
        </div>
      </header>

      <div className="dashboard-grid mb-6">
        <div className="dashboard-panel dashboard-span-4 dashboard-surface-muted">
          <p className="text-sm text-muted">Promotion Price</p>
          <h3 style={{ fontSize: "var(--text-xl)", margin: 0 }}>
            {formatMoney(promotionSettings.promotionPrice)}
          </h3>
        </div>
        <div className="dashboard-panel dashboard-span-4 dashboard-surface-muted">
          <p className="text-sm text-muted">Promotion Duration</p>
          <h3 style={{ fontSize: "var(--text-xl)", margin: 0 }}>
            {promotionSettings.promotionDurationDays} days
          </h3>
        </div>
        <div className="dashboard-panel dashboard-span-4 dashboard-surface-muted">
          <p className="text-sm text-muted">Visible Candidates</p>
          <h3 style={{ fontSize: "var(--text-xl)", margin: 0 }}>{filteredProperties.length}</h3>
        </div>
      </div>

      <div className="dashboard-surface mb-6" style={{ padding: "var(--space-4)" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "var(--space-4)",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search properties, landlords, or emails..."
            className="form-input"
            style={{ paddingLeft: "var(--space-10)" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="operation-list">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="dashboard-surface" style={{ minHeight: 132 }}>
              <div className="flex items-center gap-4 text-muted">
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Loading promotion candidates...
              </div>
            </div>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="dashboard-surface text-center" style={{ padding: "var(--space-12)" }}>
          <AlertCircle size={44} style={{ color: "var(--text-light)", margin: "0 auto var(--space-4)" }} />
          <h3 style={{ fontSize: "var(--text-lg)" }}>No properties found</h3>
          <p className="text-sm text-muted">Search for verified properties to promote them.</p>
        </div>
      ) : (
        <div className="operation-list">
          {filteredProperties.map((property) => {
            const isBusy = actionLoading === property.id;
            const landlordName = [property.landlord?.firstName, property.landlord?.lastName]
              .filter(Boolean)
              .join(" ");

            return (
              <article key={property.id} className="dashboard-surface" style={{ padding: "var(--space-4)" }}>
                <div className="promotion-row">
                  <div className="promotion-media">
                    {property.images?.[0]?.url ? (
                      <img src={property.images[0].url} alt={property.title || "Property"} />
                    ) : (
                      <div className="promotion-media-empty">
                        <Home size={22} />
                        <span>No image</span>
                      </div>
                    )}
                    {property.isFeatured && (
                      <span className="promotion-featured-badge">
                        <Star size={12} fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>

                  <div className="promotion-content">
                    <div className="flex justify-between items-start gap-3" style={{ flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-1)" }}>
                          {property.title || "Untitled property"}
                        </h3>
                        <div className="operation-meta">
                          <span className="flex items-center gap-1">
                            <Mail size={12} /> {property.landlord?.email || "No email"}
                          </span>
                          {landlordName && <span>{landlordName}</span>}
                          {property.featuredUntil && property.isFeatured && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> Expires {formatDate(property.featuredUntil)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/listing/${property.id}`}
                        target="_blank"
                        className="btn btn-sm btn-outline"
                        aria-label={`Open ${property.title || "property"} listing`}
                      >
                        <ExternalLink size={14} /> View
                      </Link>
                    </div>

                    <div className="promotion-footer">
                      <span className={`badge ${property.isFeatured ? "badge-verified" : "badge-pending"}`}>
                        {property.isFeatured ? "Featured" : "Available to promote"}
                      </span>
                      <button
                        onClick={() => toggleFeature(property.id, property.isFeatured)}
                        disabled={isBusy}
                        className={`btn ${property.isFeatured ? "btn-outline" : "btn-primary"}`}
                      >
                        {isBusy ? (
                          <>
                            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                            Updating...
                          </>
                        ) : property.isFeatured ? (
                          "Remove Feature"
                        ) : (
                          "Promote Now"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .promotion-row {
          display: grid;
          grid-template-columns: 178px minmax(0, 1fr);
          gap: var(--space-5);
          align-items: stretch;
        }

        .promotion-media {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
        }

        .promotion-media img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .promotion-media-empty {
          height: 100%;
          display: grid;
          place-items: center;
          align-content: center;
          gap: var(--space-2);
          color: var(--text-muted);
          font-size: var(--text-xs);
        }

        .promotion-featured-badge {
          position: absolute;
          top: var(--space-2);
          left: var(--space-2);
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          border-radius: var(--radius-full);
          background: var(--color-primary);
          color: var(--color-black);
          font-size: var(--text-xs);
          font-weight: var(--font-bold);
          padding: 4px 8px;
          box-shadow: var(--shadow-sm);
        }

        .promotion-content {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: var(--space-4);
        }

        .promotion-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        @media (max-width: 720px) {
          .promotion-row {
            grid-template-columns: 1fr;
          }

          .promotion-media {
            max-height: 230px;
          }
        }
      `}</style>
    </div>
  );
}
