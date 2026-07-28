export const DEFAULT_CAMPUS_CENTER = {
  lat: 32.88006,
  lng: -117.23401
};

export function hasValidMapPoint(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng);
}

export function toLngLat(point) {
  if (!hasValidMapPoint(point)) return null;
  return [point.lng, point.lat];
}

export function createRouteLineString(points = []) {
  const coordinates = points.map(toLngLat).filter(Boolean);

  if (coordinates.length < 2) return null;

  return {
    type: "Feature",
    properties: {
      geometryType: "temporary-preview"
    },
    geometry: {
      type: "LineString",
      coordinates
    }
  };
}

export function createRouteLineStringFromEndpoints(origin, destination) {
  return createRouteLineString([origin, destination]);
}
