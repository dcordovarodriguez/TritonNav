"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistanceMeters, metersToFeet } from "@/lib/distance";
import { buildNavigationHref, getNavigationData, searchCampusLocations } from "@/lib/navigation";
import { createGoogleMapsEmbedUrl } from "@/services/mapsService";

const DEFAULT_QUERY = "";
const DEMO_SEARCHES = ["CSB 115", "MOS 0114", "MANDE B202", "DIB 122"];
const DEMO_ACTIONS = [
  {
    label: "Find My Class",
    query: "CSB 115",
    detail: "Room route",
    icon: "CS"
  },
  {
    label: "Find a Building",
    query: "DIB 122",
    detail: "Building + room",
    icon: "BLD"
  },
  {
    label: "Explore Colleges",
    query: "Sixth",
    detail: "College result",
    icon: "COL"
  }
];
const FALLBACK_ORIGIN = {
  lat: 32.88114,
  lng: -117.23758,
  label: "Geisel Library"
};
const DEFAULT_MAP_CENTER = {
  lat: 32.88006,
  lng: -117.23401
};
const SHEET_STATES = {
  DISCOVERY: "discovery",
  RESULTS: "results",
  SELECTED: "selected",
  ROUTE: "route"
};
const WALKING_METERS_PER_MINUTE = 80.4672;
const METERS_PER_MILE = 1609.344;
const FEET_PER_MILE = 5280;
const MAP_LONGITUDE_SCALE = 14000;
const MAP_LATITUDE_SCALE = 18000;

function formatResultType(type) {
  if (!type) return "Destination";
  if (type === "student center") return "Student Center";
  return type
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function getDisplayTitle(result) {
  const abbreviation = result.buildingCode || result.shortName;
  if (result.room && abbreviation) return `${abbreviation} ${result.room}`;
  return result.name;
}

function getDisplaySubtitle(result) {
  if (result.type === "college") {
    const buildingCount = result.associatedBuildings?.length || 0;
    const residenceCount = result.residenceHalls?.length || 0;
    return `${buildingCount} buildings • ${residenceCount} residences`;
  }

  if (result.type === "recreation") {
    return (result.amenities || []).slice(0, 2).join(" • ") || result.address;
  }

  if (!result.room) return result.address || result.typeLabel;
  const title = getDisplayTitle(result);
  return result.name.replace(title, "").trim() || result.address || result.name;
}

function getLocationLabel(status, location) {
  if (location) return "Current location";
  if (status === "loading" || status === "idle") return "Locating…";
  if (status === "denied") return "Permission required";
  if (status === "unsupported") return "Location unavailable";
  return "Approximate campus area";
}

function clampMapPoint(value) {
  return Math.min(92, Math.max(8, value));
}

function hasCoordinates(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng);
}

function getRoutePoint(origin, destination, latitudeRatio, longitudeRatio) {
  return {
    lat: origin.lat + (destination.lat - origin.lat) * latitudeRatio,
    lng: origin.lng + (destination.lng - origin.lng) * longitudeRatio
  };
}

function buildRouteGeoPath(origin, destination) {
  if (!hasCoordinates(origin) || !hasCoordinates(destination)) {
    return [];
  }

  const latitudeDelta = Math.abs(destination.lat - origin.lat);
  const longitudeDelta = Math.abs(destination.lng - origin.lng);

  if (latitudeDelta + longitudeDelta < 0.00025) {
    return [origin, destination];
  }

  const followsEastWestAxis = longitudeDelta >= latitudeDelta;

  return followsEastWestAxis
    ? [
        origin,
        getRoutePoint(origin, destination, 0.12, 0.45),
        getRoutePoint(origin, destination, 0.72, 0.58),
        destination
      ]
    : [
        origin,
        getRoutePoint(origin, destination, 0.45, 0.12),
        getRoutePoint(origin, destination, 0.58, 0.72),
        destination
      ];
}

function projectRoutePoint(point, destination) {
  return {
    x: clampMapPoint(50 + (point.lng - destination.lng) * MAP_LONGITUDE_SCALE),
    y: clampMapPoint(50 - (point.lat - destination.lat) * MAP_LATITUDE_SCALE)
  };
}

function calculateRouteDistanceMeters(routePath, origin, destination) {
  if (routePath.length < 2) return calculateDistanceMeters(origin, destination);

  return routePath.reduce((totalDistance, point, index) => {
    if (index === 0) return totalDistance;
    const segmentDistance = calculateDistanceMeters(routePath[index - 1], point);
    return totalDistance + (segmentDistance || 0);
  }, 0);
}

