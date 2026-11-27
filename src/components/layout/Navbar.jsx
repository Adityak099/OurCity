"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ArrowUpRight, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const menuButtonRef = useRef(null);
  const dashboardPath = user?.role === "admin" ? "/admin/dashboard" : user?.role === "driver" ? "/driver/dashboard" : "/citizen/dashboard";

  function handleKeyDown(event) {
    if (event.key === "Escape" && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="navbar" onKeyDown={handleKeyDown}>
      <div className="container navbar-inner">
        <Link href="/" className="brand">
          <Image
            src="/hero/OurCity-Mark.png"
            alt="OurCity"
            width={44}
            height={44}
            className="brand-logo"
          />
          <span>
            Our<span>City</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <Link aria-current={pathname.startsWith("/map") ? "page" : undefined} className={pathname.startsWith("/map") ? "nav-link-active" : ""} href="/map">Public Map</Link>
          <Link aria-current={pathname.startsWith("/driver-info") ? "page" : undefined} className={pathname.startsWith("/driver-info") ? "nav-link-active" : ""} href="/driver-info">Collection Info</Link>
          <Link aria-current={pathname.startsWith("/clean-city-tips") ? "page" : undefined} className={pathname.startsWith("/clean-city-tips") ? "nav-link-active" : ""} href="/clean-city-tips">Clean City Tips</Link>
        </nav>

        <div className="nav-actions">
          {ready && user ? <><Link href={dashboardPath} className="nav-session-button">My dashboard</Link><Link href="/citizen/complaints/new" className="nav-cta">Report Issue <ArrowUpRight size={16} aria-hidden="true" /></Link><button className="nav-session-button" type="button" onClick={handleLogout}>Sign out</button></> : <><Link href="/login" className="nav-session-button">Sign in</Link><Link href="/citizen/complaints/new" className="nav-cta">Report Issue <ArrowUpRight size={16} aria-hidden="true" /></Link></>}
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="mobile-menu"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          {isMobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="Mobile navigation"
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
        data-open={isMobileMenuOpen}
      >
        <div className="container mobile-nav-inner">
          <Link aria-current={pathname.startsWith("/map") ? "page" : undefined} className={pathname.startsWith("/map") ? "nav-link-active" : ""} href="/map" onClick={closeMobileMenu}>Public Map</Link>
          <Link aria-current={pathname.startsWith("/driver-info") ? "page" : undefined} className={pathname.startsWith("/driver-info") ? "nav-link-active" : ""} href="/driver-info" onClick={closeMobileMenu}>Collection Info</Link>
          <Link aria-current={pathname.startsWith("/clean-city-tips") ? "page" : undefined} className={pathname.startsWith("/clean-city-tips") ? "nav-link-active" : ""} href="/clean-city-tips" onClick={closeMobileMenu}>Clean City Tips</Link>
          <Link href="/citizen/complaints/new" className="mobile-nav-cta" onClick={closeMobileMenu}>Report Issue <ArrowUpRight size={16} aria-hidden="true" /></Link>
          {ready && user ? <><Link href={dashboardPath} onClick={closeMobileMenu}>My dashboard</Link><button className="nav-session-button" type="button" onClick={async () => { await handleLogout(); closeMobileMenu(); }}>Sign out</button></> : <><Link href="/login" onClick={closeMobileMenu}>Sign in</Link><Link href="/login?mode=register" onClick={closeMobileMenu}>Create account</Link></>}
        </div>
      </nav>
    </header>
  );
}
