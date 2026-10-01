export const ORIGIN_MODES = Object.freeze({
  CURRENT: "current",
  SELECTED: "selected"
});

export function hasRouteCoordinate(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng);
}

export function resolveActiveRouteOrigin({
  mode,
  selectedOrigin,
  deviceLocation,
  deviceIsInsideCoverage
}) {
  if (mode === ORIGIN_MODES.SELECTED && hasRouteCoordinate(selectedOrigin?.coordinate)) {
    return selectedOrigin.coordinate;
  }

  if (
    mode === ORIGIN_MODES.CURRENT &&
    deviceIsInsideCoverage &&
    hasRouteCoordinate(deviceLocation)
  ) {
    return deviceLocation;
  }

  return null;
}

export function areRouteEndpointsEquivalent(origin, destination, tolerance = 0.000001) {
  if (!hasRouteCoordinate(origin) || !hasRouteCoordinate(destination)) return false;

  return (
    Math.abs(origin.lat - destination.lat) <= tolerance &&
    Math.abs(origin.lng - destination.lng) <= tolerance
  );
}
