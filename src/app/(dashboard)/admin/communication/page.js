"use client";

import { useState, useEffect } from "react";
import { Send, Megaphone, Loader2, Mail, Users, CheckCircle2, AlertTriangle } from "lucide-react";

export default function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState("email");
  
  // Email State
  const [audience, setAudience] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  // Announcement State
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementStatus, setAnnouncementStatus] = useState(null);

  useEffect(() => {
    // Fetch current announcement state
    fetch("/api/announcement")
      .then((res) => res.json())
      .then((data) => {
        if (data.text) setAnnouncementText(data.text);
        setAnnouncementActive(data.active || false);
      })
      .catch(() => {});
  }, []);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setSendingEmail(true);
    setEmailStatus(null);

    try {
      const res = await fetch("/api/admin/communication/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, subject, body }),
      });
      const data = await res.json();

      if (res.ok) {
        setEmailStatus({ type: "success", message: `Successfully queued email to ${data.count} users.` });
        setSubject("");
        setBody("");
      } else {
        setEmailStatus({ type: "error", message: data.error || "Failed to send email." });
      }
    } catch (err) {
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
    } catch (err) {
      setAnnouncementStatus({ type: "error", message: "A network error occurred." });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  return (
    <div className="fade-in dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Communication Center</h1>
          <p className="page-description">Send emails to user segments and manage global announcements.</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24, display: 'flex', gap: 16, borderBottom: '1px solid var(--border-light)' }}>
        <button
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'email' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'email' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Mail size={18} /> Email Dispatcher
        </button>
        <button
          className={`tab ${activeTab === 'announcement' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcement')}
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'announcement' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'announcement' ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Megaphone size={18} /> Global Announcement
        </button>
      </div>

      {activeTab === 'email' && (
        <div className="dashboard-surface" style={{ maxWidth: 700 }}>
          <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                Target Audience
              </label>
              <select 
                className="form-input" 
                value={audience} 
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="ALL">All Active Users</option>
                <option value="TENANT">Tenants Only</option>
                <option value="LANDLORD">Landlords Only</option>
                <option value="SCOUT">Scouts Only</option>
                <option value="AFFILIATE">Affiliates Only</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                Email Subject
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                Email Body (HTML supported)
              </label>
              <textarea
                className="form-input"
                placeholder="Compose your email here..."
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </div>

            {emailStatus && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                background: emailStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: emailStatus.type === 'success' ? '#166534' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 500
              }}>
                {emailStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {emailStatus.message}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={sendingEmail}
              style={{ display: 'flex', justifyContent: 'center', gap: 8 }}
            >
              {sendingEmail ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
              {sendingEmail ? 'Dispatching...' : 'Send Broadcast'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'announcement' && (
        <div className="dashboard-surface" style={{ maxWidth: 700 }}>
          <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                Announcement Text
              </label>
              <textarea
                className="form-input"
                placeholder="Enter the announcement message to display on user dashboards..."
                rows={4}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'var(--bg-secondary)', borderRadius: 12 }}>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                <input
                  type="checkbox"
                  style={{ opacity: 0, width: 0, height: 0 }}
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: announcementActive ? 'var(--color-primary)' : '#ccc',
                  transition: '.4s',
                  borderRadius: 24
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: 18,
                    width: 18,
                    left: announcementActive ? 22 : 3,
                    bottom: 3,
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Enable Global Banner</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>If enabled, this announcement will show at the top of every dashboard.</span>
              </div>
            </div>

            {announcementStatus && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                background: announcementStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: announcementStatus.type === 'success' ? '#166534' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 500
              }}>
                {announcementStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                {announcementStatus.message}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={savingAnnouncement}
              style={{ display: 'flex', justifyContent: 'center', gap: 8 }}
            >
              {savingAnnouncement ? <Loader2 size={18} className="spin" /> : <Megaphone size={18} />}
              {savingAnnouncement ? 'Saving...' : 'Save Announcement'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
