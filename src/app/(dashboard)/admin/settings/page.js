"use client";

import { useState, useEffect } from "react";
import {
  Save,
  RefreshCw,
  Shield,
  CreditCard,
  MessageSquare,
  Globe,
  Fingerprint,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
  Cloud,
} from "lucide-react";

const settingGroups = [
  {
    id: "PAYSTACK",
    label: "Paystack Payments",
    icon: CreditCard,
    color: "#00C3F7",
  },
  {
    id: "PAYMENT_GATEWAY",
    label: "Payment Gateway",
    icon: Zap,
    color: "#FDA829",
  },
  {
    id: "PUSHER",
    label: "Real-time (Pusher)",
    icon: MessageSquare,
    color: "#6366f1",
  },
  {
    id: "DIDIT",
    label: "Identity (Didit)",
    icon: Fingerprint,
    color: "#8b5cf6",
  },
  {
    id: "GOOGLE_MAPS",
    label: "Maps & Location",
    icon: Globe,
    color: "#3b82f6",
  },
  {
    id: "STORAGE",
    label: "Storage / Cloudflare R2",
    icon: Cloud,
    color: "#0ea5e9",
  },
  {
    id: "EMAIL",
    label: "Email Configuration",
    icon: RefreshCw,
    color: "#f97316",
  },
  {
    id: "AI",
    label: "AI Assistant",
    icon: MessageSquare,
    color: "#10b981",
  },
];

