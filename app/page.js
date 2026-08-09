"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import MapView from "@/components/MapView";
import { getLocationById } from "@/data/locations";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistanceMeters, metersToFeet } from "@/lib/distance";
import { createRouteLineString } from "@/lib/mapGeometry";
import {
  buildNavigationHref,
  getCampusRoutingPoint,
  getNavigationData,
  searchCampusLocations
} from "@/lib/navigation";
import { formatDurationMinutes } from "@/lib/utils";
import { requestWalkingRoute } from "@/services/routingService.mjs";

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
const DEVELOPMENT_TEST_ORIGIN_IDS = [
  "geisel-library",
  "price-center",
  "mandeville-center",
  "warren-lecture-hall",
  "sixth-college"
];
const DEVELOPMENT_TEST_ORIGINS = DEVELOPMENT_TEST_ORIGIN_IDS.map((id) => {
  const location = getLocationById(id);
  if (!location?.coordinates) return null;
  const routingPoint = getCampusRoutingPoint(id);
  return {
    id,
    label: location.name,
    lat: routingPoint?.lat ?? location.coordinates.lat,
    lng: routingPoint?.lng ?? location.coordinates.lng,
    displayLat: routingPoint?.displayCoordinate?.lat ?? location.coordinates.lat,
    displayLng: routingPoint?.displayCoordinate?.lng ?? location.coordinates.lng,
    routingCoordinateSource: routingPoint?.source || "legacy-location"
  };
}).filter(Boolean);
const SHEET_STATES = {
  DISCOVERY: "discovery",
  RESULTS: "results",
  SELECTED: "selected",
  ROUTE: "route"
};
const ROUTE_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  TEMPORARY_FALLBACK: "temporaryFallback"
};
const SHEET_POSITIONS = {
  EXPANDED: "expanded",
  COLLAPSED: "collapsed"
};
const SHEET_DRAG_THRESHOLD = 56;
const WALKING_METERS_PER_MINUTE = 80.4672;
const METERS_PER_MILE = 1609.344;
const FEET_PER_MILE = 5280;

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

function calculateRouteDistanceMeters(routePath, origin, destination) {
  if (routePath.length < 2) return calculateDistanceMeters(origin, destination);

  return routePath.reduce((totalDistance, point, index) => {
    if (index === 0) return totalDistance;
    const segmentDistance = calculateDistanceMeters(routePath[index - 1], point);
    return totalDistance + (segmentDistance || 0);
  }, 0);
}

function formatRouteDistance(distanceMeters) {
  const feet = metersToFeet(distanceMeters);
  if (!feet) return "Distance unavailable";
  if (feet < FEET_PER_MILE * 0.25) return `${feet.toLocaleString()} ft`;
  return `${(feet / FEET_PER_MILE).toFixed(1)} miles`;
}

function buildRoutePreview({ origin, destination, destinationLabel, originLabel }) {
  const geoPath = buildRouteGeoPath(origin, destination);
  const distanceMeters = calculateRouteDistanceMeters(geoPath, origin, destination);
  const walkMinutes = distanceMeters
    ? Math.max(1, Math.round(distanceMeters / WALKING_METERS_PER_MINUTE))
    : null;

  return {
    destinationLabel,
    distanceLabel: formatRouteDistance(distanceMeters),
    walkTimeLabel: walkMinutes ? formatDurationMinutes(walkMinutes) : "Time unavailable",
    originLabel,
    geoPath
  };
}

function formatRouteDurationSeconds(durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return "Time unavailable";
  return formatDurationMinutes(Math.max(1, Math.round(durationSeconds / 60)));
}

function buildRouteFeatureFromNormalizedRoute(route) {
  if (!route?.geometry) return null;

  return {
    type: "Feature",
    properties: {
      provider: route.provider,
      geometryType: route.isEstimated ? "temporary-preview" : "walking-route"
    },
    geometry: route.geometry
  };
}

