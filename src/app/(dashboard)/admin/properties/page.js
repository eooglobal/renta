"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Check, X, AlertCircle, Send } from "lucide-react";
import styles from "../../tenant/dashboard.module.css";

const statusLabel = (status) => {
  const map = {
    PENDING: "Pending",
    VERIFIED: "Available",
    RENTED: "Rented",
    INACTIVE: "Frozen",
  };
  return map[status] || status;
};

const statusBadge = (status) => {
  const map = {
    PENDING: "pending",
    VERIFIED: "verified",
    RENTED: "info",
    INACTIVE: "error",
  };
  return map[status] || "pending";
};

const verificationBadge = (vs) => {
  const map = {
    UNVERIFIED: "pending",
    IN_PROGRESS: "pending",
    VERIFIED: "verified",
    REJECTED: "error",
    SUSPICIOUS: "error",
  };
  return map[vs] || "pending";
};

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Rejection Modal State
  const [rejectModalProperty, setRejectModalProperty] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  const fetchProperties = async (statusFilter = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter === "PENDING") {
        params.set("status", "PENDING");
      } else if (statusFilter) {
        params.set("status", statusFilter);
      }
      const res = await fetch(`/api/admin/properties?${params}`);
      const data = await res.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error("Failed to load properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (propertyId, action) => {
    setActionLoading(propertyId);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchProperties();
      } else {
        setActionError(data.error || "Action failed. Please try again.");
      }
    } catch (error) {
      console.error("Action failed:", error);
      setActionError("Network error. Please check your connection.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalProperty) return;
    if (!rejectReason.trim()) return;

    setSubmittingReject(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: rejectModalProperty.id,
          action: "reject",
          reason: rejectReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRejectModalProperty(null);
        setRejectReason("");
        fetchProperties();
      } else {
        setActionError(data.error || "Rejection failed. Please try again.");
      }
    } catch (error) {
      console.error("Action failed:", error);
      setActionError("Network error. Please check your connection.");
    } finally {
      setSubmittingReject(false);
    }
  };

  const formatType = (type) => {
    const map = {
      SELF_CON: "Self Con",
      SINGLE_ROOM: "Room",
      FLAT: "Flat",
      TWO_BEDROOM: "2 Bed",
      THREE_BEDROOM: "3 Bed",
    };
    return map[type] || type;
  };

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter === "PENDING") {
          params.set("status", "PENDING");
        } else if (filter) {
          params.set("status", filter);
        }
        const res = await fetch(`/api/admin/properties?${params}`);
        const data = await res.json();
        setProperties(data.properties || []);
      } catch (error) {
        console.error("Failed to load properties:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [filter]);

  const filters = [
    { value: "PENDING", label: "Pending Review" },
    { value: "VERIFIED", label: "Available" },
    { value: "RENTED", label: "Rented" },
    { value: "INACTIVE", label: "Frozen" },
  ];

  return (
    <div className="fade-in">
      <div className={styles.propertiesHeader}>
        <h3>Property Verification</h3>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setActionError(null); }}
              className={`btn btn-sm ${filter === f.value ? "btn-primary" : "btn-outline"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div style={{
          margin: "0 0 16px", padding: "12px 16px",
          background: "#fee2e2", color: "#991b1b",
          borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
          fontSize: 14, fontWeight: 500
        }}>
          <AlertCircle size={16} />
          {actionError}
          <button onClick={() => setActionError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center" style={{ padding: "60px 0" }}>
          <div className="spinner" style={{ width: 32, height: 32 }}></div>
        </div>
      ) : properties.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><ClipboardList size={48} /></div>
          <h3>
            No {filters.find((f) => f.value === filter)?.label.toLowerCase()}{" "}
            properties
          </h3>
          <p>All caught up! No properties to review.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Property</th>
                <th>Landlord</th>
                <th>Area</th>
                <th>Type</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>
                    <strong>{property.title}</strong>
                    <div className="text-xs text-muted">{property.address}</div>
                  </td>
                  <td>
                    {property.landlord.firstName} {property.landlord.lastName}
                    {property.landlord.ninStatus === "VERIFIED" && (
                      <span
                        className="badge badge-verified"
                        style={{ marginLeft: 4 }}
                      >
                        ID verified
                      </span>
                    )}
                  </td>
                  <td>{property.area?.name || property.area}</td>
                  <td>{formatType(property.type)}</td>
                  <td>₦{Number(property.rentPrice).toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge badge-${statusBadge(property.status)}`}
                    >
                      {statusLabel(property.status)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${verificationBadge(property.verificationStatus)}`}
                    >
                      {property.verificationStatus}
                    </span>
                  </td>
                  <td>
                    {property.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm"
                          style={{ background: "var(--color-success)", color: "white", display: "flex", alignItems: "center", gap: 4 }}
                          onClick={() => handleAction(property.id, "verify")}
                          disabled={actionLoading === property.id}
                        >
                          {actionLoading === property.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ borderColor: "var(--color-error)", color: "var(--color-error)", display: "flex", alignItems: "center", gap: 4 }}
                          onClick={() => { setRejectModalProperty(property); setRejectReason(""); }}
                          disabled={actionLoading === property.id}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                    {property.status === "VERIFIED" && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleAction(property.id, "freeze")}
                        disabled={actionLoading === property.id}
                      >
                        Freeze
                      </button>
                    )}
                    {property.status === "INACTIVE" && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleAction(property.id, "activate")}
                        disabled={actionLoading === property.id}
                      >
                        Unfreeze
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Property Rejection Modal ── */}
      {rejectModalProperty && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }} className="fade-in">
          <div style={{
            background: "var(--bg-card, #ffffff)",
            borderRadius: 16,
            maxWidth: 520,
            width: "100%",
            padding: 24,
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            border: "1px solid var(--border-light, #e5e7eb)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Reject Property Listing</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted, #6b7280)" }}>
                    {rejectModalProperty.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalProperty(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary, #111827)" }}>
                Reason for Rejection <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                className="form-input"
                rows={4}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this property listing is rejected (e.g., Ownership document is unreadable, photos are unclear, or pricing does not match standards)..."
                style={{ width: "100%", resize: "vertical", fontSize: 14, marginBottom: 12 }}
                autoFocus
              />

              <div style={{
                background: "#fff7ed",
                border: "1px solid #ffedd5",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 20,
                fontSize: 12,
                color: "#c2410c",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <Send size={15} style={{ flexShrink: 0 }} />
                <span>This feedback will be sent directly to the landlord via <strong>Email & SMS</strong>.</span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRejectModalProperty(null)}
                  disabled={submittingReject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#dc2626", color: "white", display: "flex", alignItems: "center", gap: 6 }}
                  disabled={submittingReject || !rejectReason.trim()}
                >
                  {submittingReject ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14, borderColor: "white white transparent transparent" }} />
                      Sending...
                    </>
                  ) : (
                    <>Reject Listing</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
