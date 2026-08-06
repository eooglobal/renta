import styles from './page.module.css';
import Link from 'next/link';
import { CheckCircle, DollarSign, Ghost, Search, Ban, MapPin, Check } from 'lucide-react';
import { prisma } from '@/lib/db';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';

export const metadata = {
  title: 'Renta — Verified Apartments for Rent in Ilorin',
  description: 'Find verified apartments for rent in Ilorin, Kwara State. Zero agent inflation, secure Paystack payments, and verified property listings.',
  openGraph: {
    title: 'Renta — Rent Verified Apartments at Real Prices',
    description: 'No agent inflation. No fake listings. Rent securely through Renta.',
    url: 'https://userenta.com',
    siteName: 'Renta',
    locale: 'en_NG',
    type: 'website',
  },
};

export default async function Home() {
  const featuredApartments = await prisma.property.findMany({
    where: { status: 'VERIFIED' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { images: true }
  });

  return (
    <div className={styles.page}>
      {/* Navigation */}
      <LandingHeader />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot}></span>
              Now live in Ilorin
            </div>
            <h1 className={styles.heroTitle}>
              Rent Your Next Apartment Without Paying <span className={styles.highlight}>Excessive Agent Fees</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Find verified apartments, see the complete cost upfront, and rent with confidence. With Renta, you know exactly what you will pay before making a decision.
            </p>
            <form action="/rentals" method="GET" className={styles.searchContainer}>
              <input 
                type="text" 
                name="q"
                placeholder="Search by location, apartment type, or budget" 
                className={styles.searchInput}
                required
              />
              <button type="submit" className={styles.searchBtn}>
                <Search size={18} /> Search Apartments
              </button>
            </form>
            <p style={{ marginTop: 'var(--space-4)', opacity: 0.8, fontSize: '0.9rem', fontWeight: 500 }}>
              Transparent pricing. Verified listings. No hidden charges.<br/>
              Starting in Ilorin, Kwara State.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>10%</span>
                <span className={styles.statLabel}>Transparent Fee</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>100%</span>
                <span className={styles.statLabel}>Secure Payments</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.stat}>
                <span className={styles.statNumber}><CheckCircle size={32} /></span>
                <span className={styles.statLabel}>Verified Properties</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Apartments */}
      {featuredApartments.length > 0 && (
        <section className={styles.featured}>
          <div className="container">
            <h2 className={styles.sectionTitle}>
              Featured <span className={styles.highlight}>Apartments</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Hand-picked verified properties available right now in Ilorin.
            </p>
            <div className={styles.featuredGrid}>
              {featuredApartments.map((apt) => (
                <Link href={`/rentals/${apt.id}`} key={apt.id} className={styles.apartmentCard}>
                  <img 
                    src={apt.images && apt.images.length > 0 ? apt.images[0].url : '/placeholder-apartment.jpg'} 
                    alt={apt.title} 
                    className={styles.apartmentImage} 
                  />
                  <div className={styles.apartmentDetails}>
                    <h3 className={styles.apartmentTitle}>{apt.title}</h3>
                    <p className={styles.apartmentLocation}>
                      <MapPin size={14} /> {apt.address}
                    </p>
                    <div className={styles.apartmentPrice}>
                      ₦{Number(apt.rentPrice).toLocaleString()} <span className="text-sm font-normal text-muted">/ year</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/rentals" className="btn btn-outline btn-lg">
                View All Apartments
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Problems Section */}
      <section className={styles.problems}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Renting an Apartment Shouldn't Feel Like a <span className={styles.highlight}>Gamble</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            If you've rented an apartment before, this probably sounds familiar. You find a place, then the unexpected costs begin. By the time you're ready to pay, the amount is far higher than you expected.
          </p>
          <div className={`grid grid-4 ${styles.problemsGrid}`}>
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}><DollarSign size={40} /></div>
              <h4>Price Inflation</h4>
              <p>Agents add ₦50K–₦200K to actual rent. On Renta, you see the landlord&rsquo;s exact price.</p>
            </div>
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}><Ghost size={40} /></div>
              <h4>Fake Listings</h4>
              <p>Apartments that don&rsquo;t exist or are already rented. Every Renta listing is physically verified.</p>
            </div>
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}><Search size={40} /></div>
              <h4>Inspection Fees</h4>
              <p>Watch a detailed video tour of the apartment first. If you love it, book a physical inspection for a flat ₦2,000 fee anywhere.</p>
            </div>
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}><Ban size={40} /></div>
              <h4>Rental Scams</h4>
              <p>Paying rent but never getting keys. Renta verifies listings, manages inspections, and keeps disputes on-platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Renting Made <span className={styles.highlight}>Simple</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            A simpler, more transparent way to rent apartments.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h4>Search</h4>
              <p>Browse verified apartments that match your budget and preferred location.</p>
            </div>
            <div className={styles.stepConnector}></div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h4>Compare</h4>
              <p>See the complete price before contacting the property. Know the rent. Know the platform fee. Know the total amount.</p>
            </div>
            <div className={styles.stepConnector}></div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h4>Apply</h4>
              <p>Request the apartment directly through Renta and continue the rental process with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Landlords */}
      <section className={styles.forLandlords}>
        <div className={`container ${styles.landlordInner}`}>
          <div className={styles.landlordContent}>
            <div className={styles.heroBadge}>For Property Owners</div>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'left' }}>
              Fill Vacant Apartments <span className={styles.highlight}>Faster</span>
            </h2>
            <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)', fontSize: 'var(--text-lg)' }}>
              Listing your property is only the beginning. Renta actively helps more qualified renters discover your apartments.
            </p>
            <ul className={styles.landlordFeatures}>
              <li className="flex items-center gap-2"><Check size={16} /> Exposure through the Renta marketplace</li>
              <li className="flex items-center gap-2"><Check size={16} /> Digital marketing campaigns</li>
              <li className="flex items-center gap-2"><Check size={16} /> Trained property scouts</li>
              <li className="flex items-center gap-2"><Check size={16} /> Affiliate partners</li>
            </ul>
            <Link href="/register?role=landlord" className="btn btn-primary btn-lg">
              List Your Property — Free
            </Link>
          </div>
          <div className={styles.landlordVisual}>
            <div className={styles.dashboardPreview}>
              <div className={styles.previewHeader}>
                <span className={styles.previewDot} style={{ background: '#EF4444' }}></span>
                <span className={styles.previewDot} style={{ background: '#f59e0b' }}></span>
                <span className={styles.previewDot} style={{ background: '#22c55e' }}></span>
              </div>
              <div className={styles.previewContent}>
                <div className={styles.previewStat}>
                  <span>Active Listings</span>
                  <strong>3</strong>
                </div>
                <div className={styles.previewStat}>
                  <span>Monthly Income</span>
                  <strong>₦850K</strong>
                </div>
                <div className={styles.previewStat}>
                  <span>Occupancy</span>
                  <strong>100%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            What You See Is <span className={styles.highlight}>What You Pay</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Unlike the traditional rental process where additional charges often appear later, Renta shows the complete cost from the beginning.
          </p>
          <div className={styles.priceExample}>
            <div className={styles.priceCard}>
              <h4>Example Breakdown</h4>
              <div className={styles.priceRow}>
                <span>Apartment Rent</span>
                <span className="font-bold">₦500,000</span>
              </div>
              <div className={styles.priceRow}>
                <span>Platform Fee</span>
                <span className="font-bold">₦50,000</span>
              </div>
              <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                <span>Total Amount Payable</span>
                <span>₦550,000</span>
              </div>
              <p className={`${styles.priceNote} flex justify-center gap-4`}>
                <span className="flex items-center gap-1"><Check size={14} /> No hidden calculations</span>
                <span className="flex items-center gap-1"><Check size={14} /> No unexpected surprises</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className={styles.areas}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Available in <span className={styles.highlight}>Ilorin</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Starting with the areas students and young professionals love most.
          </p>
          <div className={`grid grid-3 ${styles.areasGrid}`}>
            <div className={styles.areaCard}>
              <div className={styles.areaIcon}><MapPin size={40} /></div>
              <h4>Tanke</h4>
              <p>Popular student hub near the University of Ilorin</p>
            </div>
            <div className={styles.areaCard}>
              <div className={styles.areaIcon}><MapPin size={40} /></div>
              <h4>Basin</h4>
              <p>Central location with great access to major roads</p>
            </div>
            <div className={styles.areaCard}>
              <div className={styles.areaIcon}><MapPin size={40} /></div>
              <h4>Malete</h4>
              <p>Close to campus with affordable options</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container text-center">
          <h2 className={styles.ctaTitle}>
            Your Next Apartment Could Be Just A Few Clicks Away
          </h2>
          <p className={styles.ctaSubtitle}>
            Stop guessing. Stop discovering extra charges at the last minute. Find verified apartments with transparent pricing and rent with greater confidence.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/rentals" className="btn btn-primary btn-lg">
              Find Your Apartment
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
