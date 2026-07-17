import { getAllLocations } from "@/data/locations";
import { getAllColleges } from "@/data/colleges";
import { getAllRecreationFacilities } from "@/data/recreationFacilities";
import { getAllBuildings } from "@/lib/buildings";
import { MOCK_SCHEDULE } from "@/lib/schedule";

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

function createLocationDocuments() {
  return getAllLocations()
    .filter((location) => location.type !== "college")
    .map((location) => ({
      key: location.id,
      destinationId: location.id,
      buildingId: location.id,
      room: "",
      name: location.name,
      shortName: location.shortName || "",
      buildingCode: location.buildingCode || "",
      type: location.type,
      typeLabel: location.type,
      address: location.address || "",
      aliases: location.aliases || [],
      nearbyLandmarks: location.nearbyLandmarks || [],
      coordinates: location.coordinates,
      searchValues: [
        location.name,
        location.shortName,
        location.buildingCode,
        ...(location.aliases || []),
        ...(location.nearbyLandmarks || [])
      ]
    }));
}

function createCollegeDocuments() {
  return getAllColleges().map((college) => ({
    key: college.id,
    destinationId: college.id,
    buildingId: college.id,
    room: "",
    name: college.name,
    shortName: college.shortName,
    buildingCode: college.shortName,
    type: "college",
    typeLabel: "college",
    address: "UC San Diego, La Jolla, CA 92093",
    aliases: college.aliases,
    nearbyLandmarks: college.landmarks,
    coordinates: college.coordinates,
    boundaryPolygon: college.boundaryPolygon,
    associatedBuildings: college.associatedBuildings,
    residenceHalls: college.residenceHalls,
    landmarks: college.landmarks,
    searchValues: [
      college.name,
      college.shortName,
      ...(college.aliases || []),
      ...(college.associatedBuildings || []),
      ...(college.residenceHalls || []),
      ...(college.landmarks || [])
    ]
  }));
}

function createRecreationFacilityDocuments() {
  return getAllRecreationFacilities().map((facility) => ({
    key: facility.id,
    destinationId: facility.id,
    buildingId: facility.id,
    room: "",
    name: facility.name,
    shortName: facility.shortName,
    buildingCode: facility.shortName,
    type: facility.type,
    typeLabel: "recreation",
    address: facility.address,
    aliases: facility.aliases,
    nearbyLandmarks: facility.amenities,
    coordinates: facility.coordinates,
    relatedCollege: facility.relatedCollege,
    amenities: facility.amenities,
    ctas: facility.ctas,
    sourceUrls: facility.sourceUrls,
    searchValues: [
      facility.name,
      facility.shortName,
      facility.relatedCollege,
      facility.address,
      ...(facility.aliases || []),
      ...(facility.amenities || []),
      ...(facility.ctas || []).map((cta) => cta.label)
    ]
  }));
}

function createRoomDocuments() {
  return getAllBuildings().flatMap((building) =>
    building.rooms.map((room) => ({
      key: `${building.id}-${room.number}`,
      destinationId: building.id,
      buildingId: building.id,
      room: room.number,
      name: `${building.name} ${room.number}`,
      shortName: building.shortName,
      buildingCode: building.shortName,
      type: "classroom",
      typeLabel: "classroom",
      address: building.address,
      aliases: [
        `${building.shortName} ${room.number}`,
        `${building.name} room ${room.number}`,
        ...(building.aliases || []).map((alias) => `${alias} ${room.number}`)
      ],
      nearbyLandmarks: [],
      coordinates: building.coords,
      searchValues: [
        building.name,
        building.shortName,
        room.number,
        `${building.shortName} ${room.number}`,
        `${building.name} ${room.number}`,
        ...(building.aliases || []).map((alias) => `${alias} ${room.number}`)
      ]
    }))
  );
}

function createCourseDocuments() {
  return MOCK_SCHEDULE.map((classItem) => ({
    key: `course-${classItem.id}`,
    destinationId: classItem.buildingId,
    buildingId: classItem.buildingId,
    room: classItem.room,
    name: classItem.course,
    shortName: classItem.building,
    buildingCode: classItem.building,
    type: "course",
    typeLabel: "course",
    address: classItem.buildingName,
    aliases: [
      classItem.course,
      `${classItem.course} ${classItem.building}`,
      `${classItem.building} ${classItem.room}`,
      classItem.buildingName
    ],
    nearbyLandmarks: [],
    coordinates: null,
    searchValues: [
      classItem.course,
      classItem.building,
      classItem.buildingName,
      classItem.room,
      `${classItem.building} ${classItem.room}`
    ]
  }));
}

const SEARCH_DOCUMENTS = [
  ...createLocationDocuments(),
  ...createCollegeDocuments(),
  ...createRecreationFacilityDocuments(),
  ...createRoomDocuments(),
  ...createCourseDocuments()
];

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
