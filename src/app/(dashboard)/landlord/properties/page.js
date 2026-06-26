"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, MapPin } from "lucide-react";
import styles from "../../tenant/dashboard.module.css";

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promotingId, setPromotingId] = useState(null);
  const [promotionPrice, setPromotionPrice] = useState(5000);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      const [propertiesRes, promotionsRes] = await Promise.all([
        fetch(`/api/properties?landlordId=${sessionData?.user?.id}`),
        fetch("/api/admin/promotions"),
      ]);

      const propertiesData = await propertiesRes.json();
      setProperties(propertiesData.properties || []);

      if (promotionsRes.ok) {
        const promotionsData = await promotionsRes.json();
        setPromotionPrice(
          Number(promotionsData.settings?.promotionPrice || 5000),
        );
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING: "badge-pending",
      VERIFIED: "badge-verified",
      RENTED: "badge-info",
      INACTIVE: "badge-error",
    };
    return map[status] || "badge-pending";
  };

  const formatType = (type) => {
    const map = {
      SELF_CON: "Self Contained",
      SINGLE_ROOM: "Single Room",
      FLAT: "Flat",
      TWO_BEDROOM: "2 Bedroom",
      THREE_BEDROOM: "3 Bedroom",
    };
    return map[type] || type;
  };

  const handlePromote = async (e, propertyId) => {
    e.preventDefault(); // Prevent navigating to the edit page
    setPromotingId(propertyId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/feature`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(`Error: ${data.error}`);
        return;
      }

      const paymentUrl = data.paymentUrl || data.authorization_url;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (error) {
      console.error("Promotion error:", error);
      alert("An error occurred while initializing promotion.");
    } finally {
      setPromotingId(null);
    }
  };

  if (loading) {
    return (
      <div
        className="flex justify-center items-center"
        style={{ minHeight: "300px" }}
      >
        <div className="spinner" style={{ width: 32, height: 32 }}></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className={styles.propertiesHeader}>
        <h3>My Properties</h3>
        <Link href="/landlord/properties/new" className="btn btn-primary">
          + Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
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
      ) : (
        <div className={styles.propertyGrid}>
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/landlord/properties/${property.id}/edit`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                className={styles.propertyCard}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.propertyImage}>
                  {property.images?.[0] ? (
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <Image
                        src={property.images[0].url}
                        alt={property.title}
                        fill
                        style={{ objectFit: "cover" }}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  ) : (
                    <span>No Image</span>
                  )}
                  <div className={styles.propertyBadge}>
                    <span
                      className={`badge ${getStatusBadge(property.status)}`}
                    >
                      {property.status}
                    </span>
                  </div>
                </div>
                <div className={styles.propertyInfo}>
                  <h4>{property.title}</h4>
                  <div className={styles.propertyMeta}>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {property.area}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home size={14} /> {formatType(property.type)}
                    </span>
                  </div>
                  <div className={styles.propertyPrice}>
                    ₦{Number(property.rentPrice).toLocaleString()}
                    <span> /year</span>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Click to edit →
                    </p>

                    {property.isFeatured ? (
                      <span
                        className="badge"
                        style={{
                          background: "var(--color-primary)",
                          color: "white",
                        }}
                      >
                        ★ Featured
                      </span>
                    ) : property.status === "VERIFIED" ? (
                      <button
                        onClick={(e) => handlePromote(e, property.id)}
                        className="btn btn-sm btn-outline"
                        disabled={promotingId === property.id}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        {promotingId === property.id
                          ? "Loading..."
                          : `Promote (₦${Number(promotionPrice).toLocaleString()})`}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
