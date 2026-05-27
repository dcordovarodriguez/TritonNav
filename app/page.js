import ClassCard from "@/components/ClassCard";
import { MOCK_SCHEDULE } from "@/lib/schedule";
import UCSD_BUILDINGS from "@/lib/buildings";

const highlightedBuildings = UCSD_BUILDINGS.slice(0, 3);
const demoSteps = [
  "Tap a class card to preload the building and room.",
  "Preview the route with live location when permission is granted.",
  "Open Google Maps for the final walking handoff."
];
const productHighlights = [
  "UCSD-first building and room search",
  "Campus-aware reverse geocoding for origin labels",
  "Feet-based walking distance for a more natural student demo",
  "Architecture ready to migrate into Expo + React Native later"
];

export default function HomePage() {
  return (
    <main className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">TritonNav Demo</p>
          <h1>Navigate from a UCSD class card to the right room with live campus context.</h1>
          <p className="hero-copy">
            TritonNav is a UCSD-focused navigation experience for students who need a faster way
            to move from a schedule, search result, or live location into the right building
            entrance and room-level instructions.
          </p>
        </div>

        <div className="hero-grid">
          <div className="metric-card">
            <span className="metric-value">{UCSD_BUILDINGS.length}</span>
            <span className="metric-label">campus buildings seeded</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{MOCK_SCHEDULE.length}</span>
            <span className="metric-label">mock classes ready</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Room-level</span>
            <span className="metric-label">final-leg directions included</span>
          </div>
        </div>

        <div className="hero-actions">
          <a className="primary-link" href="#classes">
            Start the class demo
          </a>
          <a className="secondary-link" href="/search">
            Search campus destinations
          </a>
        </div>
      </section>

      <section className="section-block" id="classes">
        <div className="section-heading">
          <div>
            <p className="eyebrow">My Classes</p>
            <h2>Demo-ready schedule cards</h2>
          </div>
          <p className="section-note">
            Each card routes into the navigation screen with the building and room prefilled.
          </p>
        </div>

        <div className="card-grid">
          {MOCK_SCHEDULE.map((classItem) => (
            <ClassCard key={classItem.id} classItem={classItem} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Demo Flow</p>
            <h2>How to present TritonNav live</h2>
          </div>
          <p className="section-note">
            This keeps the demo easy to explain on desktop and on an iPhone-sized layout.
          </p>
        </div>

        <div className="card-grid compact-grid">
          {demoSteps.map((step, index) => (
            <article className="building-card feature-card" key={step}>
              <p className="building-short">Step {index + 1}</p>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Campus Coverage</p>
            <h2>Sample building records</h2>
          </div>
        </div>

        <div className="card-grid compact-grid">
          {highlightedBuildings.map((building) => (
            <article className="building-card" key={building.id}>
              <p className="building-short">{building.shortName}</p>
              <h3>{building.name}</h3>
              <p>{building.address}</p>
              <p>
                {building.entrances.length} entrances and {building.rooms.length} seeded rooms
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">About TritonNav</p>
            <h2>UCSD-specific navigation built to adapt with students</h2>
          </div>
          <p className="section-note">
            The long-term roadmap is a mobile-first TritonNav experience that can move into Expo
            and React Native without rewriting the campus logic.
          </p>
        </div>

        <div className="card-grid">
          {productHighlights.map((highlight) => (
            <article className="building-card feature-card" key={highlight}>
              <p className="building-short">Why it matters</p>
              <h3>{highlight}</h3>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
