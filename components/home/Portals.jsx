"use client";

import { UserRound, ShieldCheck, Truck, ArrowUpRight } from "lucide-react";

const portals = [
  {
    icon: UserRound,
    role: "For Citizens",
    title: "Your neighbourhood. Your voice.",
    description:
      "Report garbage issues, follow collection vehicles and track complaint progress.",
    href: "/login?role=citizen",
    features: ["Report issues", "Track complaints", "View collection vans"],
    color: "#eaf5ed",
  },
  {
    icon: ShieldCheck,
    role: "For Management",
    title: "Manage a cleaner city.",
    description:
      "Monitor complaints, assign drivers and oversee waste collection operations.",
    href: "/login?role=admin",
    features: ["Manage complaints", "Assign drivers", "View analytics"],
    color: "#edf1fc",
  },
  {
    icon: Truck,
    role: "For Drivers",
    title: "Make every collection count.",
    description:
      "Access assigned complaints, manage collection routes and share live location.",
    href: "/login?role=driver",
    features: ["View assignments", "Start collection", "Share GPS location"],
    color: "#fff3e5",
  },
];

export default function Portals() {
  return (
    <section id="portals" className="section portals-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">One platform, three experiences</span>
          <h2>
            Built for everyone who makes a <span>difference.</span>
          </h2>
          <p>
            Every stakeholder gets the tools they need to contribute to a
            cleaner community.
          </p>
        </div>

        <div className="portal-grid">
          {portals.map((portal) => {
            const Icon = portal.icon;

            return (
              <article className="portal-card" key={portal.role}>
                <div
                  className="portal-icon"
                  style={{ background: portal.color }}
                >
                  <Icon size={27} />
                </div>

                <span className="portal-role">{portal.role}</span>
                <h3>{portal.title}</h3>
                <p>{portal.description}</p>

                <ul>
                  {portal.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>

                <a href={portal.href} className="portal-link">
                  Access portal <ArrowUpRight size={17} />
                </a>
              </article>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .portals-section {
          background: white;
        }

        .portal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .portal-card {
          border: 1px solid var(--border);
          padding: 28px;
          border-radius: 16px;
          transition: 0.25s ease;
        }

        .portal-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px #163b2410;
        }

        .portal-icon {
          display: grid;
          place-items: center;
          width: 55px;
          height: 55px;
          border-radius: 14px;
          color: var(--primary);
        }

        .portal-role {
          display: block;
          margin-top: 23px;
          font-size: 12px;
          color: var(--primary);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .portal-card h3 {
          margin: 10px 0;
          font-family: Manrope, sans-serif;
          font-size: 21px;
        }

        .portal-card > p {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.8;
          min-height: 76px;
        }

        .portal-card ul {
          list-style: none;
          padding: 0;
          margin: 22px 0;
        }

        .portal-card li {
          color: #52665a;
          margin: 12px 0;
          font-size: 13px;
        }

        .portal-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border);
          padding-top: 18px;
          margin-top: 20px;
          font-size: 14px;
          font-weight: 700;
          color: var(--primary);
        }

        @media (max-width: 850px) {
          .portal-grid {
            grid-template-columns: 1fr;
          }

          .portal-card > p {
            min-height: auto;
          }
        }
      `}</style>
    </section>
  );
}
