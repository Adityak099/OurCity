import Link from "next/link";
import Image from "next/image";
import { Leaf, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const year = 2026;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <Image
                src="/hero/OurCity-Mark.png"
                alt="OurCity"
                width={44}
                height={44}
                className="brand-logo"
              />
              <span>
                Clean<span>City</span>
              </span>
            </Link>

            <p>
              Smarter waste management, stronger communities and cleaner cities.
            </p>
          </div>

          <div className="footer-column">
            <h4>Explore</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#impact">Our mission</a>
          </div>

          <div className="footer-column">
            <h4>Our portals</h4>
            <a href="/login?role=citizen">Citizen</a>
            <a href="/login?role=admin">Management</a>
            <a href="/login?role=driver">Driver</a>
          </div>

          <div className="footer-column">
            <h4>Get involved</h4>
            <a href="#portals">
              Join CleanCity <ArrowUpRight size={14} />
            </a>
            <a href="#impact">Community initiatives</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} CleanCity. All rights reserved.</span>
          <span>
            Built for cleaner, greener communities. <Leaf size={14} />
          </span>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #142a1e;
          color: white;
          padding: 65px 0 22px;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: Manrope, sans-serif;
          font-size: 22px;
          font-weight: 800;
        }
        .brand > span:last-child span {
          color: #9bd47b;
        }
        .brand-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 12px;
          background: #264b35;
          color: #a3d977;
        }
        .footer-main {
          display: grid;
          grid-template-columns: 1.7fr 1fr 1fr 1fr;
          gap: 35px;
          padding-bottom: 50px;
        }
        .footer-brand p {
          max-width: 270px;
          color: #a9b9ac;
          line-height: 1.8;
          font-size: 14px;
          margin-top: 17px;
        }
        .footer-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 15px;
        }
        .footer-column h4 {
          font-size: 14px;
          margin: 5px 0 8px;
        }
        .footer-column a {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #a9b9ac;
          font-size: 13px;
          transition: 0.2s;
        }
        .footer-column a:hover {
          color: white;
        }
        .footer-bottom {
          border-top: 1px solid #304437;
          padding-top: 22px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          color: #a9b9ac;
          font-size: 12px;
        }
        .footer-bottom span:last-child {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        @media (max-width: 750px) {
          .footer-main {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 450px) {
          .footer-main {
            grid-template-columns: 1fr;
          }
          .footer-bottom {
            flex-direction: column;
          }
        }
      `}</style>
    </footer>
  );
}
