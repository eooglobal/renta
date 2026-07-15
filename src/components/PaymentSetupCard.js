"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { friendlyError } from "@/lib/errors";

const EARNING_ROLES = new Set(["LANDLORD", "SCOUT", "AFFILIATE"]);

export default function PaymentSetupCard({ profile }) {
  const toast = useToast();
  const [setup, setSetup] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    bankName: "",
    bankCode: "",
    bankAccount: "",
  });

  const canUseSetup = EARNING_ROLES.has(profile?.role);
  const isKycVerified = profile?.ninStatus === "VERIFIED";
  const isComplete = setup?.paymentSetupStatus === "VERIFIED";

  const selectedBankName = useMemo(
    () => banks.find((bank) => bank.code === form.bankCode)?.name || "",
    [banks, form.bankCode],
  );

  useEffect(() => {
    if (!canUseSetup) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [setupRes, banksRes] = await Promise.all([
          fetch("/api/payment-setup"),
          fetch("/api/banks"),
        ]);
        const setupData = await setupRes.json();
        const banksData = await banksRes.json();

        if (!setupRes.ok) throw new Error(setupData.error || "Failed to load payout setup");
        if (!banksRes.ok) throw new Error(banksData.error || "Failed to load banks");

        setSetup(setupData);
        setBanks(banksData);
        setForm({
          bankName: setupData.bank?.bankName || "",
          bankCode: setupData.bank?.bankCode || "",
          bankAccount: setupData.bank?.bankAccount || "",
        });
        setResolvedName(setupData.bank?.accountName || "");
      } catch (err) {
        const friendly = friendlyError(err);
        setError(friendly.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canUseSetup]);

  useEffect(() => {
    if (!form.bankCode || form.bankAccount.length !== 10) {
      if (!isComplete) setResolvedName("");
      return;
    }

    const resolve = async () => {
      setResolving(true);
      setError("");
      try {
        const res = await fetch(
          `/api/banks/resolve?account_number=${form.bankAccount}&bank_code=${form.bankCode}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not resolve account name");
        setResolvedName(data.account_name || "");
      } catch (err) {
        const friendly = friendlyError(err);
        setError(friendly.message);
        setResolvedName("");
      } finally {
        setResolving(false);
      }
    };

    const timeout = window.setTimeout(resolve, 350);
    return () => window.clearTimeout(timeout);
  }, [form.bankAccount, form.bankCode, isComplete]);

  if (!canUseSetup) return null;

  const handleBankChange = (event) => {
    const bankCode = event.target.value;
    const bankName = banks.find((bank) => bank.code === bankCode)?.name || "";
    setForm((prev) => ({ ...prev, bankCode, bankName }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/payment-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: form.bankName || selectedBankName,
          bankCode: form.bankCode,
          bankAccount: form.bankAccount,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to complete payout setup");

      setSetup((prev) => ({
        ...prev,
        ...data,
        kycStatus: "VERIFIED",
        hasSubaccount: true,
      }));
      setResolvedName(data.bank?.accountName || resolvedName);
      toast.success("Payout Setup Complete", "Paystack split payments can now route to this account.");
    } catch (err) {
      const friendly = friendlyError(err);
      setError(friendly.message);
      toast.error(friendly.title, friendly.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="card mb-6"
      style={{
        borderLeft: `4px solid ${isComplete ? "var(--color-success)" : "var(--color-warning)"}`,
        background: "var(--bg-secondary)",
      }}
    >
      <div className="flex items-center justify-between gap-4 mb-4" style={{ flexWrap: "wrap" }}>
        <div className="flex items-center gap-2">
          <CreditCard size={20} style={{ color: "var(--color-primary)" }} />
          <h3 style={{ fontSize: "var(--text-lg)", margin: 0 }}>Payout Setup</h3>
        </div>
        <span className={`badge ${isComplete ? "badge-verified" : "badge-pending"}`}>
          {isComplete ? "Ready" : "Required"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Loading payout setup...
        </div>
      ) : (
        <>
          {!isKycVerified && (
            <div
              className="mb-4 p-3 rounded text-sm flex items-center gap-2"
              style={{
                background: "#fef3c7",
                color: "#92400e",
                borderRadius: "var(--radius-md)",
              }}
            >
              <AlertTriangle size={16} />
              Complete identity verification before setting up payouts.
            </div>
          )}

          {error && (
            <div
              className="mb-4 p-3 rounded text-sm"
              style={{
                background: "var(--color-error-light)",
                color: "var(--color-error)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">Bank</label>
                <select
                  className="form-input"
                  value={form.bankCode}
                  onChange={handleBankChange}
                  disabled={!isKycVerified || saving}
                  required
                >
                  <option value="">Select bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  value={form.bankAccount}
                  onChange={(event) => {
                    const bankAccount = event.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm((prev) => ({ ...prev, bankAccount }));
                  }}
                  disabled={!isKycVerified || saving}
                  placeholder="10-digit account number"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <div
                  className="form-input flex items-center gap-2"
                  style={{
                    background: "var(--bg-primary)",
                    minHeight: "44px",
                    opacity: resolvedName ? 1 : 0.7,
                  }}
                >
                  {resolving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  <span className="text-sm">{resolvedName || "Resolved by Paystack"}</span>
                </div>
              </div>
            </div>

            {isComplete && setup?.paystackSubaccountCode && (
              <div
                className="mb-4 p-3 rounded text-sm flex items-center gap-2"
                style={{
                  background: "var(--color-success-light)",
                  color: "#15803d",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <CheckCircle size={16} />
                Paystack destination active: {setup.paystackSubaccountCode}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isKycVerified || saving || resolving || form.bankAccount.length !== 10 || !form.bankCode}
            >
              {saving ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {isComplete ? "Update Payout Setup" : "Complete Payout Setup"}
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}