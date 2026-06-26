"use client";

import { useState, useEffect } from "react";
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

  const fetchProperties = async (statusFilter = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter === "PENDING") {
        params.set("status", "PENDING");
        params.set("verificationStatus", "UNVERIFIED");
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
    try {
      const res = await fetch("/api/admin/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, action }),
      });
      if (res.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error("Action failed:", error);
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
          params.set("verificationStatus", "UNVERIFIED");
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
              onClick={() => setFilter(f.value)}
              className={`btn btn-sm ${filter === f.value ? "btn-primary" : "btn-outline"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: "60px 0" }}>
          <div className="spinner" style={{ width: 32, height: 32 }}></div>
        </div>
      ) : properties.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
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
                        NIN ✓
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
                          style={{
                            background: "var(--color-success)",
                            color: "white",
                          }}
                          onClick={() => handleAction(property.id, "verify")}
                          disabled={actionLoading === property.id}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{
                            borderColor: "var(--color-error)",
                            color: "var(--color-error)",
                          }}
                          onClick={() => handleAction(property.id, "reject")}
                          disabled={actionLoading === property.id}
                        >
                          ✕ Reject
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
