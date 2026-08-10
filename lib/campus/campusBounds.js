const UCSD_ROUTING_BOUNDS = {
  minLat: 32.858,
  maxLat: 32.8955,
  minLng: -117.255,
  maxLng: -117.215
};

function hasValidCampusPoint(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng);
}

function isWithinUcsdRoutingBounds(point, bounds = UCSD_ROUTING_BOUNDS) {
  if (!hasValidCampusPoint(point)) return false;

  return (
    point.lat >= bounds.minLat &&
    point.lat <= bounds.maxLat &&
    point.lng >= bounds.minLng &&
    point.lng <= bounds.maxLng
  );
}

function getUcsdRoutingCoverage(point) {
  if (!hasValidCampusPoint(point)) {
    return {
      status: "unknown",
      isInside: false
    };
  }

  const isInside = isWithinUcsdRoutingBounds(point);

  return {
    status: isInside ? "inside" : "outside",
    isInside
  };
}

module.exports = {
  UCSD_ROUTING_BOUNDS,
  getUcsdRoutingCoverage,
  hasValidCampusPoint,
  isWithinUcsdRoutingBounds
};
