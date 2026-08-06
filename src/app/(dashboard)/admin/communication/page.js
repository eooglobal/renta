"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send, Megaphone, Loader2, Mail, Users,
  CheckCircle2, AlertTriangle, Search, X, UserCheck
} from "lucide-react";

export default function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState("email");

  // Email State
  const [mode, setMode] = useState("broadcast"); // 'broadcast' | 'specific'
  const [audience, setAudience] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  // Specific user search
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchDebounce = useRef(null);

  // Announcement State
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementStatus, setAnnouncementStatus] = useState(null);

  useEffect(() => {
    fetch("/api/announcement")
      .then((res) => res.json())
      .then((data) => {
        if (data.text) setAnnouncementText(data.text);
        setAnnouncementActive(data.active || false);
      })
      .catch(() => {});
  }, []);

  // Debounced user search
  useEffect(() => {
    if (mode !== "specific" || !userSearch.trim()) {
      setUserResults([]);
      return;
    }
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&limit=10`);
        const data = await res.json();
        setUserResults((data.users || []).filter(u => !selectedUsers.find(s => s.id === u.id)));
      } catch {
        setUserResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [userSearch, mode]);

  const addUser = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    setUserSearch("");
    setUserResults([]);
  };

  const removeUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (mode === "specific" && selectedUsers.length === 0) {
      setEmailStatus({ type: "error", message: "Please search and add at least one recipient." });
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);

    try {
      const payload = mode === "broadcast"
        ? { audience, subject, body }
        : { specificUserIds: selectedUsers.map(u => u.id), subject, body };

      const res = await fetch("/api/admin/communication/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setEmailStatus({ type: "success", message: `Successfully sent email to ${data.count} user(s).` });
        setSubject("");
        setBody("");
        setSelectedUsers([]);
      } else {
        setEmailStatus({ type: "error", message: data.error || "Failed to send email." });
      }
    } catch {
      setEmailStatus({ type: "error", message: "A network error occurred." });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    setAnnouncementStatus(null);

    try {
      const res = await fetch("/api/admin/communication/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: announcementActive, text: announcementText }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncementStatus({ type: "success", message: "Global announcement updated successfully." });
      } else {
        setAnnouncementStatus({ type: "error", message: data.error || "Failed to update announcement." });
      }
    } catch {
      setAnnouncementStatus({ type: "error", message: "A network error occurred." });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const tabStyle = (tab) => ({
    padding: "10px 16px",
    background: "none",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
    color: activeTab === tab ? "var(--color-primary)" : "var(--text-secondary)",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "var(--text-sm)",
  });

  return (
    <div className="fade-in">
      {/* Compact page header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Communication Center</h2>
        <p className="text-muted" style={{ margin: "4px 0 0", fontSize: "var(--text-sm)" }}>
          Send emails to user segments and manage global announcements.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-light)", marginBottom: 24 }}>
        <button style={tabStyle("email")} onClick={() => setActiveTab("email")}>
          <Mail size={16} /> Email Dispatcher
        </button>
        <button style={tabStyle("announcement")} onClick={() => setActiveTab("announcement")}>
          <Megaphone size={16} /> Global Announcement
        </button>
      </div>

      {activeTab === "email" && (
        <div className="card" style={{ maxWidth: 680 }}>
          <form onSubmit={handleSendEmail} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Mode Toggle */}
            <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: 10, padding: 4, gap: 4 }}>
              <button
                type="button"
                onClick={() => { setMode("broadcast"); setSelectedUsers([]); }}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: mode === "broadcast" ? "var(--bg-card)" : "transparent",
                  fontWeight: 600, fontSize: "var(--text-sm)",
                  boxShadow: mode === "broadcast" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  color: mode === "broadcast" ? "var(--color-primary)" : "var(--text-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                <Users size={15} /> Broadcast
              </button>
              <button
                type="button"
                onClick={() => setMode("specific")}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: mode === "specific" ? "var(--bg-card)" : "transparent",
                  fontWeight: 600, fontSize: "var(--text-sm)",
                  boxShadow: mode === "specific" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  color: mode === "specific" ? "var(--color-primary)" : "var(--text-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                <UserCheck size={15} /> Specific Users
              </button>
            </div>

            {/* Broadcast: Audience Selector */}
            {mode === "broadcast" && (
              <div>
                <label className="form-label">Target Audience</label>
                <select className="form-input" value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="ALL">All Active Users</option>
                  <option value="TENANT">Tenants Only</option>
                  <option value="LANDLORD">Landlords Only</option>
                  <option value="SCOUT">Scouts Only</option>
                  <option value="AFFILIATE">Affiliates Only</option>
                </select>
              </div>
            )}

            {/* Specific: User Search */}
            {mode === "specific" && (
              <div>
                <label className="form-label">Search Recipients</label>
                {/* Selected users chips */}
                {selectedUsers.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {selectedUsers.map(u => (
                      <span key={u.id} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "var(--color-primary-light)", color: "var(--color-primary-dark)",
                        borderRadius: 20, padding: "4px 10px", fontSize: 13, fontWeight: 500
                      }}>
                        {u.firstName} {u.lastName}
                        <button type="button" onClick={() => removeUser(u.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "inherit" }}>
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ paddingLeft: 36 }}
                  />
                  {/* Dropdown results */}
                  {(userResults.length > 0 || searching) && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                      background: "var(--bg-card)", border: "1px solid var(--border-light)",
                      borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 100, overflow: "hidden"
                    }}>
                      {searching && <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>Searching...</div>}
                      {userResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => addUser(u)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            width: "100%", padding: "10px 16px", border: "none",
                            background: "none", textAlign: "left", cursor: "pointer",
                            borderBottom: "1px solid var(--border-light)"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "var(--color-primary-light)", color: "var(--color-primary)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 13, flexShrink: 0
                          }}>
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.firstName} {u.lastName}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email} · {u.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="form-label">Email Subject</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="form-label">Email Body <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(HTML supported)</span></label>
              <textarea
                className="form-input"
                placeholder="Compose your email here..."
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>

            {/* Status */}
            {emailStatus && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: emailStatus.type === "success" ? "#dcfce7" : "#fee2e2",
                color: emailStatus.type === "success" ? "#166534" : "#991b1b",
                display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500
              }}>
                {emailStatus.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {emailStatus.message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sendingEmail}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
            >
              {sendingEmail ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              {sendingEmail ? "Dispatching..." : "Send Broadcast"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "announcement" && (
        <div className="card" style={{ maxWidth: 680 }}>
          <form onSubmit={handleSaveAnnouncement} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label className="form-label">Announcement Text</label>
              <textarea
                className="form-input"
                placeholder="Enter the announcement message to display on user dashboards..."
                rows={4}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "var(--bg-secondary)", borderRadius: 12 }}>
              <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, flexShrink: 0 }}>
                <input
                  type="checkbox"
                  style={{ opacity: 0, width: 0, height: 0 }}
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                />
                <span style={{
                  position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: announcementActive ? "var(--color-primary)" : "#ccc",
                  transition: ".4s", borderRadius: 24
                }}>
                  <span style={{
                    position: "absolute", height: 18, width: 18,
                    left: announcementActive ? 22 : 3, bottom: 3,
                    backgroundColor: "white", transition: ".4s", borderRadius: "50%"
                  }} />
                </span>
              </label>
              <div>
                <strong style={{ display: "block", fontSize: 14 }}>Enable Global Banner</strong>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>If enabled, this announcement will show at the top of every dashboard.</span>
              </div>
            </div>

            {announcementStatus && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: announcementStatus.type === "success" ? "#dcfce7" : "#fee2e2",
                color: announcementStatus.type === "success" ? "#166534" : "#991b1b",
                display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500
              }}>
                {announcementStatus.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {announcementStatus.message}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingAnnouncement}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
            >
              {savingAnnouncement ? <Loader2 size={16} className="spin" /> : <Megaphone size={16} />}
              {savingAnnouncement ? "Saving..." : "Save Announcement"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
