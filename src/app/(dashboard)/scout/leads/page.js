'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, List, Home, Clock, CheckCircle, XCircle } from 'lucide-react';

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
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    const StatusBadge = ({ status }) => {
        const mapping = {
            'SUBMITTED': { cl: 'badge-secondary', icon: <List size={14} />, label: 'Pending Review' },
            'REVIEWING': { cl: 'badge-warning', icon: <Clock size={14} />, label: 'In Progress' },
            'APPROVED': { cl: 'badge-success', icon: <CheckCircle size={14} />, label: 'Verified & Listed' },
            'REJECTED': { cl: 'badge-danger', icon: <XCircle size={14} />, label: 'Rejected' }
        };
        const m = mapping[status] || mapping['SUBMITTED'];
        return <span className={`badge flex items-center gap-1 ${m.cl}`}>{m.icon} {m.label}</span>;
    };

    return (
        <div className="fade-in">
            <header className="mb-6 flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">My Leads</h1>
                    <p className="text-muted">Track the properties you've submitted for verification.</p>
                </div>
                <Link href="/scout/leads/new" className="btn btn-primary flex gap-2 items-center">
                    <Plus size={16} /> Submit New Lead
                </Link>
            </header>

            {loading ? (
                <div className="card text-center p-12">Loading leads...</div>
            ) : leads.length === 0 ? (
                <div className="card text-center p-12">
                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-full mx-auto mb-4 text-muted">
                        <Home size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No leads submitted yet</h3>
                    <p className="text-muted mb-6">Find unlisted rental properties in your area and earn 3% commission when they rent.</p>
                    <Link href="/scout/leads/new" className="btn btn-primary">Start Scouting</Link>
                </div>
            ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table className="table w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4">Submission Date</th>
                                <th className="p-4">Landlord</th>
                                <th className="p-4">Area</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Linked Property</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-4 text-sm whitespace-nowrap">
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium">{lead.landlordName}</div>
                                        <div className="text-xs text-muted">{lead.landlordPhone}</div>
                                    </td>
                                    <td className="p-4">{lead.propertyArea}</td>
                                    <td className="p-4"><StatusBadge status={lead.status} /></td>
                                    <td className="p-4">
                                        {lead.properties && lead.properties.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <Home size={14} className="text-primary" />
                                                <span className="font-medium text-sm">Yes, Listed</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted text-sm">-</span>
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