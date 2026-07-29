const activeRequests = new Map();

function normalizePointForRequest(point) {
  if (!point) return null;

  const latitude = point.latitude ?? point.lat;
  const longitude = point.longitude ?? point.lng ?? point.lon;

  return {
    latitude,
    longitude
  };
}

export function createWalkingRouteRequestKey({ origin, destination, options = {} }) {
  const normalizedOrigin = normalizePointForRequest(origin);
  const normalizedDestination = normalizePointForRequest(destination);

  return JSON.stringify({
    origin: normalizedOrigin,
    destination: normalizedDestination,
    options
  });
}

export async function requestWalkingRoute({ origin, destination, options = {}, signal }) {
  const requestBody = {
    origin: normalizePointForRequest(origin),
    destination: normalizePointForRequest(destination),
    options
  };
  const requestKey = createWalkingRouteRequestKey(requestBody);

  if (activeRequests.has(requestKey)) {
    return activeRequests.get(requestKey);
  }

  const requestPromise = fetch("/api/routes/walking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody),
    signal
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(
          payload?.error?.message || "Walking route could not be calculated."
        );
        error.code = payload?.error?.code || "ROUTE_REQUEST_FAILED";
        error.status = response.status;
        throw error;
      }

      return payload;
    })
    .finally(() => {
      activeRequests.delete(requestKey);
    });

  activeRequests.set(requestKey, requestPromise);
  return requestPromise;
}
