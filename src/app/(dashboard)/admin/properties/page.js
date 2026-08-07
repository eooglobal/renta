"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Check, X, AlertCircle } from "lucide-react";
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

  const fetchProperties = async (statusFilter = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter === "PENDING") {
        params.set("status", "PENDING");
        // We do not set verificationStatus to UNVERIFIED so that IN_PROGRESS and SUSPICIOUS are also included
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
    let reason = "";
    if (action === "reject") {
      const input = prompt("Please enter the reason for rejecting this property (sent to landlord via Email & SMS):");
      if (input === null) return; // User cancelled
      reason = input.trim();
    }

    setActionLoading(propertyId);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, action, reason }),
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
                          onClick={() => handleAction(property.id, "reject")}
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
    </div>
  );
}
