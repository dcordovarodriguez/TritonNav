const { normalizeSource } = require("../../../data/campus/sources.js");
const { normalizeCampusValue } = require("../normalize.js");
const { coordinateFromGeometry, getFeatureProperties, getGeometry, pickProperty } = require("./geojson.js");

function createId(value, fallback = "building") {
  return normalizeCampusValue(value).replace(/\s+/g, "-") || fallback;
}

function normalizeBuildingFeature(feature, options = {}) {
  const properties = getFeatureProperties(feature);
  const name = String(pickProperty(properties, ["name", "building_name", "officialName", "BLDG_NAME"])).trim();
  const officialId = String(pickProperty(properties, ["id", "buildingId", "building_id", "officialId", "BLDG_ID"], name)).trim();
  const code = String(pickProperty(properties, ["code", "buildingCode", "building_code", "BLDG_CODE"], "")).trim();
  const aliases = pickProperty(properties, ["aliases"], []);
  const centroid = coordinateFromGeometry(getGeometry(feature));

  if (!name || !centroid) return null;

  return {
    id: createId(officialId || name),
    officialId: officialId || "",
    name,
    officialName: String(pickProperty(properties, ["officialName", "official_name"], name)).trim(),
    code,
    aliases: Array.isArray(aliases) ? aliases : String(aliases).split(";").map((alias) => alias.trim()).filter(Boolean),
    type: String(pickProperty(properties, ["type", "category", "use"], "building")).trim().toLowerCase(),
    address: String(pickProperty(properties, ["address", "streetAddress", "ADDR"], "")).trim(),
    centroid,
    source: normalizeSource(options.source || properties.source, options.fallbackSource),
    sourceDataset: options.dataset || properties.sourceDataset || properties.dataset || "",
    verified: Boolean(properties.verified || options.verified),
    verifiedAt: properties.verifiedAt || options.verifiedAt || null,
    confidence: properties.confidence || options.confidence || "unknown",
    notes: String(pickProperty(properties, ["notes", "description"], "")).trim()
  };
}

module.exports = {
  normalizeBuildingFeature
};
