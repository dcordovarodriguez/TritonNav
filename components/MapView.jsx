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

const FALLBACK_STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const MAPLIBRE_DEMO_STYLE_URL = "https://demotiles.maplibre.org/style.json";
const CARTO_RASTER_FALLBACK_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://carto.com/about-carto/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/about/">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: "carto-raster",
      type: "raster",
      source: "carto"
    }
  ]
};
const CAMPUS_ZOOM = 15.2;
const DESTINATION_ZOOM = 16.8;
const PUBLIC_FALLBACK_CAMPUS_ZOOM = 13.8;
const PUBLIC_FALLBACK_DESTINATION_ZOOM = 14;
const ROUTE_SOURCE_ID = "tritonnav-preview-route";
const ROUTE_SHADOW_LAYER_ID = "tritonnav-preview-route-shadow";
const ROUTE_LAYER_ID = "tritonnav-preview-route-line";

maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

function getMapStyleUrl() {
  return process.env.NEXT_PUBLIC_MAP_STYLE_URL || FALLBACK_STYLE_URL;
}

function getMapStyle() {
  return process.env.NEXT_PUBLIC_MAP_STYLE_URL || CARTO_RASTER_FALLBACK_STYLE;
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

function supportsWebGL2() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
  return Boolean(context);
}

function getRouteCoordinates(routeGeometry) {
  if (routeGeometry?.geometry?.type !== "LineString") return [];
  return routeGeometry.geometry.coordinates.filter(
    (coordinate) =>
      Array.isArray(coordinate) &&
      Number.isFinite(coordinate[0]) &&
      Number.isFinite(coordinate[1])
  );
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
      data: routeGeometry || {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: []
        }
      }
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

  map.getSource(ROUTE_SOURCE_ID)?.setData(
    routeGeometry || {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: []
      }
    }
  );
}

