'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Phone, User, MapPin } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';

const FILTERS = ['', 'REQUESTED', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
const STATUSES = ['CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

const statusClass = (status) => {
  const map = {
    REQUESTED: 'badge-pending',
    CONTACTED: 'badge-info',
    SCHEDULED: 'badge-verified',
    COMPLETED: 'badge-verified',
    CANCELLED: 'badge-error',
  };
  return map[status] || 'badge-pending';
};

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

export default function AdminInspectionsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('REQUESTED');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const fetchRequests = async (statusFilter = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/inspections?${params}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load inspection requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(filter);
  }, [filter]);

  const updateDraft = (request, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [request.id]: {
        status: request.status === 'REQUESTED' ? 'CONTACTED' : request.status,
        scheduledAt: toDateTimeLocal(request.scheduledAt),
        assignedStaffId: request.assignedStaffId?.toString() || '',
        adminNote: request.adminNote || '',
        ...(prev[request.id] || {}),
        [field]: value,
      },
    }));
  };

  const draftFor = (request) => drafts[request.id] || {
    status: request.status === 'REQUESTED' ? 'CONTACTED' : request.status,
    scheduledAt: toDateTimeLocal(request.scheduledAt),
    assignedStaffId: request.assignedStaffId?.toString() || '',
    adminNote: request.adminNote || '',
  };

  const saveRequest = async (request) => {
    const draft = draftFor(request);
    setSavingId(request.id);
    try {
      const res = await fetch('/api/admin/inspections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          status: draft.status,
          scheduledAt: draft.scheduledAt || null,
          assignedStaffId: draft.assignedStaffId || null,
          adminNote: draft.adminNote || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update inspection request');
      }

      setDrafts((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
      await fetchRequests(filter);
    } catch (error) {
      console.error('Failed to update inspection request:', error);
      alert(error.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fade-in">
      <div className={styles.propertiesHeader}>
        <h3>Inspection Requests</h3>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {FILTERS.map((status) => (
            <button
              key={status || 'ALL'}
              onClick={() => setFilter(status)}
              className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-outline'}`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: '60px 0' }}>
          <div className="spinner" style={{ width: 32, height: 32 }}></div>
        </div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar size={42} />
          <h3>No inspection requests found</h3>
          <p>New tenant requests will appear here for staff follow-up.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Property</th>
                <th>Tenant</th>
                <th>Preference</th>
                <th>Status</th>
                <th>Staff Update</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const draft = draftFor(request);
                return (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.property?.title || 'Property'}</strong>
                      <div className="text-xs text-muted flex items-center gap-1">
                        <MapPin size={12} /> {request.property?.address || 'No address saved'}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <User size={12} /> {request.tenant?.firstName} {request.tenant?.lastName}
                        </span>
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Phone size={12} /> {request.tenantPhone || request.tenant?.phone || 'No phone'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} /> {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : 'No date'}
                        </div>
                        <div className="text-muted flex items-center gap-1">
                          <Clock size={12} /> {request.preferredTimeWindow || 'No time window'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusClass(request.status)}`}>{request.status}</span>
                    </td>
                    <td>
                      <div className="grid" style={{ gap: 'var(--space-2)', minWidth: 260 }}>
                        <select
                          className="form-input"
                          value={draft.status}
                          onChange={(e) => updateDraft(request, 'status', e.target.value)}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={draft.scheduledAt}
                          onChange={(e) => updateDraft(request, 'scheduledAt', e.target.value)}
                        />
                        <input
                          type="number"
                          className="form-input"
                          value={draft.assignedStaffId}
                          onChange={(e) => updateDraft(request, 'assignedStaffId', e.target.value)}
                          placeholder="Assigned staff ID"
                        />
                        <textarea
                          className="form-input"
                          rows={2}
                          value={draft.adminNote}
                          onChange={(e) => updateDraft(request, 'adminNote', e.target.value)}
                          placeholder="Staff note"
                        />
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={savingId === request.id}
                        onClick={() => saveRequest(request)}
                      >
                        {savingId === request.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}