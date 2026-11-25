"use client";

import {
  Camera,
  MapPin,
  Truck,
  BellRing,
  BarChart3,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Smart Complaint Reporting",
    description:
      "Report overflowing bins and garbage hotspots with photos and automatically captured location.",
    color: "#eaf5ed",
  },
  {
    icon: Truck,
    title: "Live Garbage Tracking",
    description:
      "See collection vehicles on the map and know when your neighbourhood will be served.",
    color: "#eaf1fc",
  },
  {
    icon: BellRing,
    title: "Real-time Notifications",
    description:
      "Stay informed about complaint updates, collection schedules and nearby vehicles.",
    color: "#fff5e7",
  },
  {
    icon: MapPin,
    title: "Location Intelligence",
    description:
      "Identify recurring garbage hotspots and understand neighbourhood cleanliness.",
    color: "#f3edff",
  },
  {
    icon: BarChart3,
    title: "Smart Management",
    description:
      "Give authorities tools to assign complaints, monitor progress and measure performance.",
    color: "#e8f6f5",
  },
  {
    icon: Users,
    title: "Community Participation",
    description:
      "Bring citizens together through awareness activities and cleanliness initiatives.",
    color: "#fff0ed",
  },
];

export default function Features() {
  return (
    <section id="features" className="section features-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">What we offer</span>
          <h2>
            Everything needed for a <span>cleaner city.</span>
          </h2>
          <p>
            A connected ecosystem that makes waste collection more transparent,
            efficient and community-driven.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="feature-card" key={feature.title}>
                <div
                  className="feature-icon"
                  style={{ background: feature.color }}
                >
                  <Icon size={25} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .features-section {
          background: white;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .feature-card {
          padding: 28px;
          border: 1px solid var(--border);
          border-radius: 15px;
          transition: 0.25s ease;
          background: white;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          border-color: #b7d7bf;
          box-shadow: 0 14px 35px #173e2610;
        }

        .feature-icon {
          display: grid;
          place-items: center;
          width: 53px;
          height: 53px;
          border-radius: 13px;
          color: var(--primary);
        }

        .feature-card h3 {
          margin: 21px 0 10px;
          font-family: Manrope, sans-serif;
          font-size: 18px;
        }

        .feature-card p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.8;
        }

        @media (max-width: 850px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 550px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
