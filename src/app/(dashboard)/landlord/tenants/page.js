"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Home,
  MapPin,
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  MessageCircle,
  Briefcase,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import Link from "next/link";

export default function LandlordTenantsPage() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTenant, setExpandedTenant] = useState(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch("/api/landlord/tenants");
        const data = await res.json();
        if (res.ok) setRentals(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  const activeCount = rentals.filter((r) =>
    ["ACTIVE", "PENDING"].includes(r.status),
  ).length;

  return (
    <div className="fade-in dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>My Tenants</h1>
          <p>View tenants currently renting your properties.</p>
        </div>
      </header>

      <div className="dashboard-grid mb-6">
        <div className="dashboard-panel dashboard-span-4 dashboard-surface-muted">
          <div className="flex items-center gap-4">
            <span className="icon-chip">
              <Users size={20} />
            </span>
            <div>
              <p className="text-sm text-muted">Active Tenants</p>
              <h3 style={{ fontSize: "var(--text-2xl)", margin: 0 }}>{activeCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-surface text-center text-muted" style={{ padding: "var(--space-8)" }}>
          Loading tenants...
        </div>
      ) : rentals.length === 0 ? (
        <div className="dashboard-surface text-center" style={{ padding: "var(--space-12)" }}>
          <Users
            size={48}
            style={{
              color: "var(--text-light)",
              margin: "0 auto var(--space-4)",
            }}
          />
          <h3 style={{ fontSize: "var(--text-lg)" }}>No tenants yet</h3>
          <p className="text-muted text-sm mt-2">
            Once someone rents your property, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="operation-list">
          {rentals.map((rental) => {
            const isActive = rental.status === "ACTIVE";
            const tenantName = `${rental.tenant?.firstName || ""} ${rental.tenant?.lastName || ""}`.trim();
            const tenantInitial = rental.tenant?.firstName?.charAt(0)?.toUpperCase() || "T";
            const startDate = new Date(rental.startDate).toLocaleDateString("en-GB", {
              dateStyle: "medium",
            });

            return (
              <div key={rental.id} className="dashboard-surface" style={{ padding: "var(--space-4)" }}>
                <div className="operation-row" style={{ boxShadow: "none", border: "none", padding: 0 }}>
                  <div className="operation-main">
                    <div className="avatar-token">{tenantInitial}</div>
                    <div style={{ minWidth: 0 }}>
                      <h4 className="font-bold" style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-1)" }}>
                        {tenantName || "Tenant"}
                      </h4>
                      <div className="operation-meta">
                        {rental.tenant?.phone && (
                          <a
                            href={`tel:${rental.tenant.phone}`}
                            className="flex items-center gap-1"
                            style={{ color: "var(--color-primary-dark)" }}
                          >
                            <Phone size={12} /> {rental.tenant.phone}
                          </a>
                        )}
                        <span className="flex items-center gap-1">
                          <Home size={12} /> {rental.property?.title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {startDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="operation-actions">
                    <span className={`badge ${isActive ? "badge-verified" : "badge-pending"} flex items-center gap-1`}>
                      {isActive ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {rental.status}
                    </span>
                    <Link
                      href={`/landlord/messages?startThreadWith=${rental.tenantId}&rentalId=${rental.id}&title=${encodeURIComponent(rental.property?.title)}`}
                      className="btn btn-sm btn-primary"
                    >
                      <MessageCircle size={12} /> Message
                    </Link>
                    {rental.tenant?.tenantProfile && (
                      <button
                        onClick={() =>
                          setExpandedTenant(
                            expandedTenant === rental.id ? null : rental.id,
                          )
                        }
                        className="btn btn-outline btn-sm"
                      >
                        {expandedTenant === rental.id ? "Hide Profile" : "View Profile"}
                      </button>
                    )}
                  </div>
                </div>

                {expandedTenant === rental.id && (
                  <div className="dashboard-grid mt-4">
                    <section className="dashboard-panel dashboard-span-6 dashboard-surface-muted">
                      <div className="section-heading-row">
                        <h5 className="section-title">
                          <UserCircle2 size={18} style={{ color: "var(--color-primary)" }} />
                          Tenant Details
                        </h5>
                      </div>
                      <div className="detail-grid">
                        <DetailItem label="Full Name" value={tenantName || "Not provided"} />
                        {rental.tenant?.phone && (
                          <DetailItem label="Phone Number" value={rental.tenant.phone} icon={<Phone size={14} />} />
                        )}
                        {rental.tenant?.email && (
                          <DetailItem label="Email Address" value={rental.tenant.email} icon={<Mail size={14} />} />
                        )}
                        <DetailItem label="Property" value={rental.property?.title || "Not provided"} icon={<Home size={14} />} />
                        {rental.property?.address && (
                          <DetailItem label="Property Address" value={rental.property.address} icon={<MapPin size={14} />} full />
                        )}
                        <DetailItem label="Rental Start Date" value={startDate} icon={<Calendar size={14} />} />
                        <DetailItem label="Rental Status" value={rental.status} icon={<ShieldCheck size={14} />} />
                      </div>
                    </section>

                    {rental.tenant?.tenantProfile && (
                      <section className="dashboard-panel dashboard-span-6 dashboard-surface-muted">
                        <div className="section-heading-row">
                          <h5 className="section-title">
                            <Briefcase size={18} style={{ color: "var(--color-primary)" }} />
                            Screening Profile
                          </h5>
                        </div>
                        <div className="detail-grid">
                          <DetailItem
                            label="Employment Status"
                            value={rental.tenant.tenantProfile.employmentStatus?.replaceAll("_", " ") || "Not provided"}
                          />
                          <DetailItem
                            label="Monthly Income"
                            value={rental.tenant.tenantProfile.monthlyIncome
                              ? `NGN ${Number(rental.tenant.tenantProfile.monthlyIncome).toLocaleString()}`
                              : "Not provided"}
                          />
                          {rental.tenant.tenantProfile.employerName && (
                            <DetailItem label="Employer / School" value={rental.tenant.tenantProfile.employerName} />
                          )}
                          {rental.tenant.tenantProfile.jobTitle && (
                            <DetailItem label="Job Title" value={rental.tenant.tenantProfile.jobTitle} />
                          )}
                          {rental.tenant.tenantProfile.workAddress && (
                            <DetailItem label="Work Address" value={rental.tenant.tenantProfile.workAddress} full />
                          )}
                          {rental.tenant.tenantProfile.nextOfKinName && (
                            <DetailItem label="Next of Kin" value={rental.tenant.tenantProfile.nextOfKinName} />
                          )}
                          {rental.tenant.tenantProfile.nextOfKinPhone && (
                            <DetailItem label="Next of Kin Phone" value={rental.tenant.tenantProfile.nextOfKinPhone} />
                          )}
                          {rental.tenant.tenantProfile.previousLandlordReference && (
                            <DetailItem label="Reference" value={rental.tenant.tenantProfile.previousLandlordReference} full />
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, icon, full = false }) {
  return (
    <div style={full ? { gridColumn: "1 / -1" } : undefined}>
      <p className="detail-item-label">{label}</p>
      <p className="detail-item-value flex items-center gap-2">
        {icon}
        <span>{value}</span>
      </p>
    </div>
  );
}
