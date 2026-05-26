import { getAllLocations } from "@/data/locations";
import { calculateDistanceMeters } from "@/lib/distance";

const DEFAULT_THRESHOLD_METERS = 180;

function formatCoordinateFallback(coords) {
  if (!coords?.lat || !coords?.lng) return "Coordinates unavailable";
  return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
}

/**
 * Console verification example:
 * - reverseGeocodeCampusLocation({ lat: 32.87943, lng: -117.24110 }) should match Mandeville Center
 */
export function reverseGeocodeCampusLocation(
  coordinates,
  { thresholdMeters = DEFAULT_THRESHOLD_METERS, fallbackAddress = "" } = {}
) {
  if (!coordinates?.lat || !coordinates?.lng) {
    return {
      name: "Location unavailable",
      address: "",
      type: "unknown",
      distanceMeters: null,
      source: "missing-coordinates"
    };
  }

  const closestLocation = getAllLocations()
    .map((location) => ({
      ...location,
      distanceMeters: calculateDistanceMeters(coordinates, location.coordinates)
    }))
    .filter((location) => location.distanceMeters !== null)
    .sort((left, right) => left.distanceMeters - right.distanceMeters)[0];

  if (closestLocation && closestLocation.distanceMeters <= thresholdMeters) {
    return {
      id: closestLocation.id,
      name: closestLocation.name,
      address: closestLocation.address || "",
      type: closestLocation.type,
      shortName: closestLocation.shortName || closestLocation.buildingCode || "",
      distanceMeters: closestLocation.distanceMeters,
      source: "ucsd-dataset"
    };
  }

  if (fallbackAddress) {
    return {
      name: fallbackAddress,
      address: fallbackAddress,
      type: "address",
      distanceMeters: closestLocation?.distanceMeters ?? null,
      source: "address-fallback"
    };
  }

  return {
    name: formatCoordinateFallback(coordinates),
    address: "",
    type: "coordinates",
    distanceMeters: closestLocation?.distanceMeters ?? null,
    source: "coordinate-fallback"
  };
}
