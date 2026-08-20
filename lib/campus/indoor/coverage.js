const {
  INDOOR_BUILDINGS,
  INDOOR_EDGES,
  INDOOR_FLOORS,
  INDOOR_NODES,
  INDOOR_SPACES
} = require("../../../data/campus/indoor/index.js");

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function createIndoorCoverageReport() {
  const buildingsWithIndoorData = INDOOR_BUILDINGS.filter((building) => building.indoorDataAvailable);
  const buildingsWithIndoorGraph = INDOOR_BUILDINGS.filter((building) => building.indoorGraphAvailable);
  const entranceNodes = INDOOR_NODES.filter((node) => node.nodeType === "building entrance");

  return {
    proofOfConceptBuildingId: "geisel-library",
    buildingsWithIndoorMetadata: INDOOR_BUILDINGS.length,
    buildingsWithIndoorData: buildingsWithIndoorData.length,
    buildingsWithIndoorGraph: buildingsWithIndoorGraph.length,
    floorsRepresented: INDOOR_FLOORS.length,
    roomsRepresented: INDOOR_SPACES.length,
    roomsWithAuthoritativeGeometry: INDOOR_SPACES.filter((space) => space.centroid || space.geometryRef).length,
    roomsConnectedToIndoorGraph: INDOOR_SPACES.filter((space) => space.nearestIndoorNodeId).length,
    outdoorEntrancesConnectedToIndoorNodes: entranceNodes.filter((node) => node.outdoorEntranceId).length,
    hallwayNodes: INDOOR_NODES.filter((node) => ["hallway", "corridor intersection"].includes(node.nodeType)).length,
    stairs: INDOOR_NODES.filter((node) => node.nodeType === "stair").length,
    elevators: INDOOR_NODES.filter((node) => node.nodeType === "elevator").length,
    ramps: INDOOR_NODES.filter((node) => node.nodeType === "ramp").length,
    accessibleIndoorEdges: INDOOR_EDGES.filter((edge) => edge.accessibility?.wheelchairAccessible === true).length,
    nodeTypes: countBy(INDOOR_NODES, (node) => node.nodeType),
    edgeTypes: countBy(INDOOR_EDGES, (edge) => edge.traversalType),
    verificationStatus: {
      buildings: countBy(INDOOR_BUILDINGS, (building) => building.verificationStatus),
      floors: countBy(INDOOR_FLOORS, (floor) => floor.verificationStatus),
      spaces: countBy(INDOOR_SPACES, (space) => space.verificationStatus),
      nodes: countBy(INDOOR_NODES, (node) => node.verificationStatus),
      edges: countBy(INDOOR_EDGES, (edge) => edge.verificationStatus)
    },
    geisel: {
      buildingId: "geisel-library",
      metadataPresent: Boolean(INDOOR_BUILDINGS.find((building) => building.buildingId === "geisel-library")),
      outdoorEntranceTransferNode: Boolean(INDOOR_NODES.find((node) => node.outdoorEntranceId === "geisel-library-main")),
      authoritativeFloorsAvailable: false,
      authoritativeRoomsAvailable: false,
      authoritativeGraphAvailable: false
    }
  };
}

module.exports = {
  createIndoorCoverageReport
};
