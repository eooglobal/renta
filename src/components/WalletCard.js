"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Lock,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  User,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { friendlyError } from "@/lib/errors";

const formatMoney = (value) => `\u20a6${Number(value || 0).toLocaleString()}`;

export default function WalletCard({ userRole }) {
  const toast = useToast();
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankCode: "",
    bankName: "",
    bankAccount: "",
    accountName: "",
  });

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const [walletRes, profileRes] = await Promise.all([
        fetch("/api/wallet"),
        fetch("/api/profile"),
      ]);
      const walletData = await walletRes.json();
      const profileData = await profileRes.json();
      if (!walletRes.ok) throw new Error(walletData.error || "Failed to load wallet");
      setWallet(walletData);
      setProfile(profileData);
    } catch (err) {
      const friendly = friendlyError(err);
      setError(friendly.message);
      toast.error(friendly.title, friendly.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    if (banks.length > 0) return;
    setBanksLoading(true);
    try {
      const res = await fetch("/api/banks");
      if (res.ok) setBanks(await res.json());
    } catch {
      /* ignore */
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    const { bankAccount, bankCode } = withdrawForm;
    if (bankAccount.length === 10 && bankCode) {
      resolveAccountName(bankAccount, bankCode);
    } else {
      setResolvedName("");
      setNameConfirmed(false);
      setResolveError("");
    }
  }, [withdrawForm.bankAccount, withdrawForm.bankCode]);

  const resolveAccountName = async (accountNumber, bankCode) => {
    setResolving(true);
    setResolvedName("");
    setResolveError("");
    setNameConfirmed(false);
    try {
      const res = await fetch(`/api/banks/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
      const data = await res.json();
      if (res.ok && data.account_name) setResolvedName(data.account_name);
      else setResolveError(data.error || "Could not resolve account name");
    } catch {
      setResolveError("Network error during account resolution");
    } finally {
      setResolving(false);
    }
  };

  const handleBankChange = (e) => {
    const code = e.target.value;
    const bank = banks.find((b) => b.code === code);
    setWithdrawForm((prev) => ({
      ...prev,
      bankCode: code,
      bankName: bank?.name || "",
    }));
  };

  const resetWithdrawForm = () => {
    setIsWithdrawing(false);
    setResolvedName("");
    setNameConfirmed(false);
    setWithdrawForm({
      amount: "",
      bankCode: "",
      bankName: "",
      bankAccount: "",
      accountName: "",
    });
  };

  const handleWithdrawReq = async (e) => {
    e.preventDefault();
    if (!nameConfirmed) {
      toast.error("Name Confirmation Required", "Please confirm the account name before submitting.");
      return;
    }
    try {
      const amountNum = Number(withdrawForm.amount);
      if (amountNum > Number(wallet.balance)) {
        toast.error("Insufficient Balance", "Your wallet balance is too low for this withdrawal.");
        return;
      }

      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawForm.amount,
          bankName: withdrawForm.bankName,
          bankAccount: withdrawForm.bankAccount,
          bankCode: withdrawForm.bankCode,
          accountName: resolvedName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Withdrawal Requested", data.message || "Your withdrawal request has been submitted successfully.");
      resetWithdrawForm();
      fetchWallet();
    } catch (err) {
      const friendly = friendlyError(err);
      toast.error(friendly.title, friendly.message);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-surface text-center" style={{ padding: "var(--space-8)" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--color-primary)", margin: "0 auto" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-surface text-center" style={{ padding: "var(--space-8)" }}>
        <AlertTriangle style={{ color: "var(--color-error)", margin: "0 auto" }} />
        <p className="mt-2" style={{ color: "var(--color-error)" }}>{error}</p>
      </div>
    );
  }

  const parseDate = (d) =>
    new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
  const isKycVerified = profile?.ninStatus === "VERIFIED";

  return (
    <div className="dashboard-surface">
      <div className="section-heading-row">
        <h2 className="section-title" style={{ fontSize: "var(--text-xl)" }}>
          <span className="icon-chip"><Wallet size={19} /></span>
          Renta Wallet
        </h2>
      </div>

      <div className="stat-grid mb-6">
        <div className="stat-tile">
          <p className="stat-tile-label">Available Balance</p>
          <div className="stat-tile-value" style={{ color: "var(--color-primary-dark)" }}>{formatMoney(wallet.balance)}</div>
          <p className="text-xs text-muted">Ready for withdrawal</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-label">Total Earned</p>
          <div className="stat-tile-value">{formatMoney(wallet.totalEarned)}</div>
          <p className="text-xs text-muted">Lifetime earnings</p>
        </div>
      </div>

      {!isKycVerified ? (
        <div className="dashboard-alert mb-6">
          <ShieldAlert size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)", marginBottom: 4 }}>Identity Verification Required</p>
            <p style={{ fontSize: "var(--text-xs)", marginBottom: 8 }}>You must complete identity verification before requesting a withdrawal.</p>
            <Link href={`/${String(userRole || "").toLowerCase()}/profile`} className="font-bold text-xs" style={{ color: "#92400e", textDecoration: "underline" }}>
              <User size={12} style={{ display: "inline", marginRight: 4 }} /> Complete Verification
            </Link>
          </div>
        </div>
      ) : wallet.balance > 0 && !isWithdrawing ? (
        <button
          onClick={() => {
            setIsWithdrawing(true);
            fetchBanks();
          }}
          className="btn btn-primary btn-full mb-6"
        >
          Request Withdrawal
        </button>
      ) : !isWithdrawing ? (
        <button disabled className="btn btn-outline btn-full mb-6" style={{ opacity: 0.5, cursor: "not-allowed" }}>
          <Lock size={16} /> Minimum balance required
        </button>
      ) : null}

      {isWithdrawing && isKycVerified && (
        <div className="dashboard-panel dashboard-surface-muted mb-6">
          <h4 className="section-title mb-4" style={{ fontSize: "var(--text-base)" }}>
            <Banknote size={16} /> Withdrawal Request
          </h4>
          <form onSubmit={handleWithdrawReq} className="flex flex-col gap-3">
            <div>
              <label className="form-label">Amount (NGN)</label>
              <input
                type="number"
                placeholder={`Max: ${formatMoney(wallet.balance)}`}
                max={wallet.balance}
                min={1000}
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Bank</label>
              <select value={withdrawForm.bankCode} onChange={handleBankChange} required className="form-input" disabled={banksLoading}>
                <option value="">{banksLoading ? "Loading banks..." : "Select bank"}</option>
                {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Account Number</label>
              <input
                type="text"
                placeholder="10-digit account number"
                value={withdrawForm.bankAccount}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setWithdrawForm((prev) => ({ ...prev, bankAccount: v }));
                }}
                required
                maxLength={10}
                className="form-input"
              />
            </div>

            {resolving && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Verifying account...
              </div>
            )}

            {resolveError && <div className="dashboard-alert dashboard-alert-error text-xs">{resolveError}</div>}

            {resolvedName && !nameConfirmed && (
              <div className="dashboard-alert dashboard-alert-info">
                <div>
                  <p className="text-sm font-bold" style={{ color: "#1d4ed8", marginBottom: 8 }}>Account Name: {resolvedName}</p>
                  <p className="text-xs mb-3" style={{ color: "#3b82f6" }}>Is this the correct account holder?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setNameConfirmed(true)} className="btn btn-sm" style={{ background: "var(--color-success)", color: "white" }}>
                      <CheckCircle size={13} /> Yes, confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResolvedName("");
                        setWithdrawForm((prev) => ({ ...prev, bankAccount: "", bankCode: "", bankName: "" }));
                      }}
                      className="btn btn-sm btn-outline"
                      style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
                    >
                      No, change
                    </button>
                  </div>
                </div>
              </div>
            )}

            {nameConfirmed && (
              <div className="dashboard-alert dashboard-alert-success text-sm">
                <CheckCircle size={14} /> Confirmed: {resolvedName}
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!nameConfirmed}>Submit Request</button>
              <button type="button" onClick={resetWithdrawForm} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3 className="section-title mb-4" style={{ fontSize: "var(--text-lg)" }}>
          <Clock size={16} /> Recent Transactions
        </h3>
        {wallet.transactions?.length > 0 ? (
          <div className="operation-list">
            {wallet.transactions.slice(0, 5).map((tx) => {
              const isCredit = tx.type === "CREDIT";
              return (
                <div key={tx.id} className="operation-row">
                  <div className="operation-main">
                    <span className={`icon-chip ${isCredit ? "icon-chip-success" : "icon-chip-error"}`}>
                      {isCredit ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p className="font-medium" style={{ fontSize: "var(--text-sm)", margin: 0 }}>{tx.description}</p>
                      <p className="text-xs text-muted" style={{ margin: 0 }}>{parseDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="font-bold" style={{ color: isCredit ? "var(--color-success)" : "var(--color-error)" }}>
                    {isCredit ? "+" : "-"}{formatMoney(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted text-sm text-center dashboard-panel dashboard-surface-muted">No transactions yet.</p>
        )}
      </div>
    </div>
  );
}
