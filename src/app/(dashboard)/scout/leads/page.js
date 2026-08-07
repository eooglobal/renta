'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ScoutLeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const res = await fetch('/api/scout/leads');
                const data = await res.json();
                if (res.ok) setLeads(data);
            } catch (err) {
                console.error('Failed to fetch leads:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    const StatusBadge = ({ status }) => {
        const stylesMap = {
            'SUBMITTED': { bg: '#F3F4F6', color: '#4B5563', label: 'Pending Review' },
            'REVIEWING': { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
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
                padding: '4px 10px',
                borderRadius: '12px',
                display: 'inline-block'
            }}>
                {s.label}
            </span>
        );
    };

    return (
        <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        My Leads
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                        Track properties you have submitted for verification.
                    </p>
                </div>
                <Link href="/scout/leads/new" className="btn btn-primary btn-sm" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    + Submit New Lead
                </Link>
            </div>

            {/* Table or Loading / Empty States */}
            {loading ? (
                <div className="card text-center" style={{ padding: '40px 20px', color: 'var(--text-muted)' }}>
                    Loading leads...
                </div>
            ) : leads.length === 0 ? (
                <div className="card text-center" style={{ padding: '48px 24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '8px' }}>
                        No leads submitted yet
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                        Find unlisted rental properties in your neighborhood and earn 3% commission when a tenant rents them.
                    </p>
                    <Link href="/scout/leads/new" className="btn btn-primary btn-sm" style={{ padding: '8px 18px' }}>
                        Submit First Lead
                    </Link>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                <th style={{ padding: '12px 16px' }}>Date</th>
                                <th style={{ padding: '12px 16px' }}>Landlord Info</th>
                                <th style={{ padding: '12px 16px' }}>Area</th>
                                <th style={{ padding: '12px 16px' }}>Status</th>
                                <th style={{ padding: '12px 16px' }}>Listing</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{lead.landlordName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.landlordPhone}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: 'var(--text-main)' }}>
                                        {lead.propertyArea}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <StatusBadge status={lead.status} />
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {lead.properties && lead.properties.length > 0 ? (
                                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-success)' }}>
                                                Listed
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}