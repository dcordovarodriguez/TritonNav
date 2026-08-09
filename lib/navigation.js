import campusResolver from "@/lib/campus/resolver";
import { createGoogleMapsDirectionsUrl } from "@/services/mapsService";
import { buildRouteDetails } from "@/services/navigationService";
import { searchCampusIndex } from "@/lib/searchIndex";

const {
  createRoomDirections,
  resolveBuilding: resolveCampusBuilding,
  resolveCampusDestination: resolveNormalizedCampusDestination,
  resolveDestinationToRoutableCoordinate,
  resolveDestinationToRoutableCoordinateDetails
} = campusResolver;

export function resolveBuilding(buildingInput) {
  return campusResolver.toLegacyBuilding(resolveCampusBuilding(buildingInput));
}

export function resolveCampusDestination(destinationInput) {
  if (!destinationInput) return null;
  const resolved = resolveNormalizedCampusDestination(destinationInput);
  if (!resolved) return null;

  return {
    ...resolved,
    building: resolved.legacyBuilding,
    normalizedBuilding: resolved.building
  };
}

export function buildNavigationHref(buildingInput, roomNumber = "") {
  const params = new URLSearchParams();
  params.set("building", String(buildingInput));

  if (roomNumber) {
    params.set("room", String(roomNumber));
  }

  return `/navigation?${params.toString()}`;
}

export function getCampusRoutingPoint(destinationInput, roomNumber = "") {
  const details = resolveDestinationToRoutableCoordinateDetails(destinationInput, roomNumber);
  if (!details?.routingCoordinate) return null;

  return {
    lat: details.routingCoordinate.lat,
    lng: details.routingCoordinate.lng,
    source: details.routingCoordinateSource || details.source || "",
    displayCoordinate: details.displayCoordinate || details.routingCoordinate
  };
}

export function getNavigationData(buildingInput, roomNumber, origin = null) {
  const resolvedDestination = resolveCampusDestination(buildingInput);
  if (!resolvedDestination) return null;

  const normalizedRoom = roomNumber ? decodeURIComponent(String(roomNumber)).trim() : "";
  const resolvedWithRoom = normalizedRoom
    ? resolveNormalizedCampusDestination(buildingInput, normalizedRoom)
    : resolvedDestination;
  const { building, locationMeta } = resolvedWithRoom
    ? {
        building: resolvedWithRoom.legacyBuilding,
        locationMeta: resolvedWithRoom.locationMeta
      }
    : resolvedDestination;
  const isStructuredBuilding = resolvedDestination.kind === "building";
  const isCollege = resolvedDestination.kind === "college";
  const isRecreationFacility = resolvedDestination.kind === "recreation";
  const selectedEntrance = resolvedWithRoom?.entrance || resolvedDestination.entrance || null;
  const destinationSource =
    resolvedWithRoom?.destinationSource || resolvedDestination.destinationSource || "";
  const routingDetails = isStructuredBuilding
    ? resolveDestinationToRoutableCoordinateDetails(building.id, normalizedRoom)
    : null;
  const routingDestination = isStructuredBuilding
    ? resolveDestinationToRoutableCoordinate(building.id, normalizedRoom)
    : locationMeta.coordinates;
  const displayDestination = isStructuredBuilding
    ? resolvedWithRoom?.displayCoordinate || selectedEntrance?.coordinates || routingDestination
    : locationMeta.coordinates;
  const destination = displayDestination;
  const indoorDirections = resolvedWithRoom?.indoorDirections || null;
  const instructions = isStructuredBuilding
    ? createRoomDirections(building.id, normalizedRoom) ??
      `Arrive at ${building.name} and use the main entrance.`
    : isCollege
      ? `Head toward the center of ${locationMeta.name}. Use the highlighted boundary as an approximate college area.`
      : isRecreationFacility
        ? `Head toward ${locationMeta.name}. Use the Rec links for live hours, bookings, and facility details.`
        : `Head toward ${locationMeta.name}. ${
            locationMeta.nearbyLandmarks?.length
              ? `Look for ${locationMeta.nearbyLandmarks[0]} nearby.`
              : "Use Google Maps for the final approach."
          }`;

  const roomMatch = isStructuredBuilding
    ? building.rooms.find((room) => room.number === normalizedRoom)
    : null;
  const entranceLabel = isStructuredBuilding
    ? roomMatch?.nearestEntrance ??
      building.entrances[0]?.label ??
      "main entrance"
    : building.entrances[0]?.label ?? "closest arrival point";
  const destinationMeta = {
    name: building.name,
    shortName: building.shortName,
    buildingCode: locationMeta?.buildingCode || locationMeta?.shortName || building.shortName || "",
    address: locationMeta?.address || building.address,
    type: locationMeta?.type || "building",
    nearbyLandmarks: locationMeta?.nearbyLandmarks || locationMeta?.landmarks || locationMeta?.amenities || []
  };
  const googleMapsUrl = createGoogleMapsDirectionsUrl({ destination, origin });

  return {
    building,
    college: isCollege ? locationMeta : null,
    recreationFacility: isRecreationFacility ? locationMeta : null,
    room: normalizedRoom,
    destination,
    displayDestination,
    routingDestination,
    routingCoordinateSource:
      routingDetails?.routingCoordinateSource || routingDetails?.source || destinationSource,
    displayCoordinate: displayDestination,
    routingCoordinate: routingDestination,
    selectedEntrance,
    destinationSource,
    indoorDirections,
    instructions,
    destinationType: destinationMeta.type,
    matchedBy: isStructuredBuilding
      ? building.id === buildingInput
        ? "building id"
        : "building code"
      : isCollege
        ? "college boundary"
        : isRecreationFacility
          ? "recreation facility"
          : "campus location",
    googleMapsUrl,
    routeDetails: buildRouteDetails(
      {
        destinationMeta,
        room: normalizedRoom,
        destination: routingDestination,
        googleMapsUrl,
        selectedEntrance,
        destinationSource,
        displayCoordinate: displayDestination,
        routingCoordinate: routingDestination,
        routingCoordinateSource:
          routingDetails?.routingCoordinateSource || routingDetails?.source || destinationSource,
        indoorDirections
      },
      origin
    ),
    steps: [
      isCollege || isRecreationFacility
        ? `Walk or ride to ${locationMeta.name}.`
        : `Walk or ride to ${building.name}.`,
      isCollege
        ? "Use the highlighted boundary as an approximate college area."
        : isRecreationFacility
          ? "Check UCSD Recreation for live hours, open rec, or bookings before you go."
          : `Use Google Maps to reach the ${entranceLabel}.`,
      instructions
    ]
  };
}

export function searchCampusLocations(query) {
  return searchCampusIndex(query, 12).map((result) => ({
    ...result,
    href: buildNavigationHref(result.destinationId, result.room),
    description:
      result.type === "classroom"
        ? `Classroom • ${result.address}`
        : result.type === "course"
          ? `Course route to ${result.shortName} ${result.room}`
          : result.type === "college"
            ? `College • ${(result.associatedBuildings || []).slice(0, 2).join(", ")}`
            : result.type === "recreation"
              ? `Recreation • ${(result.amenities || []).slice(0, 2).join(", ")}`
            : `${result.typeLabel} • ${result.address}`
  }));
}
