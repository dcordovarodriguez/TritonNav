export const ROUTE_PROVIDERS = {
  VALHALLA: "valhalla"
};

export const ROUTE_ERROR_CODES = {
  INVALID_REQUEST: "INVALID_REQUEST",
  UNROUTABLE: "UNROUTABLE",
  PROVIDER_CONFIGURATION: "PROVIDER_CONFIGURATION",
  PROVIDER_FAILURE: "PROVIDER_FAILURE",
  PROVIDER_TIMEOUT: "PROVIDER_TIMEOUT",
  PROVIDER_RESPONSE: "PROVIDER_RESPONSE",
  INTERNAL_ERROR: "INTERNAL_ERROR"
};

export const ROUTE_ERROR_STATUS = {
  [ROUTE_ERROR_CODES.INVALID_REQUEST]: 400,
  [ROUTE_ERROR_CODES.UNROUTABLE]: 422,
  [ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION]: 502,
  [ROUTE_ERROR_CODES.PROVIDER_FAILURE]: 502,
  [ROUTE_ERROR_CODES.PROVIDER_RESPONSE]: 502,
  [ROUTE_ERROR_CODES.PROVIDER_TIMEOUT]: 504,
  [ROUTE_ERROR_CODES.INTERNAL_ERROR]: 500
};

export const MAX_WALKING_ROUTE_BODY_BYTES = 4096;
const ENDPOINT_DISTANCE_TOLERANCE_METERS = 500;

/**
 * @typedef {Object} NormalizedRouteStep
 * @property {string} instruction
 * @property {number|null} distanceMeters
 * @property {number|null} durationSeconds
 * @property {string|null} maneuverType
 * @property {string|null} streetName
 * @property {number|null} beginShapeIndex
 * @property {number|null} endShapeIndex
 */

/**
 * @typedef {Object} NormalizedWalkingRoute
 * @property {{type: "LineString", coordinates: number[][]}} geometry
 * @property {number} distanceMeters
 * @property {number} durationSeconds
 * @property {NormalizedRouteStep[]} steps
 * @property {"valhalla"} provider
 * @property {false} isEstimated
 * @property {string[]} warnings
 */

export class RoutingError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "RoutingError";
    this.code = code;
    this.status = ROUTE_ERROR_STATUS[code] || 500;
    this.details = details;
  }
}

export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function normalizeCoordinateInput(point) {
  if (!point || typeof point !== "object" || Array.isArray(point)) return null;

  const latitude = point.latitude ?? point.lat;
  const longitude = point.longitude ?? point.lng ?? point.lon;

  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) return null;

  return {
    latitude,
    longitude
  };
}

export function validateCoordinate(point, label) {
  const coordinate = normalizeCoordinateInput(point);
  if (!coordinate) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.INVALID_REQUEST,
      `${label} must include finite latitude and longitude numbers.`
    );
  }

  if (coordinate.latitude < -90 || coordinate.latitude > 90) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.INVALID_REQUEST,
      `${label} latitude must be between -90 and 90.`
    );
  }

  if (coordinate.longitude < -180 || coordinate.longitude > 180) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.INVALID_REQUEST,
      `${label} longitude must be between -180 and 180.`
    );
  }

  return coordinate;
}

export function validateWalkingRouteRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RoutingError(ROUTE_ERROR_CODES.INVALID_REQUEST, "Request body must be a JSON object.");
  }

  const origin = validateCoordinate(body.origin, "origin");
  const destination = validateCoordinate(body.destination, "destination");

  if (origin.latitude === destination.latitude && origin.longitude === destination.longitude) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.INVALID_REQUEST,
      "origin and destination must be different coordinates."
    );
  }

  return {
    origin,
    destination,
    options: body.options && typeof body.options === "object" ? body.options : {}
  };
}

