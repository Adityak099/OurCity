import {
  Camera,
  ClipboardList,
  Truck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Camera,
    title: "Spot it & report",
    description: "Anyone can send a photo, location, area and contact details without signing in.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Drivers choose an area",
    description: "Drivers select their city and village or area, then see matching reports immediately.",
  },
  {
    number: "03",
    icon: Truck,
    title: "Clean the spot",
    description: "A driver starts cleaning and updates the shared spot to In Progress.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Show the result",
    description: "An after-photo marks it Cleaned. Everyone can follow progress on the public map.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section process-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Simple process</span>
          <h2>
            From reporting to <span>resolution.</span>
          </h2>
          <p>
            A transparent process connecting citizens, drivers and city
            management.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div className="step-card" key={step.number}>
                <div className="step-top">
                  <span className="step-number">{step.number}</span>
                  <div className="step-icon">
                    <Icon size={25} />
                  </div>
                </div>

                <h3>{step.title}</h3>
                <p>{step.description}</p>

                {index !== steps.length - 1 && (
                  <ArrowRight className="step-arrow" size={20} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}
