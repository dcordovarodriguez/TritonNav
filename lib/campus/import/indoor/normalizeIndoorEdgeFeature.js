const { normalizeSource } = require("../../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../../normalize.js");
const { getFeatureProperties, pickProperty } = require("../geojson.js");
const { toBooleanOrNull } = require("../normalizeEntranceFeature.js");

function normalizeIndoorEdgeFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const buildingId = String(pickProperty(properties, ["buildingId", "building_id", "BLDG_ID"], options.buildingId || "")).trim();
  const startNodeId = String(pickProperty(properties, ["startNodeId", "start_node_id", "fromNode", "from_node"], "")).trim();
  const endNodeId = String(pickProperty(properties, ["endNodeId", "end_node_id", "toNode", "to_node"], "")).trim();

  if (!buildingId || !startNodeId || !endNodeId) return null;

  return {
    id: normalizeCampusValue(pickProperty(properties, ["id", "edgeId", "edge_id"], `${startNodeId}-${endNodeId}`)).replace(/\s+/g, "-"),
    buildingId,
    floorId: String(pickProperty(properties, ["floorId", "floor_id"], "")).trim() || null,
    startNodeId,
    endNodeId,
    distanceMeters: Number.isFinite(Number(properties.distanceMeters ?? properties.distance_meters))
      ? Number(properties.distanceMeters ?? properties.distance_meters)
      : null,
    traversalType: String(pickProperty(properties, ["traversalType", "traversal_type", "type"], "hallway/corridor")).trim().toLowerCase(),
    directionality: String(pickProperty(properties, ["directionality", "direction"], "bidirectional")).trim(),
    publicAccess: pickProperty(properties, ["publicAccess", "public_access"], "unknown"),
    accessibility: {
      status: properties.accessibilityStatus || properties.accessibility_status || "unknown",
      wheelchairAccessible: toBooleanOrNull(pickProperty(properties, ["wheelchairAccessible", "wheelchair_accessible"], null)),
      avoidForAccessibleRouting: toBooleanOrNull(pickProperty(properties, ["avoidForAccessibleRouting", "avoid_accessible"], null))
    },
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    verificationStatus: properties.verificationStatus || properties.status || "unknown"
  };
}

module.exports = {
  normalizeIndoorEdgeFeature
};
