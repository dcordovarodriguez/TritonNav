"use client";

import { useNavigationStore } from "@/store/useNavigationStore";

export default function RouteBottomSheet({ navigationData, locationStatus, onRetryLocation }) {
  const expanded = useNavigationStore((state) => state.bottomSheetExpanded);
  const toggleBottomSheet = useNavigationStore((state) => state.toggleBottomSheet);
  const { building, room, instructions, routeDetails, googleMapsUrl, destinationType } = navigationData;

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
              ? `${routeDetails.estimatedWalkMinutes} min walk • ${routeDetails.formattedDistanceFeet}`
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
