'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    MapPin, Home as HomeIcon, CheckCircle, ArrowLeft,
    ShieldCheck, Info, Sparkles, AlertCircle
} from 'lucide-react';
import styles from './listing.module.css';
import InspectionModal from '@/components/InspectionModal';

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
    const [tenantProfile, setTenantProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`/api/properties/${id}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to fetch property details');
                setProperty(data.property || data); // Store the property object directly
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/tenant/profile');
                if (res.ok) {
                    const data = await res.json();
                    if (data.id) setTenantProfile(data);
                }
            } catch (err) {
                console.error('Failed to fetch tenant profile', err);
            }
        };

        if (id) {
            fetchDetails();
            fetchProfile();
        }
    }, [id]);

    const handleInitializePayment = async () => {
        if (!tenantProfile) {
            router.push(`/tenant/screening?returnUrl=/tenant/listing/${id}`);
            return;
        }

        try {
            const res = await fetch('/api/payments/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: property?.id || id })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Redirect to Paystack
            window.location.href = data.paymentUrl;
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
            <div className="fade-in container">
                <Link href="/tenant/search" className="btn btn-outline mb-4">
                    <span className="flex items-center gap-2"><ArrowLeft size={16} /> Back to Search</span>
                </Link>
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ color: 'var(--color-danger)' }}>Property Not Found</h3>
                    <p className="text-muted mt-2">{error || "The property you're looking for doesn't exist or has been removed."}</p>
                </div>
            </div>
        );
    }

    const { breakdown } = property;
    const isAvailable = property.status === 'AVAILABLE' || property.status === 'VERIFIED';
    const primaryImage = property.images && property.images.length > 0 ? property.images[activeImage].url : null;

    return (
        <div className={`fade-in ${styles.container}`}>
            <Link href="/tenant/search" className="btn btn-text mb-6">
                <ArrowLeft size={16} /> Back to Listings
            </Link>

            {/* Immersive Hero Header */}
            <div className={styles.hero}>
                {primaryImage ? (
                    <img src={primaryImage} className={styles.heroImage} alt={property.title} />
                ) : (
                    <div className={styles.heroImage} style={{ background: 'var(--color-gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HomeIcon size={80} style={{ opacity: 0.1 }} />
                    </div>
                )}
                <div className={styles.heroOverlay}>
                    <div className={styles.titleArea}>
                        <h1>{property.title}</h1>
                        <div className={styles.meta}>
                            <span><MapPin size={20} /> {property.area?.name}, {property.city?.name}</span>
                            <span><HomeIcon size={20} /> {formatType(property.type)}</span>
                            {property.verificationStatus === 'VERIFIED' && (
                                <span className={styles.badgePremium}><CheckCircle size={16} /> Verified Listing</span>
                            )}
                        </div>
                    </div>
                    {property.isFeatured && (
                        <div className={styles.badgePremium} style={{ background: 'var(--color-warning)', color: 'var(--color-black)' }}>
                            <Sparkles size={16} /> Featured Premium
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.content}>
                    {/* Multi-Image Gallery */}
                    {property.images && property.images.length > 1 && (
                        <div className={styles.gallery}>
                            {property.images.map((img, i) => (
                                <img
                                    key={img.id}
                                    src={img.url}
                                    className={`${styles.thumbnail} ${i === activeImage ? styles.active : ''}`}
                                    onClick={() => setActiveImage(i)}
                                    alt={`${property.title} thumbnail ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* About Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <Info size={24} className="text-primary" /> Property Overview
                        </h3>
                        <p className={styles.description}>{property.description}</p>
                    </div>

                    {property.amenities && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <ShieldCheck size={24} className="text-primary" /> Amenities & Facilities
                            </h3>
                            <div className={styles.amenitiesGrid}>
                                {(typeof property.amenities === 'string' ? JSON.parse(property.amenities) : property.amenities).map((amenity, i) => (
                                    <div key={i} className={styles.amenityItem}>
                                        <CheckCircle size={16} className="text-success" /> {amenity}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Map Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <MapPin size={24} className="text-primary" /> Neighborhood
                        </h3>
                        <p className="text-muted mb-6">Explore the area around {property.area?.name}. Exact details provided upon booking.</p>
                        <MapLocation address={`${property.area?.name}, ${property.city?.name}`} />
                    </div>
                </div>

                {/* Sticky Payment Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.paymentCard}>
                        <div className={styles.priceTag}>
                            <div className={styles.priceDisplay}>
                                ₦{Number(property.rentPrice).toLocaleString()} <sub>/yr</sub>
                            </div>
                            <div className="text-muted text-sm mt-2">Ready for immediate move-in</div>
                        </div>

                        {breakdown ? (
                            <ul className={styles.breakdown}>
                                <li className={styles.breakdownItem}>
                                    <span>Annual Rent</span>
                                    <span>₦{Number(breakdown.rent).toLocaleString()}</span>
                                </li>
                                <li className={styles.breakdownItem}>
                                    <span>Renta Service Fee (10%)</span>
                                    <span>₦{Number(breakdown.serviceFee).toLocaleString()}</span>
                                </li>
                                <li className={`${styles.breakdownItem} ${styles.totalRow}`}>
                                    <span>Total to Pay</span>
                                    <span>₦{Number(breakdown.total).toLocaleString()}</span>
                                </li>
                            </ul>
                        ) : (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl text-sm border border-gray-100">
                                <Info size={16} className="inline mr-2 text-primary" />
                                Includes Renta Escrow Protection & 24/7 Support.
                            </div>
                        )}

                        {isAvailable ? (
                            <>
                                <button
                                    className="btn btn-primary btn-lg sidebarAction mb-4"
                                    style={{ height: '64px', fontSize: '1.25rem' }}
                                    onClick={handleInitializePayment}
                                >
                                    Secure This Home
                                </button>
                                <button
                                    className="btn btn-outline btn-lg sidebarAction"
                                    style={{ height: '64px' }}
                                    onClick={() => setIsInspectionModalOpen(true)}
                                >
                                    Book Free Tour
                                </button>
                                <p className="text-xs text-center text-muted mt-6">
                                    <ShieldCheck size={12} className="inline mr-1" /> 100% Refundable if inspection fails.
                                </p>
                            </>
                        ) : (
                            <div className={styles.warningBox}>
                                <AlertCircle size={24} />
                                <div>
                                    <strong>Status: {property.status}</strong>
                                    <p>This property is currently not accepting new applications.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.ctaBox}>
                        <h3>Need help?</h3>
                        <p>Talk to a local rental agent about this property.</p>
                        <Link href="/contact" className="btn btn-white btn-sm" style={{ color: 'var(--color-primary)' }}>
                            Chat with Support
                        </Link>
                    </div>
                </div>
            </div>

            {isInspectionModalOpen && (
                <InspectionModal
                    propertyId={property?.id || id}
                    propertyTitle={property?.title}
                    onClose={() => setIsInspectionModalOpen(false)}
                />
            )}
        </div>
    );
}
