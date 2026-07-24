import {
  calculateDistanceMeters,
  estimateWalkingMinutes,
  formatDistanceFeet,
  metersToFeet
} from "@/lib/distance";
import { reverseGeocodeCampusLocation } from "@/lib/reverseGeocode";
import { formatDurationMinutes } from "@/lib/utils";

export function buildRouteDetails({ destinationMeta, room, destination, googleMapsUrl }, origin) {
  const distanceMeters = calculateDistanceMeters(origin, destination);
  const estimatedWalkMinutes = estimateWalkingMinutes(distanceMeters);
  const originPlace = reverseGeocodeCampusLocation(origin);

  return {
    buildingName: destinationMeta.name,
    buildingShortName:
      destinationMeta.shortName || destinationMeta.buildingCode || destinationMeta.name,
    room: room || "",
    destinationLabel: room
      ? `${destinationMeta.shortName || destinationMeta.name} ${room}`
      : destinationMeta.name,
    destinationType: destinationMeta.type || "location",
    destinationAddress: destinationMeta.address || "UC San Diego, La Jolla, CA 92093",
    destinationNearbyLandmarks: destinationMeta.nearbyLandmarks || [],
    distanceMeters,
    distanceFeet: metersToFeet(distanceMeters),
    formattedDistanceFeet: formatDistanceFeet(distanceMeters),
    estimatedWalkMinutes,
    formattedWalkTime: estimatedWalkMinutes
      ? formatDurationMinutes(estimatedWalkMinutes)
      : "",
    googleMapsUrl,
    originPlaceName: originPlace.name,
    originPlaceAddress: originPlace.address || "",
    originPlaceSource: originPlace.source
  };
}
