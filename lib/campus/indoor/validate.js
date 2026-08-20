const { hasValidCampusCoordinate } = require("../normalize.js");
const {
  INDOOR_ACCESSIBILITY_STATUS,
  INDOOR_EDGE_TYPES,
  INDOOR_NODE_TYPES
} = require("./schema.js");

function isKnownAccessibilityStatus(status) {
  return Object.values(INDOOR_ACCESSIBILITY_STATUS).includes(status);
}

function validateIndoorBuilding(building) {
  const errors = [];
  if (!building?.buildingId) errors.push("buildingId is required");
  if (!building?.canonicalName) errors.push("canonicalName is required");
  if (!Array.isArray(building?.floorIds)) errors.push("floorIds must be an array");
  if (!Array.isArray(building?.outdoorEntranceIds)) errors.push("outdoorEntranceIds must be an array");
  if (typeof building?.indoorDataAvailable !== "boolean") errors.push("indoorDataAvailable must be boolean");
  return errors;
}

function validateIndoorFloor(floor) {
  const errors = [];
  if (!floor?.floorId) errors.push("floorId is required");
  if (!floor?.buildingId) errors.push("buildingId is required");
  if (!Number.isFinite(floor?.floorOrder)) errors.push("floorOrder must be numeric");
  if (floor?.floorNumber === undefined || floor?.floorNumber === null) errors.push("floorNumber is required");
  if (!floor?.displayName) errors.push("displayName is required");
  return errors;
}

function validateIndoorSpace(space) {
  const errors = [];
  if (!space?.roomId) errors.push("roomId is required");
  if (!space?.buildingId) errors.push("buildingId is required");
  if (!space?.floorId) errors.push("floorId is required");
  if (!space?.searchableLabel) errors.push("searchableLabel is required");
  if (space?.centroid && !hasValidCampusCoordinate(space.centroid)) errors.push("centroid is invalid");
  return errors;
}

function validateIndoorNode(node) {
  const errors = [];
  if (!node?.id) errors.push("id is required");
  if (!node?.buildingId) errors.push("buildingId is required");
  if (!Object.values(INDOOR_NODE_TYPES).includes(node?.nodeType)) errors.push("nodeType is unsupported");
  if (node?.coordinates && !hasValidCampusCoordinate(node.coordinates)) errors.push("coordinates are invalid");
  const accessibilityStatus = node?.accessibility?.status || INDOOR_ACCESSIBILITY_STATUS.UNKNOWN;
  if (!isKnownAccessibilityStatus(accessibilityStatus)) errors.push("accessibility.status is unsupported");
  return errors;
}

function validateIndoorEdge(edge, nodes = []) {
  const errors = [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (!edge?.id) errors.push("id is required");
  if (!edge?.buildingId) errors.push("buildingId is required");
  if (!edge?.startNodeId) errors.push("startNodeId is required");
  if (!edge?.endNodeId) errors.push("endNodeId is required");
  if (edge?.startNodeId && !nodeIds.has(edge.startNodeId)) errors.push("startNodeId does not resolve");
  if (edge?.endNodeId && !nodeIds.has(edge.endNodeId)) errors.push("endNodeId does not resolve");
  if (!Object.values(INDOOR_EDGE_TYPES).includes(edge?.traversalType)) errors.push("traversalType is unsupported");
  if (edge?.distanceMeters !== null && edge?.distanceMeters !== undefined && !Number.isFinite(edge.distanceMeters)) {
    errors.push("distanceMeters must be numeric when supplied");
  }
  const accessibilityStatus = edge?.accessibility?.status || INDOOR_ACCESSIBILITY_STATUS.UNKNOWN;
  if (!isKnownAccessibilityStatus(accessibilityStatus)) errors.push("accessibility.status is unsupported");
  return errors;
}

function validateIndoorDataset({ buildings = [], floors = [], spaces = [], nodes = [], edges = [] } = {}) {
  const errors = [];
  const buildingIds = new Set(buildings.map((building) => building.buildingId));
  const floorIds = new Set(floors.map((floor) => floor.floorId));

  buildings.forEach((building) => {
    validateIndoorBuilding(building).forEach((error) => errors.push(`building ${building?.buildingId || "unknown"}: ${error}`));
  });

  floors.forEach((floor) => {
    validateIndoorFloor(floor).forEach((error) => errors.push(`floor ${floor?.floorId || "unknown"}: ${error}`));
    if (floor.buildingId && !buildingIds.has(floor.buildingId)) errors.push(`floor ${floor.floorId}: buildingId does not resolve`);
  });

  spaces.forEach((space) => {
    validateIndoorSpace(space).forEach((error) => errors.push(`space ${space?.roomId || "unknown"}: ${error}`));
    if (space.buildingId && !buildingIds.has(space.buildingId)) errors.push(`space ${space.roomId}: buildingId does not resolve`);
    if (space.floorId && !floorIds.has(space.floorId)) errors.push(`space ${space.roomId}: floorId does not resolve`);
  });

  nodes.forEach((node) => {
    validateIndoorNode(node).forEach((error) => errors.push(`node ${node?.id || "unknown"}: ${error}`));
    if (node.buildingId && !buildingIds.has(node.buildingId)) errors.push(`node ${node.id}: buildingId does not resolve`);
    if (node.floorId && !floorIds.has(node.floorId)) errors.push(`node ${node.id}: floorId does not resolve`);
  });

  edges.forEach((edge) => {
    validateIndoorEdge(edge, nodes).forEach((error) => errors.push(`edge ${edge?.id || "unknown"}: ${error}`));
    if (edge.buildingId && !buildingIds.has(edge.buildingId)) errors.push(`edge ${edge.id}: buildingId does not resolve`);
    if (edge.floorId && !floorIds.has(edge.floorId)) errors.push(`edge ${edge.id}: floorId does not resolve`);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateIndoorBuilding,
  validateIndoorDataset,
  validateIndoorEdge,
  validateIndoorFloor,
  validateIndoorNode,
  validateIndoorSpace
};
