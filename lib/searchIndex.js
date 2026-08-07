import campusSearchDocuments from "@/lib/campus/searchDocuments";

const { createCampusSearchDocuments } = campusSearchDocuments;

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeSearchValue(value).split(" ").filter(Boolean);
}

function isSubsequence(query, candidate) {
  if (!query || !candidate) return false;
  let queryIndex = 0;

  for (const character of candidate) {
    if (character === query[queryIndex]) {
      queryIndex += 1;
    }

    if (queryIndex === query.length) {
      return true;
    }
  }

  return false;
}

function levenshteinDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const costs = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previousDiagonal = costs[0];
    costs[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previousUpper = costs[rightIndex];
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      costs[rightIndex] = Math.min(
        costs[rightIndex] + 1,
        costs[rightIndex - 1] + 1,
        previousDiagonal + substitutionCost
      );

      previousDiagonal = previousUpper;
    }
  }

  return costs[right.length];
}

const SEARCH_DOCUMENTS = createCampusSearchDocuments();

function getResultTypePriority(type) {
  if (type === "classroom") return 0;
  if (type === "course") return 1;
  if (type === "recreation") return 2;
  if (type === "college") return 3;
  return 4;
}

function getDocumentScore(document, normalizedQuery) {
  if (!normalizedQuery) {
    return document.type === "building" || document.type === "student center" ? 40 : 20;
  }

  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  let bestScore = 0;

  for (const rawValue of document.searchValues) {
    const normalizedValue = normalizeSearchValue(rawValue);
    const compactValue = normalizedValue.replace(/\s+/g, "");
    const tokens = tokenize(normalizedValue);

    if (!normalizedValue) continue;

    if (normalizedValue === normalizedQuery) {
      bestScore = Math.max(bestScore, 120);
      continue;
    }

    if (document.buildingCode && normalizeSearchValue(document.buildingCode) === normalizedQuery) {
      bestScore = Math.max(bestScore, 116);
    }

    if (tokens.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 112);
    }

    if (normalizedValue.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 102);
    }

    if (tokens.some((token) => token.startsWith(normalizedQuery))) {
      bestScore = Math.max(bestScore, 96);
    }

    if (normalizedValue.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 84);
    }

    if (compactQuery.length >= 4 && isSubsequence(compactQuery, compactValue)) {
      bestScore = Math.max(bestScore, 66);
    }

    if (compactQuery.length >= 4) {
      const distance = levenshteinDistance(compactQuery, compactValue.slice(0, compactQuery.length));
      if (distance <= 2) {
        bestScore = Math.max(bestScore, 58 - distance * 4);
      }
    }
  }

  if (document.type === "course") {
    bestScore -= 4;
  }

  if (document.room) {
    bestScore += 2;
  }

  return bestScore;
}

/**
 * Console verification example:
 * - searchCampusIndex("MANDE") should rank Mandeville Center at or near the top.
 */
export function searchCampusIndex(query, limit = 12) {
  const normalizedQuery = normalizeSearchValue(query);

  const rankedResults = SEARCH_DOCUMENTS.map((document) => ({
    ...document,
    normalizedName: normalizeSearchValue(document.name),
    score: getDocumentScore(document, normalizedQuery)
  }))
    .filter((document) => document.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const typePriorityDifference =
        getResultTypePriority(left.type) - getResultTypePriority(right.type);
      if (typePriorityDifference !== 0) {
        return typePriorityDifference;
      }

      if (left.type !== right.type) {
        return left.type.localeCompare(right.type);
      }

      return left.normalizedName.localeCompare(right.normalizedName);
    });

  const dedupedResults = [];
  const seenKeys = new Set();

  for (const result of rankedResults) {
    if (seenKeys.has(result.key)) continue;
    seenKeys.add(result.key);
    dedupedResults.push(result);
  }

  return dedupedResults.slice(0, limit);
}

export function normalizeCampusQuery(query) {
  return normalizeSearchValue(query);
}
