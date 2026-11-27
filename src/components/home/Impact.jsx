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

    </section>
  );
}
