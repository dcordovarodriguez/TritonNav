"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistanceMeters, metersToFeet } from "@/lib/distance";
import { buildNavigationHref, getNavigationData, searchCampusLocations } from "@/lib/navigation";
import { createGoogleMapsEmbedUrl } from "@/services/mapsService";

const DEFAULT_QUERY = "CSB 115";
const DEFAULT_DESTINATION = {
  buildingId: "csb",
  room: "115",
  name: "Cognitive Science Building 115",
  shortName: "CSB",
  buildingCode: "CSB",
  type: "classroom",
  typeLabel: "classroom"
};
const DEMO_SEARCHES = ["CSB 115", "MOS 0114", "MANDE B202", "DIB 122"];
const DEMO_ACTIONS = [
  {
    label: "Find My Class",
    query: "CSB 115",
    detail: "Room route"
  },
  {
    label: "Find a Building",
    query: "DIB 122",
    detail: "Building + room"
  },
  {
    label: "Explore Colleges",
    query: "Sixth",
    detail: "College result"
  }
];
const FALLBACK_ORIGIN = {
  lat: 32.88114,
  lng: -117.23758,
  label: "Geisel Library"
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
  if (location) return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  if (status === "loading" || status === "idle") return "Locating";
  return "Campus fallback";
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
  const [selectedResult, setSelectedResult] = useState(DEFAULT_DESTINATION);
  const { location, status, retryLocation } = useLocation();
  const results = useMemo(() => searchCampusLocations(query), [query]);
  const navigationData = useMemo(
    () =>
      getNavigationData(
        selectedResult.buildingId,
        selectedResult.room,
        location || FALLBACK_ORIGIN
      ),
    [location, selectedResult]
  );
  const destination = navigationData?.destination;
  const embedUrl = destination ? createGoogleMapsEmbedUrl(destination, 18) : "";
  const selectedKey = `${selectedResult.buildingId}:${selectedResult.room || ""}`;
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

  function selectResult(result) {
    setSelectedResult(result);
  }

  function runDemoSearch(queryValue) {
    setQuery(queryValue);
    const [demoResult] = searchCampusLocations(queryValue);
    if (demoResult) selectResult(demoResult);
  }

  function submitSearch(event) {
    event.preventDefault();
    if (results[0]) selectResult(results[0]);
  }

  function selectFeatured(queryValue) {
    runDemoSearch(queryValue);
  }

  return (
    <main className="map-first-page">
      <section className="campus-map-shell" aria-label="UCSD campus map search">
        <div className="map-search-panel">
          <div className="prototype-badge">Prototype in Development</div>

          <form className="map-search-form" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="campus-search">
              Search UCSD destinations
            </label>
            <input
              autoComplete="off"
              className="map-search-input"
              id="campus-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search CSB 115, MOS 0114, Muir..."
              type="search"
              value={query}
            />
            <button className="map-search-button" type="submit">
              GO
            </button>
          </form>

          <div className="demo-mode-panel">
            <div className="demo-mode-heading">
              <span className="demo-brand-dot" aria-hidden="true" />
              <div>
                <p className="eyebrow">Demo Mode</p>
                <strong>One tap route previews</strong>
              </div>
            </div>
            <div className="demo-action-grid" aria-label="Demo quick actions">
              {DEMO_ACTIONS.map((action) => (
                <button
                  className="demo-action-button"
                  key={action.label}
                  onClick={() => runDemoSearch(action.query)}
                  type="button"
                >
                  <span>{action.label}</span>
                  <small>{action.detail}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="map-featured-row" aria-label="Featured destinations">
            {DEMO_SEARCHES.map((featuredQuery) => (
              <button
                className="map-featured-chip"
                key={featuredQuery}
                onClick={() => selectFeatured(featuredQuery)}
                type="button"
              >
                {featuredQuery}
              </button>
            ))}
          </div>

          {visibleResults.length ? (
            <div className="map-result-list" aria-label="Search results">
              {visibleResults.map((result) => {
                const resultKey = `${result.buildingId}:${result.room || ""}`;
                const isSelected = resultKey === selectedKey;
                const abbreviation = result.buildingCode || result.shortName || "";

                return (
                  <article
                    className={`map-result-card ${isSelected ? "map-result-card-selected" : ""}`}
                    key={result.key}
                    onClick={() => selectResult(result)}
                  >
                    <button
                      aria-label={`Center map on ${getDisplayTitle(result)}`}
                      className="map-result-select"
                      type="button"
                    >
                      <span>
                        <span className="map-result-title">{getDisplayTitle(result)}</span>
                        <span className="map-result-subtitle">{getDisplaySubtitle(result)}</span>
                      </span>
                      <span className="map-result-meta">
                        <span>{formatResultType(result.typeLabel || result.type)}</span>
                        {abbreviation ? <span>{abbreviation}</span> : null}
                      </span>
                    </button>
                    <Link
                      className="map-result-go"
                      href={buildNavigationHref(result.buildingId, result.room)}
                    >
                      GO
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="map-empty-results">
              <strong>No matches yet.</strong>
              <span>Try CSB 115, MOS 0114, MANDE B202, DIB 122, Muir, Sixth, or Geisel.</span>
            </div>
          )}
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
                title={`Map centered on ${navigationData?.building.name || selectedResult.name}`}
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
                    <polyline
                      className="route-line-shadow"
                      fill="none"
                      points={routePreview.path}
                    />
                    <polyline
                      className="route-line"
                      fill="none"
                      points={routePreview.path}
                    />
                  </svg>
                  <span
                    className="route-marker route-marker-origin"
                    style={{
                      left: `${routePreview.points.origin.x}%`,
                      top: `${routePreview.points.origin.y}%`
                    }}
                  />
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

        {routePreview ? (
          <div className="route-preview-card">
            <div>
              <p className="eyebrow">Route Preview</p>
              <h2>{routePreview.destinationLabel}</h2>
            </div>
            <div className="route-preview-metrics">
              <div>
                <span>Distance</span>
                <strong>{routePreview.distanceLabel}</strong>
              </div>
              <div>
                <span>Estimated Walk Time</span>
                <strong>{routePreview.walkTimeLabel}</strong>
              </div>
            </div>
            {selectedCollege ? (
              <div className="college-result-details">
                <div>
                  <span>Associated Buildings</span>
                  <p>{selectedCollege.associatedBuildings.slice(0, 4).join(", ")}</p>
                </div>
                <div>
                  <span>Residence Halls</span>
                  <p>{selectedCollege.residenceHalls.slice(0, 4).join(", ")}</p>
                </div>
              </div>
            ) : null}
            {selectedRecreationFacility ? (
              <div className="facility-link-panel">
                <div>
                  <span>UCSD Rec Links</span>
                  <p>{selectedRecreationFacility.amenities.slice(0, 3).join(" • ")}</p>
                </div>
                <div className="facility-link-list">
                  {selectedRecreationFacility.ctas.map((cta) => (
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
              </div>
            ) : null}
            <p className="route-preview-origin">Origin: {routePreview.originLabel}</p>
            <Link
              className="map-result-go route-preview-go"
              href={buildNavigationHref(selectedResult.buildingId, selectedResult.room)}
            >
              GO
            </Link>
          </div>
        ) : (
          <div className="route-preview-card route-preview-card-loading">
            <p className="eyebrow">Route Preview</p>
            <h2>Finding campus route</h2>
            <div className="route-loading-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
