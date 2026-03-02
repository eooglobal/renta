'use client';

import { useState, useEffect } from 'react';
import { Phone, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';

export default function AdminScoutLeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLeads = async () => {
        try {
            setLoading(true);
            // Reusing existing API (but server-side is scout-only for GET currently). 
            // Wait, we need an admin GET route for leads.
            const res = await fetch('/api/admin/leads');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
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

    const updateStatus = async (id, status) => {
        if (!confirm(`Are you sure you want to mark this lead as ${status}?`)) return;
        try {
            const res = await fetch(`/api/admin/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Failed to update status');
            fetchLeads();
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading leads...</div>;
    if (error) return <div className="p-8 text-danger text-center">{error}</div>;

    return (
        <div className="fade-in">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold">Scout Leads Queue</h1>
                    <p className="text-muted">Review, call landlords, and verify submitted properties.</p>
                </div>
            </header>

            <div className="grid gap-4">
                {leads.map(lead => (
                    <div key={lead.id} className="card p-6 border flex flex-col md:flex-row gap-6 items-start justify-between hover:border-gray-300 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-lg">{lead.landlordName}</h3>
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-medium">
                                    {lead.status}
                                </span>
                            </div>

                            <div className="text-sm text-gray-700 space-y-2 mb-4">
                                <p className="flex items-center gap-2"><MapPin size={16} className="text-muted" /> {lead.propertyAddress}, {lead.propertyArea}</p>
                                <p className="flex items-center gap-2">
                                    <Phone size={16} className="text-muted" />
                                    <a href={`tel:${lead.landlordPhone}`} className="text-primary hover:underline">{lead.landlordPhone}</a>
                                </p>
                                {lead.notes && (
                                    <div className="bg-yellow-50 p-3 rounded border border-yellow-100 mt-3 text-yellow-800">
                                        <span className="font-bold text-xs uppercase mb-1 block">Scout Notes:</span>
                                        {lead.notes}
                                    </div>
                                )}
                            </div>

                            <p className="text-xs text-muted">Submitted by Scout ID: {lead.scoutId} on {new Date(lead.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                            {lead.status === 'SUBMITTED' && (
                                <button onClick={() => updateStatus(lead.id, 'REVIEWING')} className="btn btn-outline flex justify-center items-center gap-2">
                                    <Clock size={16} /> Start Review
                                </button>
                            )}

                            {(lead.status === 'SUBMITTED' || lead.status === 'REVIEWING') && (
                                <>
                                    <button onClick={() => updateStatus(lead.id, 'APPROVED')} className="btn btn-primary bg-green-600 hover:bg-green-700 border-none flex justify-center items-center gap-2">
                                        <CheckCircle size={16} /> Approve & List
                                    </button>
                                    <button onClick={() => updateStatus(lead.id, 'REJECTED')} className="btn btn-outline text-danger border-danger hover:bg-red-50 flex justify-center items-center gap-2">
                                        <XCircle size={16} /> Reject
                                    </button>
                                </>
                            )}

                            {lead.status === 'APPROVED' && (
                                <div className="text-green-600 flex items-center gap-2 font-medium bg-green-50 px-4 py-2 rounded">
                                    <CheckCircle size={18} /> Lead Verified
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {leads.length === 0 && (
                    <div className="card text-center p-12 text-muted">No scout leads in the queue.</div>
                )}
            </div>
        </div>
    );
}
