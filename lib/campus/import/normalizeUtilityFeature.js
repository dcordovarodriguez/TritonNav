const { normalizeSource } = require("../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../normalize.js");
const { coordinateFromGeometry, getFeatureProperties, getGeometry, pickProperty } = require("./geojson.js");

function normalizeUtilityFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const coordinates = coordinateFromGeometry(getGeometry(feature));
  const categoryId = String(pickProperty(properties, ["categoryId", "category", "utilityType", "utility_type"], options.categoryId || "")).trim();
  const name = String(pickProperty(properties, ["name", "label"], "")).trim();

  if (!name || !categoryId || !coordinates) return null;

  return {
    id: normalizeCampusValue(pickProperty(properties, ["id", "utilityId", "utility_id"], `${categoryId}-${name}`)).replace(/\s+/g, "-"),
    categoryId,
    name,
    type: String(pickProperty(properties, ["type"], categoryId)).trim(),
    coordinates,
    relatedBuildingIds: Array.isArray(properties.relatedBuildingIds)
      ? properties.relatedBuildingIds
      : String(pickProperty(properties, ["relatedBuildingIds", "related_building_ids"], ""))
          .split(";")
          .map((id) => id.trim())
          .filter(Boolean),
    verificationStatus: properties.verificationStatus || properties.status || "unknown",
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    sourceDataset: options.dataset || properties.sourceDataset || properties.dataset || "",
    verified: Boolean(properties.verified || options.verified),
    verifiedAt: properties.verifiedAt || options.verifiedAt || null,
    confidence: properties.confidence || options.confidence || "unknown"
  };
}

module.exports = {
  normalizeUtilityFeature
};
