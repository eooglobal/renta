'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    MapPin, Home as HomeIcon, CheckCircle, ArrowLeft,
    Bed, Bath, SquareSigma, Calendar, ShieldCheck, Info
} from 'lucide-react';
import styles from './listing.module.css';

// Dynamically import the map to avoid SSR issues with window being undefined
const MapLocation = dynamic(() => import('@/components/MapLocation'), {
    ssr: false,
    loading: () => <div style={{ height: 300, background: '#f3f4f6', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>
});

const formatType = (type) => {
    return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
};

export default function TenantPropertyDetails() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();

    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`/api/properties/${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to fetch property details');
                setProperty(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id]);

    const handleInitializePayment = async () => {
        try {
            const res = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: id })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Redirect to Paystack
            window.location.href = data.data.authorization_url;
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center" style={{ padding: '100px 0' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="fade-in">
                <Link href="/tenant/search" className="btn btn-outline mb-4">
                    <span className="flex items-center gap-2"><ArrowLeft size={16} /> Back to Search</span>
                </Link>
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--color-danger)' }}>Property Not Found</h3>
                    <p className="text-muted mt-2">{error || "The property you're looking for doesn't exist or has been removed."}</p>
                </div>
            </div>
        );
    }

    const { breakdown } = property;
    const isAvailable = property.status === 'AVAILABLE';

    return (
        <div className={`fade-in ${styles.container}`}>
            <Link href="/tenant/search" className="btn btn-outline" style={{ display: 'inline-flex', marginBottom: 'var(--space-6)', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> Back to Search
            </Link>

            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <h1>{property.title}</h1>
                    <div className={styles.meta}>
                        <span className="flex items-center gap-1"><MapPin size={16} /> {property.area}</span>
                        <span className="flex items-center gap-1"><HomeIcon size={16} /> {formatType(property.type)}</span>
                        {property.verificationStatus === 'VERIFIED' && (
                            <span className="badge badge-verified"><CheckCircle size={14} /> Verified</span>
                        )}
                        <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`}>
                            {property.status}
                        </span>
                    </div>
                </div>

                <div className={styles.priceArea}>
                    <div className={styles.price}>
                        ₦{Number(property.rentPrice).toLocaleString()} <sub>/yr</sub>
                    </div>
                    {breakdown && (
                        <div className={styles.totalPrice}>
                            Total: ₦{Number(breakdown.total).toLocaleString()} (inc. 10% fee)
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.content}>
                    {/* Image Gallery */}
                    <div className={styles.images}>
                        {property.images && property.images.length > 0 ? (
                            <>
                                <img
                                    src={property.images[activeImage].url}
                                    className={styles.mainImage}
                                    alt={`${property.title} view ${activeImage + 1}`}
                                />
                                {property.images.length > 1 && (
                                    <div className={styles.thumbnailGrid}>
                                        {property.images.map((img, i) => (
                                            <img
                                                key={img.id}
                                                src={img.url}
                                                className={`${styles.thumbnail} ${i === activeImage ? styles.active : ''}`}
                                                onClick={() => setActiveImage(i)}
                                                alt={`Thumbnail ${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={styles.mainImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <HomeIcon size={64} style={{ opacity: 0.2 }} />
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <Info size={20} className="text-primary" /> About This Property
                        </h3>
                        <p>{property.description}</p>
                    </div>

                    {/* Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <ShieldCheck size={20} className="text-primary" /> Amenities & Features
                            </h3>
                            <div className={styles.amenitiesList}>
                                {property.amenities.map((amenity, i) => (
                                    <span key={i} className={styles.amenity}>✓ {amenity}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Map */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <MapPin size={20} className="text-primary" /> Location
                        </h3>
                        <p className="text-muted mb-4">Approximate location in {property.area}</p>
                        <MapLocation address={property.area} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarSection}>
                        <h3 className={styles.sectionTitle}>Payment Summary</h3>

                        {breakdown && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-6) 0' }}>
                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span className="text-muted">Rent Price</span>
                                    <span>₦{Number(breakdown.rentPrice).toLocaleString()}</span>
                                </li>
                                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span className="text-muted">Renta Service Fee (10%)</span>
                                    <span>₦{Number(breakdown.serviceFee).toLocaleString()}</span>
                                </li>
                                <li style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-gray-200)', fontWeight: 'bold' }}>
                                    <span>Total Required</span>
                                    <span className="text-primary">₦{Number(breakdown.total).toLocaleString()}</span>
                                </li>
                            </ul>
                        )}

                        {isAvailable ? (
                            <>
                                <button
                                    className="btn btn-primary btn-lg"
                                    style={{ width: '100%', marginBottom: '12px' }}
                                    onClick={handleInitializePayment}
                                >
                                    Proceed to Pay Rent
                                </button>
                                <button className="btn btn-outline btn-lg" style={{ width: '100%' }}>
                                    Book Inspection
                                </button>
                                <p className="text-xs text-muted mt-4" style={{ textAlign: 'center' }}>
                                    Your money is held securely in escrow until you confirm you've moved in.
                                </p>
                            </>
                        ) : (
                            <div className={styles.warningBox}>
                                <Info size={20} />
                                <div>
                                    <strong>Property Not Available</strong>
                                    <p style={{ marginTop: 4 }}>This property is currently {property.status.toLowerCase()} and cannot be rented at this time.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
