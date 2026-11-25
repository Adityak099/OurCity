"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ArrowUpRight, X } from "lucide-react";
import { useRef, useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  function handleKeyDown(event) {
    if (event.key === "Escape" && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
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

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#portals">Our portals</a>
          <a href="#impact">Our impact</a>
        </nav>

        <div className="nav-actions">
          <a href="/login" className="nav-cta">
            Get Started <ArrowUpRight size={16} />
          </a>
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
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav
        id="mobile-navigation"
        className="mobile-nav"
        aria-label="Mobile navigation"
        hidden={!isMobileMenuOpen}
      >
        <div className="mobile-nav-inner">
          <a href="#features" onClick={closeMobileMenu}>
            Features
          </a>
          <a href="#how-it-works" onClick={closeMobileMenu}>
            How it works
          </a>
          <a href="#portals" onClick={closeMobileMenu}>
            Our portals
          </a>
          <a href="#impact" onClick={closeMobileMenu}>
            Our impact
          </a>
          <Link href="/login" className="mobile-nav-cta" onClick={closeMobileMenu}>
            Get Started <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>

      <style jsx>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
        }

        .navbar-inner {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: Manrope, sans-serif;
          font-size: 22px;
          font-weight: 800;
        }

        .brand > span:last-child span {
          color: var(--primary);
        }

        .brand-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 12px;
          background: var(--primary-light);
          color: var(--primary);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-links a {
          color: var(--muted);
          font-size: 14px;
          font-weight: 600;
          transition: 0.2s;
        }

        .nav-links a:hover {
          color: var(--primary);
        }

        .nav-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 17px;
          border-radius: 9px;
          color: white;
          background: var(--primary);
          font-size: 14px;
          font-weight: 700;
        }

        .mobile-menu {
          display: none;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          padding: 0;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--foreground);
          background: transparent;
          cursor: pointer;
        }

        .mobile-menu:focus-visible,
        .mobile-nav a:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 3px;
        }

        .mobile-nav {
          position: absolute;
          top: 100%;
          right: 0;
          left: 0;
          background: var(--background);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .mobile-nav[hidden] {
          display: none;
        }

        .mobile-nav-inner {
          display: grid;
          gap: 4px;
          width: min(100% - 32px, 1160px);
          margin: 0 auto;
          padding: 12px 0 16px;
        }

        .mobile-nav a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 44px;
          padding: 8px 12px;
          border-radius: 8px;
          color: var(--foreground);
          font-size: 15px;
          font-weight: 600;
        }

        .mobile-nav a:hover {
          color: var(--primary);
          background: var(--primary-light);
        }

        .mobile-nav .mobile-nav-cta {
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
          color: white;
          background: var(--primary);
        }

        .mobile-nav .mobile-nav-cta:hover {
          color: white;
          filter: brightness(0.95);
        }

        @media (max-width: 850px) {
          .nav-links {
            display: none;
          }

          .mobile-menu {
            display: flex;
          }
        }

        @media (max-width: 480px) {
          .nav-cta {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
