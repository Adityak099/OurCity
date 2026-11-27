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
    title: "Open Spot Reporting",
    description:
      "Anyone can report a garbage spot without login, using a photo, location, area and contact details.",
  },
  {
    icon: Truck,
    title: "Driver Area Selection",
    description:
      "Drivers choose their working city and area to find matching reports and clean them directly.",
  },
  {
    icon: BellRing,
    title: "Before & After Proof",
    description:
      "Every spot follows Reported, In Progress and Cleaned statuses with photo evidence.",
  },
  {
    icon: MapPin,
    title: "Public Map",
    description:
      "See reported spots, their progress, before-and-after photos and cleanup dates.",
  },
  {
    icon: BarChart3,
    title: "Municipal Oversight",
    description:
      "Help municipal teams monitor shared reports, cleaning progress and area performance.",
  },
  {
    icon: Users,
    title: "Cleaner Living",
    description:
      "Simple everyday habits and local collection information support cleaner neighbourhoods.",
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
                <div className="feature-icon">
                  <Icon size={25} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>

    </section>
  );
}
