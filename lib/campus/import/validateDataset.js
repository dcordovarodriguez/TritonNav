const { CAMPUS_ENTITY_TYPES } = require("../schema.js");

const SUPPORTED_ENTITY_TYPES = new Set([
  CAMPUS_ENTITY_TYPES.BUILDING,
  CAMPUS_ENTITY_TYPES.ENTRANCE,
  CAMPUS_ENTITY_TYPES.PATH,
  CAMPUS_ENTITY_TYPES.UTILITY,
  "accessibility"
]);

function getFeatures(input) {
  if (Array.isArray(input)) return input;
  if (input?.type === "FeatureCollection" && Array.isArray(input.features)) return input.features;
  return [];
}

function validateFeature(feature, index) {
  const errors = [];

  if (!feature || feature.type !== "Feature") {
    errors.push(`feature ${index} is not a GeoJSON Feature`);
  }

  if (!feature?.geometry) {
    errors.push(`feature ${index} is missing geometry`);
  }

  if (!feature?.properties || typeof feature.properties !== "object") {
    errors.push(`feature ${index} is missing properties`);
  }

  return errors;
}

function validateCampusDataset({ id = "dataset", entityType, input, required = false }) {
  const errors = [];
  const warnings = [];

  if (!SUPPORTED_ENTITY_TYPES.has(entityType)) {
    errors.push(`${id}: unsupported entityType "${entityType}"`);
  }

  const features = getFeatures(input);
  if (!features.length) {
    const message = `${id}: no GeoJSON features found`;
    if (required) errors.push(message);
    else warnings.push(message);
  }

  features.forEach((feature, index) => {
    errors.push(...validateFeature(feature, index));
  });

  return {
    id,
    entityType,
    featureCount: features.length,
    features,
    errors,
    warnings,
    valid: errors.length === 0
  };
}

module.exports = {
  SUPPORTED_ENTITY_TYPES,
  getFeatures,
  validateCampusDataset
};
