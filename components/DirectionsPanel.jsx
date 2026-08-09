export default function DirectionsPanel({ navigationData }) {
  const {
    building,
    instructions,
    steps,
    room,
    routeDetails,
    destinationType,
    googleMapsUrl,
    selectedEntrance
  } = navigationData;
  const accessibilityLabel =
    selectedEntrance?.accessible === true
      ? "accessible entrance"
      : selectedEntrance?.accessible === false
        ? "accessibility unverified"
        : selectedEntrance
          ? "accessibility unknown"
          : "";
  const indoorDirections = navigationData.indoorDirections || routeDetails.indoorDirections;

  return (
    <section className="directions-card desktop-directions-panel">
      <p className="eyebrow">Final Leg</p>
      <h2>{room ? `Room ${room}` : building.shortName}</h2>
      <p className="muted-copy">
        {building.name} • {destinationType}
      </p>
      <div className="route-metric-grid">
        <div className="route-metric-card">
          <span className="eyebrow">Estimated walk</span>
          <strong>
            {routeDetails.estimatedWalkMinutes
              ? routeDetails.formattedWalkTime
              : "Waiting for location"}
          </strong>
        </div>
        <div className="route-metric-card">
          <span className="eyebrow">Distance</span>
          <strong>{routeDetails.formattedDistanceFeet}</strong>
        </div>
        <div className="route-metric-card">
          <span className="eyebrow">Origin</span>
          <strong>{routeDetails.originPlaceName}</strong>
        </div>
      </div>
      <p className="directions-summary">{instructions}</p>
      {selectedEntrance ? (
        <p className="directions-summary">
          Arrival: {selectedEntrance.name}
          {accessibilityLabel ? ` (${accessibilityLabel})` : ""}
        </p>
      ) : null}
      {indoorDirections ? (
        <details className="route-step-details">
          <summary>Inside building</summary>
          <div className="route-step-preview-list">
            {indoorDirections.summary ? (
              <p className="directions-summary">{indoorDirections.summary}</p>
            ) : null}
            {indoorDirections.steps?.map((step, index) => (
              <div className="route-step-preview-row" key={`${step}-${index}`}>
                <span>{index + 1}</span>
                <p>
                  <strong>{step}</strong>
                </p>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <div className="route-sheet-actions">
        <a className="secondary-link" href={googleMapsUrl} rel="noreferrer" target="_blank">
          Open in Google Maps
        </a>
      </div>

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
