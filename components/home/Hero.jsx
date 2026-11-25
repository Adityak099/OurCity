import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Truck,
  Recycle,
  Leaf,
} from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="eyebrow">
            <Leaf size={14} />
            Building greener communities
          </div>

          <h1>
            Building Cleaner Cities,
            <span> Together.</span>
          </h1>

          <p className="hero-description">
            A smarter way to manage waste, track garbage collection and empower
            communities to create cleaner neighbourhoods.
          </p>

          <div className="hero-actions">
            <a href="/login" className="primary-btn">
              Report an Issue <ArrowRight size={17} />
            </a>

            <a href="#how-it-works" className="secondary-btn">
              Explore CleanCity
            </a>
          </div>

          <div className="hero-trust">
            <CheckCircle2 size={17} />
            <span>Connecting citizens, drivers and city authorities</span>
          </div>
        </div>

        {/* <div className="hero-visual">
          <div className="visual-glow" />

          <div className="dashboard-card">
            <div className="dashboard-top">
              <div>
                <span className="dashboard-label">COLLECTION STATUS</span>
                <h3>Your neighbourhood</h3>
              </div>
              <span className="live-pill">● LIVE DEMO</span>
            </div>

            <div className="map-preview">
              <div className="map-grid" />
              <div className="map-road road-one" />
              <div className="map-road road-two" />
              <div className="map-road road-three" />

              <div className="map-pin pin-one">
                <MapPin size={21} />
              </div>
              <div className="map-pin pin-two">
                <Truck size={20} />
              </div>
              <div className="map-pin pin-three">
                <MapPin size={21} />
              </div>

              <div className="map-caption">
                <Truck size={15} />
                Collection vehicle
              </div>
            </div>

            <div className="dashboard-stats">
              <div>
                <span className="stat-icon">
                  <Recycle size={18} />
                </span>
                <div>
                  <strong>Smart</strong>
                  <small>Waste collection</small>
                </div>
              </div>

              <div>
                <span className="stat-icon">
                  <Leaf size={18} />
                </span>
                <div>
                  <strong>Cleaner</strong>
                  <small>Communities</small>
                </div>
              </div>
            </div>
          </div>

          <div className="floating-card">
            <span className="floating-check">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <strong>Issue resolved!</strong>
              <small>Example status update</small>
            </div>
          </div>
        </div> */}
        <Image
          src="/hero/heroimage.jpeg"
          alt="Illustration of a city with waste collection vehicles and citizens"
          width={500}
          height={500}
          className="hero-visual"
        />
      </div>

      <style jsx>{`
        .hero {
          padding: 95px 0 105px;
          overflow: hidden;
          background:
            radial-gradient(circle at 80% 35%, #e7f5e8 0, transparent 34%),
            linear-gradient(120deg, #f9fcf8, #f1f8f1);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 55px;
        }

        h1 {
          font-family: Manrope, sans-serif;
          font-size: clamp(43px, 5.3vw, 66px);
          letter-spacing: -3px;
          line-height: 1.12;
          margin: 25px 0 22px;
          font-weight: 800;
        }

        h1 span {
          color: var(--primary);
        }

        .hero-description {
          max-width: 510px;
          color: var(--muted);
          line-height: 1.85;
          font-size: 17px;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 13px;
          margin-top: 30px;
        }

        .hero-trust {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 29px;
          color: var(--muted);
          font-size: 13px;
        }

        .hero-trust svg {
          color: var(--primary);
        }

        .hero-visual {
          position: relative;
          padding: 25px;
        }

        .visual-glow {
          position: absolute;
          inset: 8%;
          background: #b6e4bc;
          filter: blur(80px);
          opacity: 0.6;
        }

        .dashboard-card {
          position: relative;
          z-index: 1;
          padding: 24px;
          background: white;
          border: 1px solid #e5eee5;
          border-radius: 22px;
          box-shadow: 0 25px 70px rgba(28, 75, 43, 0.12);
        }

        .dashboard-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .dashboard-label {
          color: var(--muted);
          font-size: 10px;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .dashboard-top h3 {
          font-size: 19px;
          margin: 7px 0 0;
          font-family: Manrope, sans-serif;
        }

        .live-pill {
          background: #eaf7ed;
          color: var(--primary);
          padding: 8px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .map-preview {
          height: 285px;
          margin-top: 23px;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          background-color: #e9f2e5;
          background-image: radial-gradient(#c9dcbf 1px, transparent 1px);
          background-size: 18px 18px;
        }

        .map-road {
          position: absolute;
          background: #fff;
          border: 1px solid #dce7d9;
          border-radius: 30px;
        }

        .road-one {
          height: 35px;
          width: 130%;
          top: 45%;
          left: -10%;
          transform: rotate(-20deg);
        }

        .road-two {
          height: 30px;
          width: 110%;
          top: 15%;
          left: 0;
          transform: rotate(48deg);
        }

        .road-three {
          height: 22px;
          width: 90%;
          top: 72%;
          left: 15%;
          transform: rotate(35deg);
        }

        .map-pin {
          position: absolute;
          z-index: 2;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: white;
          box-shadow: 0 5px 15px #285d3840;
        }

        .pin-one {
          background: #dc9a31;
          top: 22%;
          left: 23%;
        }

        .pin-two {
          background: var(--primary);
          top: 48%;
          left: 56%;
          width: 49px;
          height: 49px;
        }

        .pin-three {
          background: #438bca;
          top: 69%;
          left: 77%;
        }

        .map-caption {
          position: absolute;
          bottom: 13px;
          left: 13px;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 8px;
          background: white;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 3px 12px #00000010;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 18px;
        }

        .dashboard-stats > div {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          border-radius: 11px;
          background: #f7faf6;
        }

        .stat-icon {
          color: var(--primary);
        }

        .dashboard-stats strong,
        .dashboard-stats small {
          display: block;
        }

        .dashboard-stats strong {
          font-size: 13px;
        }

        .dashboard-stats small {
          margin-top: 3px;
          color: var(--muted);
          font-size: 10px;
        }

        .floating-card {
          position: absolute;
          z-index: 4;
          right: -4px;
          bottom: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 14px 17px;
          border-radius: 13px;
          box-shadow: 0 12px 35px #00000015;
        }

        .floating-check {
          color: #219653;
        }

        .floating-card strong,
        .floating-card small {
          display: block;
        }

        .floating-card strong {
          font-size: 13px;
        }

        .floating-card small {
          margin-top: 4px;
          color: var(--muted);
          font-size: 11px;
        }

        @media (max-width: 850px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .hero-content {
            text-align: center;
          }

          .hero-description {
            margin-inline: auto;
          }

          .hero-actions,
          .hero-trust {
            justify-content: center;
          }

          .hero-visual {
            max-width: 600px;
            width: 100%;
            margin: auto;
          }
        }

        @media (max-width: 500px) {
          .hero {
            padding: 65px 0;
          }

          .hero-visual {
            padding: 8px 0 25px;
          }

          .dashboard-card {
            padding: 15px;
          }

          .map-preview {
            height: 225px;
          }

          .floating-card {
            right: -5px;
            bottom: -5px;
          }

          .dashboard-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
