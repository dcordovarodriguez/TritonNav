const {
  CAMPUS_BUILDINGS,
  CAMPUS_COLLEGES,
  CAMPUS_DISTRICTS,
  CAMPUS_ENTRANCES,
  CAMPUS_PLACES,
  CAMPUS_ROOMS,
  UNDERGRADUATE_COLLEGE_HOUSING,
  UPPER_DIVISION_HOUSING
} = require("../../data/campus/index.js");
const { compactCampusValue, hasValidCampusCoordinate, normalizeCampusValue } = require("./normalize.js");

function matchesAny(value, candidates = []) {
  const normalizedValue = compactCampusValue(value);
  return candidates.some((candidate) => compactCampusValue(candidate) === normalizedValue);
}

function resolveBuildingById(id) {
  if (!id) return null;
  const normalizedId = String(id).toLowerCase();
  return CAMPUS_BUILDINGS.find((building) => building.id === normalizedId) ?? null;
}

function resolveBuildingByName(name) {
  if (!name) return null;
  const normalizedName = normalizeCampusValue(name);
  return (
    CAMPUS_BUILDINGS.find((building) => normalizeCampusValue(building.name) === normalizedName) ??
    null
  );
}

function resolveBuildingByAlias(alias) {
  if (!alias) return null;
  return CAMPUS_BUILDINGS.find((building) => matchesAny(alias, building.aliases)) ?? null;
}

function resolveBuildingByCode(code) {
  if (!code) return null;
  const normalizedCode = compactCampusValue(code);
  return (
    CAMPUS_BUILDINGS.find(
      (building) =>
        compactCampusValue(building.code) === normalizedCode ||
        compactCampusValue(building.name) === normalizedCode ||
        matchesAny(code, building.aliases)
    ) ?? null
  );
}

function resolveBuilding(input) {
  if (!input) return null;
  return (
    resolveBuildingById(input) ??
    resolveBuildingByCode(input) ??
    resolveBuildingByName(input) ??
    resolveBuildingByAlias(input)
  );
}

function getBuildingEntrances(buildingId) {
  return CAMPUS_ENTRANCES.filter((entrance) => entrance.buildingId === buildingId);
}

function isEntranceUsableForBuilding(entrance, buildingId) {
  return (
    entrance?.buildingId === buildingId &&
    hasValidCampusCoordinate(entrance.coordinates)
  );
}

function getEntranceRoutingCoordinate(entrance) {
  if (hasValidCampusCoordinate(entrance?.routingAnchor)) {
    return {
      coordinates: entrance.routingAnchor,
      source: "entrance-routing-anchor"
    };
  }

  if (hasValidCampusCoordinate(entrance?.coordinates)) {
    return {
      coordinates: entrance.coordinates,
      source: "entrance-coordinate"
    };
  }

  return null;
}

function selectDefaultEntrance(buildingId, entrances = getBuildingEntrances(buildingId)) {
  const validEntrances = entrances.filter((entrance) =>
    isEntranceUsableForBuilding(entrance, buildingId)
  );

  return (
    validEntrances.find((entrance) => entrance.type === "main") ??
    validEntrances.find((entrance) => entrance.accessible) ??
    validEntrances[0] ??
    null
  );
}

function selectEntranceForRoom(room, entrances = getBuildingEntrances(room?.buildingId)) {
  if (!room?.buildingId) return null;
  const preferredEntrance = entrances.find((entrance) => entrance.id === room.preferredEntranceId);

  return isEntranceUsableForBuilding(preferredEntrance, room.buildingId)
    ? preferredEntrance
    : selectDefaultEntrance(room.buildingId, entrances);
}

function getPrimaryEntrance(buildingId) {
  return selectDefaultEntrance(buildingId);
}

function resolveEntranceById(id) {
  if (!id) return null;
  return CAMPUS_ENTRANCES.find((entrance) => entrance.id === String(id)) ?? null;
}

