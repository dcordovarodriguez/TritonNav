const {
  getAllCampusBuildings,
  getAllCampusEntrances
} = require("../resolver.js");
const { CAMPUS_UTILITIES } = require("../../../data/campus/utilities.js");
const { normalizeAccessibilityFeature } = require("./normalizeAccessibilityFeature.js");
const { normalizeBuildingFeature } = require("./normalizeBuildingFeature.js");
const { normalizeEntranceFeature } = require("./normalizeEntranceFeature.js");
const { normalizePathFeature } = require("./normalizePathFeature.js");
const { normalizeUtilityFeature } = require("./normalizeUtilityFeature.js");
const { matchCampusRecord } = require("./matchCampusRecord.js");
const { validateCampusDataset } = require("./validateDataset.js");

function normalizeFeatureForEntityType(feature, entityType, options = {}) {
  switch (entityType) {
    case "building":
      return normalizeBuildingFeature(feature, options);
    case "entrance":
      return normalizeEntranceFeature(feature, options);
    case "path":
      return normalizePathFeature(feature, options);
    case "accessibility":
      return normalizeAccessibilityFeature(feature, options);
    case "utility":
      return normalizeUtilityFeature(feature, options);
    default:
      return null;
  }
}

function existingRecordsForEntityType(entityType) {
  if (entityType === "building") return getAllCampusBuildings();
  if (entityType === "entrance") return getAllCampusEntrances();
  if (entityType === "utility") return CAMPUS_UTILITIES;
  return [];
}

function createCampusImportPreview({ id, entityType, input, source, required = false } = {}) {
  const validation = validateCampusDataset({ id, entityType, input, required });
  const existingRecords = existingRecordsForEntityType(entityType);
  const normalized = [];
  const rejected = [];
  const matches = [];

  if (!validation.valid) {
    return {
      id,
      entityType,
      valid: false,
      validation,
      normalized,
      rejected,
      matches,
      summary: {
        features: validation.featureCount,
        normalized: 0,
        rejected: 0,
        create: 0,
        supersede: 0,
        review: 0
      }
    };
  }

  validation.features.forEach((feature, index) => {
    const record = normalizeFeatureForEntityType(feature, entityType, { source });

    if (!record) {
      rejected.push({
        index,
        reason: "normalization-failed"
      });
      return;
    }

    const match = matchCampusRecord(record, existingRecords, entityType);
    normalized.push(record);
    matches.push({
      importedId: record.id,
      importedName: record.name,
      action: match.action,
      reason: match.reason,
      matchId: match.match?.id || null,
      candidateIds: match.candidates.map((candidate) => candidate.record.id)
    });
  });

  return {
    id,
    entityType,
    valid: true,
    validation,
    normalized,
    rejected,
    matches,
    summary: {
      features: validation.featureCount,
      normalized: normalized.length,
      rejected: rejected.length,
      create: matches.filter((match) => match.action === "create").length,
      supersede: matches.filter((match) => match.action === "supersede").length,
      review: matches.filter((match) => match.action === "review").length
    }
  };
}

function createCampusImportRun({ datasets = [], source } = {}) {
  const previews = datasets.map((dataset) =>
    createCampusImportPreview({
      ...dataset,
      source: dataset.source || source
    })
  );

  return {
    generatedFor: "dry-run",
    datasetCount: previews.length,
    previews,
    summary: previews.reduce(
      (total, preview) => ({
        features: total.features + preview.summary.features,
        normalized: total.normalized + preview.summary.normalized,
        rejected: total.rejected + preview.summary.rejected,
        create: total.create + preview.summary.create,
        supersede: total.supersede + preview.summary.supersede,
        review: total.review + preview.summary.review
      }),
      { features: 0, normalized: 0, rejected: 0, create: 0, supersede: 0, review: 0 }
    )
  };
}

module.exports = {
  createCampusImportPreview,
  createCampusImportRun,
  normalizeFeatureForEntityType
};
