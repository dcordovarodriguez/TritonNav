const { normalizeSource } = require("../../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../../normalize.js");
const { coordinateFromGeometry, getFeatureProperties, getGeometry, pickProperty } = require("../geojson.js");
const { toBooleanOrNull } = require("../normalizeEntranceFeature.js");

function normalizeIndoorNodeFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const buildingId = String(pickProperty(properties, ["buildingId", "building_id", "BLDG_ID"], options.buildingId || "")).trim();
  const nodeType = String(pickProperty(properties, ["nodeType", "node_type", "type"], "")).trim().toLowerCase();
  const id = String(pickProperty(properties, ["id", "nodeId", "node_id"], "")).trim();

  if (!buildingId || !nodeType || !id) return null;

  return {
    id: normalizeCampusValue(id).replace(/\s+/g, "-"),
    buildingId,
    floorId: String(pickProperty(properties, ["floorId", "floor_id"], "")).trim() || null,
    outdoorEntranceId: String(pickProperty(properties, ["outdoorEntranceId", "outdoor_entrance_id"], "")).trim() || null,
    nodeType,
    coordinates: coordinateFromGeometry(getGeometry(feature)),
    geometryRef: pickProperty(properties, ["geometryRef", "geometry_ref"], null),
    accessibility: {
      status: properties.accessibilityStatus || properties.accessibility_status || "unknown",
      wheelchairAccessible: toBooleanOrNull(pickProperty(properties, ["wheelchairAccessible", "wheelchair_accessible"], null)),
      notes: String(pickProperty(properties, ["accessibilityNotes", "accessibility_notes"], "")).trim()
    },
    publicAccess: pickProperty(properties, ["publicAccess", "public_access"], "unknown"),
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    verificationStatus: properties.verificationStatus || properties.status || "unknown"
  };
}

module.exports = {
  normalizeIndoorNodeFeature
};
