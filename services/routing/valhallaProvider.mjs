import {
  ROUTE_ERROR_CODES,
  ROUTE_PROVIDERS,
  RoutingError,
  createNormalizedWalkingRoute,
  isFiniteNumber,
  validateRouteEndpoints
} from "../../lib/routing/routeModel.mjs";

const DEFAULT_TIMEOUT_MS = 8000;
const VALHALLA_PRECISION = 6;
const ROUTE_PATH_PATTERN = /\/route\/?$/;
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

export function buildValhallaRouteUrl(baseUrl) {
  let url;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION,
      "Walking routing provider is not configured correctly."
    );
  }

  if (!ROUTE_PATH_PATTERN.test(url.pathname)) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/route`;
  } else {
    url.pathname = url.pathname.replace(/\/$/, "");
  }

  return url.toString();
}

function getValhallaConfiguration() {
  const baseUrl = process.env.VALHALLA_BASE_URL;

  if (!baseUrl) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION,
      "Walking routing provider is not configured."
    );
  }

  const apiKeyHeader = process.env.VALHALLA_API_KEY_HEADER || "";

  if (apiKeyHeader && !HEADER_NAME_PATTERN.test(apiKeyHeader)) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_CONFIGURATION,
      "Walking routing provider is not configured correctly."
    );
  }

  return {
    url: buildValhallaRouteUrl(baseUrl),
    apiKey: process.env.VALHALLA_API_KEY || "",
    apiKeyHeader
  };
}

export function decodeValhallaShape(shape, precision = VALHALLA_PRECISION) {
  if (typeof shape !== "string" || !shape.length) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
      "Routing provider response did not include a route shape."
    );
  }

  const factor = 10 ** precision;
  const coordinates = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < shape.length) {
    const latitudeResult = decodeNextPolylineValue(shape, index);
    index = latitudeResult.nextIndex;
    latitude += latitudeResult.delta;

    const longitudeResult = decodeNextPolylineValue(shape, index);
    index = longitudeResult.nextIndex;
    longitude += longitudeResult.delta;

    coordinates.push([longitude / factor, latitude / factor]);
  }

  return coordinates;
}

function decodeNextPolylineValue(shape, startIndex) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte = null;

  do {
    if (index >= shape.length) {
      throw new RoutingError(
        ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
        "Routing provider returned a malformed route shape."
      );
    }

    byte = shape.charCodeAt(index) - 63;
    if (byte < 0) {
      throw new RoutingError(
        ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
        "Routing provider returned a malformed route shape."
      );
    }

    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  const delta = result & 1 ? ~(result >> 1) : result >> 1;
  return {
    delta,
    nextIndex: index
  };
}

function metersFromKilometers(value) {
  return isFiniteNumber(value) ? Math.round(value * 1000) : null;
}

function secondsFromValue(value) {
  return isFiniteNumber(value) ? Math.round(value) : null;
}

function firstFiniteNumber(values) {
  return values.find((value) => isFiniteNumber(value)) ?? null;
}

export function normalizeValhallaRouteResponse(response, { origin, destination }) {
  const trip = response?.trip;
  const legs = Array.isArray(trip?.legs) ? trip.legs : [];

  if (!trip) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
      "Routing provider response did not include a trip."
    );
  }

  if (!legs.length) {
    throw new RoutingError(
      ROUTE_ERROR_CODES.UNROUTABLE,
      "Walking route could not be calculated for those coordinates."
    );
  }

  const coordinates = [];
  const steps = [];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;

  for (const leg of legs) {
    if (!leg?.shape) {
      throw new RoutingError(
        ROUTE_ERROR_CODES.PROVIDER_RESPONSE,
        "Routing provider response did not include a leg shape."
      );
    }

    const legCoordinates = decodeValhallaShape(leg.shape);
    coordinates.push(...(coordinates.length ? legCoordinates.slice(1) : legCoordinates));

    const summary = leg.summary || {};
    const legDistanceMeters = metersFromKilometers(firstFiniteNumber([summary.length]));
    const legDurationSeconds = secondsFromValue(firstFiniteNumber([summary.time, summary.elapsed_time]));

    if (legDistanceMeters) totalDistanceMeters += legDistanceMeters;
    if (legDurationSeconds) totalDurationSeconds += legDurationSeconds;

    if (Array.isArray(leg.maneuvers)) {
      steps.push(
        ...leg.maneuvers.map((maneuver) => ({
          instruction: maneuver.instruction || maneuver.verbal_post_transition_instruction || "",
          distanceMeters: metersFromKilometers(firstFiniteNumber([maneuver.length])),
          durationSeconds: secondsFromValue(firstFiniteNumber([maneuver.time, maneuver.travel_time])),
          maneuverType: maneuver.type ?? null,
          streetName: Array.isArray(maneuver.street_names)
            ? maneuver.street_names[0] || null
            : maneuver.street_name || null,
          beginShapeIndex: maneuver.begin_shape_index ?? null,
          endShapeIndex: maneuver.end_shape_index ?? null
        }))
      );
    }
  }

  const tripSummary = trip.summary || {};
  const summaryDistanceMeters = metersFromKilometers(firstFiniteNumber([tripSummary.length]));
  const summaryDurationSeconds = secondsFromValue(
    firstFiniteNumber([tripSummary.time, tripSummary.elapsed_time])
  );
  const geometry = {
    type: "LineString",
    coordinates
  };

  validateRouteEndpoints(geometry, origin, destination);

  return createNormalizedWalkingRoute({
    geometry,
    distanceMeters: summaryDistanceMeters || totalDistanceMeters,
    durationSeconds: summaryDurationSeconds || totalDurationSeconds,
    steps,
    provider: ROUTE_PROVIDERS.VALHALLA,
    warnings: []
  });
}

export async function requestValhallaWalkingRoute({ origin, destination, options = {} }) {
  const configuration = getValhallaConfiguration();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const headers = {
    "Content-Type": "application/json"
  };

  if (configuration.apiKey && configuration.apiKeyHeader) {
    headers[configuration.apiKeyHeader] = configuration.apiKey;
  }

  const body = {
    locations: [
      { lat: origin.latitude, lon: origin.longitude, type: "break" },
      { lat: destination.latitude, lon: destination.longitude, type: "break" }
    ],
    costing: "pedestrian",
    directions_options: {
      units: "kilometers"
    }
  };

  if (options.wheelchair || options.avoidStairs) {
    body.costing_options = {
      pedestrian: {}
    };
  }

  try {
    const response = await fetch(configuration.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const code = response.status === 400 || response.status === 404
        ? ROUTE_ERROR_CODES.UNROUTABLE
        : ROUTE_ERROR_CODES.PROVIDER_FAILURE;
      throw new RoutingError(code, "Walking routing provider could not calculate a route.");
    }

    const payload = await response.json();
    return normalizeValhallaRouteResponse(payload, { origin, destination });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new RoutingError(
        ROUTE_ERROR_CODES.PROVIDER_TIMEOUT,
        "Walking routing provider timed out."
      );
    }

    if (error instanceof RoutingError) throw error;

    throw new RoutingError(
      ROUTE_ERROR_CODES.PROVIDER_FAILURE,
      "Walking routing provider could not be reached."
    );
  } finally {
    clearTimeout(timeout);
  }
}
