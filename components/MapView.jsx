"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import {
  DEFAULT_CAMPUS_CENTER,
  createRouteLineStringFromEndpoints,
  hasValidMapPoint,
  toLngLat
} from "@/lib/mapGeometry";
import { createGoogleMapsDirectionsUrl } from "@/services/mapsService";
import { navigationSelectors, useNavigationStore } from "@/store/useNavigationStore";

const FALLBACK_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const CAMPUS_ZOOM = 15.2;
const DESTINATION_ZOOM = 16.8;
const ROUTE_SOURCE_ID = "tritonnav-preview-route";
const ROUTE_SHADOW_LAYER_ID = "tritonnav-preview-route-shadow";
const ROUTE_LAYER_ID = "tritonnav-preview-route-line";
const ROUTE_CONNECTOR_SOURCE_ID = "tritonnav-route-display-connector";
const ROUTE_CONNECTOR_LAYER_ID = "tritonnav-route-display-connector-line";
const MAX_MAP_PIXEL_RATIO = 2;
const MAX_TILE_CACHE_SIZE = 32;
const EMPTY_ROUTE_FEATURE = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: []
  }
};

maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

function getMapStyleUrl() {
  return process.env.NEXT_PUBLIC_MAP_STYLE_URL || FALLBACK_STYLE_URL;
}

function getMapStyle() {
  return getMapStyleUrl();
}

function roundCoordinate(value) {
  return Number.isFinite(value) ? value.toFixed(5) : "";
}

function createMarkerElement(className, label) {
  const marker = document.createElement("div");
  marker.className = `maplibre-marker ${className}`;
  marker.setAttribute("aria-label", label);
  return marker;
}

function createExploreMarkerElement(item) {
  const marker = document.createElement("button");
  marker.className = `maplibre-marker-college ${item.isSelected ? "maplibre-marker-college-selected" : ""}`;
  marker.type = "button";
  marker.setAttribute("aria-label", `Select ${item.name}`);
  marker.textContent = item.label || item.name;
  return marker;
}

function supportsWebGL2() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
  const isSupported = Boolean(context);

  context?.getExtension("WEBGL_lose_context")?.loseContext();
  canvas.width = 1;
  canvas.height = 1;
  canvas.remove();

  return isSupported;
}

function getMapPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, MAX_MAP_PIXEL_RATIO);
}

function getRouteCoordinates(routeGeometry) {
  if (routeGeometry?.geometry?.type !== "LineString") return [];
  return routeGeometry.geometry.coordinates.filter(
    (coordinate) =>
      Array.isArray(coordinate) &&
      coordinate.length === 2 &&
      Number.isFinite(coordinate[0]) &&
      Number.isFinite(coordinate[1])
  );
}

function getPointKey(point) {
  if (!hasValidMapPoint(point)) return "";
  return `${roundCoordinate(point.lat)},${roundCoordinate(point.lng)}`;
}

function getRouteGeometryKey(routeGeometry) {
  const coordinates = getRouteCoordinates(routeGeometry);
  if (!coordinates.length) return "";
  return coordinates.map((coordinate) => coordinate.map(roundCoordinate).join(",")).join("|");
}

function getUtilityMarkersKey(utilityMarkers) {
  if (!Array.isArray(utilityMarkers) || !utilityMarkers.length) return "";

  return utilityMarkers
    .map((item) =>
      [
        item.id || "",
        item.categoryId || "",
        item.iconLabel || "",
        item.name || "",
        getPointKey(item.coordinates)
      ].join(":")
    )
    .join("|");
}

function getExploreMarkersKey(exploreMarkers) {
  if (!Array.isArray(exploreMarkers) || !exploreMarkers.length) return "";

  return exploreMarkers
    .map((item) =>
      [item.id || "", item.label || "", getPointKey(item.coordinates), item.isSelected ? "1" : "0"].join(":")
    )
    .join("|");
}

function getCameraPadding(variant, bottomSheetState) {
  if (variant !== "homepage") {
    return { top: 56, right: 56, bottom: 56, left: 56 };
  }

  return {
    top: 144,
    right: 34,
    bottom: bottomSheetState === "collapsed" ? 148 : 360,
    left: 34
  };
}