function getRouteOverlayGeometry(origin, destination) {
  if (!origin || !destination) {
    return {
      origin: { x: 30, y: 72 },
      destination: { x: 50, y: 50 },
      path: "30,72 50,50",
      geoPath: []
    };
  }

  const geoPath = buildRouteGeoPath(origin, destination);
  const projectedPath = geoPath.map((point) => projectRoutePoint(point, destination));
  const [originPoint] = projectedPath;
  const destinationPoint = projectedPath[projectedPath.length - 1];

  return {
    origin: originPoint || { x: 30, y: 72 },
    destination: destinationPoint || { x: 50, y: 50 },
    path: projectedPath.map((point) => `${point.x},${point.y}`).join(" "),
    geoPath
  };
}

function getCollegeBoundaryOverlay(college) {
  if (!college?.boundaryPolygon?.length || !college?.coordinates) return null;

  const boundaryPoints = college.boundaryPolygon.map((point) =>
    projectRoutePoint(point, college.coordinates)
  );

  return {
    points: boundaryPoints.map((point) => `${point.x},${point.y}`).join(" ")
  };
}

function formatRouteDistance(distanceMeters) {
  const feet = metersToFeet(distanceMeters);
  if (!feet) return "Distance unavailable";
  if (feet < FEET_PER_MILE * 0.25) return `${feet.toLocaleString()} ft`;
  return `${(feet / FEET_PER_MILE).toFixed(1)} miles`;
}

function buildRoutePreview({ origin, destination, destinationLabel, originLabel }) {
  const routeGeometry = getRouteOverlayGeometry(origin, destination);
  const distanceMeters = calculateRouteDistanceMeters(routeGeometry.geoPath, origin, destination);
  const walkMinutes = distanceMeters
    ? Math.max(1, Math.round(distanceMeters / WALKING_METERS_PER_MINUTE))
    : null;

  return {
    destinationLabel,
    distanceLabel: formatRouteDistance(distanceMeters),
    walkTimeLabel: walkMinutes ? `${walkMinutes} minutes` : "Time unavailable",
    originLabel,
    points: {
      origin: routeGeometry.origin,
      destination: routeGeometry.destination
    },
    path: routeGeometry.path
  };
}

