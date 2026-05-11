import Link from 'next/link';
import styles from '@/app/page.module.css';

export default function LandingFooter() {
    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.footerInner}`}>
                <div className={styles.footerBrand}>
                    <span className={styles.footerLogo}>Renta</span>
                    <p>Verified apartment rentals in Ilorin, Nigeria.</p>
                </div>
                <div className={styles.footerLinks}>
                    <div>
                        <h6>Platform</h6>
                        <Link href="/register">Browse Listings</Link>
                        <Link href="/register?role=landlord">List Property</Link>
                        <Link href="/register?role=scout">Become a Scout</Link>
                    </div>
                    <div>
                        <h6>Company</h6>
                        <Link href="/about">About Renta</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/terms">Terms of Service</Link>
                        <Link href="/privacy">Privacy Policy</Link>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p>© {new Date().getFullYear()} Renta. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
