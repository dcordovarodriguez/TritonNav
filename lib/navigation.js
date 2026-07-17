import {
  getBuildingById,
  getBuildingByName,
  getBuildingByShortName,
  getDestinationCoords,
  getRoomDirections
} from "@/lib/buildings";
import { getCollegeById, getCollegeByShortName } from "@/data/colleges";
import {
  getRecreationFacilityById,
  getRecreationFacilityByShortName
} from "@/data/recreationFacilities";
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

function createCollegeShell(college) {
  return {
    id: college.id,
    name: college.name,
    shortName: college.shortName,
    coords: college.coordinates,
    address: "UC San Diego, La Jolla, CA 92093",
    entrances: [
      {
        label: "College center",
        coords: college.coordinates
      }
    ],
    rooms: [],
    type: college.type
  };
}

function createRecreationFacilityShell(facility) {
  return {
    id: facility.id,
    name: facility.name,
    shortName: facility.shortName,
    coords: facility.coordinates,
    address: facility.address || "UC San Diego, La Jolla, CA 92093",
    entrances: [
      {
        label: "Facility entrance",
        coords: facility.coordinates
      }
    ],
    rooms: [],
    type: facility.type
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

  const college =
    getCollegeById(destinationInput) ??
    getCollegeByShortName(destinationInput) ??
    null;

  if (college) {
    return {
      kind: "college",
      building: createCollegeShell(college),
      locationMeta: college
    };
  }

  const recreationFacility =
    getRecreationFacilityById(destinationInput) ??
    getRecreationFacilityByShortName(destinationInput) ??
    null;

  if (recreationFacility) {
    return {
      kind: "recreation",
      building: createRecreationFacilityShell(recreationFacility),
      locationMeta: recreationFacility
    };
  }

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
  const isCollege = resolvedDestination.kind === "college";
  const isRecreationFacility = resolvedDestination.kind === "recreation";
  const destination = isStructuredBuilding
    ? getDestinationCoords(building.id, normalizedRoom)
    : locationMeta.coordinates;
  const instructions = isStructuredBuilding
    ? getRoomDirections(building.id, normalizedRoom) ??
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
        destination,
        googleMapsUrl
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
