"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "@/components/MapView";
import { getLocationById } from "@/data/locations";
import { useLocation } from "@/hooks/useLocation";
import destinationIntelligence from "@/lib/campus/destinationIntelligence";
import campusResolver from "@/lib/campus/resolver";
import { calculateDistanceMeters, metersToFeet } from "@/lib/distance";
import { createRouteLineString } from "@/lib/mapGeometry";
import {
  buildNavigationHref,
  getCampusRoutingPoint,
  getNavigationData,
  searchCampusLocations
} from "@/lib/navigation";
import { formatDurationMinutes } from "@/lib/utils";
import {
  ORIGIN_MODES,
  areRouteEndpointsEquivalent,
  resolveActiveRouteOrigin
} from "@/lib/originSelection.mjs";
import { requestWalkingRoute } from "@/services/routingService.mjs";

const { createDestinationIntelligence, UTILITY_CATEGORIES } = destinationIntelligence;
const { getAllCampusBuildings, getAllCampusColleges } = campusResolver;
const CAMPUS_BUILDING_NAMES = new Map(
  getAllCampusBuildings().map((building) => [building.id, building.name])
);

const DEFAULT_QUERY = "";
const DEMO_SEARCHES = ["CSB 115", "MOS 0114", "MANDE B202", "DIB 122"];
const DEMO_ACTIONS = [
  {
    id: "class",
    label: "Find My Class",
    query: "CSB 115",
    detail: "Room route",
    icon: "CS"
  },
  {
    id: "building",
    label: "Find a Building",
    query: "Design and Innovation Building",
    detail: "Campus buildings",
    icon: "BLD"
  },
  {
    id: "colleges",
    label: "Explore Colleges",
    query: "",
    detail: "All eight colleges",
    icon: "COL"
  }
];
const COLLEGE_MARKER_LABELS = {
  "eighth-college": "Eighth",
  "marshall-college": "Marshall",
  "muir-college": "Muir",
  "revelle-college": "Revelle",
  "roosevelt-college": "ERC",
  "seventh-college": "Seventh",
  "sixth-college-area": "Sixth",
  "warren-college": "Warren"
};
const CAMPUS_COLLEGE_MARKERS = getAllCampusColleges().map((college) => ({
  id: college.id,
  name: college.name,
  label: COLLEGE_MARKER_LABELS[college.id] || college.name.replace(/\s+College$/i, ""),
  coordinates: college.centroid,
  source: college.source,
  associatedBuildings: college.associatedBuildingIds.map(
    (buildingId) => CAMPUS_BUILDING_NAMES.get(buildingId) || buildingId
  )
}));
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
  COLLEGES: "colleges",
  RESULTS: "results",
  SELECTED: "selected",
  ROUTE: "route"
};
const ROUTE_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  ROUTING_UNAVAILABLE: "routingUnavailable",
  TEMPORARY_FALLBACK: "temporaryFallback"
};
const SHEET_POSITIONS = {
  EXPANDED: "expanded",
  COLLAPSED: "collapsed"
};
const SHEET_DRAG_THRESHOLD = 56;
const SEARCH_MODES = {
  DESTINATION: "destination",
  ORIGIN: "origin"
};
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