function upsertRouteLayer(map, routeGeometry) {
  if (!map?.isStyleLoaded()) return;

  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: routeGeometry || EMPTY_ROUTE_FEATURE
    });
  }

  if (!map.getLayer(ROUTE_SHADOW_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_SHADOW_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": "rgba(24, 43, 73, 0.46)",
        "line-width": 11,
        "line-opacity": 0.82
      }
    });
  }

  if (!map.getLayer(ROUTE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": "#ffcd00",
        "line-dasharray": [1.6, 1.2],
        "line-width": 6
      }
    });
  }

  map.getSource(ROUTE_SOURCE_ID)?.setData(routeGeometry || EMPTY_ROUTE_FEATURE);
}

function upsertRouteConnectorLayer(map, routeConnectorGeometry) {
  if (!map?.isStyleLoaded()) return;

  if (!map.getSource(ROUTE_CONNECTOR_SOURCE_ID)) {
    map.addSource(ROUTE_CONNECTOR_SOURCE_ID, {
      type: "geojson",
      data: routeConnectorGeometry || EMPTY_ROUTE_FEATURE
    });
  }

  if (!map.getLayer(ROUTE_CONNECTOR_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_CONNECTOR_LAYER_ID,
      type: "line",
      source: ROUTE_CONNECTOR_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": "#102a4e",
        "line-dasharray": [1, 1.6],
        "line-opacity": 0.58,
        "line-width": 3
      }
    });
  }

  map.getSource(ROUTE_CONNECTOR_SOURCE_ID)?.setData(routeConnectorGeometry || EMPTY_ROUTE_FEATURE);
}

