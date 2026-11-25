import Link from "next/link";
import Image from "next/image";
import { Menu, ArrowUpRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar">
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

        <a href="#portals" className="mobile-menu" aria-label="Explore portals">
          <Menu size={24} />
        </a>
      </div>

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
          color: var(--foreground);
        }

        @media (max-width: 850px) {
          .nav-links {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .nav-cta {
            display: none;
          }

          .mobile-menu {
            display: block;
          }
        }
      `}</style>
    </header>
  );
}
