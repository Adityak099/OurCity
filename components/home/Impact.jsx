"use client";

import { Leaf, Recycle, Users, TreePine, ArrowRight } from "lucide-react";

export default function Impact() {
  return (
    <section id="impact" className="section impact-section">
      <div className="container impact-grid">
        <div className="impact-content">
          <span className="eyebrow">
            <Leaf size={14} /> Our mission
          </span>

          <h2>
            A cleaner environment starts with
            <span> small actions.</span>
          </h2>

          <p>
            Better waste management isn&apos;t just about collecting garbage. It&apos;s
            about building responsible communities, encouraging sustainable
            habits and creating healthier neighbourhoods.
          </p>

          <a href="#portals" className="impact-link">
            Be part of the change <ArrowRight size={17} />
          </a>
        </div>

        <div className="impact-visual">
          <div className="impact-card">
            <div className="impact-card-icon">
              <Recycle size={25} />
            </div>
            <h3>Responsible Waste Disposal</h3>
            <p>Encouraging better segregation and disposal habits.</p>
          </div>

          <div className="impact-card">
            <div className="impact-card-icon">
              <Users size={25} />
            </div>
            <h3>Active Communities</h3>
            <p>Bringing citizens together for cleaner neighbourhoods.</p>
          </div>

          <div className="impact-card">
            <div className="impact-card-icon">
              <TreePine size={25} />
            </div>
            <h3>Greener Cities</h3>
            <p>Supporting sustainable urban environments.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .impact-section {
          background: #f2f8f1;
        }

        .impact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 70px;
        }

        .impact-content h2 {
          font-family: Manrope, sans-serif;
          font-size: clamp(32px, 4vw, 46px);
          line-height: 1.2;
          letter-spacing: -1.8px;
          margin: 22px 0;
        }

        .impact-content h2 span {
          color: var(--primary);
        }

        .impact-content > p {
          color: var(--muted);
          line-height: 1.9;
          font-size: 15px;
          max-width: 490px;
        }

        .impact-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
          color: var(--primary);
          font-size: 14px;
          font-weight: 700;
        }

        .impact-visual {
          display: grid;
          gap: 15px;
        }

        .impact-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 22px;
          border-radius: 14px;
          border: 1px solid #e0eadf;
          background: white;
        }

        .impact-card-icon {
          display: grid;
          place-items: center;
          width: 45px;
          height: 45px;
          color: var(--primary);
          background: var(--primary-light);
          border-radius: 12px;
        }

        .impact-card h3 {
          font-family: Manrope, sans-serif;
          font-size: 17px;
          margin: 13px 0 5px;
        }

        .impact-card p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        @media (max-width: 800px) {
          .impact-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }
        }
      `}</style>
    </section>
  );
}
