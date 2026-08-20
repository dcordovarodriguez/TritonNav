const { normalizeSource } = require("../../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../../normalize.js");
const { coordinateFromGeometry, getFeatureProperties, getGeometry, pickProperty } = require("../geojson.js");

function normalizeRoomFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const buildingId = String(pickProperty(properties, ["buildingId", "building_id", "BLDG_ID"], options.buildingId || "")).trim();
  const floorId = String(pickProperty(properties, ["floorId", "floor_id", "LEVEL_ID"], options.floorId || "")).trim();
  const roomNumber = String(pickProperty(properties, ["roomNumber", "room_number", "number", "ROOM"], "")).trim();
  const roomName = String(pickProperty(properties, ["roomName", "room_name", "name"], roomNumber)).trim();

  if (!buildingId || !floorId || !roomNumber) return null;

  return {
    roomId: normalizeCampusValue(pickProperty(properties, ["roomId", "room_id", "id"], `${buildingId}-${roomNumber}`)).replace(/\s+/g, "-"),
    buildingId,
    floorId,
    roomNumber,
    roomName,
    roomType: String(pickProperty(properties, ["roomType", "room_type", "type"], "room")).trim(),
    aliases: Array.isArray(properties.aliases)
      ? properties.aliases
      : String(pickProperty(properties, ["aliases"], "")).split(";").map((alias) => alias.trim()).filter(Boolean),
    searchableLabel: String(pickProperty(properties, ["searchableLabel", "searchable_label"], `${roomName} ${roomNumber}`)).trim(),
    centroid: coordinateFromGeometry(getGeometry(feature)),
    geometryRef: pickProperty(properties, ["geometryRef", "geometry_ref"], null),
    nearestIndoorNodeId: String(pickProperty(properties, ["nearestIndoorNodeId", "nearest_indoor_node_id"], "")).trim(),
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    verificationStatus: properties.verificationStatus || properties.status || "unknown"
  };
}

module.exports = {
  normalizeRoomFeature
};
