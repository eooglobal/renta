'use client';

import { useState, useEffect } from 'react';
import { FileText, Building, User, MapPin, Calendar, ExternalLink } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';

export default function AdminRentalsPage() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchRentals = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filter) params.set('status', filter);
                const res = await fetch(`/api/admin/rentals?${params}`);
                const data = await res.json();
                setRentals(data.rentals || []);
            } catch (error) {
                console.error('Failed to load rentals:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRentals();
    }, [filter]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return 'var(--color-success)';
            case 'PENDING': return 'var(--color-warning)';
            case 'COMPLETED': return 'var(--color-gray-500)';
            case 'DISPUTED': return 'var(--color-error)';
            case 'CANCELLED': return 'var(--color-error)';
            default: return 'var(--color-gray-500)';
        }
    };

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <h3>Rental Management</h3>
                <div className="flex gap-2">
                    {['', 'PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED'].map(status => (
                        <button key={status} onClick={() => setFilter(status)}
                            className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-outline'}`}>
                            {status || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center" style={{ padding: '60px 0' }}>
                    <div className="spinner" style={{ width: 32, height: 32 }}></div>
                </div>
            ) : rentals.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📄</div>
                    <h3>No rentals found</h3>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Tenant</th>
                                <th>Landlord</th>
                                <th>Amount</th>
                                <th>Duration</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rentals.map(rental => (
                                <tr key={rental.id}>
                                    <td>
                                        <div className="flex flex-col">
                                            <strong>{rental.property.title}</strong>
                                            <span className="text-xs text-muted">
                                                <MapPin size={10} /> {rental.property.area?.name || rental.property.area}, {rental.property.city?.name || rental.property.city}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span>{rental.tenant.firstName} {rental.tenant.lastName}</span>
                                            <span className="text-xs text-muted">{rental.tenant.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span>{rental.property.landlord.firstName} {rental.property.landlord.lastName}</span>
                                            <span className="text-xs text-muted">{rental.property.landlord.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <strong>₦{Number(rental.totalPaid).toLocaleString()}</strong>
                                    </td>
                                    <td>
                                        <div className="text-xs">
                                            <div>{new Date(rental.startDate).toLocaleDateString()}</div>
                                            <div className="text-muted">to</div>
                                            <div>{new Date(rental.endDate).toLocaleDateString()}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: getStatusColor(rental.status), color: 'white' }}>
                                            {rental.status}
                                        </span>
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