const { normalizeFloorFeature } = require("./normalizeFloorFeature.js");
const { normalizeIndoorEdgeFeature } = require("./normalizeIndoorEdgeFeature.js");
const { normalizeIndoorNodeFeature } = require("./normalizeIndoorNodeFeature.js");
const { normalizeRoomFeature } = require("./normalizeRoomFeature.js");
const { normalizeVerticalConnection } = require("./normalizeVerticalConnection.js");
const { validateIndoorDataset } = require("../../indoor/validate.js");

function importIndoorBuilding({
  building,
  floors = [],
  rooms = [],
  nodes = [],
  edges = [],
  verticalConnections = [],
  source
} = {}) {
  const normalizedFloors = floors.map((feature) => normalizeFloorFeature(feature, { buildingId: building?.buildingId, source })).filter(Boolean);
  const normalizedRooms = rooms.map((feature) => normalizeRoomFeature(feature, { buildingId: building?.buildingId, source })).filter(Boolean);
  const normalizedNodes = nodes.map((feature) => normalizeIndoorNodeFeature(feature, { buildingId: building?.buildingId, source })).filter(Boolean);
  const normalizedEdges = [
    ...edges.map((feature) => normalizeIndoorEdgeFeature(feature, { buildingId: building?.buildingId, source })).filter(Boolean),
    ...verticalConnections.map((feature) => normalizeVerticalConnection(feature, { buildingId: building?.buildingId, source })).filter(Boolean)
  ];
  const dataset = {
    buildings: building ? [building] : [],
    floors: normalizedFloors,
    spaces: normalizedRooms,
    nodes: normalizedNodes,
    edges: normalizedEdges
  };

  return {
    ...dataset,
    validation: validateIndoorDataset(dataset),
    summary: {
      buildings: dataset.buildings.length,
      floors: dataset.floors.length,
      rooms: dataset.spaces.length,
      nodes: dataset.nodes.length,
      edges: dataset.edges.length
    }
  };
}

module.exports = {
  importIndoorBuilding
};
