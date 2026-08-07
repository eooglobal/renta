"use client";

import { useState, useEffect } from "react";
import { X, Megaphone } from "lucide-react";

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch("/api/announcement");
        if (res.ok) {
          const data = await res.json();
          if (data.active && data.text) {
            // Check if dismissed
            const dismissed = localStorage.getItem("renta_announcement_dismissed");
            if (dismissed !== data.text) {
              setAnnouncement(data.text);
              setVisible(true);
            } else {
              setVisible(false);
            }
          } else {
            setVisible(false);
            setAnnouncement(null);
          }
        }
      } catch (error) {
        // Silently ignore
      }
    };

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (announcement) {
      localStorage.setItem("renta_announcement_dismissed", announcement);
    }
  };

  if (!visible || !announcement) return null;

  return (
    <div
      style={{
        background: "var(--color-primary)",
        color: "#fff",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        boxShadow: "var(--shadow-sm)",
        position: "relative",
        zIndex: 50,
      }}
      className="fade-in"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, justifyContent: "center" }}>
        <Megaphone size={18} style={{ color: "#fff" }} />
        <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500, color: "#fff" }}>
          {announcement}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        aria-label="Dismiss announcement"
      >
        <X size={18} />
      </button>
    </div>
  );
}