function getLocationLabel(status, location, coverage) {
  if (location && coverage?.status === "outside") return "Outside UCSD routing area";
  if (location) return "Current location";
  if (status === "loading") return "Locating…";
  if (status === "idle") return "Use current location";
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

function getCollapsedSheetSummary({
  exploredCollege,
  query,
  routePreview,
  sheetState,
  visibleResultCount
}) {
  if (sheetState === SHEET_STATES.COLLEGES) {
    return {
      title: exploredCollege?.name || "Explore Colleges",
      detail: exploredCollege
        ? exploredCollege.associatedBuildings.length
          ? `${exploredCollege.associatedBuildings.length} linked destinations`
          : "Representative campus anchor"
        : "Tap a college marker"
    };
  }

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

function getRoutePanelEyebrow(routeStatus) {
  if (routeStatus === ROUTE_STATES.SUCCESS) return "Walking Route Preview";
  if (routeStatus === ROUTE_STATES.LOADING) return "Calculating Route";
  if (routeStatus === ROUTE_STATES.ROUTING_UNAVAILABLE) return "Routing Not Connected";
  if (routeStatus === ROUTE_STATES.ERROR) return "Route Unavailable";
  return "Temporary Route Preview";
}

function formatVerificationStatus(status) {
  if (!status) return "Verification pending";
  if (status === "official-map") return "UCSD map";
  if (status === "provisional") return "Provisional";
  return status.replace(/-/g, " ");
}

function filterRooms(rooms, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return rooms.slice(0, 5);

  return rooms
    .filter((room) =>
      [room.number, room.name, room.entranceName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    )
    .slice(0, 5);
}

function UtilityNearbyPanel({ category, results }) {
  if (!category || category.id === "room-lookup") return null;

  return (
    <div className="destination-intelligence-section">
      <div className="destination-section-heading">
        <span>Nearby</span>
        <strong>{category.label}</strong>
      </div>
      {results?.length ? (
        <div className="nearby-utility-list">
          {results.map((item) => (
            <div className="nearby-utility-row" key={item.id}>
              <span className="nearby-utility-dot" aria-hidden="true">
                {category.iconLabel}
              </span>
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.distanceLabel || "Distance unavailable"} • {item.type} •{" "}
                  {formatVerificationStatus(item.verificationStatus)}
                </small>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="sheet-supporting-copy">
          No nearby {category.label.toLowerCase()} records are available for this destination yet.
        </p>
      )}
    </div>
  );
}

function RoomLookupPanel({ building, rooms, query, onChangeQuery, onSelectRoom }) {
  const filteredRooms = filterRooms(rooms, query);

  return (
    <div className="destination-intelligence-section">
      <div className="destination-section-heading">
        <span>Inside the Building</span>
        <strong>Room Lookup</strong>
      </div>
      <label className="sr-only" htmlFor="room-lookup-input">
        Search rooms in {building?.name || "selected building"}
      </label>
      <input
        className="room-lookup-input"
        id="room-lookup-input"
        onChange={(event) => onChangeQuery(event.target.value)}
        placeholder={`Search rooms in ${building?.shortName || building?.name || "this building"}`}
        type="search"
        value={query}
      />
      {filteredRooms.length ? (
        <div className="room-lookup-list">
          {filteredRooms.map((room) => (
            <button
              className="room-lookup-row"
              key={room.id}
              onClick={() => onSelectRoom(room)}
              type="button"
            >
              <span>
                <strong>{room.name}</strong>
                <small>
                  {room.entranceName ? `Preferred entrance: ${room.entranceName}` : "Entrance pending"}
                </small>
              </span>
              <span>{room.hasIndoorDirections ? "Directions" : "No indoor details"}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="sheet-supporting-copy">
          Detailed room records are not available for {building?.name || "this building"} yet.
        </p>
      )}
    </div>
  );
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
  const [originMode, setOriginMode] = useState(ORIGIN_MODES.CURRENT);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [originQuery, setOriginQuery] = useState("");
  const [searchMode, setSearchMode] = useState(SEARCH_MODES.DESTINATION);
  const [originMenuOpen, setOriginMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [collegeExploreActive, setCollegeExploreActive] = useState(false);
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [activeUtilityId, setActiveUtilityId] = useState("");
  const [roomLookupQuery, setRoomLookupQuery] = useState("");
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
  const searchInputRef = useRef(null);
  const searchBlurTimerRef = useRef(null);
  const dragStateRef = useRef({
    pointerId: null,
    startY: 0,
    lastOffset: 0,
    didDrag: false
  });
  const { location, status, coverage, retryLocation } = useLocation();

  useEffect(() => {
    const viewport = window.visualViewport;

    function updateViewportMetrics() {
      const viewportHeight = viewport?.height || window.innerHeight;
      const viewportOffsetTop = viewport?.offsetTop || 0;
      const keyboardInset = Math.max(
        0,
        window.innerHeight - viewportHeight - viewportOffsetTop
      );

      document.documentElement.style.setProperty(
        "--tritonnav-visual-viewport-height",
        `${viewportHeight}px`
      );
      document.documentElement.style.setProperty(
        "--tritonnav-visual-viewport-offset-top",
        `${viewportOffsetTop}px`
      );
      document.documentElement.style.setProperty(
        "--tritonnav-keyboard-inset",
        `${keyboardInset}px`
      );
    }

    updateViewportMetrics();
    viewport?.addEventListener("resize", updateViewportMetrics);
    viewport?.addEventListener("scroll", updateViewportMetrics);
    window.addEventListener("resize", updateViewportMetrics);

    return () => {
      window.clearTimeout(searchBlurTimerRef.current);
      viewport?.removeEventListener("resize", updateViewportMetrics);
      viewport?.removeEventListener("scroll", updateViewportMetrics);
      window.removeEventListener("resize", updateViewportMetrics);
      document.documentElement.style.removeProperty("--tritonnav-visual-viewport-height");
      document.documentElement.style.removeProperty("--tritonnav-visual-viewport-offset-top");
      document.documentElement.style.removeProperty("--tritonnav-keyboard-inset");
    };
  }, []);

  const isOutsideRoutingCoverage = Boolean(location && coverage?.status === "outside");
  const locationFocusKey = location
    ? `${status}:${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
    : "";
  const routeOrigin = resolveActiveRouteOrigin({
    mode: originMode,
    selectedOrigin,
    deviceLocation: location,
    deviceIsInsideCoverage: Boolean(coverage?.isInside)
  });
  const mapCurrentLocation = location || null;
  const routeOriginLabel = originMode === ORIGIN_MODES.SELECTED && selectedOrigin
    ? selectedOrigin.label
    : location && coverage?.isInside
      ? "Current location"
      : isOutsideRoutingCoverage
        ? "Outside UCSD routing area"
        : "Current location not set";
  const hasSearchQuery = query.trim().length > 0;
  const isOriginSearch = searchMode === SEARCH_MODES.ORIGIN;
  const activeSearchQuery = isOriginSearch ? originQuery : query;
  const hasActiveSearchQuery = activeSearchQuery.trim().length > 0;
  const destinationResults = useMemo(() => searchCampusLocations(query), [query]);
  const originResults = useMemo(() => searchCampusLocations(originQuery), [originQuery]);
  const activeResults = isOriginSearch ? originResults : destinationResults;
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
  const intelligence = useMemo(
    () => (navigationData ? createDestinationIntelligence(navigationData) : null),
    [navigationData]
  );
  const activeUtility = UTILITY_CATEGORIES.find((category) => category.id === activeUtilityId) || null;
  const activeUtilityResults = activeUtilityId
    ? intelligence?.utilities?.[activeUtilityId]?.results || []
    : [];
  const utilityMarkers = useMemo(
    () =>
      activeUtility?.mapLayer && activeUtilityResults.length
        ? activeUtilityResults.map((item) => ({
            id: item.id,
            name: item.name,
            categoryId: activeUtility.id,
            coordinates: item.coordinates,
            iconLabel: activeUtility.iconLabel
          }))
        : [],
    [activeUtility, activeUtilityResults]
  );
  const collegeMarkers = useMemo(
    () =>
      collegeExploreActive
        ? CAMPUS_COLLEGE_MARKERS.map((college) => ({
            ...college,
            isSelected: selectedCollegeId === college.id
          }))
        : [],
    [collegeExploreActive, selectedCollegeId]
  );
  const exploredCollege = collegeExploreActive
    ? CAMPUS_COLLEGE_MARKERS.find((college) => college.id === selectedCollegeId) || null
    : null;
  const destination = navigationData?.destination;
  const routingDestination = navigationData?.routingDestination || destination;
  const selectedKey = selectedResult
    ? `${selectedResult.buildingId}:${selectedResult.room || ""}`
    : "";
  const visibleResults = activeResults.slice(0, 6);
  const origin = routeOrigin;
  const routePreview = useMemo(
    () =>
      navigationData && routeOrigin
        ? buildRoutePreview({
            origin,
            destination: routingDestination,
            destinationLabel: navigationData.routeDetails.destinationLabel,
            originLabel: routeOriginLabel
          })
        : null,
    [navigationData, origin, routeOrigin, routeOriginLabel, routingDestination]
  );
  const selectedCollege = navigationData?.college;
  const selectedRecreationFacility = navigationData?.recreationFacility;
  const arrivalSummary = getArrivalSummary(navigationData?.routeDetails);
  const shouldShowResults =
    sheetState === SHEET_STATES.RESULTS &&
    (hasActiveSearchQuery || isSearchFocused || isOriginSearch);
  const shouldShowDestination = sheetState === SHEET_STATES.SELECTED && selectedResult && navigationData;
  const shouldShowRoute = sheetState === SHEET_STATES.ROUTE && selectedResult && navigationData;
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
    : routePreview || {
        destinationLabel: navigationData?.routeDetails.destinationLabel || "Selected destination",
        distanceLabel: "Route unavailable",
        walkTimeLabel: "Time unavailable",
        originLabel: routeOriginLabel,
        steps: [],
        warnings: []
      };
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
  const routeLineGeometry = useMemo(
    () =>
      shouldShowRoute && routeRequest.route
        ? buildRouteFeatureFromNormalizedRoute(routeRequest.route)
        : shouldShowRoute &&
            routePreview?.geoPath &&
            routeRequest.status === ROUTE_STATES.TEMPORARY_FALLBACK
          ? createRouteLineString(routePreview.geoPath)
          : null,
    [routePreview, routeRequest.route, routeRequest.status, shouldShowRoute]
  );
  const routeConnectorGeometry = useMemo(
    () =>
      shouldShowRoute && routeRequest.status === ROUTE_STATES.SUCCESS
        ? createFinalConnectorGeometry(routingDestination, destination)
        : null,
    [destination, routeRequest.status, routingDestination, shouldShowRoute]
  );
  const mapMode = shouldShowRoute
    ? "route"
    : destination
      ? "destination"
      : collegeExploreActive
        ? "college-overview"
      : routeOrigin || mapCurrentLocation
        ? "current-location"
        : "default";
  const isSheetExpanded = sheetPosition === SHEET_POSITIONS.EXPANDED;
  const sheetLabelNoun =
    sheetState === SHEET_STATES.RESULTS
      ? "search results"
      : sheetState === SHEET_STATES.DISCOVERY
        ? "destination details"
        : sheetState === SHEET_STATES.COLLEGES
          ? "college explorer"
        : "destination details";
  const sheetToggleLabel = `${isSheetExpanded ? "Collapse" : "Expand"} ${sheetLabelNoun}`;
  const collapsedSummary = getCollapsedSheetSummary({
    exploredCollege,
    query: activeSearchQuery,
    routePreview: routeDisplay,
    sheetState,
    visibleResultCount: visibleResults.length
  });

  function resetRouteRequest() {
    routeAbortRef.current?.abort();
    setRouteRequest({
      status: ROUTE_STATES.IDLE,
      route: null,
      error: "",
      errorCode: "",
      httpStatus: null,
      requestDurationMs: null
    });
  }

  function selectResult(
    result,
    { collapseSheet = false, preserveCollegeExplorer = false } = {}
  ) {
    if (result.type === "college") {
      selectCollegeMarker(result.destinationId, { collapseSheet });
      return;
    }

    resetRouteRequest();
    setSelectedResult(result);
    if (!preserveCollegeExplorer) {
      setCollegeExploreActive(false);
      setSelectedCollegeId("");
    }
    setRoomLookupQuery("");
    setSearchMode(SEARCH_MODES.DESTINATION);
    setSheetState(SHEET_STATES.SELECTED);
    setSheetPosition(collapseSheet ? SHEET_POSITIONS.COLLAPSED : SHEET_POSITIONS.EXPANDED);
    searchInputRef.current?.blur();
  }

  function selectOriginResult(result) {
    const routingPoint = getCampusRoutingPoint(
      result.destinationId || result.buildingId,
      result.room
    );

    if (!routingPoint) return;

    resetRouteRequest();
    setSelectedOrigin({
      type: ORIGIN_MODES.SELECTED,
      coordinate: { lat: routingPoint.lat, lng: routingPoint.lng },
      label: getDisplayTitle(result),
      source: routingPoint.source || "campus-search"
    });
    setOriginMode(ORIGIN_MODES.SELECTED);
    setOriginQuery(getDisplayTitle(result));
    setDevelopmentOriginId("current");
    setSearchMode(SEARCH_MODES.DESTINATION);
    setCollegeExploreActive(false);
    setSelectedCollegeId("");
    setOriginMenuOpen(false);
    setSheetState(selectedResult ? SHEET_STATES.SELECTED : SHEET_STATES.DISCOVERY);
    setSheetPosition(SHEET_POSITIONS.EXPANDED);
    searchInputRef.current?.blur();
  }

  function selectActiveSearchResult(result) {
    if (isOriginSearch) {
      selectOriginResult(result);
      return;
    }

    selectResult(result);
  }

  function runDemoSearch(queryValue, { collapseSheet = false } = {}) {
    setQuery(queryValue);
    const [demoResult] = searchCampusLocations(queryValue);
    if (demoResult) selectResult(demoResult, { collapseSheet });
  }

  function openCollegeExplorer() {
    resetRouteRequest();
    setQuery("");
    setSelectedResult(null);
    setActiveUtilityId("");
    setRoomLookupQuery("");
    setSearchMode(SEARCH_MODES.DESTINATION);
    setCollegeExploreActive(true);
    setSelectedCollegeId("");
    setSheetState(SHEET_STATES.COLLEGES);
    setSheetPosition(SHEET_POSITIONS.COLLAPSED);
    searchInputRef.current?.blur();
  }

  function runDemoAction(action) {
    if (action.id === "colleges") {
      openCollegeExplorer();
      return;
    }

    if (action.id === "building") {
      setQuery(action.query);
      const buildingResult = searchCampusLocations(action.query).find((result) => !result.room);
      if (buildingResult) selectResult(buildingResult, { collapseSheet: true });
      return;
    }

    runDemoSearch(action.query, { collapseSheet: true });
  }

  function selectCollegeMarker(collegeId, { collapseSheet = true } = {}) {
    const college = CAMPUS_COLLEGE_MARKERS.find((item) => item.id === collegeId);
    if (!college) return;

    resetRouteRequest();
    setQuery("");
    setSelectedResult(null);
    setActiveUtilityId("");
    setRoomLookupQuery("");
    setSearchMode(SEARCH_MODES.DESTINATION);
    setCollegeExploreActive(true);
    setSelectedCollegeId(college.id);
    setSheetState(SHEET_STATES.COLLEGES);
    setSheetPosition(collapseSheet ? SHEET_POSITIONS.COLLAPSED : SHEET_POSITIONS.EXPANDED);
    searchInputRef.current?.blur();
  }

  function submitSearch(event) {
    event.preventDefault();
    if (activeResults[0]) {
      selectActiveSearchResult(activeResults[0]);
      return;
    }

    setSheetState(hasActiveSearchQuery ? SHEET_STATES.RESULTS : SHEET_STATES.DISCOVERY);
  }

  function selectFeatured(queryValue) {
    runDemoSearch(queryValue);
  }

  function updateQuery(value) {
    resetRouteRequest();
    setQuery(value);
    setSelectedResult(null);
    setCollegeExploreActive(false);
    setSelectedCollegeId("");
    setActiveUtilityId("");
    setRoomLookupQuery("");
    setSheetState(value.trim() ? SHEET_STATES.RESULTS : SHEET_STATES.DISCOVERY);
  }

  function updateOriginQuery(value) {
    resetRouteRequest();
    setOriginQuery(value);
    setSheetState(SHEET_STATES.RESULTS);
  }

  function updateActiveSearch(value) {
    if (isOriginSearch) {
      updateOriginQuery(value);
      return;
    }

    updateQuery(value);
  }

  function clearSearch() {
    resetRouteRequest();
    setQuery("");
    setCollegeExploreActive(false);
    setSelectedCollegeId("");
    setActiveUtilityId("");
    setRoomLookupQuery("");
    setSheetState(SHEET_STATES.DISCOVERY);
  }

  function clearActiveSearch() {
    if (isOriginSearch) {
      setOriginQuery("");
      setSheetState(SHEET_STATES.RESULTS);
      return;
    }

    clearSearch();
  }

  function beginSetLocation() {
    resetRouteRequest();
    setCollegeExploreActive(false);
    setSelectedCollegeId("");
    setOriginMenuOpen(false);
    setOriginQuery("");
    setSearchMode(SEARCH_MODES.ORIGIN);
    setSheetState(SHEET_STATES.RESULTS);
    setSheetPosition(SHEET_POSITIONS.EXPANDED);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  function useCurrentLocation() {
    resetRouteRequest();
    setCollegeExploreActive(false);
    setSelectedCollegeId("");
    setOriginMode(ORIGIN_MODES.CURRENT);
    setSelectedOrigin(null);
    setOriginQuery("");
    setSearchMode(SEARCH_MODES.DESTINATION);
    setOriginMenuOpen(false);
    setDevelopmentOriginId("current");
    setSheetState(selectedResult ? SHEET_STATES.SELECTED : SHEET_STATES.DISCOVERY);
    retryLocation();
  }

  function handleSearchFocus() {
    window.clearTimeout(searchBlurTimerRef.current);
    setIsSearchFocused(true);
    setCollegeExploreActive(false);
    setOriginMenuOpen(false);
    setSheetState(SHEET_STATES.RESULTS);
    setSheetPosition(SHEET_POSITIONS.EXPANDED);
  }

  function handleSearchBlur() {
    window.clearTimeout(searchBlurTimerRef.current);
    searchBlurTimerRef.current = window.setTimeout(() => {
      setIsSearchFocused(false);
      if (!isOriginSearch && !query.trim() && !selectedResult) {
        setSheetState(SHEET_STATES.DISCOVERY);
      }
    }, 120);
  }

  function changeDestination() {
    resetRouteRequest();
    setSelectedResult(null);
    setCollegeExploreActive(false);
    setSelectedCollegeId("");
    setActiveUtilityId("");
    setRoomLookupQuery("");
    setSearchMode(SEARCH_MODES.DESTINATION);
    setSheetState(query.trim() ? SHEET_STATES.RESULTS : SHEET_STATES.DISCOVERY);
  }

  async function previewRoute() {
    if (!selectedResult || !hasCoordinates(routingDestination)) return;

    if (!hasCoordinates(origin)) {
      setRouteRequest({
        status: ROUTE_STATES.ERROR,
        route: null,
        error: "Choose Current Location while on campus, or set a UCSD starting point before requesting directions.",
        errorCode: "ORIGIN_OUTSIDE_ROUTING_AREA",
        httpStatus: null,
        requestDurationMs: null
      });
      setSheetState(SHEET_STATES.ROUTE);
      setSheetPosition(SHEET_POSITIONS.EXPANDED);
      return;
    }

    if (areRouteEndpointsEquivalent(origin, routingDestination)) {
      setRouteRequest({
        status: ROUTE_STATES.ERROR,
        route: null,
        error: "Choose a destination that is different from your starting point.",
        errorCode: "ORIGIN_MATCHES_DESTINATION",
        httpStatus: null,
        requestDurationMs: null
      });
      setSheetState(SHEET_STATES.ROUTE);
      setSheetPosition(SHEET_POSITIONS.EXPANDED);
      return;
    }

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

      if (error?.code === "PROVIDER_CONFIGURATION") {
        setRouteRequest({
          status: ROUTE_STATES.ROUTING_UNAVAILABLE,
          route: null,
          error: "Live campus routing is not connected on this deployment yet. Destination details and nearby utilities are still available.",
          errorCode: error.code,
          httpStatus: error.status || null,
          requestDurationMs: Math.round(performance.now() - requestStartedAt)
        });
        setSheetPosition(SHEET_POSITIONS.EXPANDED);
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
      setSheetPosition(SHEET_POSITIONS.EXPANDED);
    }
  }

  function updateDevelopmentOrigin(event) {
    const nextOriginId = event.target.value;
    setDevelopmentOriginId(nextOriginId);
    resetRouteRequest();

    if (nextOriginId === "current") {
      setOriginMode(ORIGIN_MODES.CURRENT);
      setSelectedOrigin(null);
    } else {
      const nextOrigin = DEVELOPMENT_TEST_ORIGINS.find(
        (testOrigin) => testOrigin.id === nextOriginId
      );
      if (nextOrigin) {
        setOriginMode(ORIGIN_MODES.SELECTED);
        setSelectedOrigin({
          type: ORIGIN_MODES.SELECTED,
          coordinate: { lat: nextOrigin.lat, lng: nextOrigin.lng },
          label: nextOrigin.label,
          source: nextOrigin.routingCoordinateSource
        });
      }
    }

    if (selectedResult) {
      setSheetState(SHEET_STATES.SELECTED);
      setSheetPosition(SHEET_POSITIONS.EXPANDED);
    }
  }

  function requestDeviceLocation() {
    useCurrentLocation();
  }

  function selectUtilityCategory(categoryId) {
    setActiveUtilityId(categoryId);
    if (categoryId !== "room-lookup") {
      setRoomLookupQuery("");
    }
    if (selectedResult) {
      setSheetPosition(SHEET_POSITIONS.EXPANDED);
    }
  }

  function selectRoomFromLookup(room) {
    const roomQuery = `${navigationData?.building?.shortName || selectedResult?.buildingCode || ""} ${room.number}`.trim();
    const [roomResult] = searchCampusLocations(roomQuery);
    if (roomResult) {
      setQuery(roomQuery);
      selectResult(roomResult);
      setActiveUtilityId("room-lookup");
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

  const originControlLabel =
    originMode === ORIGIN_MODES.SELECTED && selectedOrigin
      ? selectedOrigin.label
      : getLocationLabel(status, location, coverage);
  const canRequestRoute =
    hasCoordinates(origin) &&
    hasCoordinates(routingDestination) &&
    !areRouteEndpointsEquivalent(origin, routingDestination);

  return (
    <main
      className={`map-first-page ${isSearchFocused ? "map-first-page-keyboard-open" : ""}`}
    >
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
              {isOriginSearch ? "Search for a UCSD starting point" : "Search UCSD destinations"}
            </label>
            <span className="map-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              autoComplete="off"
              className="map-search-input"
              id="campus-search"
              onBlur={handleSearchBlur}
              onChange={(event) => updateActiveSearch(event.target.value)}
              onFocus={handleSearchFocus}
              placeholder={isOriginSearch ? "Set starting point" : "Where are you going?"}
              ref={searchInputRef}
              type="search"
              value={activeSearchQuery}
            />
            {activeSearchQuery ? (
              <button
                aria-label="Clear search"
                className="map-search-clear"
                onClick={clearActiveSearch}
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
          <div className="map-origin-control">
            <button
              aria-expanded={originMenuOpen}
              aria-haspopup="menu"
              className="map-location-button"
              onClick={() => setOriginMenuOpen((isOpen) => !isOpen)}
              title="Choose starting point"
              type="button"
            >
              <span className="map-location-dot" />
              <span className="map-origin-button-copy">
                <small>Starting point</small>
                <strong>{originControlLabel}</strong>
              </span>
              <span className="map-origin-chevron" aria-hidden="true">⌄</span>
            </button>
            {originMenuOpen ? (
              <div className="map-origin-menu" role="menu" aria-label="Starting point">
                <button onClick={requestDeviceLocation} role="menuitem" type="button">
                  <span className="map-location-dot" />
                  <span>
                    <strong>Current Location</strong>
                    <small>Use this device</small>
                  </span>
                </button>
                <button onClick={beginSetLocation} role="menuitem" type="button">
                  <span className="map-origin-pin" aria-hidden="true">+</span>
                  <span>
                    <strong>Set Location</strong>
                    <small>Choose a UCSD place</small>
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="campus-map-frame">
          <MapView
            bottomSheetState={sheetPosition}
            exploreMarkers={collegeMarkers}
            currentLocation={mapCurrentLocation}
            currentLocationStatus={status}
            fallbackLocation={FALLBACK_ORIGIN}
            focusCurrentLocationKey={locationFocusKey}
            allowEndpointRouteFallback={false}
            mapMode={mapMode}
            navigationData={navigationData}
            onSelectExploreMarker={selectCollegeMarker}
            originLabel={routeOriginLabel}
            originLocation={routeOrigin}
            originType={originMode}
            routeGeometry={routeLineGeometry}
            routeConnectorGeometry={routeConnectorGeometry}
            routeIsEstimated={routeRequest.status !== ROUTE_STATES.SUCCESS}
            selectedDestination={destination}
            showFallbackOrigin={false}
            utilityMarkers={utilityMarkers}
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
                    onClick={() => runDemoAction(action)}
                    type="button"
                  >
                    <span className="demo-route-icon" aria-hidden="true">
                      {action.icon}
                    </span>
                    <span className="demo-route-copy">
                      <span>{action.label}</span>
                      <small>{action.detail}</small>
                    </span>
                    <span className="demo-route-arrow" aria-hidden="true">
                      &gt;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {sheetState === SHEET_STATES.COLLEGES ? (
            <div className="sheet-panel-content college-explorer-panel">
              <div className="sheet-heading-row">
                <div>
                  <p className="eyebrow">Campus Overview</p>
                  <h2>Explore Colleges</h2>
                </div>
                <button className="sheet-text-button" onClick={clearSearch} type="button">
                  Done
                </button>
              </div>
              <p className="sheet-supporting-copy">
                Tap a representative college marker. Official territorial boundaries are not yet
                available in TritonNav.
              </p>
              {exploredCollege ? (
                <div className="college-explorer-selection">
                  <strong>{exploredCollege.name}</strong>
                  <span>
                    {exploredCollege.associatedBuildings.length
                      ? exploredCollege.associatedBuildings.join(", ")
                      : "Linked college destinations are pending official campus data."}
                  </span>
                </div>
              ) : null}
              <div className="college-explorer-list" aria-label="UC San Diego colleges">
                {CAMPUS_COLLEGE_MARKERS.map((college) => (
                  <button
                    aria-pressed={selectedCollegeId === college.id}
                    key={college.id}
                    onClick={() => selectCollegeMarker(college.id)}
                    type="button"
                  >
                    <strong>{college.name}</strong>
                    <span>{college.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {shouldShowResults ? (
            <div className="sheet-panel-content">
              <div className="sheet-heading-row">
                <div>
                  <p className="eyebrow">
                    {isOriginSearch ? "Starting Point" : "Search Results"}
                  </p>
                  <h2>
                    {visibleResults.length
                      ? isOriginSearch
                        ? "Select a campus origin"
                        : "Select a destination"
                      : "No matches yet"}
                  </h2>
                </div>
                <button className="sheet-text-button" onClick={clearActiveSearch} type="button">
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
                        onClick={() => selectActiveSearchResult(result)}
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
                  {isOriginSearch
                    ? "Try Geisel Library, Price Center, Mandeville, Sixth College, or another UCSD place."
                    : "Try CSB 115, MOS 0114, MANDE B202, DIB 122, Muir, Sixth, or Geisel."}
                </div>
              )}
            </div>
          ) : null}

          {shouldShowDestination ? (
            <div className="sheet-panel-content">
              <div className="sheet-heading-row">
                <div>
                  <h2>{routeDisplay.destinationLabel}</h2>
                  <p className="eyebrow">Destination Selected</p>
                </div>
                <button className="sheet-text-button" onClick={changeDestination} type="button">
                  Change
                </button>
              </div>
              <div className="route-endpoint-summary" aria-label="Route endpoints">
                <div>
                  <span>Starting point</span>
                  <strong>{routeOriginLabel}</strong>
                </div>
                <div>
                  <span>Destination</span>
                  <strong>{routeDisplay.destinationLabel}</strong>
                </div>
              </div>
              {originMode === ORIGIN_MODES.CURRENT && isOutsideRoutingCoverage ? (
                <div className="inline-alert inline-alert-warning">
                  <strong>Outside UCSD routing area.</strong> TritonNav can show your real location,
                  but the local Valhalla graph only covers UCSD. Set a campus starting point to
                  preview a walking route while you are away.
                  <button className="inline-alert-action" onClick={beginSetLocation} type="button">
                    Set campus starting point
                  </button>
                </div>
              ) : null}
              {!hasCoordinates(origin) && !isOutsideRoutingCoverage ? (
                <div className="inline-alert inline-alert-warning">
                  <strong>Starting point needed.</strong> Use your current location or choose a UCSD
                  place before requesting directions.
                  <button className="inline-alert-action" onClick={beginSetLocation} type="button">
                    Set Location
                  </button>
                </div>
              ) : null}
              <div className="sheet-metric-grid">
                <div>
                  <span>Distance</span>
                  <strong>{routeDisplay.distanceLabel}</strong>
                </div>
                <div>
                  <span>Walk time</span>
                  <strong>{routeDisplay.walkTimeLabel}</strong>
                </div>
              </div>
              <div className="destination-intelligence-section">
                <div className="destination-section-heading">
                  <span>Destination</span>
                  <strong>{intelligence?.destinationType || navigationData.destinationType}</strong>
                </div>
                <p className="sheet-supporting-copy">
                  {navigationData.building.name}
                  {navigationData.room ? ` • room ${navigationData.room}` : ""}
                  {navigationData.building.shortName ? ` • ${navigationData.building.shortName}` : ""}
                </p>
                {intelligence?.selectedEntrance ? (
                  <p className="sheet-supporting-copy">
                    Preferred entrance: {intelligence.selectedEntrance.name}
                  </p>
                ) : null}
              </div>
              <p className="sheet-summary">
                {navigationData.instructions}
              </p>
              {arrivalSummary ? (
                <p className="sheet-supporting-copy">{arrivalSummary}</p>
              ) : null}
              <div className="destination-intelligence-section">
                <div className="destination-section-heading">
                  <span>Arrival</span>
                  <strong>{intelligence?.accessibilityStatus || "Accessibility data unavailable"}</strong>
                </div>
                <p className="sheet-supporting-copy">
                  Accessibility is shown only when TritonNav has verified or curated entrance data.
                </p>
              </div>
              <IndoorDirectionsDetails indoorDirections={navigationData.indoorDirections} />
              {!hasIndoorDirections(navigationData.indoorDirections) ? (
                <p className="sheet-supporting-copy">
                  Detailed indoor directions are not available yet.
                </p>
              ) : null}
              {activeUtility?.id === "room-lookup" ? (
                <RoomLookupPanel
                  building={navigationData.building}
                  onChangeQuery={setRoomLookupQuery}
                  onSelectRoom={selectRoomFromLookup}
                  query={roomLookupQuery}
                  rooms={activeUtilityResults}
                />
              ) : (
                <UtilityNearbyPanel category={activeUtility} results={activeUtilityResults} />
              )}
              {intelligence?.buildingInfo?.aliases?.length || intelligence?.buildingInfo?.college ? (
                <div className="destination-intelligence-section">
                  <div className="destination-section-heading">
                    <span>Building Information</span>
                    <strong>{intelligence.buildingInfo.college || "Campus"}</strong>
                  </div>
                  {intelligence.buildingInfo.aliases?.length ? (
                    <p className="sheet-supporting-copy">
                      Also known as: {intelligence.buildingInfo.aliases.slice(0, 4).join(", ")}
                    </p>
                  ) : null}
                  {intelligence.buildingInfo.image ? (
                    <p className="sheet-supporting-copy">Building image available.</p>
                  ) : (
                    <p className="sheet-supporting-copy">No verified building image is available yet.</p>
                  )}
                </div>
              ) : null}
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
              <button
                className="sheet-primary-action"
                disabled={!canRequestRoute || routeRequest.status === ROUTE_STATES.LOADING}
                onClick={previewRoute}
                type="button"
              >
                {routeRequest.status === ROUTE_STATES.LOADING ? "Calculating..." : "Get Directions"}
              </button>
            </div>
          ) : null}

          {shouldShowRoute ? (
            <div className="sheet-panel-content">
              <div className="sheet-heading-row">
                <div>
                  <h2>{routeDisplay.destinationLabel}</h2>
                  <p className="eyebrow">{getRoutePanelEyebrow(routeRequest.status)}</p>
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
              {routeRequest.status === ROUTE_STATES.ROUTING_UNAVAILABLE ? (
                <div className="inline-alert inline-alert-warning">
                  <strong>Routing not connected.</strong> {routeRequest.error}
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
              {!hasIndoorDirections(navigationData.indoorDirections) ? (
                <p className="sheet-supporting-copy">
                  Detailed indoor directions are not available yet.
                </p>
              ) : null}
              {activeUtility?.id === "room-lookup" ? (
                <RoomLookupPanel
                  building={navigationData.building}
                  onChangeQuery={setRoomLookupQuery}
                  onSelectRoom={selectRoomFromLookup}
                  query={roomLookupQuery}
                  rooms={activeUtilityResults}
                />
              ) : (
                <UtilityNearbyPanel category={activeUtility} results={activeUtilityResults} />
              )}
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
                <button
                  className="sheet-primary-action"
                  disabled={!canRequestRoute || routeRequest.status === ROUTE_STATES.LOADING}
                  onClick={previewRoute}
                  type="button"
                >
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
