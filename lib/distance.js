/**
 * Console verification examples:
 * - metersToFeet(120) -> 394
 * - formatDistanceFeet(120) -> "394 ft"
 */

export function calculateDistanceMeters(origin, destination) {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(destination.lat - origin.lat);
  const longitudeDelta = toRadians(destination.lng - origin.lng);
  const originLatitude = toRadians(origin.lat);
  const destinationLatitude = toRadians(destination.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(earthRadius * arc);
}

export function metersToFeet(meters) {
  if (!meters) return null;
  return Math.round(meters * 3.28084);
}

export function formatDistanceFeet(meters) {
  const feet = metersToFeet(meters);
  if (!feet) return "Distance unavailable";
  return `${feet.toLocaleString()} ft`;
}

export function estimateWalkingMinutes(distanceMeters, speedMetersPerMinute = 80) {
  if (!distanceMeters) return null;
  return Math.max(1, Math.round(distanceMeters / speedMetersPerMinute));
}
