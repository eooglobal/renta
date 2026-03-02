import styles from './page.module.css';
import Link from 'next/link';
import { CheckCircle, DollarSign, Ghost, Search, Ban, MapPin, Check } from 'lucide-react';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <Link href="/" className={styles.logo}>
            Renta
          </Link>
          <div className={styles.navLinks}>
            <Link href="/listings" className={styles.navLink}>Browse Listings</Link>
            <Link href="/login" className={`btn btn-outline ${styles.navBtn}`}>Log In</Link>
            <Link href="/register" className={`btn btn-primary ${styles.navBtn}`}>Get Started</Link>
          </div>
          <button className={styles.mobileMenu} aria-label="Toggle menu" id="mobile-menu-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot}></span>
              Now live in Ilorin
            </div>
            <h1 className={styles.heroTitle}>
              Rent Verified Apartments at <span className={styles.highlight}>Real Prices</span>
            </h1>
            <p className={styles.heroSubtitle}>
              No agent inflation. No fake listings. No scams. Just verified apartments
              at landlord-approved prices with escrow protection.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/register" className="btn btn-primary btn-lg">
                Find an Apartment
              </Link>
              <Link href="/register?role=landlord" className="btn btn-outline btn-lg">
                List Your Property
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>10%</span>
                <span className={styles.statLabel}>Transparent Fee</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>100%</span>
                <span className={styles.statLabel}>Escrow Protected</span>
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

      {/* Problems Section */}
      <section className={styles.problems}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Tired of rental <span className={styles.highlight}>nightmares?</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Renting in Ilorin shouldn&rsquo;t feel like a gamble. Here&rsquo;s what we&rsquo;re fixing.
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
              <p>Paying ₦2K–₦5K per inspection with no guarantee. Book free verified inspections on Renta.</p>
            </div>
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}><Ban size={40} /></div>
              <h4>Rental Scams</h4>
              <p>Paying rent but never getting keys. Your money stays in escrow until you confirm access.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            How <span className={styles.highlight}>Renta</span> Works
          </h2>
          <p className={styles.sectionSubtitle}>
            Simple, transparent, and safe — from search to move-in.
          </p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h4>Browse & Search</h4>
              <p>Filter verified apartments by location, price, and type. Every listing shows the real price.</p>
            </div>
            <div className={styles.stepConnector}></div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h4>Book Inspection</h4>
              <p>Schedule a free inspection at your convenience. See the apartment in person before committing.</p>
            </div>
            <div className={styles.stepConnector}></div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h4>Pay Securely</h4>
              <p>Pay rent + 10% service fee. Funds are held in escrow — the landlord doesn&rsquo;t receive a kobo until you move in.</p>
            </div>
            <div className={styles.stepConnector}></div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <h4>Move In</h4>
              <p>Confirm access, funds are released, and your digital rental agreement is ready. Welcome home!</p>
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
              Manage Your Properties <span className={styles.highlight}>Effortlessly</span>
            </h2>
            <ul className={styles.landlordFeatures}>
              <li className="flex items-center gap-2"><Check size={16} /> Set your own rent price — no agent interference</li>
              <li className="flex items-center gap-2"><Check size={16} /> Get verified tenants with NIN verification</li>
              <li className="flex items-center gap-2"><Check size={16} /> Receive payments directly to your bank</li>
              <li className="flex items-center gap-2"><Check size={16} /> Digital rental agreements included</li>
              <li className="flex items-center gap-2"><Check size={16} /> Track maintenance requests in one place</li>
              <li className="flex items-center gap-2"><Check size={16} /> Centralized property management dashboard</li>
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
            Transparent <span className={styles.highlight}>Pricing</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            What the landlord sets is what you pay. Plus a flat 10% service fee. That&rsquo;s it.
          </p>
          <div className={styles.priceExample}>
            <div className={styles.priceCard}>
              <h4>Example Breakdown</h4>
              <div className={styles.priceRow}>
                <span>Landlord&rsquo;s Rent</span>
                <span className="font-bold">₦200,000</span>
              </div>
              <div className={styles.priceRow}>
                <span>Renta Service Fee (10%)</span>
                <span className="font-bold">₦20,000</span>
              </div>
              <div className={`${styles.priceRow} ${styles.priceTotal}`}>
                <span>Total You Pay</span>
                <span>₦220,000</span>
              </div>
              <p className={`${styles.priceNote} flex justify-center gap-4`}>
                <span className="flex items-center gap-1"><Check size={14} /> Escrow protected</span>
                <span className="flex items-center gap-1"><Check size={14} /> No hidden charges</span>
                <span className="flex items-center gap-1"><Check size={14} /> Paid once yearly</span>
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
            Ready to rent without the stress?
          </h2>
          <p className={styles.ctaSubtitle}>
            Join Renta today. Verified apartments. Real prices. Zero scams.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Create Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>Renta</span>
            <p>Verified apartment rentals in Ilorin, Nigeria.</p>
          </div>
          <div className={styles.footerLinks}>
            <div>
              <h6>Platform</h6>
              <Link href="/listings">Browse Listings</Link>
              <Link href="/register?role=landlord">List Property</Link>
              <Link href="/register?role=scout">Become a Scout</Link>
            </div>
            <div>
              <h6>Company</h6>
              <Link href="/about">About Renta</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} Renta. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
