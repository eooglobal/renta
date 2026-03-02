'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, MapPin } from 'lucide-react';
import styles from '../../tenant/dashboard.module.css';

export default function LandlordPropertiesPage() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await fetch('/api/properties?landlordId=me');
            // Since our API uses landlordId from query, we need session-based filter
            // For now, fetch all and filter client-side, or use a dedicated endpoint
            const session = await fetch('/api/auth/session');
            const sessionData = await session.json();

            const propertiesRes = await fetch(`/api/properties?landlordId=${sessionData?.user?.id}`);
            const data = await propertiesRes.json();
            setProperties(data.properties || []);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            PENDING: 'badge-pending',
            VERIFIED: 'badge-verified',
            RENTED: 'badge-info',
            INACTIVE: 'badge-error',
        };
        return map[status] || 'badge-pending';
    };

    const formatType = (type) => {
        const map = {
            SELF_CON: 'Self Contained',
            SINGLE_ROOM: 'Single Room',
            FLAT: 'Flat',
            TWO_BEDROOM: '2 Bedroom',
            THREE_BEDROOM: '3 Bedroom',
        };
        return map[type] || type;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center" style={{ minHeight: '300px' }}>
                <div className="spinner" style={{ width: 32, height: 32 }}></div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className={styles.propertiesHeader}>
                <h3>My Properties</h3>
                <Link href="/landlord/properties/new" className="btn btn-primary">
                    + Add Property
                </Link>
            </div>

            {properties.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><Home size={48} /></div>
                    <h3>No properties yet</h3>
                    <p>Start by adding your first property. It will be verified by our team before going live.</p>
                    <Link href="/landlord/properties/new" className="btn btn-primary">
                        Add Your First Property
                    </Link>
                </div>
            ) : (
                <div className={styles.propertyGrid}>
                    {properties.map(property => (
                        <Link key={property.id} href={`/landlord/properties/${property.id}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className={styles.propertyCard} style={{ cursor: 'pointer' }}>
                                <div className={styles.propertyImage}>
                                    {property.images?.[0] ? (
                                        <img src={property.images[0].url} alt={property.title} />
                                    ) : (
                                        <span>No Image</span>
                                    )}
                                    <div className={styles.propertyBadge}>
                                        <span className={`badge ${getStatusBadge(property.status)}`}>
                                            {property.status}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.propertyInfo}>
                                    <h4>{property.title}</h4>
                                    <div className={styles.propertyMeta}>
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {property.area}</span>
                                        <span className="flex items-center gap-1"><Home size={14} /> {formatType(property.type)}</span>
                                    </div>
                                    <div className={styles.propertyPrice}>
                                        ₦{Number(property.rentPrice).toLocaleString()}
                                        <span> /year</span>
                                    </div>
                                    <p className="text-xs mt-2" style={{ color: 'var(--color-primary)' }}>Click to edit →</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
