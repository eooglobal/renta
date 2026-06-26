"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/app/page.module.css";

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((open) => !open);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isMenuOpen]);

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.navInner}`}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          Renta
        </Link>

        <div
          id="landing-navigation"
          className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksMobile : ""}`}
        >
          <Link href="/register" className={styles.navLink} onClick={closeMenu}>
            Browse Listings
          </Link>
          <Link
            href="/login"
            className={`btn btn-outline ${styles.navBtn}`}
            onClick={closeMenu}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className={`btn btn-primary ${styles.navBtn}`}
            onClick={closeMenu}
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="landing-navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}
