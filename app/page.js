import ClassCard from "@/components/ClassCard";
import { MOCK_SCHEDULE } from "@/lib/schedule";
import UCSD_BUILDINGS from "@/lib/buildings";

const highlightedBuildings = UCSD_BUILDINGS.slice(0, 3);

export default function HomePage() {
  return (
    <main className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">TritonNav MVP</p>
          <h1>Navigate from your class schedule to the right UCSD room.</h1>
          <p className="hero-copy">
            This starter gives you the exact MVP flow from the prompt:
            schedule to building handoff to room-level instructions.
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
      </section>

      <section className="section-block">
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
    </main>
  );
}
