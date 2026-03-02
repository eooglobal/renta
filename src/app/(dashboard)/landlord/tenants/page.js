'use client';

import { useState, useEffect } from 'react';
import { Users, Home, MapPin, Calendar, Phone, CheckCircle, Clock } from 'lucide-react';

export default function LandlordTenantsPage() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await fetch('/api/landlord/tenants');
                const data = await res.json();
                if (res.ok) setRentals(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchTenants();
    }, []);

    const activeCount = rentals.filter(r => r.status === 'ACTIVE').length;

    return (
        <div className="fade-in">
            <header className="mb-6">
                <h1 style={{ fontSize: 'var(--text-2xl)' }}>My Tenants</h1>
                <p className="text-muted">View tenants currently renting your properties.</p>
            </header>

            <div className="card mb-6" style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex items-center gap-4">
                    <Users size={24} style={{ color: 'var(--color-primary)' }} />
                    <div>
                        <p className="text-sm text-muted">Active Tenants</p>
                        <h3 style={{ fontSize: 'var(--text-2xl)' }}>{activeCount}</h3>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card text-center text-muted" style={{ padding: 'var(--space-8)' }}>Loading tenants...</div>
            ) : rentals.length === 0 ? (
                <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
                    <Users size={48} style={{ color: 'var(--text-light)', margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ fontSize: 'var(--text-lg)' }}>No tenants yet</h3>
                    <p className="text-muted text-sm mt-2">Once someone rents your property, they&apos;ll appear here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {rentals.map(rental => (
                        <div key={rental.id} className="card">
                            <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                                <div className="flex items-center gap-4">
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        background: 'var(--color-primary)', color: 'var(--color-black)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)', flexShrink: 0
                                    }}>
                                        {rental.tenant?.firstName?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold" style={{ fontSize: 'var(--text-base)' }}>
                                            {rental.tenant?.firstName} {rental.tenant?.lastName}
                                        </h4>
                                        <div className="flex gap-3 mt-1" style={{ flexWrap: 'wrap' }}>
                                            {rental.tenant?.phone && (
                                                <a href={`tel:${rental.tenant.phone}`} className="text-xs flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                                                    <Phone size={12} /> {rental.tenant.phone}
                                                </a>
                                            )}
                                            <span className="text-xs text-muted flex items-center gap-1">
                                                <Home size={12} /> {rental.property?.title}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`badge ${rental.status === 'ACTIVE' ? 'badge-verified' : 'badge-pending'} flex items-center gap-1`}>
                                        {rental.status === 'ACTIVE' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                        {rental.status}
                                    </span>
                                    <p className="text-xs text-muted mt-2">
                                        <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {new Date(rental.startDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}