function getRouteErrorMessage(error) {
  if (error?.code === "PROVIDER_CONFIGURATION") {
    return "Walking routing is not configured yet.";
  }

  if (error?.code === "PROVIDER_TIMEOUT") {
    return "Walking routing took too long to respond.";
  }

  if (error?.code === "PROVIDER_FAILURE") {
    return "The walking route provider returned an error.";
  }

  if (error?.code === "PROVIDER_RESPONSE") {
    return "The walking route provider returned route data TritonNav could not use.";
  }

  if (error?.code === "UNROUTABLE") {
    return "TritonNav could not calculate a walking route for those coordinates.";
  }

  return error?.message || "Walking route could not be calculated.";
}

function getCollapsedSheetSummary({ query, routePreview, sheetState, visibleResultCount }) {
  if (sheetState === SHEET_STATES.SELECTED && routePreview) {
    return {
      title: routePreview.destinationLabel,
      detail: routePreview.walkTimeLabel
    };
  }

  if (sheetState === SHEET_STATES.ROUTE && routePreview) {
    return {
      title: routePreview.destinationLabel,
      detail: `${routePreview.walkTimeLabel} - route preview`
    };
  }

  if (sheetState === SHEET_STATES.RESULTS) {
    const countLabel = `${visibleResultCount} ${visibleResultCount === 1 ? "result" : "results"}`;
    return {
      title: query.trim() || "Search results",
      detail: countLabel
    };
  }

  return {
    title: "Where are you going?",
    detail: "Search campus destinations"
  };
}

function getArrivalSummary(routeDetails) {
  if (!routeDetails?.entranceName) return "";

  const accessibilityLabel =
    routeDetails.entranceAccessible === true
      ? "accessible entrance"
      : routeDetails.entranceAccessible === false
        ? "accessibility unverified"
        : "accessibility unknown";

  return `Arrival: ${routeDetails.entranceName} (${accessibilityLabel})`;
}

function hasIndoorDirections(indoorDirections) {
  return Boolean(
    indoorDirections?.summary ||
      indoorDirections?.steps?.length ||
      indoorDirections?.finalLandmark
  );
}

