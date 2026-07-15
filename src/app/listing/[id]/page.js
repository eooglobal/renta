import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Home as HomeIcon, CheckCircle, Info, Sparkles, UserPlus, MessageCircle } from 'lucide-react';
import { auth } from '@/lib/auth';
import styles from '@/app/(dashboard)/tenant/listing/[id]/listing.module.css';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import PropertyStructuredData from '@/components/PropertyStructuredData';

const formatType = (type) => {
    return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
};

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

    if (!property) return { title: 'Property Not Found - Renta' };

    const formattedType = formatType(property.type);
    const title = `${property.title} - ${formattedType} in ${property.area.name} | Renta`;
    const description = property.description.substring(0, 160) + '...';

    const primaryImage = property.images.find(img => img.isPrimary)?.url || property.images[0]?.url || '/placeholder.jpg';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://userenta.com/listing/${property.slug || property.id}`,
            images: [{ url: primaryImage, width: 1200, height: 630, alt: property.title }],
            type: 'article',
        }
    };
}

// 2. Render Premium Public Page
export default async function PublicListingPage({ params }) {
    const { id } = await params;
    const property = await prisma.property.findFirst({
        where: {
            OR: [
                { id: id },
                { slug: id }
            ]
        },
        include: { images: { orderBy: { isPrimary: 'desc' } }, videos: { orderBy: { createdAt: 'desc' } }, city: true, area: true }
    });

    const session = await auth();

    // Redirect authenticated users to their respective dashboard view
    if (session) {
        const role = session.user.role.toLowerCase();
        // Redirect to dashboard listing view if it exists for the role
        // For now, mapping all to /role/listing/[id]
        const redirectPath = `/${role}/listing/${id}`;
        const { redirect } = await import('next/navigation');
        redirect(redirectPath);
    }

    if (!property) notFound();

    const formattedType = formatType(property.type);
    const primaryImage = property.images[0]?.url;

    return (
        <div className="flex flex-col min-h-screen">
            <LandingHeader />
            <main className={`fade-in ${styles.container}`} style={{ marginTop: '120px', marginBottom: '80px', flex: '1' }}>
                <PropertyStructuredData property={property} />
                {/* Hero Header */}
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
                                <span><MapPin size={20} /> {property.area.name}, {property.city.name}</span>
                                <span><HomeIcon size={20} /> {formattedType}</span>
                                {property.verificationStatus === 'VERIFIED' && (
                                    <span className={styles.badgePremium}><CheckCircle size={16} /> Verified Renta Listing</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.grid}>
                    <div className={styles.content}>
                        {/* Visual Gallery Preview for Logged Out Users */}
                        <div className={styles.gallery}>
                            {property.images.slice(1, 5).map((img) => (
                                <div key={img.id} style={{ position: 'relative' }}>
                                    <img src={img.url} className={styles.thumbnail} alt="Property view" />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-xl)' }}></div>
                                </div>
                            ))}
                            {property.images.length > 5 && (
                                <div className={styles.thumbnail} style={{ background: 'var(--color-gray-900)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    +{property.images.length - 5}
                                </div>
                            )}
                        </div>

                        {property.videos && property.videos.length > 0 && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>
                                    <Info size={24} className="text-primary" /> Walkthrough Videos
                                </h3>
                                <div className={styles.videoGrid}>
                                    {property.videos.map((video) => (
                                        <video
                                            key={video.id}
                                            className={styles.videoPlayer}
                                            src={video.url}
                                            controls
                                            playsInline
                                            preload="metadata"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <Info size={24} className="text-primary" /> About This Home
                            </h3>
                            <p className={styles.description}>{property.description}</p>
                        </div>

                        {/* Restricted Amenities Preview */}
                        {property.amenities && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>
                                    <Sparkles size={24} className="text-primary" /> Facilities
                                </h3>
                                <div className={styles.amenitiesGrid}>
                                    {JSON.parse(property.amenities).slice(0, 4).map((amenity, i) => (
                                        <div key={i} className={styles.amenityItem}>
                                            <CheckCircle size={16} className="text-success" /> {amenity}
                                        </div>
                                    ))}
                                    <div className={styles.amenityItem} style={{ borderStyle: 'dashed', opacity: 0.6 }}>
                                        Sign in for details...
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Public Sticky Sidebar */}
                    <div className={styles.sidebar}>
                        <div className={styles.paymentCard}>
                            <div className={styles.priceTag}>
                                <div className={styles.priceDisplay}>
                                    ₦{Number(property.rentPrice).toLocaleString()} <sub>/yr</sub>
                                </div>
                                <div className="text-muted text-sm mt-2">Available for Rent</div>
                            </div>

                            <div className="mb-8">
                                <h4 className="font-bold mb-4">Interested in this property?</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Join Renta to view full images, book free inspections, and pay securely through the platform.
                                </p>
                            </div>

                            <Link href="/register" className="btn btn-primary btn-lg sidebarAction mb-4" style={{ height: '64px', fontSize: '1.25rem' }}>
                                <UserPlus size={20} className="mr-2" /> Start Free Application
                            </Link>

                            <Link href="/login" className="btn btn-outline btn-lg sidebarAction" style={{ height: '64px', border: '2px solid var(--color-gray-200)' }}>
                                Log In to Your Account
                            </Link>

                            <p className="text-xs text-center text-gray-500 mt-6">
                                Verified Listings • 24/7 Support • Zero Agency Fees
                            </p>
                        </div>

                        <div className={styles.ctaBox} style={{ background: 'var(--color-black)' }}>
                            <h3 style={{ color: 'white' }}>Property Manager?</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)' }}>List your own properties and reach thousands of verified tenants.</p>
                            <Link href="/register?role=LANDLORD" className="btn btn-white btn-sm" style={{ color: 'black' }}>
                                Start Listing
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <LandingFooter />
        </div>
    );
}
