"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Calendar,
  Save,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { friendlyError } from "@/lib/errors";
import PaymentSetupCard from "@/components/PaymentSetupCard";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="fade-in">
          <div
            className="card text-center"
            style={{ padding: "var(--space-12)" }}
          >
            <Loader2
              size={32}
              style={{
                color: "var(--color-primary)",
                margin: "0 auto",
                animation: "spin 1s linear infinite",
              }}
            />
            <p className="text-muted mt-4">Loading profile...</p>
          </div>
        </div>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}

function ProfilePageInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Bank lookup state
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState("");
  const [manualAccountName, setManualAccountName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    bankName: "",
    bankAccount: "",
    bankCode: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Show result message if returning from Didit verification redirect
    const verificationResult = searchParams?.get("verification");
    if (verificationResult === "complete") {
      toast.success("Identity Verified", "Identity verified successfully!");
    } else if (verificationResult === "failed") {
      toast.error(
        "Verification Failed",
        "Identity verification failed. Please try again with Didit.",
      );
    } else if (verificationResult === "pending") {
      toast.success(
        "Verification Pending",
        "Verification submitted and under review. We'll notify you shortly.",
      );
    } else if (verificationResult === "error") {
      toast.error(
        "Verification Error",
        "Verification could not be completed. Please try again.",
      );
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
          setForm((prev) => ({
            ...prev,
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phone: data.phone || "",
            bankName: data.bankName || "",
            bankAccount: data.bankAccount || "",
            bankCode: data.bankCode || "",
          }));
          if (data.bankAccount && data.bankCode) {
            setNameConfirmed(true);
            setResolvedName(data.firstName + " " + data.lastName);
            setManualAccountName(data.firstName + " " + data.lastName);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const loadBanks = async () => {
      setBanksLoading(true);
      setBanksError("");
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load banks");
        }

        setBanks(data);
      } catch (err) {
        const message = err?.message || "Failed to load banks";
        setBanksError(message);
        console.error("Failed to load banks", err);
      } finally {
        setBanksLoading(false);
      }
    };

    fetchProfile();
    loadBanks();
  }, []);

  // Auto-resolve bank details
  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }

    const bankAccount = form.bankAccount;
    const bankCode = form.bankCode;

    if (bankAccount.length === 10 && bankCode) {
      resolveAccountName(bankAccount, bankCode);
    } else {
      setResolvedName("");
      setNameConfirmed(false);
      setResolveError("");
    }
  }, [form.bankAccount, form.bankCode, isFirstLoad]);

  const resolveAccountName = async (accountNumber, bankCode) => {
    setResolving(true);
    setResolvedName("");
    setResolveError("");
    setNameConfirmed(false);
    try {
      const res = await fetch(
        `/api/banks/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      );
      const data = await res.json();
      if (res.ok && data.account_name) {
        setResolvedName(data.account_name);
        setManualAccountName(data.account_name);
      } else {
        setResolveError(data.error || "Could not resolve account name");
      }
    } catch {
      setResolveError("Network error during account resolution");
    } finally {
      setResolving(false);
    }
  };

  const handleBankChange = (e) => {
    const code = e.target.value;
    const bank = banks.find((b) => b.code === code);
    setForm((prev) => ({
      ...prev,
      bankCode: code,
      bankName: bank?.name || "",
    }));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if ((form.bankAccount || form.bankCode) && !nameConfirmed) {
      if (!manualAccountName.trim()) {
        toast.error(
          "Confirm Account Name",
          "Please resolve and confirm your bank account name, or enter it manually.",
        );
        setSaving(false);
        return;
      }
    }

    if (showPassSection && form.newPassword) {
      if (form.newPassword !== form.confirmPassword) {
        toast.error("Passwords Don't Match", "New passwords do not match.");
        setSaving(false);
        return;
      }
      if (form.newPassword.length < 8) {
        toast.error(
          "Password Too Short",
          "New password must be at least 8 characters.",
        );
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        bankName: form.bankName,
        bankAccount: form.bankAccount,
        bankCode: form.bankCode,
        accountName: (resolvedName || manualAccountName).trim(),
      };

      if (showPassSection && form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const friendly = friendlyError(data.error || "Update failed");
        toast.error(friendly.title, friendly.message);
      } else {
        toast.success(
          "Profile Saved",
          data.warning || "Profile updated successfully!",
        );
        setForm((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setShowPassSection(false);
        if (manualAccountName.trim()) {
          setNameConfirmed(true);
        }
      }
    } catch (err) {
      const friendly = friendlyError(err);
      toast.error(friendly.title, friendly.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div
          className="card text-center"
          style={{ padding: "var(--space-12)" }}
        >
          <Loader2
            size={32}
            style={{
              color: "var(--color-primary)",
              margin: "0 auto",
              animation: "spin 1s linear infinite",
            }}
          />
          <p className="text-muted mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  const roleBadgeMap = {
    TENANT: "badge-info",
    LANDLORD: "badge-primary",
    SCOUT: "badge-verified",
    AFFILIATE: "badge-pending",
    ADMIN: "badge-error",
  };

  const ninStatusMap = {
    PENDING: { label: "Not Verified", className: "badge-pending" },
    VERIFIED: { label: "Verified", className: "badge-verified" },
    FAILED: { label: "Failed", className: "badge-error" },
  };

  const memberSince = profile
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
        new Date(profile.createdAt),
      )
    : "";

  return (
    <div className="fade-in">
      <header className="mb-6">
        <h1 style={{ fontSize: "var(--text-2xl)" }}>My Profile</h1>
        <p className="text-muted">
          Manage your account information and settings.
        </p>
      </header>

      {/* Profile Header Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "var(--color-primary)",
              color: "var(--color-black)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "var(--font-extrabold)",
              fontSize: "var(--text-2xl)",
              flexShrink: 0,
            }}
          >
            {profile?.firstName?.charAt(0)?.toUpperCase()}
            {profile?.lastName?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: "var(--text-xl)",
                marginBottom: "var(--space-1)",
              }}
            >
              {profile?.firstName} {profile?.lastName}
            </h2>
            <p className="text-sm text-muted">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`badge ${roleBadgeMap[profile?.role] || "badge-info"}`}
              >
                {profile?.role}
              </span>
              <span className="text-xs text-muted flex items-center gap-1">
                <Calendar size={12} /> Joined {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="card mb-6" style={{ background: "var(--bg-secondary)" }}>
        <div className="flex gap-6" style={{ flexWrap: "wrap" }}>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--text-muted)" }} />
            <span className="text-sm">Account Status:</span>
            <span
              className={`badge ${profile?.status === "ACTIVE" ? "badge-verified" : "badge-error"}`}
            >
              {profile?.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User size={16} style={{ color: "var(--text-muted)" }} />
            <span className="text-sm">Identity Verification:</span>
            <span
              className={`badge ${ninStatusMap[profile?.ninStatus]?.className || "badge-pending"}`}
            >
              {ninStatusMap[profile?.ninStatus]?.label || "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Identity Verification Widget (all users, when not yet verified) */}
      {(profile?.ninStatus === "PENDING" ||
        profile?.ninStatus === "FAILED") && (
        <div
          className="card mb-6"
          style={{
            borderLeft: "4px solid var(--color-primary)",
            background: "var(--bg-secondary)",
          }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Shield size={20} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "var(--text-lg)", margin: 0 }}>
                Identity Verification Required
              </h3>
            </div>
            <p className="text-sm text-muted">
              To build trust on Renta, please verify your identity. This is
              required to access rental features.
            </p>
            <DiditVerifyButton />
          </div>
        </div>
      )}

      {/* Tenant Screening Widget */}
      {profile?.role === "TENANT" && (
        <div
          className="card mb-6"
          style={{
            borderLeft: "4px solid var(--color-info)",
            background: "var(--bg-secondary)",
          }}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Briefcase size={20} style={{ color: "var(--color-info)" }} />
              <h3 style={{ fontSize: "var(--text-lg)", margin: 0 }}>
                Tenant Screening Profile
              </h3>
            </div>
            <p className="text-sm text-muted">
              A completed screening profile (employment &amp; income details) is
              required before you can rent any property on Renta.
            </p>
            <div className="mt-2 text-left">
              <Link
                href="/tenant/screening"
                className="btn btn-outline"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Briefcase size={16} /> Update Screening Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      <PaymentSetupCard profile={profile} />

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="card mb-6">
          <h3
            className="mb-4 flex items-center gap-2"
            style={{ fontSize: "var(--text-lg)" }}
          >
            <User size={18} style={{ color: "var(--color-primary)" }} />{" "}
            Personal Information
          </h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label flex items-center gap-1">
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="form-input"
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
              <span className="form-help">Email cannot be changed.</span>
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-1">
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 08012345678"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card mb-6">
          <h3
            className="mb-4 flex items-center gap-2"
            style={{ fontSize: "var(--text-lg)" }}
          >
            <Building2 size={18} style={{ color: "var(--color-primary)" }} />{" "}
            Bank Details
          </h3>
          <p className="text-sm text-muted mb-4">
            Add your bank account for receiving wallet withdrawals.
          </p>
          {banksError && (
            <div
              className="mb-4 p-3 rounded text-xs"
              style={{
                background: "var(--color-error-light)",
                color: "var(--color-error)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {banksError}
            </div>
          )}
          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Bank</label>
              <select
                name="bankCode"
                value={form.bankCode}
                onChange={handleBankChange}
                className="form-input"
                disabled={banksLoading}
              >
                <option value="">
                  {banksLoading ? "Loading banks..." : "Select bank"}
                </option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                name="bankAccount"
                value={form.bankAccount}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((prev) => ({ ...prev, bankAccount: v }));
                }}
                className="form-input"
                placeholder="10-digit account number"
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bank Code</label>
              <input
                type="text"
                name="bankCode"
                value={form.bankCode}
                readOnly
                className="form-input"
                style={{
                  opacity: 0.7,
                  cursor: "not-allowed",
                  background: "var(--bg-secondary)",
                }}
                placeholder="Auto-filled"
              />
            </div>
          </div>

          {/* Account name resolution */}
          {resolving && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Verifying account...
            </div>
          )}

          {resolveError && (
            <div
              className="mt-3 p-3 rounded text-xs"
              style={{
                background: "var(--color-error-light)",
                color: "var(--color-error)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {resolveError}
            </div>
          )}

          <div className="form-group mt-3">
            <label className="form-label">Account Name</label>
            <input
              type="text"
              value={manualAccountName}
              onChange={(e) => {
                setManualAccountName(e.target.value);
                setNameConfirmed(false);
              }}
              className="form-input"
              placeholder="Enter the full name on the bank account"
            />
            <p className="text-xs text-muted mt-2">
              If automatic lookup fails or looks unreliable in sandbox, enter
              the full account name manually.
            </p>
          </div>

          {resolvedName && !nameConfirmed && (
            <div
              className="mt-3 p-4 border rounded"
              style={{
                background: "var(--color-info-light)",
                borderColor: "#bfdbfe",
                borderRadius: "var(--radius-md)",
              }}
            >
              <p
                className="text-sm font-bold"
                style={{ color: "#1d4ed8", marginBottom: "8px" }}
              >
                Account Name: {resolvedName}
              </p>
              <p
                className="text-xs mb-3"
                style={{ color: "#3b82f6", marginBottom: "10px" }}
              >
                Is this the correct account holder?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setManualAccountName(resolvedName);
                    setNameConfirmed(true);
                  }}
                  className="btn btn-sm"
                  style={{ background: "var(--color-success)", color: "white" }}
                >
                  <CheckCircle
                    size={13}
                    style={{
                      marginRight: 4,
                      display: "inline-flex",
                      verticalAlign: "middle",
                    }}
                  />{" "}
                  Yes, confirm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResolvedName("");
                    setForm((prev) => ({
                      ...prev,
                      bankAccount: "",
                      bankCode: "",
                      bankName: "",
                    }));
                  }}
                  className="btn btn-sm btn-outline"
                  style={{
                    borderColor: "var(--color-error)",
                    color: "var(--color-error)",
                  }}
                >
                  No, change
                </button>
              </div>
            </div>
          )}

          {nameConfirmed && resolvedName && (
            <div
              className="mt-3 p-3 rounded text-sm flex items-center gap-2"
              style={{
                background: "var(--color-success-light)",
                color: "#15803d",
                borderRadius: "var(--radius-md)",
              }}
            >
              <CheckCircle size={14} /> Confirmed: {resolvedName}
            </div>
          )}
        </div>

        {/* Password Section */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3
              className="flex items-center gap-2"
              style={{ fontSize: "var(--text-lg)" }}
            >
              <Lock size={18} style={{ color: "var(--color-primary)" }} />{" "}
              Security
            </h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPassSection(!showPassSection)}
            >
              {showPassSection ? "Cancel" : "Change Password"}
            </button>
          </div>

          {showPassSection && (
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={handleChange}
                    className="form-input"
                    required
                    style={{ paddingRight: "var(--space-10)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{
                      position: "absolute",
                      right: "var(--space-3)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                    }}
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPass ? "text" : "password"}
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Min. 8 characters"
                      required
                      style={{ paddingRight: "var(--space-10)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{
                        position: "absolute",
                        right: "var(--space-3)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                      }}
                    >
                      {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {!showPassSection && (
            <p className="text-sm text-muted">
              Click <span>&quot;Change Password&quot;</span> to update your
              password.
            </p>
          )}
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={saving}
          style={{ minWidth: "200px" }}
        >
          {saving ? (
            <>
              <Loader2
                size={18}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              Saving...
            </>
          ) : (
            <>
              <Save size={18} /> Save Changes
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Didit Verification Button
function DiditVerifyButton() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/verification/didit/session", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to start verification");
      const verificationUrl =
        data.verification_url || data.verificationUrl || data.url;
      if (!verificationUrl) {
        throw new Error(
          "Verification service did not return a verification URL",
        );
      }
      window.location.href = verificationUrl;
    } catch (err) {
      const friendly = friendlyError(err);
      toast.error(friendly.title, friendly.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "12px",
        background: "white",
        border: "2px solid var(--color-primary)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Shield size={16} style={{ color: "var(--color-primary)" }} />
        <span style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>
          Verify with Didit
        </span>
        <span
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 999,
            background: "var(--color-primary)",
            fontWeight: 700,
          }}
        >
          RECOMMENDED
        </span>
      </div>
      <p className="text-sm text-muted mb-3">
        Quick identity check using your government-issued ID. Powered by Didit -
        no manual data entry required.
      </p>
      <button
        onClick={handleVerify}
        disabled={loading}
        className="btn btn-primary"
        style={{ minWidth: 160 }}
      >
        {loading ? (
          <>
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />{" "}
            Starting...
          </>
        ) : (
          <>
            <Shield size={16} /> Start Verification
          </>
        )}
      </button>
    </div>
  );
}

