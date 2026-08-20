const {
  INDOOR_BUILDINGS,
  INDOOR_NODES
} = require("../../../data/campus/indoor/index.js");

function getIndoorAvailabilityForBuilding(buildingId, outdoorEntranceId = "") {
  const indoorBuilding = INDOOR_BUILDINGS.find((building) => building.buildingId === buildingId) || null;
  const entranceNode = outdoorEntranceId
    ? INDOOR_NODES.find((node) => node.outdoorEntranceId === outdoorEntranceId) || null
    : null;

  return {
    buildingId,
    indoorBuilding,
    entranceNode,
    available: Boolean(indoorBuilding?.indoorGraphAvailable),
    dataAvailable: Boolean(indoorBuilding?.indoorDataAvailable),
    transferNodeId: entranceNode?.id || null,
    message: indoorBuilding?.indoorGraphAvailable
      ? "Indoor navigation data available"
      : "Indoor navigation data unavailable"
  };
}

module.exports = {
  getIndoorAvailabilityForBuilding
};