const defaultSettings = [
  {
    key: "PAYSTACK_SECRET_KEY",
    group: "PAYSTACK",
    label: "Secret Key",
    type: "password",
    description: "Your Paystack Secret Key. Keep this private.",
  },
  {
    key: "NEXT_PUBLIC_PAYSTACK_KEY",
    group: "PAYSTACK",
    label: "Public Key",
    type: "text",
    description: "Your Paystack Public Key. Used on the frontend.",
  },

  {
    key: "ACTIVE_PAYMENT_GATEWAY",
    group: "PAYMENT_GATEWAY",
    label: "Active Gateway",
    type: "text",
    description:
      'Set to "paystack" or "nomba" to switch gateways instantly without redeploying.',
  },
  {
    key: "NOMBA_BASE_URL",
    group: "PAYMENT_GATEWAY",
    label: "Nomba Base URL",
    type: "text",
    description:
      "Use https://api.nomba.com for live or https://sandbox.nomba.com while testing.",
  },
  {
    key: "NOMBA_CLIENT_ID",
    group: "PAYMENT_GATEWAY",
    label: "Nomba Client ID",
    type: "text",
    description: "Your Nomba API Client ID.",
  },
  {
    key: "NOMBA_CLIENT_SECRET",
    group: "PAYMENT_GATEWAY",
    label: "Nomba Client Secret",
    type: "password",
    description: "Your Nomba API Client Secret. Keep this private.",
  },
  {
    key: "NOMBA_ACCOUNT_ID",
    group: "PAYMENT_GATEWAY",
    label: "Nomba Account ID",
    type: "text",
    description: "Your Nomba Account ID used for API authorization.",
  },
  {
    key: "NOMBA_WEBHOOK_SECRET",
    group: "PAYMENT_GATEWAY",
    label: "Nomba Webhook Secret",
    type: "password",
    description: "Used to verify Nomba webhook signatures.",
  },
  {
    key: "PROMOTION_PRICE",
    group: "PAYMENT_GATEWAY",
    label: "Promotion Price",
    type: "text",
    description: "Amount landlords pay to promote a property listing.",
  },
  {
    key: "PROMOTION_DURATION_DAYS",
    group: "PAYMENT_GATEWAY",
    label: "Promotion Duration (Days)",
    type: "text",
    description: "How many days a promoted property remains featured.",
  },

  { key: "PUSHER_APP_ID", group: "PUSHER", label: "App ID", type: "text" },
  {
    key: "NEXT_PUBLIC_PUSHER_KEY",
    group: "PUSHER",
    label: "Key",
    type: "text",
  },
  { key: "PUSHER_SECRET", group: "PUSHER", label: "Secret", type: "password" },
  {
    key: "NEXT_PUBLIC_PUSHER_CLUSTER",
    group: "PUSHER",
    label: "Cluster",
    type: "text",
  },

  {
    key: "DIDIT_API_KEY",
    group: "DIDIT",
    label: "API Key",
    type: "password",
    description: "From Didit Console > API & Webhooks",
  },
  {
    key: "DIDIT_WORKFLOW_ID",
    group: "DIDIT",
    label: "Workflow ID",
    type: "text",
    description:
      "From Didit Console > Workflows. Controls which checks run (ID, liveness, etc.)",
  },
  {
    key: "DIDIT_WEBHOOK_SECRET",
    group: "DIDIT",
    label: "Webhook Secret",
    type: "password",
    description:
      "From Didit Console > API & Webhooks. Used to verify webhook signatures.",
  },

  {
    key: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    group: "GOOGLE_MAPS",
    label: "API Key",
    type: "text",
  },

  {
    key: "R2_ACCOUNT_ID",
    group: "STORAGE",
    label: "Cloudflare Account ID",
    type: "text",
    description: "Cloudflare account ID used to build the R2 S3-compatible endpoint.",
  },
  {
    key: "R2_ACCESS_KEY_ID",
    group: "STORAGE",
    label: "R2 Access Key ID",
    type: "text",
    description: "Access key for the R2 bucket used by property images and videos.",
  },
  {
    key: "R2_SECRET_ACCESS_KEY",
    group: "STORAGE",
    label: "R2 Secret Access Key",
    type: "password",
    description: "Secret key for the R2 bucket. Keep this private.",
  },
  {
    key: "R2_BUCKET_NAME",
    group: "STORAGE",
    label: "R2 Bucket Name",
    type: "text",
    description: "Bucket where Renta stores uploaded property media.",
  },
  {
    key: "R2_PUBLIC_URL",
    group: "STORAGE",
    label: "R2 Public URL",
    type: "text",
    description: "Optional public/custom domain, for example https://cdn.userenta.com. If empty, Renta uses the media proxy route.",
  },

  {
    key: "EMAIL_PROVIDER",
    group: "EMAIL",
    label: "Email Provider",
    type: "text",
    description: "Use zeptomail for ZeptoMail API delivery or smtp for SMTP fallback.",
  },
  {
    key: "ZEPTOMAIL_SEND_TOKEN",
    group: "EMAIL",
    label: "ZeptoMail Send Token",
    type: "password",
    description: "Agent send mail token from ZeptoMail > SMTP/API.",
  },
  {
    key: "ZEPTOMAIL_API_URL",
    group: "EMAIL",
    label: "ZeptoMail API URL",
    type: "text",
    description: "Default: https://api.zeptomail.com/v1.1/email",
  },
  {
    key: "EMAIL_FROM_NAME",
    group: "EMAIL",
    label: "From Name",
    type: "text",
  },
  {
    key: "EMAIL_SERVER_HOST",
    group: "EMAIL",
    label: "SMTP Host",
    type: "text",
  },
  {
    key: "EMAIL_SERVER_PORT",
    group: "EMAIL",
    label: "SMTP Port",
    type: "text",
  },
  {
    key: "EMAIL_SERVER_USER",
    group: "EMAIL",
    label: "SMTP User",
    type: "text",
  },
  {
    key: "EMAIL_SERVER_PASSWORD",
    group: "EMAIL",
    label: "SMTP Password",
    type: "password",
  },
  { key: "EMAIL_FROM", group: "EMAIL", label: "From Email", type: "text" },
  {
    key: "GROQ_API_KEY",
    group: "AI",
    label: "Groq API Key",
    type: "password",
    description: "API key used by the Renta support assistant.",
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [activeGroup, setActiveGroup] = useState("PAYSTACK");
  const [revealed, setRevealed] = useState({});

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const map = data.settings.reduce(
          (acc, s) => ({ ...acc, [s.key]: s.value }),
          {},
        );
        setSettings(map);
        setHealth(data.health);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (key) => {
    setSaving(key);
    setSaved(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: settings[key] }),
      });
      if (res.ok) {
        setSaved(key);
        setTimeout(() => setSaved(null), 2500);
        const updated = await fetch("/api/admin/settings");
        if (updated.ok) {
          const data = await updated.json();
          setHealth(data.health);
        }
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(null);
    }
  };

  const toggleReveal = (key) =>
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeGroupData = settingGroups.find((g) => g.id === activeGroup);
  const activeFields = defaultSettings.filter((s) => s.group === activeGroup);
  const filledCount = activeFields.filter((f) => settings[f.key]).length;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
        }}
      >
        <Loader2
          size={32}
          style={{
            animation: "spin 0.8s linear infinite",
            color: "var(--color-primary)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* ── Page Header ── */}
      <div
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: "var(--text-3xl)",
              fontWeight: "var(--font-bold)",
              margin: 0,
            }}
          >
            <span
              style={{
                background: "var(--color-primary)",
                borderRadius: 12,
                padding: "8px 10px",
                display: "flex",
              }}
            >
              <Shield size={22} color="#000" />
            </span>
            Platform Configuration
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              marginTop: 6,
              fontSize: "var(--text-sm)",
            }}
          >
            Manage API keys and external service integrations without touching
            code.
          </p>
        </div>

        {health && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 999,
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              background: health.isHealthy
                ? "var(--color-success-light)"
                : "var(--color-error-light)",
              color: health.isHealthy ? "#16a34a" : "#dc2626",
              border: `1px solid ${health.isHealthy ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: health.isHealthy
                  ? "var(--color-success)"
                  : "var(--color-error)",
                boxShadow: health.isHealthy
                  ? "0 0 0 3px rgba(34,197,94,0.25)"
                  : "none",
                animation: health.isHealthy ? "pulse 2s infinite" : "none",
              }}
            />
            {health.isHealthy
              ? "Platform Fully Operational"
              : `${health.missingKeys.length} Critical Keys Missing`}
          </div>
        )}
      </div>

      {/* ── Missing Keys Alert ── */}
      {!health?.isHealthy && health?.missingKeys?.length > 0 && (
        <div
          style={{
            marginBottom: 28,
            padding: "16px 20px",
            background: "var(--color-error-light)",
            border: "1px solid #fca5a5",
            borderRadius: "var(--radius-xl)",
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle
            size={20}
            style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                color: "#991b1b",
                marginBottom: 10,
              }}
            >
              Action Required — Missing Credentials
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {health.missingKeys.map((key) => (
                <span
                  key={key}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "white",
                    border: "1px solid #fca5a5",
                    fontSize: 11,
                    color: "#b91c1c",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {settingGroups.map((group) => {
            const Icon = group.icon;
            const isActive = activeGroup === group.id;
            const fields = defaultSettings.filter((s) => s.group === group.id);
            const filled = fields.filter((f) => settings[f.key]).length;
            const complete = filled === fields.length;

            return (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-xl)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "all var(--transition-fast)",
                  background: isActive
                    ? "var(--color-primary)"
                    : "var(--bg-card)",
                  boxShadow: isActive
                    ? "0 4px 14px rgba(253,168,41,0.35)"
                    : "var(--shadow-sm)",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#000" : "var(--text-secondary)",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive
                      ? "rgba(0,0,0,0.12)"
                      : `${group.color}18`,
                    color: isActive ? "#000" : group.color,
                  }}
                >
                  <Icon size={17} />
                </span>
                <span style={{ flex: 1, fontSize: "var(--text-sm)" }}>
                  {group.label}
                </span>
                {complete ? (
                  <CheckCircle2
                    size={15}
                    style={{
                      color: isActive ? "#000" : "var(--color-success)",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 999,
                      flexShrink: 0,
                      background: isActive
                        ? "rgba(0,0,0,0.15)"
                        : "var(--color-warning-light)",
                      color: isActive ? "#000" : "#d97706",
                    }}
                  >
                    {filled}/{fields.length}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* ── Main Form Panel ── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "var(--shadow-card)",
              overflow: "hidden",
            }}
          >
            {/* Panel Header */}
            <div
              style={{
                padding: "24px 32px",
                borderBottom: "1px solid var(--border-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${activeGroupData.color}15`,
                    color: activeGroupData.color,
                  }}
                >
                  <activeGroupData.icon size={22} />
                </span>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "var(--text-xl)",
                      fontWeight: 700,
                    }}
                  >
                    {activeGroupData.label}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--text-xs)",
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {filledCount} of {activeFields.length} fields configured
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {Math.round((filledCount / activeFields.length) * 100)}%
                  complete
                </span>
                <div
                  style={{
                    width: 120,
                    height: 6,
                    background: "var(--border-light)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      width: `${(filledCount / activeFields.length) * 100}%`,
                      background:
                        filledCount === activeFields.length
                          ? "var(--color-success)"
                          : "var(--color-primary)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Fields */}
            <div
              style={{
                padding: "28px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {activeFields.map((field, idx) => {
                const isPassword = field.type === "password";
                const isRevealed = revealed[field.key];
                const hasValue = !!settings[field.key];
                const isSavingKey = saving === field.key;
                const isSavedKey = saved === field.key;

                return (
                  <div key={field.key}>
                    {idx > 0 && (
                      <div
                        style={{
                          height: 1,
                          background: "var(--border-light)",
                          marginBottom: 24,
                        }}
                      />
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <label
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 600,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {field.label}
                        {hasValue && (
                          <span
                            style={{
                              marginLeft: 6,
                              color: "var(--color-success)",
                              fontSize: 11,
                            }}
                          >
                            ✓ Set
                          </span>
                        )}
                      </label>
                      <code
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "var(--bg-secondary)",
                          color: "var(--text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {field.key}
                      </code>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1, position: "relative" }}>
                        <input
                          type={isPassword && !isRevealed ? "password" : "text"}
                          value={settings[field.key] || ""}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              [field.key]: e.target.value,
                            })
                          }
                          className="form-input"
                          style={{ paddingRight: isPassword ? 44 : 16 }}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() => toggleReveal(field.key)}
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              display: "flex",
                              padding: 0,
                            }}
                          >
                            {isRevealed ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleSave(field.key)}
                        disabled={isSavingKey}
                        className="btn btn-primary"
                        style={{
                          minWidth: 110,
                          gap: 6,
                          background: isSavedKey
                            ? "var(--color-success)"
                            : undefined,
                          transition: "background 0.3s ease",
                        }}
                      >
                        {isSavingKey ? (
                          <>
                            <Loader2
                              size={15}
                              style={{ animation: "spin 0.7s linear infinite" }}
                            />{" "}
                            Saving
                          </>
                        ) : isSavedKey ? (
                          <>
                            <CheckCircle2 size={15} /> Saved!
                          </>
                        ) : (
                          <>
                            <Save size={15} /> Update
                          </>
                        )}
                      </button>
                    </div>

                    {field.description && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 6,
                        }}
                      >
                        {field.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Info Banner ── */}
          <div
            style={{
              marginTop: 20,
              padding: "16px 20px",
              borderRadius: "var(--radius-xl)",
              background: "var(--color-primary-light)",
              border: "1px solid rgba(253,168,41,0.3)",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <Zap
              size={18}
              style={{
                color: "var(--color-primary-dark)",
                flexShrink: 0,
                marginTop: 1,
              }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: "var(--text-sm)",
                  color: "var(--color-primary-dark)",
                }}
              >
                Live Configuration
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#8a5f00" }}>
                Changes take effect immediately — no redeploy needed. If a value
                is not set here, the platform falls back to environment
                variables.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
