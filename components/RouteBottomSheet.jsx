"use client";

import { useNavigationStore } from "@/store/useNavigationStore";

export default function RouteBottomSheet({ navigationData, locationStatus, onRetryLocation }) {
  const expanded = useNavigationStore((state) => state.bottomSheetExpanded);
  const toggleBottomSheet = useNavigationStore((state) => state.toggleBottomSheet);
  const {
    building,
    room,
    instructions,
    routeDetails,
    googleMapsUrl,
    destinationType,
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
    <aside className="route-bottom-sheet">
      <button
        aria-expanded={expanded}
        className="sheet-handle"
        onClick={toggleBottomSheet}
        type="button"
      >
        <span className="sheet-handle-bar" />
        <span>{expanded ? "Hide trip details" : "Show trip details"}</span>
      </button>

      <div className="route-bottom-sheet-header">
        <div>
          <p className="eyebrow">Current Trip</p>
          <h2>{room ? `${building.shortName} ${room}` : building.name}</h2>
          <p className="muted-copy">
            {routeDetails.estimatedWalkMinutes
              ? `${routeDetails.formattedWalkTime} walk • ${routeDetails.formattedDistanceFeet}`
              : "Waiting for a live origin to estimate walk time"}
          </p>
        </div>
        <a className="primary-link" href={googleMapsUrl} rel="noreferrer" target="_blank">
          Open live navigation
        </a>
      </div>

      {expanded ? (
        <div className="route-bottom-sheet-body">
          <div className="route-metric-grid">
            <div className="route-metric-card">
              <span className="eyebrow">Destination</span>
              <strong>{building.name}</strong>
            </div>
            <div className="route-metric-card">
              <span className="eyebrow">Type</span>
              <strong>{destinationType}</strong>
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

          <p className="route-sheet-copy">{instructions}</p>
          {selectedEntrance ? (
            <p className="route-sheet-copy">
              Arrival: {selectedEntrance.name}
              {accessibilityLabel ? ` (${accessibilityLabel})` : ""}
            </p>
          ) : null}
          {indoorDirections ? (
            <details className="route-step-details">
              <summary>Inside building</summary>
              <div className="route-step-preview-list">
                {indoorDirections.summary ? (
                  <p className="route-sheet-copy">{indoorDirections.summary}</p>
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
            <button className="secondary-link action-button" onClick={onRetryLocation} type="button">
              Refresh location
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