export default function HomePage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [selectedResult, setSelectedResult] = useState(null);
  const [sheetState, setSheetState] = useState(SHEET_STATES.DISCOVERY);
  const { location, status, retryLocation } = useLocation();
  const hasSearchQuery = query.trim().length > 0;
  const results = useMemo(() => searchCampusLocations(query), [query]);
  const navigationData = useMemo(
    () =>
      selectedResult
        ? getNavigationData(
            selectedResult.buildingId,
            selectedResult.room,
            location || FALLBACK_ORIGIN
          )
        : null,
    [location, selectedResult]
  );
  const destination = navigationData?.destination;
  const mapCenter = destination || DEFAULT_MAP_CENTER;
  const embedUrl = createGoogleMapsEmbedUrl(mapCenter, destination ? 18 : 16);
  const selectedKey = selectedResult
    ? `${selectedResult.buildingId}:${selectedResult.room || ""}`
    : "";
  const visibleResults = results.slice(0, 6);
  const origin = location || FALLBACK_ORIGIN;
  const routePreview = navigationData
    ? buildRoutePreview({
        origin,
        destination,
        destinationLabel: navigationData.routeDetails.destinationLabel,
        originLabel: location ? "Current location" : FALLBACK_ORIGIN.label
      })
    : null;
  const selectedCollege = navigationData?.college;
  const selectedRecreationFacility = navigationData?.recreationFacility;
  const collegeBoundary = getCollegeBoundaryOverlay(selectedCollege);
  const shouldShowResults = sheetState === SHEET_STATES.RESULTS && hasSearchQuery;
  const shouldShowDestination = sheetState === SHEET_STATES.SELECTED && selectedResult && routePreview;
  const shouldShowRoute = sheetState === SHEET_STATES.ROUTE && selectedResult && routePreview;

  function selectResult(result) {
    setSelectedResult(result);
    setSheetState(SHEET_STATES.SELECTED);
  }

  function runDemoSearch(queryValue) {
    setQuery(queryValue);
    const [demoResult] = searchCampusLocations(queryValue);
    if (demoResult) selectResult(demoResult);
  }

  function submitSearch(event) {
    event.preventDefault();
    if (results[0]) {
      selectResult(results[0]);
      return;
    }

    setSheetState(hasSearchQuery ? SHEET_STATES.RESULTS : SHEET_STATES.DISCOVERY);
  }

  function selectFeatured(queryValue) {
    runDemoSearch(queryValue);
  }

  function updateQuery(value) {
    setQuery(value);
    setSheetState(value.trim() ? SHEET_STATES.RESULTS : SHEET_STATES.DISCOVERY);
  }

  function clearSearch() {
    setQuery("");
    setSheetState(SHEET_STATES.DISCOVERY);
  }

  function changeDestination() {
    setSelectedResult(null);
    setSheetState(query.trim() ? SHEET_STATES.RESULTS : SHEET_STATES.DISCOVERY);
  }

  function previewRoute() {
    if (selectedResult) setSheetState(SHEET_STATES.ROUTE);
  }

  return (
    <main className="map-first-page">
      <section className="campus-map-shell" aria-label="UCSD campus map search">
        <div className="map-top-bar">
          <div className="map-brand-row">
            <div>
              <p className="map-brand-eyebrow">Prototype in Development</p>
              <strong>TritonNav</strong>
            </div>
            <span className="map-brand-status">UCSD campus guide</span>
          </div>
          <form className="map-search-form" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="campus-search">
              Search UCSD destinations
            </label>
            <span className="map-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              autoComplete="off"
              className="map-search-input"
              id="campus-search"
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Where are you going?"
              type="search"
              value={query}
            />
            {query ? (
              <button
                aria-label="Clear search"
                className="map-search-clear"
                onClick={clearSearch}
                type="button"
              >
                ×
              </button>
            ) : null}
            <button aria-label="Search destinations" className="map-search-submit" type="submit">
              Search
            </button>
          </form>
        </div>

        <button
          className="map-location-button"
          onClick={retryLocation}
          title="Use current location"
          type="button"
        >
          <span className="map-location-dot" />
          <span>{getLocationLabel(status, location)}</span>
        </button>

        <div className="campus-map-frame">
          {embedUrl ? (
            <>
              <iframe
                allowFullScreen
                height="100%"
                loading="lazy"
                src={embedUrl}
                title={`Map centered on ${navigationData?.building.name || "UC San Diego"}`}
                width="100%"
              />
              {routePreview ? (
                <div className="route-preview-overlay" aria-hidden="true">
                  <svg className="route-line-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {collegeBoundary ? (
                      <polygon className="college-boundary-fill" points={collegeBoundary.points} />
                    ) : null}
                    {collegeBoundary ? (
                      <polygon className="college-boundary-line" points={collegeBoundary.points} />
                    ) : null}
                    {shouldShowRoute ? (
                      <polyline
                        className="route-line-shadow"
                        fill="none"
                        points={routePreview.path}
                      />
                    ) : null}
                    {shouldShowRoute ? (
                      <polyline
                        className="route-line"
                        fill="none"
                        points={routePreview.path}
                      />
                    ) : null}
                  </svg>
                  {shouldShowRoute ? (
                    <span
                      className="route-marker route-marker-origin"
                      style={{
                        left: `${routePreview.points.origin.x}%`,
                        top: `${routePreview.points.origin.y}%`
                      }}
                    />
                  ) : null}
                  <span
                    className="route-marker route-marker-destination"
                    style={{
                      left: `${routePreview.points.destination.x}%`,
                      top: `${routePreview.points.destination.y}%`
                    }}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="map-empty-state">Select a destination.</div>
          )}
        </div>

        <section
          aria-label="Destination panel"
          className={`map-bottom-sheet map-bottom-sheet-${sheetState}`}
        >
          <button
            aria-label="Show destination options"
            className="sheet-grab-handle"
            onClick={() => setSheetState(SHEET_STATES.DISCOVERY)}
            type="button"
          >
            <span />
          </button>

          {sheetState === SHEET_STATES.DISCOVERY ? (
            <div className="sheet-panel-content">
              <div className="sheet-heading-row">
                <div>
                  <p className="eyebrow">Start Here</p>
                  <h1>Where are you going?</h1>
                </div>
                <span className="sheet-state-chip">Guest search</span>
              </div>
              <div className="quick-destination-row" aria-label="Quick destinations">
                {DEMO_SEARCHES.map((featuredQuery) => (
                  <button
                    className="quick-destination-chip"
                    key={featuredQuery}
                    onClick={() => selectFeatured(featuredQuery)}
                    type="button"
                  >
                    {featuredQuery}
                  </button>
                ))}
              </div>
              <div className="demo-route-row" aria-label="Demo routes">
                {DEMO_ACTIONS.map((action) => (
                  <button
                    className="demo-route-button"
                    key={action.label}
                    onClick={() => runDemoSearch(action.query)}
                    type="button"
                  >
                    <span className="demo-route-icon" aria-hidden="true">
                      {action.icon}
                    </span>
                    <span className="demo-route-copy">
                      <span>{action.label}</span>
                      <small>{action.query}</small>
                    </span>
                    <span className="demo-route-arrow" aria-hidden="true">
                      &gt;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {shouldShowResults ? (
            <div className="sheet-panel-content">
              <div className="sheet-heading-row">
                <div>
                  <p className="eyebrow">Search Results</p>
                  <h2>{visibleResults.length ? "Select a destination" : "No matches yet"}</h2>
                </div>
                <button className="sheet-text-button" onClick={clearSearch} type="button">
                  Clear
                </button>
              </div>
              {visibleResults.length ? (
                <div className="sheet-result-list" aria-label="Search results">
                  {visibleResults.map((result) => {
                    const resultKey = `${result.buildingId}:${result.room || ""}`;
                    const isSelected = resultKey === selectedKey;
                    const abbreviation = result.buildingCode || result.shortName || "";

                    return (
                      <button
                        aria-pressed={isSelected}
                        className={`sheet-result-row ${isSelected ? "sheet-result-row-selected" : ""}`}
                        key={result.key}
                        onClick={() => selectResult(result)}
                        type="button"
                      >
                        <span>
                          <strong>{getDisplayTitle(result)}</strong>
                          <small>{getDisplaySubtitle(result)}</small>
                        </span>
                        <span className="sheet-result-side">
                          <span className="sheet-result-meta">
                            {formatResultType(result.typeLabel || result.type)}
                            {abbreviation ? ` • ${abbreviation}` : ""}
                          </span>
                          <span className="sheet-result-arrow" aria-hidden="true">
                            &gt;
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="sheet-empty-state">
                  Try CSB 115, MOS 0114, MANDE B202, DIB 122, Muir, Sixth, or Geisel.
                </div>
              )}
            </div>
          ) : null}

          {shouldShowDestination ? (
            <div className="sheet-panel-content">
              <div className="sheet-heading-row">
                <div>
                  <p className="eyebrow">Destination Selected</p>
                  <h2>{routePreview.destinationLabel}</h2>
                </div>
                <button className="sheet-text-button" onClick={changeDestination} type="button">
                  Change
                </button>
              </div>
              <div className="sheet-metric-grid">
                <div>
                  <span>Distance</span>
                  <strong>{routePreview.distanceLabel}</strong>
                </div>
                <div>
                  <span>Walk time</span>
                  <strong>{routePreview.walkTimeLabel}</strong>
                </div>
              </div>
              <p className="sheet-summary">
                {navigationData.instructions}
              </p>
              {selectedCollege ? (
                <p className="sheet-supporting-copy">
                  {selectedCollege.associatedBuildings.slice(0, 3).join(", ")}
                </p>
              ) : null}
              {selectedRecreationFacility ? (
                <div className="facility-link-list">
                  {selectedRecreationFacility.ctas.slice(0, 2).map((cta) => (
                    <a
                      className="facility-link-button"
                      href={cta.url}
                      key={cta.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {cta.label}
                    </a>
                  ))}
                </div>
              ) : null}
              <button className="sheet-primary-action" onClick={previewRoute} type="button">
                Preview Route
              </button>
            </div>
          ) : null}

          {shouldShowRoute ? (
            <div className="sheet-panel-content">
              <div className="sheet-heading-row">
                <div>
                  <p className="eyebrow">Route Preview</p>
                  <h2>{routePreview.destinationLabel}</h2>
                </div>
                <button className="sheet-text-button" onClick={changeDestination} type="button">
                  Change
                </button>
              </div>
              <div className="sheet-metric-grid">
                <div>
                  <span>Origin</span>
                  <strong>{routePreview.originLabel}</strong>
                </div>
                <div>
                  <span>Distance</span>
                  <strong>{routePreview.distanceLabel}</strong>
                </div>
                <div>
                  <span>Walk time</span>
                  <strong>{routePreview.walkTimeLabel}</strong>
                </div>
              </div>
              <p className="sheet-summary">{navigationData.instructions}</p>
              <p className="sheet-supporting-copy">
                Accessibility preferences are coming soon. Current preview uses the campus walking
                estimate.
              </p>
              <Link
                className="sheet-primary-action"
                href={buildNavigationHref(selectedResult.buildingId, selectedResult.room)}
              >
                Start Route
              </Link>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
