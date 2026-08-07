import { prisma } from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Calendar, Bed, Bath, Shield, CheckCircle } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';

export const dynamic = 'force-dynamic';

export default async function PublicRentalDetailsPage({ params }) {
  const apt = await prisma.rental.findUnique({
    where: { id: parseInt(params.id) },
    include: { landlord: { select: { firstName: true, lastName: true, ninStatus: true } } }
  });

  if (!apt || apt.status !== 'ACTIVE') {
    notFound();
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingHeader />
      
      <main className="container" style={{ flex: 1, padding: 'calc(var(--header-height) + var(--space-8)) 0 var(--space-12)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          
          <Link href="/rentals" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 'var(--space-6)', fontWeight: 'var(--font-medium)' }}>
            &larr; Back to Search
          </Link>

          <div style={{ background: 'white', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            {apt.media && apt.media.length > 0 ? (
              <div style={{ height: 400, width: '100%', position: 'relative' }}>
                <img src={apt.media[0]} alt={apt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ height: 200, width: '100%', background: 'var(--bg-secondary)' }} />
            )}

            <div style={{ padding: 'var(--space-8)' }}>
              <div className="flex justify-between items-start" style={{ flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div>
                  <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>{apt.title}</h1>
                  <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={16} /> {apt.address}, {apt.location}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)' }}>
                    ₦{Number(apt.price).toLocaleString()}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>per year</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-8)' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bed size={18} className="text-primary-color" /> <span style={{ fontWeight: 'var(--font-medium)' }}>{apt.bedrooms} Bedrooms</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bath size={18} className="text-primary-color" /> <span style={{ fontWeight: 'var(--font-medium)' }}>{apt.bathrooms} Bathrooms</span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} className="text-primary-color" /> <span style={{ fontWeight: 'var(--font-medium)' }}>Listed on {new Date(apt.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-8)' }}>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Description</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{apt.description}</p>
              </div>

              <div style={{ marginBottom: 'var(--space-8)' }}>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Amenities</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {apt.amenities && apt.amenities.map(am => (
                    <span key={am} style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', padding: '4px 12px', borderRadius: '100px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{am}</span>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div>
                  <h4 style={{ fontWeight: 'var(--font-semibold)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={16} className="text-success-color" /> Landlord: {apt.landlord?.firstName} {apt.landlord?.lastName}
                  </h4>
                  {apt.landlord?.ninStatus === 'VERIFIED' && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={12} /> Identity Verified
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Link href={`/login?redirect=/tenant/rentals/${apt.id}`} className="btn btn-primary">
                    Rent Now
                  </Link>
                  <Link href={`/login?redirect=/tenant/inspections/new?rentalId=${apt.id}`} className="btn btn-outline">
                    Book Inspection
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
