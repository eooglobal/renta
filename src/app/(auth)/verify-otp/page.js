"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Resend timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue && value !== "") return;

    const newDigits = [...digits];
    
    // Handle pasting complete 6-digit code
    if (cleanValue.length > 1) {
      const pastedCode = cleanValue.slice(0, 6).split("");
      pastedCode.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleanValue.slice(-1);
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpCode = digits.join("");
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      setError("Email address is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to verify code. Please check and try again.");
        setLoading(false);
        return;
      }

      setSuccess("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      setError("Network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to resend code.");
      } else {
        setSuccess("A new 6-digit verification code has been sent!");
        setTimer(60);
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Failed to resend code. Network error.");
    } finally {
      setResending(false);
    }
  };

  const maskEmail = (str) => {
    if (!str || !str.includes("@")) return str;
    const [name, domain] = str.split("@");
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-secondary, #F4F4F0)",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#FFFFFF",
          borderRadius: "24px",
          padding: "40px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
          border: "1px solid var(--border-light, #E5E5E0)",
        }}
      >
        {/* Header Icon */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#FFF8EB",
              color: "#FDA829",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 800,
              color: "#1A1A1A",
              letterSpacing: "-0.5px",
            }}
          >
            Verify Your Account
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "14px",
              color: "#666666",
              lineHeight: 1.5,
            }}
          >
            We sent a 6-digit verification code to{" "}
            <strong style={{ color: "#000000" }}>{maskEmail(email) || "your email"}</strong> and phone.
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              color: "#166534",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit}>
          {!emailParam && (
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#444",
                  marginBottom: "6px",
                }}
              >
                Your Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="form-input"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #E5E5E0",
                  fontSize: "14px",
                }}
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "28px",
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: "48px",
                  height: "56px",
                  borderRadius: "12px",
                  border: digit ? "2px solid #FDA829" : "1px solid #E5E5E0",
                  background: digit ? "#FFFDF5" : "#FAFAFA",
                  textAlign: "center",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#000000",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "50px",
              background: "#FDA829",
              color: "#000000",
              fontWeight: 800,
              fontSize: "15px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(253, 168, 41, 0.35)",
              transition: "transform 0.2s ease",
            }}
          >
            {loading ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <span>Complete Verification</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Resend Section */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
            Didn't receive the code?{" "}
            {timer > 0 ? (
              <span style={{ color: "#999", fontWeight: 600 }}>
                Resend in {timer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FDA829",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            )}
          </p>
        </div>

        {/* Footer Link */}
        <div style={{ marginTop: "28px", textAlign: "center", borderTop: "1px solid #F0F0EE", paddingTop: "20px" }}>
          <Link
            href="/login"
            style={{
              fontSize: "13px",
              color: "#666666",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading verification...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
