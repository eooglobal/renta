import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Home as HomeIcon, CheckCircle, Info, Sparkles, UserPlus, MessageCircle } from 'lucide-react';
import { auth } from '@/lib/auth';
import styles from '@/app/(dashboard)/tenant/listing/[id]/listing.module.css';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import PropertyStructuredData from '@/components/PropertyStructuredData';

export const dynamic = 'force-dynamic';

const formatType = (type) => {
    return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
};

import { getAbsoluteImageUrl, buildPageMetadata } from '@/lib/seo';

// 1. Generate SEO Metadata for social sharing
export async function generateMetadata({ params }) {
    const { id } = await params;
    const property = await prisma.property.findFirst({
        where: {
            OR: [
                { id: id },
                { slug: id }
            ]
        },
        include: { images: true, videos: true, city: true, area: true }
    });

    if (!property) return { title: 'Property Not Found — Renta' };

    const formattedType = formatType(property.type);
    const areaName = property.area?.name || 'Ilorin';
    const cityName = property.city?.name || 'Kwara State';
    const title = `${property.title} — ${formattedType} in ${areaName} | Renta`;
    const description = `${property.title} (${formattedType}) in ${areaName}, ${cityName}. Rent: ₦${Number(property.rentPrice).toLocaleString()}/year. ${property.description ? property.description.substring(0, 110) : 'Verified listing with transparent fees.'}`;

    const rawPrimaryImage = property.images?.find(img => img.isPrimary)?.url || property.images?.[0]?.url || '/og-image.png';
    const absoluteImage = getAbsoluteImageUrl(rawPrimaryImage);

    return buildPageMetadata({
        title,
        description,
        image: absoluteImage,
        path: `/listing/${property.slug || property.id}`,
        keywords: `${property.title}, apartment in ${areaName}, rent ${formattedType} Ilorin, Renta verified listings`,
    });
}

export default async function PublicPropertyDetailsPage({ params }) {
    const { id } = await params;
    const session = await auth();

    const property = await prisma.property.findFirst({
        where: {
            OR: [
                { id: id },
                { slug: id }
            ]
        },
        include: {
            city: true,
            area: true,
            images: true,
            videos: true,
            landlord: {
                select: {
                    firstName: true,
                    lastName: true,
                    ninStatus: true,
                    createdAt: true
                }
            }
        }
    });

    if (!property || property.status !== 'VERIFIED') {
        notFound();
    }

    const primaryImage = property.images.find(img => img.isPrimary)?.url || property.images[0]?.url || '/placeholder.jpg';
    const otherImages = property.images.filter(img => img.url !== primaryImage);

    // Calculate Renta breakdown
    const rent = Number(property.rentPrice);
    const serviceFee = rent * 0.10;
    const total = rent + serviceFee;

    const formattedType = formatType(property.type);

    return (
        <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <PropertyStructuredData property={property} />
            <LandingHeader />

            <main style={{ flex: 1, paddingBottom: '60px' }}>
                <div className="container" style={{ marginTop: '32px' }}>
                    
                    {/* Breadcrumbs */}
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Home</Link>
                        <span>/</span>
                        <Link href="/rentals" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Apartments</Link>
                        <span>/</span>
                        <span style={{ color: 'var(--text-main)' }}>{property.title}</span>
                    </div>

                    {/* Title & Location Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <span className="badge badge-primary">{formattedType}</span>
                            {property.studentFriendly && <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1' }}>Student Friendly</span>}
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>{property.title}</h1>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
                            {property.address}, {property.area.name}, {property.city.name}
                        </p>
                    </div>

                    {/* Gallery Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: otherImages.length > 0 ? '2fr 1fr' : '1fr', gap: '16px', marginBottom: '32px', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                        <div style={{ height: '420px', position: 'relative' }}>
                            <img src={primaryImage} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {otherImages.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '16px', height: '420px' }}>
                                {otherImages.slice(0, 2).map((img, idx) => (
                                    <div key={idx} style={{ height: '202px' }}>
                                        <img src={img.url} alt={`${property.title} view ${idx + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main Layout Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' }}>
                        
                        {/* Details Panel */}
                        <div>
                            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>About this Apartment</h3>
                                <p style={{ lineHeight: '1.7', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{property.description}</p>
                            </div>

                            {/* Features / Amenities */}
                            {property.amenities && property.amenities.length > 0 && (
                                <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>Amenities & Features</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                        {property.amenities.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                                                <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Video Walkthrough if present */}
                            {property.videos && property.videos.length > 0 && (
                                <div className="card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>Video Walkthrough</h3>
                                    <video controls style={{ width: '100%', borderRadius: 'var(--radius-lg)', maxHeight: '400px' }}>
                                        <source src={property.videos[0].url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}
                        </div>

                        {/* Pricing & CTA Card */}
                        <div>
                            <div className="card" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
                                <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Annual Rent Price</span>
                                    <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>₦{rent.toLocaleString()}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / year</span>
                                </div>

                                {/* Price Breakdown */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Base Rent</span>
                                        <span>₦{rent.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                        <span>Renta Fee (10%)</span>
                                        <span>₦{serviceFee.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.05rem', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                                        <span>Total Required</span>
                                        <span style={{ color: 'var(--color-primary)' }}>₦{total.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {!session ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <Link href={`/login?redirect=/rentals/${property.id}`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                                            Log in to Schedule Inspection (₦2,000)
                                        </Link>
                                        <Link href={`/register?role=TENANT`} className="btn btn-outline" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                                            Create Tenant Account
                                        </Link>
                                    </div>
                                ) : (
                                    <Link href={`/tenant/rentals/${property.id}`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                                        Proceed to Dashboard Inspection
                                    </Link>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
}
