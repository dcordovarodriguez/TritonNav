const { normalizeSource } = require("../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../normalize.js");
const { coordinateFromGeometry, getFeatureProperties, getGeometry, pickProperty } = require("./geojson.js");

function createId(value, fallback = "entrance") {
  return normalizeCampusValue(value).replace(/\s+/g, "-") || fallback;
}

function toBooleanOrNull(value) {
  if (value === true || value === false) return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["true", "yes", "y", "1", "accessible"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "not accessible"].includes(normalized)) return false;
  return null;
}

function normalizeEntranceFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const coordinates = coordinateFromGeometry(getGeometry(feature));
  const buildingId = String(pickProperty(properties, ["buildingId", "building_id", "BLDG_ID"], options.buildingId || "")).trim();
  const name = String(pickProperty(properties, ["name", "entranceName", "entrance_name"], "Entrance")).trim();

  if (!buildingId || !coordinates) return null;

  return {
    id: createId(pickProperty(properties, ["id", "entranceId", "entrance_id"], `${buildingId}-${name}`)),
    buildingId,
    name,
    type: String(pickProperty(properties, ["type", "entranceType", "entrance_type"], "entrance")).trim().toLowerCase(),
    coordinates,
    accessible: toBooleanOrNull(pickProperty(properties, ["accessible", "ada", "ADA"], null)),
    publicAccess: toBooleanOrNull(pickProperty(properties, ["public", "publicAccess", "public_access"], null)),
    stairs: toBooleanOrNull(pickProperty(properties, ["stairs", "hasStairs", "has_stairs"], null)),
    ramp: toBooleanOrNull(pickProperty(properties, ["ramp", "hasRamp", "has_ramp"], null)),
    notes: String(pickProperty(properties, ["notes", "doorNotes", "door_notes"], "")).trim(),
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    sourceDataset: options.dataset || properties.sourceDataset || properties.dataset || "",
    verified: Boolean(properties.verified || options.verified),
    verifiedAt: properties.verifiedAt || options.verifiedAt || null,
    confidence: properties.confidence || options.confidence || "unknown"
  };
}

module.exports = {
  normalizeEntranceFeature,
  toBooleanOrNull
};
