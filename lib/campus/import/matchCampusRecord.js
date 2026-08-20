const { normalizeCampusValue } = require("../normalize.js");

function normalizedList(values = []) {
  return values.map((value) => normalizeCampusValue(value)).filter(Boolean);
}

function createRecordKeys(record, entityType = "building") {
  const keys = new Set();
  const add = (prefix, value) => {
    const normalized = normalizeCampusValue(value);
    if (normalized) keys.add(`${prefix}:${normalized}`);
  };

  add("id", record.id);
  add("officialId", record.officialId);
  add("name", record.name);

  if (entityType === "building") {
    add("code", record.code);
    for (const alias of normalizedList(record.aliases || [])) keys.add(`alias:${alias}`);
  }

  if (entityType === "entrance") {
    add("buildingId", record.buildingId);
    if (record.buildingId && record.name) {
      add("buildingEntrance", `${record.buildingId} ${record.name}`);
    }
  }

  if (entityType === "utility") {
    add("categoryName", `${record.categoryId || ""} ${record.name || ""}`);
  }

  return keys;
}

function scoreCandidate(importedRecord, existingRecord, entityType) {
  let score = 0;
  const reasons = [];
  const importedKeys = createRecordKeys(importedRecord, entityType);
  const existingKeys = createRecordKeys(existingRecord, entityType);

  for (const key of importedKeys) {
    if (existingKeys.has(key)) {
      if (key.startsWith("officialId:")) score += 100;
      else if (key.startsWith("id:")) score += 90;
      else if (key.startsWith("code:")) score += 70;
      else if (key.startsWith("buildingEntrance:")) score += 65;
      else if (key.startsWith("name:")) score += 50;
      else if (key.startsWith("alias:")) score += 35;
      else score += 20;
      reasons.push(key);
    }
  }

  return {
    record: existingRecord,
    score,
    reasons
  };
}

function matchCampusRecord(importedRecord, existingRecords = [], entityType = "building") {
  const candidates = existingRecords
    .map((record) => scoreCandidate(importedRecord, record, entityType))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  if (!candidates.length) {
    return {
      action: "create",
      match: null,
      candidates: [],
      reason: "no-stable-match"
    };
  }

  const [best, second] = candidates;
  if (second && best.score === second.score) {
    return {
      action: "review",
      match: null,
      candidates: candidates.slice(0, 5),
      reason: "ambiguous-match"
    };
  }

  return {
    action: "supersede",
    match: best.record,
    candidates: [best],
    reason: best.reasons.join(",")
  };
}

module.exports = {
  createRecordKeys,
  matchCampusRecord
};
