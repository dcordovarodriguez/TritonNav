"use client";

import { useEffect } from "react";
import {
  createGoogleMapsDirectionsUrl,
  createGoogleMapsEmbedUrl
} from "@/services/mapsService";
import { navigationSelectors, useNavigationStore } from "@/store/useNavigationStore";

export default function MapView({ navigationData, location }) {
  const data = navigationData;
  const { destination, building, room, googleMapsUrl, routeDetails, destinationType } = data;
  const mapStatus = useNavigationStore(navigationSelectors.mapStatus);
  const mapError = useNavigationStore(navigationSelectors.mapError);
  const setMapLoading = useNavigationStore((state) => state.setMapLoading);
  const setMapReady = useNavigationStore((state) => state.setMapReady);
  const setMapFailed = useNavigationStore((state) => state.setMapFailed);
  const mapsUrl =
    googleMapsUrl || createGoogleMapsDirectionsUrl({ destination, origin: location });
  const embedUrl = createGoogleMapsEmbedUrl(data.destination);

  useEffect(() => {
    setMapLoading();
  }, [destination.lat, destination.lng, setMapLoading]);

  return (
    <section className="map-card">
      <div className="map-card-header">
        <div>
          <p className="eyebrow">Map Destination</p>
          <h2>{building.name}</h2>
          <p className="muted-copy">
            {destinationType}
            {room ? ` • room ${room}` : ""}
          </p>
        </div>
        <a className="primary-link" href={mapsUrl} rel="noreferrer" target="_blank">
          Open in Google Maps
        </a>
      </div>

      <div className="map-status-row">
        <span className={`status-chip status-chip-${mapStatus}`}>
          {mapStatus === "ready"
            ? "Map preview ready"
            : mapStatus === "error"
              ? "Map preview issue"
              : "Loading map preview"}
        </span>
        <span className={`status-chip ${location ? "status-chip-ready" : "status-chip-warning"}`}>
          {location ? "Using live origin" : "Using fallback origin"}
        </span>
        <span className="status-chip status-chip-ready">
          {routeDetails.estimatedWalkMinutes
            ? `${routeDetails.estimatedWalkMinutes} min walk`
            : "Waiting for distance estimate"}
        </span>
      </div>

      <div className="map-embed-shell">
        {mapStatus !== "ready" ? (
          <div className="map-overlay">
            {mapStatus === "error" ? mapError : "Loading Google Maps preview..."}
          </div>
        ) : null}
        <iframe
          title={`Google Maps route preview for ${building.name}`}
          width="100%"
          height="300"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={embedUrl}
          onLoad={() => setMapReady()}
          onError={() => setMapFailed("Google Maps preview could not be loaded.")}
        />
      </div>

      <div className="map-details">
        <p>
          <strong>You are here:</strong> {routeDetails.originPlaceName}
        </p>
        {routeDetails.originPlaceAddress ? (
          <p>
            <strong>Origin context:</strong> {routeDetails.originPlaceAddress}
          </p>
        ) : null}
        <p>
          <strong>Destination:</strong> {building.name}
        </p>
        <p>
          <strong>Destination type:</strong> {routeDetails.destinationType}
        </p>
        <p>
          <strong>Distance:</strong> {routeDetails.formattedDistanceFeet}
        </p>
        <p>
          <strong>Address:</strong> {routeDetails.destinationAddress}
        </p>
        <p>
          <strong>Matched by:</strong> {data.matchedBy}
        </p>
        <p>
          <strong>Coordinates:</strong> {destination.lat}, {destination.lng}
        </p>
        <p>{room ? `Optimized for room ${room}` : "Optimized for the building entrance"}</p>
      </div>
    </section>
  );
}