export function validateLineStringGeometry(geometry) {
  if (!geometry || geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
      "Routing provider returned an invalid route geometry."
    );
  }

  if (geometry.coordinates.length < 2) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
      "Routing provider returned too few route coordinates."
    );
  }

  for (const coordinate of geometry.coordinates) {
    if (
      !Array.isArray(coordinate) ||
      coordinate.length !== 2 ||
      !isFiniteNumber(coordinate[0]) ||
      !isFiniteNumber(coordinate[1]) ||
      coordinate[0] < -180 ||
      coordinate[0] > 180 ||
      coordinate[1] < -90 ||
      coordinate[1] > 90
    ) {
      throw new RoutingError(
        ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
        "Routing provider returned malformed coordinates."
      );
    }
  }

  return geometry;
}

export function calculateCoordinateDistanceMeters(left, right) {
  if (!left || !right) return null;

  const leftLatitude = left.latitude ?? left.lat ?? left[1];
  const leftLongitude = left.longitude ?? left.lng ?? left.lon ?? left[0];
  const rightLatitude = right.latitude ?? right.lat ?? right[1];
  const rightLongitude = right.longitude ?? right.lng ?? right.lon ?? right[0];

  if (
    !isFiniteNumber(leftLatitude) ||
    !isFiniteNumber(leftLongitude) ||
    !isFiniteNumber(rightLatitude) ||
    !isFiniteNumber(rightLongitude)
  ) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(rightLatitude - leftLatitude);
  const longitudeDelta = toRadians(rightLongitude - leftLongitude);
  const originLatitude = toRadians(leftLatitude);
  const destinationLatitude = toRadians(rightLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(earthRadius * arc);
}

export function validateRouteEndpoints(geometry, origin, destination) {
  const coordinates = validateLineStringGeometry(geometry).coordinates;
  const firstDistance = calculateCoordinateDistanceMeters(coordinates[0], origin);
  const lastDistance = calculateCoordinateDistanceMeters(coordinates[coordinates.length - 1], destination);

  if (
    firstDistance === null ||
    lastDistance === null ||
    firstDistance > ENDPOINT_DISTANCE_TOLERANCE_METERS ||
    lastDistance > ENDPOINT_DISTANCE_TOLERANCE_METERS
  ) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
      "Routing provider returned a route that does not match the requested endpoints."
    );
  }
}

export function normalizeRouteStep(step = {}) {
  return {
    instruction: typeof step.instruction === "string" ? step.instruction : "",
    distanceMeters: isFiniteNumber(step.distanceMeters) ? step.distanceMeters : null,
    durationSeconds: isFiniteNumber(step.durationSeconds) ? step.durationSeconds : null,
    maneuverType:
      typeof step.maneuverType === "string" || typeof step.maneuverType === "number"
        ? String(step.maneuverType)
        : null,
    streetName: typeof step.streetName === "string" && step.streetName ? step.streetName : null,
    beginShapeIndex: Number.isInteger(step.beginShapeIndex) ? step.beginShapeIndex : null,
    endShapeIndex: Number.isInteger(step.endShapeIndex) ? step.endShapeIndex : null
  };
}

export function createNormalizedWalkingRoute({
  geometry,
  distanceMeters,
  durationSeconds,
  steps = [],
  provider = ROUTE_PROVIDERS.VALHALLA,
  warnings = []
}) {
  validateLineStringGeometry(geometry);

  if (!isFiniteNumber(distanceMeters) || distanceMeters <= 0) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
      "Routing provider returned an invalid route distance."
    );
  }

  if (!isFiniteNumber(durationSeconds) || durationSeconds <= 0) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
      "Routing provider returned an invalid route duration."
    );
  }

  return {
    geometry,
    distanceMeters,
    durationSeconds,
    steps: steps.map(normalizeRouteStep),
    provider,
    isEstimated: false,
    warnings: Array.isArray(warnings) ? warnings.filter((warning) => typeof warning === "string") : []
  };
}

export function createRouteErrorResponse(error) {
  const routingError =
    error instanceof RoutingError
      ? error
      : new RoutingError(ROUTE_ERROR_CODES.INTERNAL_ERROR, "Walking route could not be calculated.");

  return {
    status: routingError.status,
    body: {
      error: {
        code: routingError.code,
        message: routingError.message
      }
    }
  };
}