function normalizeRoomNumber(value) {
  return compactCampusValue(value).toUpperCase();
}

function resolveRoom(buildingInput, roomInput) {
  const building = resolveBuilding(buildingInput);
  if (!building || !roomInput) return null;
  const normalizedRoom = normalizeRoomNumber(roomInput);
  return (
    CAMPUS_ROOMS.find(
      (room) =>
        room.buildingId === building.id &&
        normalizeRoomNumber(room.number) === normalizedRoom
    ) ?? null
  );
}

function resolveRoomToBuilding(roomOrQuery, roomInput = "") {
  if (roomInput) {
    const room = resolveRoom(roomOrQuery, roomInput);
    return room ? resolveBuildingById(room.buildingId) : null;
  }

  const parsed = parseCampusDestinationQuery(roomOrQuery);
  if (!parsed.room) return null;
  const room = resolveRoom(parsed.buildingInput, parsed.room);
  return room ? resolveBuildingById(room.buildingId) : null;
}

function resolveRoomToPreferredEntrance(roomOrQuery, roomInput = "") {
  const room = roomInput
    ? resolveRoom(roomOrQuery, roomInput)
    : resolveParsedRoom(roomOrQuery);
  if (!room) return null;
  return selectEntranceForRoom(room);
}

function resolveParsedRoom(query) {
  const parsed = parseCampusDestinationQuery(query);
  if (!parsed.room) return null;
  return resolveRoom(parsed.buildingInput, parsed.room);
}

function parseCampusDestinationQuery(query) {
  const normalizedQuery = String(query || "").trim();
  const match = normalizedQuery.match(/^(.+?)\s+([a-zA-Z]?\d+[a-zA-Z]?|[a-zA-Z]\d{3}|East Ballroom|West Ballroom|Theatre|Food Court)$/i);

  if (!match) {
    return {
      buildingInput: normalizedQuery,
      room: ""
    };
  }

  return {
    buildingInput: match[1].trim(),
    room: match[2].trim()
  };
}

function getFloorLabel(floor) {
  if (floor === 0) return "basement level";
  if (floor === 1) return "ground floor";
  return `floor ${floor}`;
}

function createRoomDirections(buildingId, roomNumber) {
  const building = resolveBuildingById(buildingId);
  if (!building) return null;

  const room = resolveRoom(building.id, roomNumber);
  if (!room) {
    return `Enter ${building.name} and look for room ${roomNumber} on the directory near the entrance.`;
  }

  const entrance = resolveRoomToPreferredEntrance(building.id, room.number);
  const entranceHint = entrance
    ? `Enter via the ${entrance.name}.`
    : "Enter through the main entrance.";

  return `${entranceHint} Head to the ${getFloorLabel(room.floor)} and proceed to room ${room.number}.`;
}

function toLegacyBuilding(building) {
  if (!building) return null;
  const entrances = getBuildingEntrances(building.id);
  const rooms = CAMPUS_ROOMS.filter((room) => room.buildingId === building.id);

  return {
    id: building.id,
    name: building.name,
    shortName: building.code,
    code: building.code,
    coords: building.centroid,
    address: building.address,
    aliases: building.aliases,
    entrances: entrances.map((entrance) => ({
      id: entrance.id,
      label: entrance.name,
      name: entrance.name,
      type: entrance.type,
      coords: entrance.coordinates,
      coordinates: entrance.coordinates,
      routingAnchor: entrance.routingAnchor || null,
      accessible: entrance.accessible,
      notes: entrance.notes
    })),
    rooms: rooms.map((room) => {
      const entrance = resolveEntranceById(room.preferredEntranceId);
      return {
        id: room.id,
        number: room.number,
        name: room.name,
        floor: room.floor,
        nearestEntrance: entrance?.name || null,
        preferredEntranceId: room.preferredEntranceId,
        indoorDirections: room.indoorDirections || null
      };
    }),
    type: building.type,
    source: building.source
  };
}

