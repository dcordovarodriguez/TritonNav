const { normalizeSource } = require("../../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../../normalize.js");
const { getFeatureProperties, pickProperty } = require("../geojson.js");

function normalizeFloorFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const buildingId = String(pickProperty(properties, ["buildingId", "building_id", "BLDG_ID"], options.buildingId || "")).trim();
  const floorNumber = pickProperty(properties, ["floorNumber", "floor_number", "level", "LEVEL"], null);
  const displayName = String(pickProperty(properties, ["displayName", "display_name", "name"], `Floor ${floorNumber ?? ""}`)).trim();

  if (!buildingId || floorNumber === null || floorNumber === undefined || !displayName) return null;

  const floorId = String(
    pickProperty(properties, ["floorId", "floor_id", "id"], `${buildingId}-floor-${floorNumber}`)
  ).trim();

  return {
    floorId: normalizeCampusValue(floorId).replace(/\s+/g, "-"),
    buildingId,
    floorNumber,
    displayName,
    floorOrder: Number(pickProperty(properties, ["floorOrder", "floor_order", "sort"], Number(floorNumber))),
    geometryRef: pickProperty(properties, ["geometryRef", "geometry_ref"], null),
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    verificationStatus: properties.verificationStatus || properties.status || "unknown"
  };
}

module.exports = {
  normalizeFloorFeature
};
