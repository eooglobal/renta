'use client';

import { useState, useEffect } from 'react';
import { Phone, CheckCircle, XCircle, Clock, MapPin, AlertCircle, FileText, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';
import { formatDisplayId } from '@/lib/idFormatter';

export default function AdminScoutLeadsPage() {
  const { data: session } = useSession();
  const toast = useToast();
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  
  // Custom Confirmation Modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    leadId: null,
    targetStatus: '',
    actionLoading: false
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch leads');
      setLeads(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const openConfirmModal = (leadId, targetStatus) => {
    setConfirmState({
      isOpen: true,
      leadId,
      targetStatus,
      actionLoading: false
    });
  };

  const handleConfirmStatusChange = async () => {
    const { leadId, targetStatus } = confirmState;
    if (!leadId || !targetStatus) return;

    setConfirmState(prev => ({ ...prev, actionLoading: true }));

    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update lead status');

      toast.success('Lead Updated', `Lead ${formatDisplayId('SLD', leadId)} status changed to ${targetStatus}.`);
      setConfirmState({ isOpen: false, leadId: null, targetStatus: '', actionLoading: false });
      fetchLeads();
    } catch (err) {
      toast.error('Action Failed', err.message || 'Could not update lead status.');
      setConfirmState(prev => ({ ...prev, actionLoading: false }));
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const stylesMap = {
      'SUBMITTED': { bg: '#F3F4F6', color: '#4B5563', label: 'Pending Review' },
      'REVIEWING': { bg: '#FEF3C7', color: '#92400E', label: 'In Review' },
      'APPROVED': { bg: '#D1FAE5', color: '#065F46', label: 'Verified & Listed' },
      'REJECTED': { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' }
    };
    const s = stylesMap[status] || stylesMap['SUBMITTED'];
    return (
      <span style={{
        background: s.bg,
        color: s.color,
        fontSize: '0.75rem',
        fontWeight: '600',
        padding: '3px 10px',
        borderRadius: '12px',
        display: 'inline-block'
      }}>
        {s.label}
      </span>
    );
  };

  // Role-based access check
  if (session?.user?.role === 'ADMIN' && session?.user?.adminRole === 'SUPPORT') {
    return (
      <div className="fade-in flex flex-col items-center justify-center p-12 text-center">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertCircle className="text-red-500" size={48} />
        </div>
        <h3>Access Denied</h3>
        <p className="text-muted max-w-md">
          Support staff are restricted from viewing or managing Scout Leads.
          Please contact a Super Admin if you believe this is an error.
        </p>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-muted">Loading scout leads queue...</div>;
  if (error) return <div className="p-8 text-danger text-center">{error}</div>;

  // Filtered Leads
  const filteredLeads = filter === 'ALL' ? leads : leads.filter(l => l.status === filter);

  // Metrics
  const totalCount = leads.length;
  const submittedCount = leads.filter(l => l.status === 'SUBMITTED').length;
  const reviewingCount = leads.filter(l => l.status === 'REVIEWING').length;
  const approvedCount = leads.filter(l => l.status === 'APPROVED').length;

  return (
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
          Scout Leads Queue
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          Review landlord contacts, verify unlisted rental properties, and publish listings.
        </p>
      </div>

      {/* Metrics Header Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Total Leads</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>{totalCount}</span>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pending Review</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>{submittedCount}</span>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>In Review</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#D97706' }}>{reviewingCount}</span>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Verified & Listed</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#059669' }}>{approvedCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: 'ALL', label: `All (${totalCount})` },
          { key: 'SUBMITTED', label: `Pending (${submittedCount})` },
          { key: 'REVIEWING', label: `In Review (${reviewingCount})` },
          { key: 'APPROVED', label: `Approved (${approvedCount})` },
          { key: 'REJECTED', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '16px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={`Update Lead ${formatDisplayId('SLD', confirmState.leadId)}`}
        message={`Are you sure you want to change this lead's status to "${confirmState.targetStatus}"?`}
        confirmText={confirmState.targetStatus === 'APPROVED' ? 'Approve & List' : confirmState.targetStatus === 'REJECTED' ? 'Reject Lead' : 'Proceed'}
        variant={confirmState.targetStatus === 'REJECTED' ? 'danger' : 'primary'}
        loading={confirmState.actionLoading}
        onConfirm={handleConfirmStatusChange}
        onClose={() => setConfirmState({ isOpen: false, leadId: null, targetStatus: '', actionLoading: false })}
      />

      {/* Leads List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            className="card"
            style={{
              padding: '20px 24px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            {/* Top Row: Ref ID + Status + Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '14px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  background: 'var(--bg-secondary)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)'
                }}>
                  {formatDisplayId('SLD', lead.id)}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  {lead.landlordName}
                </h3>
                <StatusBadge status={lead.status} />
              </div>

              {/* Actions Header Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {lead.status === 'SUBMITTED' && (
                  <button
                    onClick={() => openConfirmModal(lead.id, 'REVIEWING')}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    <Clock size={14} style={{ marginRight: '4px' }} /> Start Review
                  </button>
                )}

                {(lead.status === 'SUBMITTED' || lead.status === 'REVIEWING') && (
                  <>
                    <button
                      onClick={() => openConfirmModal(lead.id, 'APPROVED')}
                      className="btn btn-primary btn-sm"
                      style={{
                        background: '#059669',
                        borderColor: '#059669',
                        color: '#fff',
                        fontSize: '0.8rem',
                        padding: '6px 14px'
                      }}
                    >
                      <CheckCircle size={14} style={{ marginRight: '4px' }} /> Approve & List
                    </button>
                    <button
                      onClick={() => openConfirmModal(lead.id, 'REJECTED')}
                      className="btn btn-outline btn-sm"
                      style={{
                        color: 'var(--color-error)',
                        borderColor: 'var(--color-error)',
                        fontSize: '0.8rem',
                        padding: '6px 12px'
                      }}
                    >
                      <XCircle size={14} style={{ marginRight: '4px' }} /> Reject
                    </button>
                  </>
                )}

                {lead.status === 'APPROVED' && (
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={15} /> Verified & Listed
                  </span>
                )}
              </div>
            </div>

            {/* Details Body Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              fontSize: '0.875rem'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
                  Property Location & Address
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-main)', fontWeight: '500' }}>
                  <MapPin size={16} style={{ shrink: 0, marginTop: '2px', color: 'var(--text-muted)' }} />
                  <span>{lead.propertyAddress}, <strong>{lead.propertyArea}</strong></span>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
                  Landlord Phone Number
                </div>
                <a
                  href={`tel:${lead.landlordPhone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                  {lead.landlordPhone}
                </a>
              </div>
            </div>

            {/* Scout Notes (if provided) */}
            {lead.notes && (
              <div style={{
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginTop: '14px',
                fontSize: '0.825rem',
                color: '#92400E'
              }}>
                <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '0.75rem', display: 'block', marginBottom: '2px' }}>
                  Scout Notes:
                </span>
                {lead.notes}
              </div>
            )}

            {/* Footer Metadata */}
            <div style={{ marginTop: '12px', fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} />
              Submitted by Scout <strong style={{ color: 'var(--text-main)' }}>{formatDisplayId('USR', lead.scoutId)}</strong> on {new Date(lead.createdAt).toLocaleDateString()}
            </div>

          </div>
        ))}

        {filteredLeads.length === 0 && (
          <div className="card text-center" style={{ padding: '48px 24px', color: 'var(--text-muted)' }}>
            No scout leads matching the selected status.
          </div>
        )}
      </div>

    </div>
  );
}
