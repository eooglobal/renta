import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Search, MapPin } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';

export const dynamic = 'force-dynamic';

export default async function PublicRentalsPage({ searchParams }) {
  const q = searchParams.q || '';
  
  const where = {
    status: 'ACTIVE',
    ...(q ? {
      OR: [
        { title: { contains: q } },
        { location: { contains: q } },
        { address: { contains: q } },
      ]
    } : {})
  };

  const rentals = await prisma.rental.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingHeader />
      
      <main className="container" style={{ flex: 1, padding: 'calc(var(--header-height) + var(--space-8)) 0 var(--space-12)' }}>
        <h1 className="section-title text-center mb-8">
          Search <span className="text-primary-color">Apartments</span>
        </h1>
        
        <div style={{ maxWidth: 600, margin: '0 auto var(--space-12)' }}>
          <form action="/rentals" method="GET" className="flex w-full" style={{ background: 'white', borderRadius: '100px', padding: 8, boxShadow: 'var(--shadow-md)', alignItems: 'center' }}>
            <input 
              type="text" 
              name="q"
              defaultValue={q}
              placeholder="Search by title, location, or address..." 
              style={{ flex: 1, border: 'none', padding: '12px 16px', background: 'transparent', outline: 'none' }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '100px', padding: '12px 24px' }}>
              <Search size={18} /> Search
            </button>
          </form>
        </div>

        {rentals.length === 0 ? (
          <div className="card text-center text-muted" style={{ padding: 'var(--space-16)' }}>
            No apartments found matching your search.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
            {rentals.map(apt => (
              <Link href={`/rentals/${apt.id}`} key={apt.id} style={{ background: 'white', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                <img 
                  src={apt.media && apt.media.length > 0 ? apt.media[0] : '/placeholder-apartment.jpg'} 
                  alt={apt.title} 
                  style={{ height: 200, width: '100%', objectFit: 'cover', background: 'var(--bg-secondary)' }}
                />
                <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 8, color: 'var(--text-primary)' }}>{apt.title}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                    <MapPin size={14} /> {apt.location}
                  </p>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-primary)', marginTop: 'auto' }}>
                    ₦{Number(apt.price).toLocaleString()} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ year</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
