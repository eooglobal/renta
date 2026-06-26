"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Search,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import styles from "../../tenant/dashboard.module.css"; // Reusing dashboard styles
import Link from "next/link";

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

      if (res.ok) {
        await fetchPromotions();
      }
    } catch (err) {
      console.error("Failed to toggle feature status", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.landlord?.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const featuredCount = properties.filter((p) => p.isFeatured).length;

  return (
    <div className="fade-in">
      <div className={styles.welcomeSection}>
        <div className="flex justify-between items-start">
          <div>
            <h2>Promotion Management</h2>
            <p className="text-muted">
              Manage featured listings and boost property visibility
            </p>
          </div>
          <div className="bg-primary-light p-4 rounded-2xl flex items-center gap-4">
            <div className="text-right">
              <span className="block text-xs uppercase text-muted font-bold tracking-wider">
                Active Featured
              </span>
              <span className="text-2xl font-black text-primary">
                {featuredCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
              <Star size={24} fill="currentColor" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters/Search */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            size={18}
          />
          <input
            type="text"
            placeholder="Search properties or landlords..."
            className="form-input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="card animate-pulse h-64"></div>
            ))
        ) : filteredProperties.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <AlertCircle className="mx-auto text-muted mb-4" size={48} />
            <h3 className="text-xl font-bold">No properties found</h3>
            <p className="text-muted">
              Search for verified properties to promote them.
            </p>
          </div>
        ) : (
          filteredProperties.map((property) => (
            <div
              key={property.id}
              className={`card overflow-hidden transition-all duration-300 ${property.isFeatured ? "border-primary ring-1 ring-primary-light ring-offset-2" : ""}`}
            >
              <div className="relative aspect-video">
                {property.images?.[0] ? (
                  <img
                    src={property.images[0].url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-muted">
                    No Image
                  </div>
                )}
                {property.isFeatured && (
                  <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Star size={12} fill="currentColor" /> FEATURED
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold line-clamp-1 flex-1 pr-2">
                    {property.title}
                  </h3>
                  <Link
                    href={`/listing/${property.id}`}
                    target="_blank"
                    className="text-muted hover:text-primary"
                  >
                    <ExternalLink size={18} />
                  </Link>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted mb-4">
                  <span className="font-medium text-gray-700">Landlord:</span>
                  <span>{property.landlord?.email}</span>
                </div>

                {property.isFeatured && property.featuredUntil && (
                  <div className="bg-success-light text-success text-xs p-2 rounded-lg mb-4 flex items-center gap-2">
                    <Calendar size={14} />
                    <span>
                      Expires:{" "}
                      {new Date(property.featuredUntil).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleFeature(property.id, property.isFeatured)
                    }
                    disabled={actionLoading === property.id}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      property.isFeatured
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-primary text-white hover:shadow-lg hover:shadow-primary-light active:scale-95"
                    }`}
                  >
                    {actionLoading === property.id ? (
                      <span className="spinner spinner-white"></span>
                    ) : property.isFeatured ? (
                      "Remove Feature"
                    ) : (
                      "Promote Now"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .bg-primary-light {
          background-color: rgba(var(--color-primary-rgb), 0.1);
        }
        .bg-success-light {
          background-color: #f0fdf4;
          border: 1px solid #dcfce7;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ring-primary-light {
          --tw-ring-color: rgba(var(--color-primary-rgb), 0.2);
        }
      `}</style>
    </div>
  );
}