export default function MapView({
  navigationData = null,
  location = null,
  currentLocation = null,
  currentLocationStatus = "idle",
  fallbackLocation = DEFAULT_CAMPUS_CENTER,
  selectedDestination = null,
  routeGeometry = null,
  bottomSheetState = "expanded",
  mapMode = "default",
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
  const lastCameraKeyRef = useRef("");
  const [localStatus, setLocalStatus] = useState("loading");
  const [localError, setLocalError] = useState("");
  const styleUrl = getMapStyleUrl();
  const mapStyle = getMapStyle();
  const usesPublicFallbackStyle = styleUrl === FALLBACK_STYLE_URL;
  const usesMapLibreDemoStyle = styleUrl === MAPLIBRE_DEMO_STYLE_URL;
  const liveOrigin = currentLocation || location || null;
  const markerOrigin = hasValidMapPoint(liveOrigin) ? liveOrigin : fallbackLocation;
  const hasDestinationCoordinates = hasValidMapPoint(destination);
  const mapRouteGeometry =
    routeGeometry ||
    (hasValidMapPoint(markerOrigin) && hasDestinationCoordinates
      ? createRouteLineStringFromEndpoints(markerOrigin, destination)
      : null);
  const mapsUrl = useMemo(
    () =>
      data?.googleMapsUrl ||
      createGoogleMapsDirectionsUrl({
        destination,
        origin: liveOrigin || fallbackLocation
      }),
    [data?.googleMapsUrl, destination, fallbackLocation, liveOrigin]
  );
  const hasGoogleMapsAction = Boolean(mapsUrl);
  const shellClassName =
    variant === "homepage" ? "maplibre-shell maplibre-shell-homepage" : "map-embed-shell";

  useEffect(() => {
    let cancelled = false;
    let mapInstance = null;

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
          minZoom: 13,
          pitchWithRotate: false,
          style: mapStyle,
          zoom: usesPublicFallbackStyle ? PUBLIC_FALLBACK_CAMPUS_ZOOM : CAMPUS_ZOOM
        });

        mapInstance.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "bottom-right"
        );
        mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

        function handleMapReady() {
          if (cancelled) return;
          upsertRouteLayer(mapInstance, mapRouteGeometry);
          setLocalStatus("ready");
          setMapReady();
          requestAnimationFrame(() => mapInstance.resize());
        }

        mapInstance.on("style.load", handleMapReady);
        mapInstance.on("load", handleMapReady);

        mapInstance.on("error", (event) => {
          const message =
            event?.error?.message || "MapLibre style or tile data could not be loaded.";
          setLocalStatus("error");
          setLocalError(message);
          setMapFailed(message);
        });

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
      currentMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      mapRef.current?.remove();
      currentMarkerRef.current = null;
      destinationMarkerRef.current = null;
      mapRef.current = null;
    };
  }, [setMapFailed, setMapLoading, setMapReady, styleUrl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasValidMapPoint(markerOrigin)) {
      currentMarkerRef.current?.remove();
      currentMarkerRef.current = null;
      return;
    }

    const className = hasValidMapPoint(liveOrigin)
      ? "maplibre-marker-current"
      : "maplibre-marker-fallback";
    const label = hasValidMapPoint(liveOrigin)
      ? "Current location"
      : "Fallback campus origin";

    currentMarkerRef.current?.remove();
    currentMarkerRef.current = new maplibregl.Marker({
      element: createMarkerElement(className, label)
    })
      .setLngLat(toLngLat(markerOrigin))
      .addTo(map);
  }, [liveOrigin, markerOrigin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = null;

    if (!hasDestinationCoordinates) return;

    destinationMarkerRef.current = new maplibregl.Marker({
      element: createMarkerElement("maplibre-marker-destination", "Selected destination")
    })
      .setLngLat(toLngLat(destination))
      .addTo(map);
  }, [destination, hasDestinationCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRoute = () => upsertRouteLayer(map, mapRouteGeometry);
    if (map.isStyleLoaded()) {
      updateRoute();
      return;
    }

    map.once("load", updateRoute);
  }, [mapRouteGeometry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || localStatus !== "ready") return;

    const routeCoordinates = getRouteCoordinates(mapRouteGeometry);
    const padding = getCameraPadding(variant, bottomSheetState);
    const cameraKey = [
      mapMode,
      bottomSheetState,
      hasDestinationCoordinates ? `${roundCoordinate(destination.lat)},${roundCoordinate(destination.lng)}` : "",
      routeCoordinates.map((coordinate) => coordinate.map(roundCoordinate).join(",")).join("|")
    ].join(":");

    if (lastCameraKeyRef.current === cameraKey) return;
    lastCameraKeyRef.current = cameraKey;

    if (mapMode === "route" && routeCoordinates.length >= 2) {
      const bounds = routeCoordinates.reduce(
        (nextBounds, coordinate) => nextBounds.extend(coordinate),
        new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0])
      );
      map.fitBounds(bounds, {
        duration: 620,
        maxZoom: usesPublicFallbackStyle ? PUBLIC_FALLBACK_DESTINATION_ZOOM : 17,
        padding
      });
      return;
    }

    if ((mapMode === "destination" || hasDestinationCoordinates) && hasDestinationCoordinates) {
      map.easeTo({
        center: toLngLat(destination),
        duration: 520,
        padding,
        zoom: usesPublicFallbackStyle ? PUBLIC_FALLBACK_DESTINATION_ZOOM : DESTINATION_ZOOM
      });
      return;
    }

    if (mapMode === "current-location" && hasValidMapPoint(markerOrigin)) {
      map.easeTo({
        center: toLngLat(markerOrigin),
        duration: 520,
        padding,
        zoom: usesPublicFallbackStyle ? PUBLIC_FALLBACK_DESTINATION_ZOOM : 16.1
      });
      return;
    }

    map.easeTo({
      center: toLngLat(DEFAULT_CAMPUS_CENTER),
      duration: 520,
      padding,
      zoom: usesPublicFallbackStyle ? PUBLIC_FALLBACK_CAMPUS_ZOOM : CAMPUS_ZOOM
    });
  }, [
    bottomSheetState,
    destination,
    hasDestinationCoordinates,
    localStatus,
    mapMode,
    mapRouteGeometry,
    markerOrigin,
    usesPublicFallbackStyle,
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
      {usesPublicFallbackStyle || usesMapLibreDemoStyle ? (
        <div className="maplibre-style-note">
          {usesMapLibreDemoStyle ? "MapLibre demo style" : "Public preview style"}
        </div>
      ) : null}
      {mapMode === "route" && mapRouteGeometry ? (
        <div className="maplibre-route-note">Temporary route preview</div>
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
