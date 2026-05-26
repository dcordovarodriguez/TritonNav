import {
  getBuildingById,
  getBuildingByName,
  getBuildingByShortName,
  getDestinationCoords,
  getRoomDirections
} from "@/lib/buildings";
import { getLocationById, getLocationByShortName } from "@/data/locations";
import { createGoogleMapsDirectionsUrl } from "@/services/mapsService";
import { buildRouteDetails } from "@/services/navigationService";
import { searchCampusIndex } from "@/lib/searchIndex";

function createLocationShell(location) {
  return {
    id: location.id,
    name: location.name,
    shortName: location.shortName || location.buildingCode || location.name,
    coords: location.coordinates,
    address: location.address || "UC San Diego, La Jolla, CA 92093",
    entrances: [
      {
        label: "Closest arrival point",
        coords: location.coordinates
      }
    ],
    rooms: [],
    type: location.type
  };
}

export function resolveBuilding(buildingInput) {
  if (!buildingInput) return null;
  return (
    getBuildingById(buildingInput) ??
    getBuildingByShortName(buildingInput) ??
    getBuildingByName(buildingInput)
  );
}

export function resolveCampusDestination(destinationInput) {
  if (!destinationInput) return null;

  const building =
    getBuildingById(destinationInput) ??
    getBuildingByShortName(destinationInput) ??
    getBuildingByName(destinationInput);

  if (building) {
    const locationMeta =
      getLocationById(building.id) ??
      getLocationByShortName(building.shortName) ??
      null;

    return {
      kind: "building",
      building,
      locationMeta
    };
  }

  const location =
    getLocationById(destinationInput) ??
    getLocationByShortName(destinationInput) ??
    null;

  if (!location) return null;

  return {
    kind: "location",
    building: createLocationShell(location),
    locationMeta: location
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

export function getNavigationData(buildingInput, roomNumber, origin = null) {
  const resolvedDestination = resolveCampusDestination(buildingInput);
  if (!resolvedDestination) return null;

  const normalizedRoom = roomNumber ? decodeURIComponent(String(roomNumber)).trim() : "";
  const { building, locationMeta } = resolvedDestination;
  const isStructuredBuilding = resolvedDestination.kind === "building";
  const destination = isStructuredBuilding
    ? getDestinationCoords(building.id, normalizedRoom)
    : locationMeta.coordinates;
  const instructions = isStructuredBuilding
    ? getRoomDirections(building.id, normalizedRoom) ??
      `Arrive at ${building.name} and use the main entrance.`
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
    buildingCode: locationMeta?.buildingCode || building.shortName || "",
    address: locationMeta?.address || building.address,
    type: locationMeta?.type || "building",
    nearbyLandmarks: locationMeta?.nearbyLandmarks || []
  };
  const googleMapsUrl = createGoogleMapsDirectionsUrl({ destination, origin });

  return {
    building,
    room: normalizedRoom,
    destination,
    instructions,
    destinationType: destinationMeta.type,
    matchedBy: isStructuredBuilding
      ? building.id === buildingInput
        ? "building id"
        : "building code"
      : "campus location",
    googleMapsUrl,
    routeDetails: buildRouteDetails(
      {
        destinationMeta,
        room: normalizedRoom,
        destination,
        googleMapsUrl
      },
      origin
    ),
    steps: [
      `Walk or ride to ${building.name}.`,
      `Use Google Maps to reach the ${entranceLabel}.`,
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
          : `${result.typeLabel} • ${result.address}`
  }));
}
