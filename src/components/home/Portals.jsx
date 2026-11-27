import { UserRound, ShieldCheck, Truck, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const portals = [
  {
    icon: UserRound,
    role: "Open to everyone",
    title: "Your neighbourhood. Your voice.",
    description:
      "Report a garbage spot without creating an account and follow its progress publicly.",
    href: "/citizen/complaints/new",
    features: ["No login to report", "Photo and location", "Public progress map"],
  },
  {
    icon: ShieldCheck,
    role: "For Management",
    title: "Manage a cleaner city.",
    description:
      "Monitor complaints, assign drivers and oversee waste collection operations.",
    href: "/login?role=admin",
    features: ["Manage complaints", "Assign drivers", "View analytics"],
  },
  {
    icon: Truck,
    role: "For Drivers",
    title: "Make every collection count.",
    description:
      "Choose a working area, find matching reports, clean a spot and upload proof.",
    href: "/login?role=driver",
    features: ["Choose working area", "Pick a reported spot", "Upload after-photo"],
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
                <div className="portal-icon">
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

                <Link href={portal.href} className="portal-link">
                  Access portal <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>

    </section>
  );
}