function resolveCollege(input) {
  if (!input) return null;
  const normalizedInput = compactCampusValue(input);
  return (
    CAMPUS_COLLEGES.find(
      (college) =>
        college.id === String(input).toLowerCase() ||
        compactCampusValue(college.name) === normalizedInput ||
        matchesAny(input, college.aliases)
    ) ?? null
  );
}

function resolvePlace(input) {
  if (!input) return null;
  const normalizedInput = compactCampusValue(input);
  return (
    CAMPUS_PLACES.find(
      (place) =>
        place.id === String(input).toLowerCase() ||
        compactCampusValue(place.name) === normalizedInput ||
        matchesAny(input, place.aliases)
    ) ?? null
  );
}

function resolveCampusDestination(input, roomInput = "") {
  if (!input) return null;
  const parsed = roomInput
    ? { buildingInput: input, room: String(roomInput).trim() }
    : parseCampusDestinationQuery(input);
  const building = resolveBuilding(parsed.buildingInput);

  if (building) {
    const room = parsed.room ? resolveRoom(building.id, parsed.room) : null;
    const entrance = room
      ? resolveRoomToPreferredEntrance(building.id, room.number)
      : getPrimaryEntrance(building.id);
    const routableCoordinate = resolveRoutableCoordinateForBuilding(building, entrance);
    const displayCoordinate = entrance?.coordinates || building.centroid;

    return {
      kind: building.type === "college" ? "college" : "building",
      building,
      legacyBuilding: toLegacyBuilding(building),
      room,
      entrance,
      indoorDirections: room?.indoorDirections || null,
      locationMeta: createLocationMeta(building),
      destination: routableCoordinate?.coordinates ?? null,
      destinationSource: routableCoordinate?.source ?? null,
      displayCoordinate,
      routingCoordinate: routableCoordinate?.coordinates ?? null,
      routingCoordinateSource: routableCoordinate?.source ?? null,
      matchedBy: room ? "room" : "campus resolver"
    };
  }

  const college = resolveCollege(input);
  if (college) {
    const collegeBuilding = resolveBuildingById(college.id);
    return {
      kind: "college",
      building: collegeBuilding,
      legacyBuilding: toLegacyBuilding(collegeBuilding),
      college,
      locationMeta: {
        ...college,
        coordinates: college.centroid,
        shortName: college.name.replace(/\s+College$/i, ""),
        type: "college",
        landmarks: []
      },
      destination: college.centroid,
      displayCoordinate: college.centroid,
      routingCoordinate: college.centroid,
      routingCoordinateSource: "centroid-fallback",
      matchedBy: "college boundary"
    };
  }

  const place = resolvePlace(input);
  if (!place) return null;

  const relatedBuilding = resolveBuildingById(place.relatedBuildingId);
  return {
    kind: place.type === "recreation" ? "recreation" : "location",
    building: relatedBuilding,
    legacyBuilding: relatedBuilding ? toLegacyBuilding(relatedBuilding) : createPlaceShell(place),
    place,
    locationMeta: {
      ...place,
      coordinates: place.coordinates,
      shortName: relatedBuilding?.code || place.name,
      buildingCode: relatedBuilding?.code || "",
      nearbyLandmarks: place.amenities || [],
      amenities: place.amenities || [],
      ctas: place.ctas || [],
      sourceUrls: place.sourceUrls || {}
    },
    destination: place.coordinates,
    displayCoordinate: place.coordinates,
    routingCoordinate: place.routingAnchor || place.coordinates,
    routingCoordinateSource: place.routingAnchor ? "place-routing-anchor" : "place-coordinate",
    matchedBy: place.type === "recreation" ? "recreation facility" : "campus location"
  };
}

