import {
  MAX_WALKING_ROUTE_BODY_BYTES,
  ROUTE_ERROR_CODES,
  RoutingError,
  createRouteErrorResponse,
  validateWalkingRouteRequest
} from "@/lib/routing/routeModel.mjs";
import { requestValhallaWalkingRoute } from "@/services/routing/valhallaProvider.mjs";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json"
};

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: RESPONSE_HEADERS
  });
}

function methodNotAllowedResponse() {
  const response = createRouteErrorResponse(
    new RoutingError(ROUTE_ERROR_CODES.METHOD_NOT_ALLOWED, "Method not allowed.")
  );
  return jsonResponse(response.body, response.status);
}

export function GET() {
  return methodNotAllowedResponse();
}

export function PUT() {
  return methodNotAllowedResponse();
}

export function PATCH() {
  return methodNotAllowedResponse();
}

export function DELETE() {
  return methodNotAllowedResponse();
}

export async function POST(request) {
  try {
    const rawBody = await request.text();

    if (rawBody.length > MAX_WALKING_ROUTE_BODY_BYTES) {
      throw new RoutingError(ROUTE_ERROR_CODES.INVALID_REQUEST, "Request body is too large.");
    }

    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      throw new RoutingError(ROUTE_ERROR_CODES.INVALID_REQUEST, "Request body must be valid JSON.");
    }

    const routeRequest = validateWalkingRouteRequest(body);
    const route = await requestValhallaWalkingRoute(routeRequest);
    return jsonResponse(route);
  } catch (error) {
    if (error instanceof RoutingError) {
      console.warn("[walking-route]", error.code, error.message);
    } else {
      console.error("[walking-route]", "INTERNAL_ERROR");
    }

    const response = createRouteErrorResponse(error);
    return jsonResponse(response.body, response.status);
  }
}