export default function MapView({
  navigationData = null,
  location = null,
  currentLocation = null,
  currentLocationStatus = "idle",
  fallbackLocation = DEFAULT_CAMPUS_CENTER,
  focusCurrentLocationKey = "",
  originLocation = null,
  originLabel = "Route origin",
  originType = "current",
  selectedDestination = null,
  routeGeometry = null,
  routeConnectorGeometry = null,
  utilityMarkers = [],
  exploreMarkers = [],
  onSelectExploreMarker = null,
  routeIsEstimated = true,
  allowEndpointRouteFallback = process.env.NODE_ENV !== "production",
  bottomSheetState = "expanded",
  mapMode = "default",
  showFallbackOrigin = true,
  variant = "card"
}) {
  const data = navigationData;
  const destination = selectedDestination || data?.destination || null;
  const building = data?.building;
  const room = data?.room;
  const routeDetails = data?.routeDetails;
  const destinationType = data?.destinationType;
  const mapStatus = useNavigationStore(navigationSelectors.mapStatus);
  const mapError = useNavigationStore(navigationSelectors.mapError);
  const setMapLoading = useNavigationStore((state) => state.setMapLoading);
  const setMapReady = useNavigationStore((state) => state.setMapReady);
  const setMapFailed = useNavigationStore((state) => state.setMapFailed);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const utilityMarkerRefs = useRef([]);
  const exploreMarkerRefs = useRef([]);
  const onSelectExploreMarkerRef = useRef(onSelectExploreMarker);
  const lastCameraKeyRef = useRef("");
  const currentMarkerKeyRef = useRef("");
  const destinationMarkerKeyRef = useRef("");
  const utilityMarkersKeyRef = useRef("");
  const exploreMarkersKeyRef = useRef("");
  const routeGeometryKeyRef = useRef(null);
  const routeConnectorGeometryKeyRef = useRef(null);
  const [localStatus, setLocalStatus] = useState("loading");
  const [localError, setLocalError] = useState("");
  const styleUrl = getMapStyleUrl();
  const mapStyle = getMapStyle();
  const liveOrigin = originLocation || currentLocation || location || null;
  const markerOrigin = hasValidMapPoint(liveOrigin)
    ? liveOrigin
    : showFallbackOrigin
      ? fallbackLocation
      : null;
  const hasDestinationCoordinates = hasValidMapPoint(destination);
  const mapRouteGeometry =
    routeGeometry ||
    (allowEndpointRouteFallback && hasValidMapPoint(markerOrigin) && hasDestinationCoordinates
      ? createRouteLineStringFromEndpoints(markerOrigin, destination)
      : null);
  const liveOriginKey = getPointKey(liveOrigin);
  const markerOriginKey = getPointKey(markerOrigin);
  const destinationKey = getPointKey(destination);
  const mapRouteGeometryKey = getRouteGeometryKey(mapRouteGeometry);
  const routeConnectorGeometryKey = getRouteGeometryKey(routeConnectorGeometry);
  const utilityMarkersKey = getUtilityMarkersKey(utilityMarkers);
  const exploreMarkersKey = getExploreMarkersKey(exploreMarkers);
  const exploreMarkerCoordinates = useMemo(
    () => exploreMarkers.map((item) => item.coordinates).filter(hasValidMapPoint),
    [exploreMarkers]
  );
  const mapsUrl = useMemo(
    () =>
      data?.googleMapsUrl ||
      createGoogleMapsDirectionsUrl({
        destination,
        origin: liveOrigin || (showFallbackOrigin ? fallbackLocation : null)
      }),
    [data?.googleMapsUrl, destination, fallbackLocation, liveOrigin, showFallbackOrigin]
  );
  const hasGoogleMapsAction = Boolean(mapsUrl);
  const shellClassName =
    variant === "homepage" ? "maplibre-shell maplibre-shell-homepage" : "map-embed-shell";

  useEffect(() => {
    onSelectExploreMarkerRef.current = onSelectExploreMarker;
  }, [onSelectExploreMarker]);

  useEffect(() => {
    let cancelled = false;
    let mapHasLoaded = false;
    let mapInstance = null;
    let readyFrame = null;
    let handleMapReady = null;
    let handleMapError = null;
    let handleVisibilityChange = null;

    async function initializeMap() {
      if (!containerRef.current || mapRef.current) return;

      setLocalStatus("loading");
      setMapLoading();

      try {
        if (cancelled || !containerRef.current) return;

        if (!supportsWebGL2()) {
          const message =
            "WebGL2 is required to display the interactive campus map in this browser.";
          setLocalStatus("error");
          setLocalError(message);
          setMapFailed(message);
          return;
        }

        mapInstance = new maplibregl.Map({
          attributionControl: false,
          center: toLngLat(DEFAULT_CAMPUS_CENTER),
          container: containerRef.current,
          maxZoom: 19,
          maxTileCacheSize: MAX_TILE_CACHE_SIZE,
          maxTileCacheZoomLevels: 2,
          minZoom: 13,
          pixelRatio: getMapPixelRatio(),
          pitchWithRotate: false,
          style: mapStyle,
          zoom: CAMPUS_ZOOM
        });

        mapInstance.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "bottom-right"
        );
        mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

        handleMapReady = () => {
          if (cancelled) return;
          mapHasLoaded = true;
          upsertRouteLayer(mapInstance, mapRouteGeometry);
          upsertRouteConnectorLayer(mapInstance, routeConnectorGeometry);
          setLocalStatus("ready");
          setMapReady();
          readyFrame = requestAnimationFrame(() => mapInstance.resize());
        };

        handleMapError = (event) => {
          if (mapHasLoaded) return;
          const message =
            event?.error?.message || "MapLibre style or tile data could not be loaded.";
          setLocalStatus("error");
          setLocalError(message);
          setMapFailed(message);
        };

        handleVisibilityChange = () => {
          if (document.hidden) {
            mapInstance.stop();
            return;
          }

          mapInstance.resize();
          mapInstance.triggerRepaint();
        };

        mapInstance.once("load", handleMapReady);
        mapInstance.on("error", handleMapError);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        mapRef.current = mapInstance;
      } catch (error) {
        const message = error?.message || "MapLibre could not be initialized.";
        setLocalStatus("error");
        setLocalError(message);
        setMapFailed(message);
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
      if (readyFrame !== null) cancelAnimationFrame(readyFrame);
      if (handleMapReady) mapInstance?.off("load", handleMapReady);
      if (handleMapError) mapInstance?.off("error", handleMapError);
      if (handleVisibilityChange) {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      currentMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      utilityMarkerRefs.current.forEach((marker) => marker.remove());
      exploreMarkerRefs.current.forEach(({ element, handleClick, marker }) => {
        element.removeEventListener("click", handleClick);
        marker.remove();
      });
      mapInstance?.stop();
      mapRef.current?.remove();
      currentMarkerRef.current = null;
      destinationMarkerRef.current = null;
      utilityMarkerRefs.current = [];
      exploreMarkerRefs.current = [];
      mapRef.current = null;
      currentMarkerKeyRef.current = "";
      destinationMarkerKeyRef.current = "";
      utilityMarkersKeyRef.current = "";
      exploreMarkersKeyRef.current = "";
      routeGeometryKeyRef.current = null;
      routeConnectorGeometryKeyRef.current = null;
    };
  }, [setMapFailed, setMapLoading, setMapReady, styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasValidMapPoint(markerOrigin)) {
      currentMarkerRef.current?.remove();
      currentMarkerRef.current = null;
      currentMarkerKeyRef.current = "";
      return;
    }

    const className =
      originType === "selected"
        ? "maplibre-marker-origin"
        : hasValidMapPoint(liveOrigin)
          ? "maplibre-marker-current"
          : "maplibre-marker-fallback";
    const label = hasValidMapPoint(liveOrigin) ? originLabel : "Fallback campus origin";
    const markerKey = [markerOriginKey, liveOriginKey, className, label].join(":");

    if (currentMarkerRef.current && currentMarkerKeyRef.current === markerKey) return;

    currentMarkerRef.current?.remove();
    currentMarkerRef.current = new maplibregl.Marker({
      element: createMarkerElement(className, label)
    })
      .setLngLat(toLngLat(markerOrigin))
      .addTo(map);
    currentMarkerKeyRef.current = markerKey;
  }, [liveOriginKey, markerOrigin, markerOriginKey, originLabel, originType]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasDestinationCoordinates) {
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
      destinationMarkerKeyRef.current = "";
      return;
    }

    if (destinationMarkerRef.current && destinationMarkerKeyRef.current === destinationKey) return;

    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = new maplibregl.Marker({
      element: createMarkerElement("maplibre-marker-destination", "Selected destination")
    })
      .setLngLat(toLngLat(destination))
      .addTo(map);
    destinationMarkerKeyRef.current = destinationKey;
  }, [destination, destinationKey, hasDestinationCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (utilityMarkersKeyRef.current === utilityMarkersKey) return;

    utilityMarkerRefs.current.forEach((marker) => marker.remove());
    utilityMarkerRefs.current = [];
    utilityMarkersKeyRef.current = utilityMarkersKey;

    for (const item of utilityMarkers) {
      if (!hasValidMapPoint(item.coordinates)) continue;

      const element = createMarkerElement(
        "maplibre-marker-utility",
        item.name || "Nearby campus utility"
      );
      element.dataset.utilityType = item.categoryId || "utility";
      element.textContent = item.iconLabel || "";

      utilityMarkerRefs.current.push(
        new maplibregl.Marker({ element })
          .setLngLat(toLngLat(item.coordinates))
          .addTo(map)
      );
    }
  }, [utilityMarkers, utilityMarkersKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (exploreMarkersKeyRef.current === exploreMarkersKey) return;

    exploreMarkerRefs.current.forEach(({ element, handleClick, marker }) => {
      element.removeEventListener("click", handleClick);
      marker.remove();
    });
    exploreMarkerRefs.current = [];
    exploreMarkersKeyRef.current = exploreMarkersKey;

    for (const item of exploreMarkers) {
      if (!hasValidMapPoint(item.coordinates)) continue;

      const element = createExploreMarkerElement(item);
      const handleClick = () => onSelectExploreMarkerRef.current?.(item.id);
      element.addEventListener("click", handleClick);
      const marker = new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat(toLngLat(item.coordinates))
        .addTo(map);

      exploreMarkerRefs.current.push({ element, handleClick, marker });
    }
  }, [exploreMarkers, exploreMarkersKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRoute = () => {
      if (routeGeometryKeyRef.current === mapRouteGeometryKey) return;
      upsertRouteLayer(map, mapRouteGeometry);
      routeGeometryKeyRef.current = mapRouteGeometryKey;
    };
    if (map.isStyleLoaded()) {
      updateRoute();
      return;
    }

    map.once("load", updateRoute);
    return () => map.off("load", updateRoute);
  }, [mapRouteGeometry, mapRouteGeometryKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateConnector = () => {
      if (routeConnectorGeometryKeyRef.current === routeConnectorGeometryKey) return;
      upsertRouteConnectorLayer(map, routeConnectorGeometry);
      routeConnectorGeometryKeyRef.current = routeConnectorGeometryKey;
    };
    if (map.isStyleLoaded()) {
      updateConnector();
      return;
    }

    map.once("load", updateConnector);
    return () => map.off("load", updateConnector);
  }, [routeConnectorGeometry, routeConnectorGeometryKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || localStatus !== "ready") return;

    const routeCoordinates = getRouteCoordinates(mapRouteGeometry);
    const padding = getCameraPadding(variant, bottomSheetState);
    const cameraKey = [
      mapMode,
      bottomSheetState,
      destinationKey,
      mapRouteGeometryKey,
      exploreMarkersKey
    ].join(":");

    if (lastCameraKeyRef.current === cameraKey) return;
    lastCameraKeyRef.current = cameraKey;
    map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });

    if (mapMode === "route" && routeCoordinates.length >= 2) {
      const bounds = routeCoordinates.reduce(
        (nextBounds, coordinate) => nextBounds.extend(coordinate),
        new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0])
      );
      map.fitBounds(bounds, {
        duration: 620,
        maxZoom: 17,
        padding,
        retainPadding: false
      });
      return;
    }

    if (mapMode === "college-overview" && exploreMarkerCoordinates.length) {
      const firstCoordinate = toLngLat(exploreMarkerCoordinates[0]);
      const collegePadding =
        variant === "homepage"
          ? { ...padding, top: 220, bottom: Math.max(padding.bottom, 164) }
          : padding;
      const bounds = exploreMarkerCoordinates.reduce(
        (nextBounds, coordinate) => nextBounds.extend(toLngLat(coordinate)),
        new maplibregl.LngLatBounds(firstCoordinate, firstCoordinate)
      );
      map.fitBounds(bounds, {
        duration: 620,
        maxZoom: 15,
        padding: collegePadding,
        retainPadding: false
      });
      return;
    }

    if ((mapMode === "destination" || hasDestinationCoordinates) && hasDestinationCoordinates) {
      map.easeTo({
        center: toLngLat(destination),
        duration: 520,
        padding,
        retainPadding: false,
        zoom: DESTINATION_ZOOM
      });
      return;
    }

    if (mapMode === "current-location" && hasValidMapPoint(markerOrigin)) {
      map.easeTo({
        center: toLngLat(markerOrigin),
        duration: 520,
        padding,
        retainPadding: false,
        zoom: 16.1
      });
      return;
    }

    map.easeTo({
      center: toLngLat(DEFAULT_CAMPUS_CENTER),
      duration: 520,
      padding,
      retainPadding: false,
      zoom: CAMPUS_ZOOM
    });
  }, [
    bottomSheetState,
    destination,
    destinationKey,
    exploreMarkerCoordinates,
    exploreMarkersKey,
    hasDestinationCoordinates,
    localStatus,
    mapMode,
    mapRouteGeometry,
    mapRouteGeometryKey,
    markerOrigin,
    variant
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || localStatus !== "ready" || !focusCurrentLocationKey) return;
    if (!hasValidMapPoint(markerOrigin)) return;

    map.easeTo({
      center: toLngLat(markerOrigin),
      duration: 520,
      padding: getCameraPadding(variant, bottomSheetState),
      retainPadding: false,
      zoom: 16.4
    });
  }, [
    bottomSheetState,
    focusCurrentLocationKey,
    localStatus,
    markerOrigin,
    variant
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const frame = requestAnimationFrame(() => map.resize());
    const timer = window.setTimeout(() => map.resize(), 260);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [bottomSheetState, variant]);

  const mapSurface = (
    <div className={shellClassName}>
      <div
        aria-label="Interactive UC San Diego campus map"
        className="maplibre-map"
        ref={containerRef}
      />
      {localStatus !== "ready" ? (
        <div className="maplibre-overlay">
          {localStatus === "error"
            ? localError || mapError || "Map preview could not be loaded."
            : "Loading campus map..."}
        </div>
      ) : null}
      {!hasDestinationCoordinates && data ? (
        <div className="maplibre-note">Missing destination coordinates for this result.</div>
      ) : null}
      {mapMode === "route" && mapRouteGeometry ? (
        <div className="maplibre-route-note">
          {routeIsEstimated ? "Temporary route preview" : "Walking route preview"}
        </div>
      ) : null}
    </div>
  );

  if (variant === "homepage") {
    return mapSurface;
  }

  return (
    <section className="map-card">
      <div className="map-card-header">
        <div>
          <p className="eyebrow">Map Destination</p>
          <h2>{building?.name || "Campus destination"}</h2>
          <p className="muted-copy">
            {destinationType || "Destination"}
            {room ? ` • room ${room}` : ""}
          </p>
        </div>
        {hasGoogleMapsAction ? (
          <a className="primary-link" href={mapsUrl} rel="noreferrer" target="_blank">
            Open in Google Maps
          </a>
        ) : (
          <span className="status-chip status-chip-warning">Google Maps handoff unavailable</span>
        )}
      </div>

      <div className="map-status-row">
        <span className={`status-chip status-chip-${mapStatus}`}>
          {mapStatus === "ready"
            ? "Map preview ready"
            : mapStatus === "error"
              ? "Map preview issue"
              : "Loading map preview"}
        </span>
        <span
          className={`status-chip ${
            hasValidMapPoint(liveOrigin) ? "status-chip-ready" : "status-chip-warning"
          }`}
        >
          {hasValidMapPoint(liveOrigin) ? "Using live origin" : "Using fallback origin"}
        </span>
        <span className={`status-chip status-chip-${currentLocationStatus}`}>
          {routeDetails?.estimatedWalkMinutes
            ? `${routeDetails.formattedWalkTime} walk`
            : "Waiting for distance estimate"}
        </span>
      </div>

      {!hasDestinationCoordinates ? (
        <div className="inline-alert inline-alert-warning">
          <strong>Map preview unavailable.</strong> TritonNav could not resolve destination
          coordinates for this route, so only the text directions are available right now.
        </div>
      ) : null}

      {mapSurface}

      <div className="map-details">
        <p>
          <strong>You are here:</strong> {routeDetails?.originPlaceName || "Campus area"}
        </p>
        {routeDetails?.originPlaceAddress ? (
          <p>
            <strong>Origin context:</strong> {routeDetails.originPlaceAddress}
          </p>
        ) : null}
        <p>
          <strong>Destination:</strong> {building?.name || "Selected destination"}
        </p>
        <p>
          <strong>Destination type:</strong> {routeDetails?.destinationType || destinationType}
        </p>
        <p>
          <strong>Distance:</strong> {routeDetails?.formattedDistanceFeet || "Distance unavailable"}
        </p>
        <p>
          <strong>Address:</strong> {routeDetails?.destinationAddress || "UC San Diego"}
        </p>
        {routeDetails?.destinationNearbyLandmarks?.length ? (
          <p>
            <strong>Nearby landmark:</strong> {routeDetails.destinationNearbyLandmarks[0]}
          </p>
        ) : null}
        <p>
          <strong>Matched by:</strong> {data?.matchedBy || "campus destination"}
        </p>
        <p>
          <strong>Coordinates:</strong>{" "}
          {hasDestinationCoordinates ? `${destination.lat}, ${destination.lng}` : "Unavailable"}
        </p>
        <p>{room ? `Optimized for room ${room}` : "Optimized for the building entrance"}</p>
        {!hasGoogleMapsAction ? (
          <p>
            Google Maps could not be opened automatically, so stay on this page for the route
            preview.
          </p>
        ) : null}
      </div>
    </section>
  );
}
