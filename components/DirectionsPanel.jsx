export default function DirectionsPanel({ navigationData }) {
  const { building, instructions, steps, room } = navigationData;

  return (
    <section className="directions-card">
      <p className="eyebrow">Final Leg</p>
      <h2>{room ? `Room ${room}` : building.shortName}</h2>
      <p className="directions-summary">{instructions}</p>

      <div className="steps-list">
        {steps.map((step, index) => (
          <div className="step-row" key={`${step}-${index}`}>
            <span className="step-number">{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      <div className="entrance-list">
        <h3>Known entrances</h3>
        {building.entrances.map((entrance) => (
          <p key={entrance.label}>
            <strong>{entrance.label}:</strong> {entrance.coords.lat}, {entrance.coords.lng}
          </p>
        ))}
      </div>
    </section>
  );
}
