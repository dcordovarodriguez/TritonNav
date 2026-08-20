const {
  INDOOR_BUILDINGS,
  INDOOR_EDGES,
  INDOOR_FLOORS,
  INDOOR_NODES,
  INDOOR_SPACES
} = require("../../../data/campus/indoor/index.js");
const { resolveCampusDestination } = require("../resolver.js");

function getIndoorBuilding(buildingId) {
  if (!buildingId) return null;
  return INDOOR_BUILDINGS.find((building) => building.buildingId === buildingId) || null;
}

function getIndoorFloorsForBuilding(buildingId) {
  return INDOOR_FLOORS.filter((floor) => floor.buildingId === buildingId);
}

function getIndoorSpacesForBuilding(buildingId) {
  return INDOOR_SPACES.filter((space) => space.buildingId === buildingId);
}

function getIndoorNodesForBuilding(buildingId) {
  return INDOOR_NODES.filter((node) => node.buildingId === buildingId);
}

function getIndoorEdgesForBuilding(buildingId) {
  return INDOOR_EDGES.filter((edge) => edge.buildingId === buildingId);
}

function getIndoorEntranceNodeForOutdoorEntrance(outdoorEntranceId) {
  if (!outdoorEntranceId) return null;
  return INDOOR_NODES.find((node) => node.outdoorEntranceId === outdoorEntranceId) || null;
}

function resolveIndoorDestination(input, roomInput = "") {
  const destination = resolveCampusDestination(input, roomInput);
  if (!destination?.building) return null;

  const indoorBuilding = getIndoorBuilding(destination.building.id);
  const entranceNode = getIndoorEntranceNodeForOutdoorEntrance(destination.entrance?.id);
  const indoorSpaces = getIndoorSpacesForBuilding(destination.building.id);
  const indoorSpace = destination.room
    ? indoorSpaces.find((space) => space.roomNumber === destination.room.number || space.roomId === destination.room.id) || null
    : null;

  return {
    outdoorDestination: destination,
    indoorBuilding,
    entranceNode,
    indoorSpace,
    indoorDataAvailable: Boolean(indoorBuilding?.indoorDataAvailable),
    indoorGraphAvailable: Boolean(indoorBuilding?.indoorGraphAvailable),
    fallback: !indoorBuilding?.indoorGraphAvailable
  };
}

module.exports = {
  getIndoorBuilding,
  getIndoorEdgesForBuilding,
  getIndoorEntranceNodeForOutdoorEntrance,
  getIndoorFloorsForBuilding,
  getIndoorNodesForBuilding,
  getIndoorSpacesForBuilding,
  resolveIndoorDestination
};
