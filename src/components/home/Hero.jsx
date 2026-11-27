import { ArrowRight, BadgeCheck, CheckCircle2, Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="eyebrow">
            <Leaf size={14} aria-hidden="true" />
            OurCity · A Smart Solution for a Cleaner India
          </div>

          <h1>
            See it. Report it.
            <span> Clean it. Track it.</span>
          </h1>

          <p className="hero-description">
            Report a garbage spot in seconds—no account needed. Local drivers
            choose their area, clean reported spots and share proof of the work.
          </p>

          <div className="hero-actions">
            <Link href="/citizen/complaints/new" className="primary-btn">
              Report an Issue <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/map" className="secondary-btn">
              Explore Live Map
            </Link>
          </div>

          <div className="hero-trust">
            <CheckCircle2 size={17} aria-hidden="true" />
            <span>No login · Local action · Visible progress</span>
          </div>
        </div>

        <div className="hero-visual-card">
          <Image
            src="/hero/heroimage.jpeg"
            alt="OurCity community working together for a cleaner neighbourhood"
            width={620}
            height={520}
            className="hero-visual"
            priority
          />
          <div className="hero-sticker">
            <BadgeCheck size={20} aria-hidden="true" />
            <span>
              <strong>Verified</strong>
              <small>Community reported</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