function IndoorDirectionsDetails({ indoorDirections }) {
  if (!hasIndoorDirections(indoorDirections)) return null;

  return (
    <details className="indoor-directions-details">
      <summary>Inside building</summary>
      <div className="indoor-directions-card">
        {indoorDirections.summary ? <p>{indoorDirections.summary}</p> : null}
        {indoorDirections.steps?.length ? (
          <ol>
            {indoorDirections.steps.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
          </ol>
        ) : null}
        {indoorDirections.finalLandmark ? (
          <p className="sheet-supporting-copy">
            Final landmark: {indoorDirections.finalLandmark}
          </p>
        ) : null}
        {indoorDirections.source ? (
          <p className="sheet-supporting-copy">
            Provisional classroom guidance: {indoorDirections.source}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function createFinalConnectorGeometry(routingDestination, displayDestination) {
  if (!hasCoordinates(routingDestination) || !hasCoordinates(displayDestination)) return null;

  const connectorDistance = calculateDistanceMeters(routingDestination, displayDestination);
  if (!connectorDistance || connectorDistance < 2 || connectorDistance > 80) return null;

  return createRouteLineString([routingDestination, displayDestination]);
}

export default function HomePage() {
  const isDevelopment = process.env.NODE_ENV === "development";
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [selectedResult, setSelectedResult] = useState(null);
  const [sheetState, setSheetState] = useState(SHEET_STATES.DISCOVERY);
  const [sheetPosition, setSheetPosition] = useState(SHEET_POSITIONS.EXPANDED);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [developmentOriginId, setDevelopmentOriginId] = useState("current");
  const [routeRequest, setRouteRequest] = useState({
    status: ROUTE_STATES.IDLE,
    route: null,
    error: "",
    errorCode: "",
    httpStatus: null,
    requestDurationMs: null
  });
  const routeAbortRef = useRef(null);
  const routeSequenceRef = useRef(0);
  const dragStateRef = useRef({
    pointerId: null,
    startY: 0,
    lastOffset: 0,
    didDrag: false
  });
  const { location, status, retryLocation } = useLocation();
  const developmentOrigin = isDevelopment && developmentOriginId !== "current"
    ? DEVELOPMENT_TEST_ORIGINS.find((testOrigin) => testOrigin.id === developmentOriginId) || null
    : null;
  const routeOrigin = developmentOrigin || location || FALLBACK_ORIGIN;
  const routeOriginLabel = developmentOrigin
    ? `Development test origin: ${developmentOrigin.label}`
    : location
      ? "Current location"
      : FALLBACK_ORIGIN.label;
  const hasSearchQuery = query.trim().length > 0;
  const results = useMemo(() => searchCampusLocations(query), [query]);
  const navigationData = useMemo(
    () =>
      selectedResult
        ? getNavigationData(
            selectedResult.buildingId,
            selectedResult.room,
            routeOrigin
          )
        : null,
    [routeOrigin, selectedResult]
  );
  const destination = navigationData?.destination;
  const routingDestination = navigationData?.routingDestination || destination;
  const selectedKey = selectedResult
    ? `${selectedResult.buildingId}:${selectedResult.room || ""}`
    : "";
  const visibleResults = results.slice(0, 6);
  const origin = routeOrigin;
  const routePreview = navigationData
    ? buildRoutePreview({
        origin,
        destination: routingDestination,
        destinationLabel: navigationData.routeDetails.destinationLabel,
        originLabel: routeOriginLabel
      })
    : null;
  const selectedCollege = navigationData?.college;
  const selectedRecreationFacility = navigationData?.recreationFacility;
  const arrivalSummary = getArrivalSummary(navigationData?.routeDetails);
  const shouldShowResults = sheetState === SHEET_STATES.RESULTS && hasSearchQuery;
  const shouldShowDestination = sheetState === SHEET_STATES.SELECTED && selectedResult && routePreview;
  const shouldShowRoute = sheetState === SHEET_STATES.ROUTE && selectedResult && routePreview;
  const routeDisplay = routeRequest.route
    ? {
        destinationLabel: routePreview?.destinationLabel || navigationData?.routeDetails.destinationLabel,
        distanceLabel: formatRouteDistance(routeRequest.route.distanceMeters),
        walkTimeLabel: formatRouteDurationSeconds(routeRequest.route.durationSeconds),
        originLabel: routePreview?.originLabel || "Route origin",
        steps: routeRequest.route.steps || [],
        warnings: routeRequest.route.warnings || [],
        isEstimated: Boolean(routeRequest.route.isEstimated),
        provider: routeRequest.route.provider
      }
    : routePreview;
  const routeDiagnostics = {
    routeState: routeRequest.status,
    origin,
    destination,
    routingDestination,
    routingCoordinateSource: navigationData?.routingCoordinateSource || "",
    httpStatus: routeRequest.httpStatus,
    errorCode: routeRequest.errorCode,
    provider: routeRequest.route?.provider || "",
    isEstimated: routeRequest.route ? String(routeRequest.route.isEstimated) : "",
    geometryCoordinates: routeRequest.route?.geometry?.coordinates?.length || 0,
    distanceMeters: routeRequest.route?.distanceMeters || null,
    durationSeconds: routeRequest.route?.durationSeconds || null,
    maneuverSteps: routeRequest.route?.steps?.length || 0,
    warnings: routeRequest.route?.warnings?.length || 0,
    temporaryFallbackActive: routeRequest.status === ROUTE_STATES.TEMPORARY_FALLBACK,
    requestDurationMs: routeRequest.requestDurationMs
  };
  const routeLineGeometry =
    shouldShowRoute && routeRequest.route
      ? buildRouteFeatureFromNormalizedRoute(routeRequest.route)
      : shouldShowRoute && routePreview?.geoPath && routeRequest.status === ROUTE_STATES.TEMPORARY_FALLBACK
        ? createRouteLineString(routePreview.geoPath)
        : null;
  const routeConnectorGeometry =
    shouldShowRoute && routeRequest.status === ROUTE_STATES.SUCCESS
      ? createFinalConnectorGeometry(routingDestination, destination)
      : null;
  const mapMode = shouldShowRoute
    ? "route"
    : destination
      ? "destination"
      : location
        ? "current-location"
        : "default";
  const isSheetExpanded = sheetPosition === SHEET_POSITIONS.EXPANDED;
  const sheetLabelNoun =
    sheetState === SHEET_STATES.RESULTS
      ? "search results"
      : sheetState === SHEET_STATES.DISCOVERY
        ? "destination details"
        : "destination details";
  const sheetToggleLabel = `${isSheetExpanded ? "Collapse" : "Expand"} ${sheetLabelNoun}`;
  const collapsedSummary = getCollapsedSheetSummary({
    query,
    routePreview: routeDisplay,
    sheetState,
    visibleResultCount: visibleResults.length
  });

  function selectResult(result) {
    routeAbortRef.current?.abort();
    setSelectedResult(result);
    setRouteRequest({
      status: ROUTE_STATES.IDLE,
      route: null,
      error: "",
      errorCode: "",
      httpStatus: null,
      requestDurationMs: null
    });
    setSheetState(SHEET_STATES.SELECTED);
    setSheetPosition(SHEET_POSITIONS.EXPANDED);
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
    routeAbortRef.current?.abort();
    setQuery(value);
    setRouteRequest({
      status: ROUTE_STATES.IDLE,
      route: null,
      error: "",
      errorCode: "",
      httpStatus: null,
      requestDurationMs: null
    });
    setSheetState(value.trim() ? SHEET_STATES.RESULTS : SHEET_STATES.DISCOVERY);
  }

  function clearSearch() {
    routeAbortRef.current?.abort();
    setQuery("");
    setRouteRequest({
      status: ROUTE_STATES.IDLE,
      route: null,
      error: "",
      errorCode: "",
      httpStatus: null,
      requestDurationMs: null
    });
    setSheetState(SHEET_STATES.DISCOVERY);
  }

  function changeDestination() {
    routeAbortRef.current?.abort();
    setSelectedResult(null);
    setRouteRequest({
      status: ROUTE_STATES.IDLE,
      route: null,
      error: "",
      errorCode: "",
      httpStatus: null,
      requestDurationMs: null
    });
    setSheetState(query.trim() ? SHEET_STATES.RESULTS : SHEET_STATES.DISCOVERY);
  }

  async function previewRoute() {
    if (!selectedResult || !hasCoordinates(origin) || !hasCoordinates(routingDestination)) return;

    routeAbortRef.current?.abort();
    const controller = new AbortController();
    const requestSequence = routeSequenceRef.current + 1;
    const requestStartedAt = performance.now();
    routeSequenceRef.current = requestSequence;
    routeAbortRef.current = controller;

    setSheetState(SHEET_STATES.ROUTE);
    setSheetPosition(SHEET_POSITIONS.COLLAPSED);
    setRouteRequest({
      status: ROUTE_STATES.LOADING,
      route: null,
      error: "",
      errorCode: "",
      httpStatus: null,
      requestDurationMs: null
    });

    try {
      const route = await requestWalkingRoute({
        origin,
        destination: routingDestination,
        signal: controller.signal
      });

      if (routeSequenceRef.current !== requestSequence) return;

      setRouteRequest({
        status: ROUTE_STATES.SUCCESS,
        route,
        error: "",
        errorCode: "",
        httpStatus: 200,
        requestDurationMs: Math.round(performance.now() - requestStartedAt)
      });
    } catch (error) {
      if (error?.name === "AbortError" || routeSequenceRef.current !== requestSequence) return;

      if (error?.code === "PROVIDER_CONFIGURATION" && process.env.NODE_ENV !== "production") {
        setRouteRequest({
          status: ROUTE_STATES.TEMPORARY_FALLBACK,
          route: null,
          error: "Walking routing is not configured locally, so this is a temporary estimate.",
          errorCode: error.code,
          httpStatus: error.status || null,
          requestDurationMs: Math.round(performance.now() - requestStartedAt)
        });
        return;
      }

      setRouteRequest({
        status: ROUTE_STATES.ERROR,
        route: null,
        error: getRouteErrorMessage(error),
        errorCode: error?.code || "ROUTE_REQUEST_FAILED",
        httpStatus: error?.status || null,
        requestDurationMs: Math.round(performance.now() - requestStartedAt)
      });
    }
  }

  function updateDevelopmentOrigin(event) {
    routeAbortRef.current?.abort();
    setDevelopmentOriginId(event.target.value);
    setRouteRequest({
      status: ROUTE_STATES.IDLE,
      route: null,
      error: "",
      errorCode: "",
      httpStatus: null,
      requestDurationMs: null
    });
    if (selectedResult) {
      setSheetState(SHEET_STATES.SELECTED);
      setSheetPosition(SHEET_POSITIONS.EXPANDED);
    }
  }

  function toggleSheetPosition() {
    if (dragStateRef.current.didDrag) {
      dragStateRef.current.didDrag = false;
      return;
    }

    setSheetPosition((currentPosition) =>
      currentPosition === SHEET_POSITIONS.EXPANDED
        ? SHEET_POSITIONS.COLLAPSED
        : SHEET_POSITIONS.EXPANDED
    );
  }

  function startSheetDrag(event) {
    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastOffset: 0,
      didDrag: false
    };
    setIsDragging(true);
    setDragOffset(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveSheetDrag(event) {
    if (!isDragging || dragStateRef.current.pointerId !== event.pointerId) return;

    const deltaY = event.clientY - dragStateRef.current.startY;
    const nextOffset =
      sheetPosition === SHEET_POSITIONS.EXPANDED
        ? Math.max(0, deltaY)
        : Math.min(0, deltaY);

    dragStateRef.current.lastOffset = nextOffset;
    if (Math.abs(deltaY) > 8) {
      dragStateRef.current.didDrag = true;
    }
    setDragOffset(nextOffset);
  }

  function finishSheetDrag(event) {
    if (!isDragging || dragStateRef.current.pointerId !== event.pointerId) return;

    const finalOffset = dragStateRef.current.lastOffset;
    const shouldCollapse =
      sheetPosition === SHEET_POSITIONS.EXPANDED && finalOffset > SHEET_DRAG_THRESHOLD;
    const shouldExpand =
      sheetPosition === SHEET_POSITIONS.COLLAPSED && finalOffset < -SHEET_DRAG_THRESHOLD;

    if (shouldCollapse) {
      setSheetPosition(SHEET_POSITIONS.COLLAPSED);
    } else if (shouldExpand) {
      setSheetPosition(SHEET_POSITIONS.EXPANDED);
    }

    setDragOffset(0);
    setIsDragging(false);
    dragStateRef.current = {
      pointerId: null,
      startY: 0,
      lastOffset: 0,
      didDrag: dragStateRef.current.didDrag
    };
    event.currentTarget.releasePointerCapture?.(event.pointerId);
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
          {isDevelopment ? (
            <div className="development-route-tools" aria-label="Development route testing">
              <label htmlFor="development-origin">Development test origin</label>
              <select
                id="development-origin"
                onChange={updateDevelopmentOrigin}
                value={developmentOriginId}
              >
                <option value="current">Use current location</option>
                {DEVELOPMENT_TEST_ORIGINS.map((testOrigin) => (
                  <option key={testOrigin.id} value={testOrigin.id}>
                    {testOrigin.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
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
          <MapView
            bottomSheetState={sheetPosition}
            currentLocation={location}
            currentLocationStatus={status}
            fallbackLocation={FALLBACK_ORIGIN}
            allowEndpointRouteFallback={false}
            mapMode={mapMode}
            navigationData={navigationData}
            routeGeometry={routeLineGeometry}
            routeConnectorGeometry={routeConnectorGeometry}
            routeIsEstimated={routeRequest.status !== ROUTE_STATES.SUCCESS}
            selectedDestination={destination}
            variant="homepage"
          />
        </div>

        <section
          aria-label="Destination panel"
          className={`map-bottom-sheet map-bottom-sheet-${sheetState} map-bottom-sheet-${sheetPosition} ${
            isDragging ? "map-bottom-sheet-dragging" : ""
          }`}
          style={{ "--sheet-drag-offset": `${dragOffset}px` }}
        >
          <button
            aria-expanded={isSheetExpanded}
            aria-label={sheetToggleLabel}
            className="sheet-grab-handle"
            onClick={toggleSheetPosition}
            onPointerCancel={finishSheetDrag}
            onPointerDown={startSheetDrag}
            onPointerMove={moveSheetDrag}
            onPointerUp={finishSheetDrag}
            type="button"
          >
            <span />
          </button>

          <div className="sheet-collapsed-summary" aria-hidden={isSheetExpanded}>
            <strong>{collapsedSummary.title}</strong>
            <span>{collapsedSummary.detail}</span>
          </div>

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
                  <h2>{routePreview.destinationLabel}</h2>
                  <p className="eyebrow">Destination Selected</p>
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
              {arrivalSummary ? (
                <p className="sheet-supporting-copy">{arrivalSummary}</p>
              ) : null}
              <IndoorDirectionsDetails indoorDirections={navigationData.indoorDirections} />
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
                  <h2>{routeDisplay.destinationLabel}</h2>
                  <p className="eyebrow">
                    {routeRequest.status === ROUTE_STATES.SUCCESS
                      ? "Walking Route Preview"
                      : "Temporary Route Preview"}
                  </p>
                </div>
                <button className="sheet-text-button" onClick={changeDestination} type="button">
                  Change
                </button>
              </div>
              {routeRequest.status === ROUTE_STATES.LOADING ? (
                <div className="inline-alert">
                  Calculating a walking route. The map will fit to the route when it is ready.
                </div>
              ) : null}
              {routeRequest.status === ROUTE_STATES.ERROR ? (
                <div className="inline-alert inline-alert-warning">
                  <strong>Route unavailable.</strong> {routeRequest.error}
                </div>
              ) : null}
              {routeRequest.status === ROUTE_STATES.TEMPORARY_FALLBACK ? (
                <div className="inline-alert inline-alert-warning">
                  <strong>Temporary route preview.</strong> {routeRequest.error}
                </div>
              ) : null}
              <div className="sheet-metric-grid">
                <div>
                  <span>Origin</span>
                  <strong>{routeDisplay.originLabel}</strong>
                </div>
                <div>
                  <span>{routeRequest.status === ROUTE_STATES.SUCCESS ? "Route distance" : "Est. distance"}</span>
                  <strong>{routeDisplay.distanceLabel}</strong>
                </div>
                <div>
                  <span>{routeRequest.status === ROUTE_STATES.SUCCESS ? "Walk time" : "Est. walk time"}</span>
                  <strong>{routeDisplay.walkTimeLabel}</strong>
                </div>
              </div>
              <p className="sheet-summary">{navigationData.instructions}</p>
              {arrivalSummary ? (
                <p className="sheet-supporting-copy">{arrivalSummary}</p>
              ) : null}
              <IndoorDirectionsDetails indoorDirections={navigationData.indoorDirections} />
              <p className="sheet-supporting-copy">
                {routeRequest.status === ROUTE_STATES.SUCCESS
                  ? "Outdoor walking guidance is separated from building and room arrival notes."
                  : "Accessibility preferences are coming soon. Current preview uses the campus walking estimate."}
              </p>
              {routeRequest.status === ROUTE_STATES.SUCCESS && routeDisplay.warnings?.length ? (
                <div className="inline-alert inline-alert-warning">
                  <strong>Route note.</strong> {routeDisplay.warnings[0]}
                </div>
              ) : null}
              {routeRequest.status === ROUTE_STATES.SUCCESS && routeDisplay.steps?.length ? (
                <details className="route-step-details">
                  <summary>Walking directions</summary>
                  <div className="route-step-preview-list">
                    {routeDisplay.steps.slice(0, 5).map((step, index) => (
                      <div className="route-step-preview-row" key={`${step.instruction}-${index}`}>
                        <span>{index + 1}</span>
                        <p>
                          <strong>{step.instruction || "Continue on the walking route."}</strong>
                          {step.streetName ? <small>{step.streetName}</small> : null}
                          {step.distanceMeters ? (
                            <small>{formatRouteDistance(step.distanceMeters)}</small>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
              <div className="route-sheet-actions">
                <button className="sheet-primary-action" onClick={previewRoute} type="button">
                  {routeRequest.status === ROUTE_STATES.LOADING ? "Calculating..." : "Retry Route"}
                </button>
                <Link
                  className="secondary-link"
                  href={buildNavigationHref(selectedResult.buildingId, selectedResult.room)}
                >
                  Open details
                </Link>
              </div>
              {isDevelopment ? (
                <details className="route-diagnostics-panel">
                  <summary>Route diagnostics</summary>
                  <dl>
                    <div>
                      <dt>Route state</dt>
                      <dd>{routeDiagnostics.routeState}</dd>
                    </div>
                    <div>
                      <dt>Origin</dt>
                      <dd>
                        {hasCoordinates(routeDiagnostics.origin)
                          ? `${routeDiagnostics.origin.lat.toFixed(5)}, ${routeDiagnostics.origin.lng.toFixed(5)}`
                          : "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt>Destination</dt>
                      <dd>
                        {hasCoordinates(routeDiagnostics.destination)
                          ? `${routeDiagnostics.destination.lat.toFixed(5)}, ${routeDiagnostics.destination.lng.toFixed(5)}`
                          : "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt>Routing destination</dt>
                      <dd>
                        {hasCoordinates(routeDiagnostics.routingDestination)
                          ? `${routeDiagnostics.routingDestination.lat.toFixed(5)}, ${routeDiagnostics.routingDestination.lng.toFixed(5)}`
                          : "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt>Routing source</dt>
                      <dd>{routeDiagnostics.routingCoordinateSource || "None"}</dd>
                    </div>
                    <div>
                      <dt>HTTP status</dt>
                      <dd>{routeDiagnostics.httpStatus || "None"}</dd>
                    </div>
                    <div>
                      <dt>Error code</dt>
                      <dd>{routeDiagnostics.errorCode || "None"}</dd>
                    </div>
                    <div>
                      <dt>Provider</dt>
                      <dd>{routeDiagnostics.provider || "None"}</dd>
                    </div>
                    <div>
                      <dt>Estimated</dt>
                      <dd>{routeDiagnostics.isEstimated || "None"}</dd>
                    </div>
                    <div>
                      <dt>Geometry coords</dt>
                      <dd>{routeDiagnostics.geometryCoordinates}</dd>
                    </div>
                    <div>
                      <dt>Distance meters</dt>
                      <dd>{routeDiagnostics.distanceMeters || "None"}</dd>
                    </div>
                    <div>
                      <dt>Duration seconds</dt>
                      <dd>{routeDiagnostics.durationSeconds || "None"}</dd>
                    </div>
                    <div>
                      <dt>Maneuver steps</dt>
                      <dd>{routeDiagnostics.maneuverSteps}</dd>
                    </div>
                    <div>
                      <dt>Warnings</dt>
                      <dd>{routeDiagnostics.warnings}</dd>
                    </div>
                    <div>
                      <dt>Temporary fallback</dt>
                      <dd>{routeDiagnostics.temporaryFallbackActive ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                      <dt>Request duration</dt>
                      <dd>
                        {routeDiagnostics.requestDurationMs === null
                          ? "None"
                          : `${routeDiagnostics.requestDurationMs} ms`}
                      </dd>
                    </div>
                  </dl>
                </details>
              ) : null}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
