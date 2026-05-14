import { createGoogleMapsDirectionsUrl } from "@/services/mapsService";

export default function MapView({ navigationData, location }) {
  const { destination, building, room, googleMapsUrl } = navigationData;
  const mapsUrl =
    googleMapsUrl || createGoogleMapsDirectionsUrl({ destination, origin: location });

  return (
    <section className="map-card">
      <div className="map-card-header">
        <div>
          <p className="eyebrow">Map Destination</p>
          <h2>{building.name}</h2>
        </div>
        <a className="primary-link" href={mapsUrl} rel="noreferrer" target="_blank">
          Open in Google Maps
        </a>
      </div>

      <div className="map-placeholder">
        <div className="map-orb" />
        <div>
          <p className="map-label">Best arrival point</p>
          <h3>
            {destination.lat}, {destination.lng}
          </h3>
          <p>{room ? `Optimized for room ${room}` : "Optimized for the building entrance"}</p>
        </div>
      </div>

      <div className="map-details">
        <p>
          <strong>Address:</strong> {building.address}
        </p>
        <p>
          <strong>Matched by:</strong> {navigationData.matchedBy}
        </p>
      </div>
    </section>
  );
}
