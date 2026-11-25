"use client";

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
    title: "Report",
    description: "Citizens report garbage issues with a photo and location.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Assign",
    description: "Authorities review complaints and assign collection teams.",
  },
  {
    number: "03",
    icon: Truck,
    title: "Collect",
    description: "Drivers receive tasks and manage their assigned routes.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Resolve",
    description: "The issue is resolved and citizens can track the update.",
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
                  <ArrowRight className="step-arrow" size={20} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .process-section {
          background: #f7faf6;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .step-card {
          position: relative;
          padding: 25px;
          border-radius: 15px;
          border: 1px solid var(--border);
          background: white;
        }

        .step-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .step-number {
          color: #a2b3a5;
          font-size: 13px;
          font-weight: 800;
        }

        .step-icon {
          display: grid;
          place-items: center;
          width: 51px;
          height: 51px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 13px;
        }

        .step-card h3 {
          font-family: Manrope, sans-serif;
          margin: 22px 0 8px;
          font-size: 20px;
        }

        .step-card p {
          color: var(--muted);
          line-height: 1.8;
          font-size: 13px;
          margin: 0;
        }

        .step-arrow {
          position: absolute;
          top: 41px;
          right: -19px;
          color: #8eae95;
          z-index: 2;
        }

        @media (max-width: 850px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .step-arrow {
            display: none;
          }
        }

        @media (max-width: 500px) {
          .steps-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