function createLocationMeta(building) {
  return {
    id: building.id,
    name: building.name,
    shortName: building.code,
    buildingCode: building.code,
    type: building.type,
    address: building.address,
    coordinates: building.centroid,
    nearbyLandmarks: []
  };
}

function createPlaceShell(place) {
  return {
    id: place.id,
    name: place.name,
    shortName: place.name,
    coords: place.coordinates,
    address: "UC San Diego, La Jolla, CA 92093",
    entrances: [
      {
        label: "Closest arrival point",
        coords: place.coordinates
      }
    ],
    rooms: [],
    type: place.type,
    amenities: place.amenities || [],
    ctas: place.ctas || [],
    sourceUrls: place.sourceUrls || {}
  };
}

function resolveDestinationToRoutableCoordinate(input, roomInput = "") {
  const destination = resolveCampusDestination(input, roomInput);
  if (!destination) return null;

  const coordinate = destination.destination;
  return hasValidCampusCoordinate(coordinate) ? coordinate : null;
}

function resolveDestinationToRoutableCoordinateDetails(input, roomInput = "") {
  const destination = resolveCampusDestination(input, roomInput);
  if (!destination || !hasValidCampusCoordinate(destination.destination)) return null;

  return {
    coordinate: destination.destination,
    source: destination.destinationSource || (destination.entrance ? "entrance" : "centroid"),
    displayCoordinate: destination.displayCoordinate || destination.destination,
    routingCoordinate: destination.routingCoordinate || destination.destination,
    routingCoordinateSource:
      destination.routingCoordinateSource ||
      destination.destinationSource ||
      (destination.entrance ? "entrance-coordinate" : "centroid-fallback"),
    entranceId: destination.entrance?.id || null,
    buildingId: destination.building?.id || destination.legacyBuilding?.id || null,
    roomId: destination.room?.id || null
  };
}

function resolveRoutableCoordinateForBuilding(building, entrance = null) {
  if (isEntranceUsableForBuilding(entrance, building?.id)) {
    const routeCoordinate = getEntranceRoutingCoordinate(entrance);
    if (routeCoordinate) return routeCoordinate;
  }

  if (hasValidCampusCoordinate(building?.centroid)) {
    return {
      coordinates: building.centroid,
      source: "centroid-fallback"
    };
  }

  return null;
}

function getAllCampusBuildings() {
  return CAMPUS_BUILDINGS;
}

function getAllCampusEntrances() {
  return CAMPUS_ENTRANCES;
}

function getAllCampusRooms() {
  return CAMPUS_ROOMS;
}

function getAllCampusPlaces() {
  return CAMPUS_PLACES;
}

function getAllCampusColleges() {
  return CAMPUS_COLLEGES;
}

function getAllCampusDistricts() {
  return CAMPUS_DISTRICTS;
}

function getAllCampusHousingCommunities() {
  return [...UNDERGRADUATE_COLLEGE_HOUSING, ...UPPER_DIVISION_HOUSING];
}

module.exports = {
  createRoomDirections,
  getAllCampusBuildings,
  getAllCampusColleges,
  getAllCampusDistricts,
  getAllCampusEntrances,
  getAllCampusHousingCommunities,
  getAllCampusPlaces,
  getAllCampusRooms,
  getBuildingEntrances,
  getPrimaryEntrance,
  parseCampusDestinationQuery,
  resolveBuilding,
  resolveBuildingByAlias,
  resolveBuildingByCode,
  resolveBuildingById,
  resolveBuildingByName,
  resolveCampusDestination,
  resolveCollege,
  resolveDestinationToRoutableCoordinate,
  resolveDestinationToRoutableCoordinateDetails,
  resolveEntranceById,
  resolvePlace,
  resolveRoutableCoordinateForBuilding,
  resolveRoom,
  resolveRoomToBuilding,
  resolveRoomToPreferredEntrance,
  selectDefaultEntrance,
  selectEntranceForRoom,
  toLegacyBuilding
};
