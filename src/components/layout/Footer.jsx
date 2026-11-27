import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <Link href="/" className="footer-brand-link">
            <span className="footer-brand-icon">
              <Leaf size={18} aria-hidden="true" />
            </span>
            <span>
              Our<span>City</span>
            </span>
          </Link>

          <nav className="footer-nav" aria-label="Footer navigation">
            <Link href="/map">Public map</Link>
            <Link href="/driver-info">Collection info</Link>
            <Link href="/clean-city-tips">Clean city tips</Link>
            <Link href="/login?role=citizen">Citizen portal</Link>
            <Link href="/login?role=admin">Management</Link>
            <Link href="/login?role=driver">Driver portal</Link>
          </nav>

          <p className="footer-copyright">© {year} OurCity</p>
        </div>
      </div>
    </footer>
  );
}
