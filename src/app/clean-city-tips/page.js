import Link from "next/link";
import {
  ArrowRight,
  Check,
  Droplets,
  Leaf,
  Recycle,
  Sprout,
  Trash2,
} from "lucide-react";

const tips = [
  [Recycle, "Separate before you discard", "Keep wet waste, dry recyclables and household hazardous waste apart so each can be handled safely."],
  [Trash2, "Use a bin, every time", "Keep waste contained and never leave bags beside a full bin. Report overflowing public bins so they can be cleared."],
  [Droplets, "Keep drains and water clean", "Never sweep litter into a storm drain. Lightweight plastic travels quickly into waterways."],
  [Leaf, "Make reuse your first choice", "Carry a reusable bottle and bag, repair what you can, and choose products with less packaging."],
];

export default function CleanCityTipsPage() {
  return (
    <main id="main-content" className="nature-page">
      <section className="nature-hero">
        <div className="container nature-hero-layout">
          <div className="nature-hero-copy">
            <span className="nature-eyebrow">
              <Sprout size={16} aria-hidden="true" />
              SMALL HABITS, BIG CITY ENERGY
            </span>
            <h1>
              Make room for a <span>cleaner</span> kind of <em>everyday.</em>
            </h1>
            <p>
              Little choices add up. Keep your street, park and waterways
              healthier with easy habits anyone can start today.
            </p>
            <div className="nature-hero-actions">
              <Link className="nature-cta" href="/citizen/complaints/new">
                Report a spot <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <a className="nature-text-link" href="#daily-habits">
                Explore the habits
              </a>
            </div>
            <div className="nature-hero-note">
              <span>
                <Leaf size={16} aria-hidden="true" />
              </span>
              <p>
                <strong>Good things grow locally.</strong>
                <br />
                Start with the place right outside your door.
              </p>
            </div>
          </div>
          <div className="nature-hero-art">
            <svg
              className="nature-illustration"
              viewBox="0 0 560 430"
              role="img"
              aria-labelledby="tips-illustration-title"
            >
              <title id="tips-illustration-title">
                A colorful neighborhood with clean streets, recycling bins and
                greener habits
              </title>
              <rect className="tips-scene-card" x="22" y="22" width="516" height="386" rx="34" />
              <circle className="tips-sun" cx="438" cy="104" r="44" />
              <path className="tips-sun-ray" d="M438 43v-12m0 146v-12m61-61h12m-146 0h12m104-43 9-9m-104 104 9-9m86 0 9 9m-104-104 9 9" />
              <path className="tips-hill tips-hill-back" d="M38 271c63-70 113-64 171-9 58-67 130-79 204-9 42-38 79-31 117 2v153H38z" />
              <path className="tips-hill tips-hill-front" d="M38 312c66-39 121-29 178 1 74-43 151-38 223 4 35-20 66-21 91-8v81H38z" />

              <path className="tips-building tips-building-blue" d="M89 164h91v125H89z" />
              <path className="tips-roof tips-roof-blue" d="m78 165 56-46 57 46z" />
              <path className="tips-window" d="M106 184h22v26h-22zm36 0h22v26h-22zm-36 43h22v26h-22zm36 0h22v26h-22z" />

              <path className="tips-building tips-building-rose" d="M207 195h79v94h-79z" />
              <path className="tips-roof tips-roof-rose" d="m198 196 48-38 48 38z" />
              <path className="tips-window" d="M222 212h18v23h-18zm32 0h18v23h-18z" />

              <path className="tips-tree-trunk" d="M355 230h12v63h-12z" />
              <circle className="tips-tree" cx="361" cy="205" r="39" />
              <circle className="tips-tree-highlight" cx="335" cy="216" r="23" />
              <circle className="tips-tree-highlight" cx="386" cy="218" r="22" />

              <path className="tips-street" d="M50 326c84-24 140 27 219 5s148-33 244 2" />
              <path className="tips-street-line" d="M50 326c84-24 140 27 219 5s148-33 244 2" />

              <g className="tips-bin tips-bin-blue" transform="translate(115 290)">
                <path d="M2 14h49l-5 60H7z" />
                <path className="tips-bin-lid" d="M-2 8h57v8H-2zm17-7h23v5H15z" />
                <path className="tips-recycle" d="m19 30 5-8 6 3m-12 8-4 7 6 3m11-6 4 7-6 3" />
              </g>
              <g className="tips-bin tips-bin-amber" transform="translate(416 298)">
                <path d="M2 14h49l-5 60H7z" />
                <path className="tips-bin-lid" d="M-2 8h57v8H-2zm17-7h23v5H15z" />
                <path className="tips-recycle" d="m19 30 5-8 6 3m-12 8-4 7 6 3m11-6 4 7-6 3" />
              </g>

              <g className="tips-pin" transform="translate(334 97)">
                <path d="M31 0C14 0 0 14 0 31c0 25 31 56 31 56s31-31 31-56C62 14 48 0 31 0Z" />
                <circle className="tips-pin-center" cx="31" cy="31" r="18" />
                <path className="tips-pin-check" d="m23 31 6 6 11-13" />
              </g>

              <g className="tips-label" transform="translate(54 54)">
                <rect width="156" height="43" rx="14" />
                <circle className="tips-label-icon" cx="22" cy="21.5" r="11" />
                <path className="tips-label-check" d="m17 22 4 4 7-8" />
                <text x="43" y="26">A cleaner block</text>
              </g>
            </svg>
            <div className="nature-art-tag">
              <span>
                <Check size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>Small step today</strong>
                <small>Cleaner streets tomorrow</small>
              </div>
            </div>
          </div>
        </div>
        <div className="nature-hero-bottom container" aria-label="Better habits for">
          <span>BETTER HABITS FOR</span>
          <strong>Streets</strong>
          <i aria-hidden="true" />
          <strong>Parks</strong>
          <i aria-hidden="true" />
          <strong>Waterways</strong>
        </div>
      </section>
      <section className="container nature-tips-section" id="daily-habits">
        <div className="nature-section-heading">
          <span className="nature-kicker">YOUR EVERYDAY IMPACT</span>
          <h2>
            Four easy ways to keep
            <br />
            <em>good things growing.</em>
          </h2>
          <p>
            Choose one habit to start with. Your neighbourhood will feel the
            difference.
          </p>
        </div>
        <div className="nature-tip-grid">
          {tips.map(([Icon, title, description], index) => (
            <article
              key={title}
              className={`nature-tip-card nature-tip-${index + 1}`}
            >
              <span className="nature-tip-number">0{index + 1}</span>
              <div className="nature-tip-icon">
                <Icon size={24} aria-hidden="true" />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="nature-tip-link">
                Make it a habit <ArrowRight size={15} aria-hidden="true" />
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
