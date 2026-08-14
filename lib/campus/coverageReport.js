const {
  getAllCampusBuildings,
  getAllCampusColleges,
  getAllCampusDistricts,
  getAllCampusEntrances,
  getAllCampusHousingCommunities,
  getAllCampusPlaces,
  getAllCampusRooms
} = require("./resolver.js");
const { CAMPUS_UTILITIES, UTILITY_CATEGORIES } = require("../../data/campus/utilities.js");
const { getSourceStatus, normalizeSource } = require("../../data/campus/sources.js");

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item) || "unspecified";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sourceAuthority(source) {
  if (!source) return "unknown";
  if (typeof source === "string") return source;
  return source.authority || source.sourceType || "unknown";
}

function countBySourceStatus(items) {
  return countBy(items, (item) => getSourceStatus(item.source));
}

function isOfficialSource(source) {
  const normalized = normalizeSource(source);
  return normalized.status === "official" || normalized.confidence === "official";
}

function isProvisionalSource(source) {
  const normalized = normalizeSource(source);
  return (
    normalized.status === "provisional" ||
    normalized.confidence === "provisional" ||
    normalized.sourceType === "manual-curation" ||
    normalized.sourceType === "curated-provisional"
  );
}

function createUtilityCoverage() {
  const utilitiesByCategory = {};

  for (const category of UTILITY_CATEGORIES) {
    const utilities = CAMPUS_UTILITIES.filter((utility) => utility.categoryId === category.id);
    utilitiesByCategory[category.id] = {
      label: category.label,
      total: utilities.length,
      official: utilities.filter((utility) => isOfficialSource(utility.source)).length,
      provisional: utilities.filter((utility) => isProvisionalSource(utility.source)).length,
      unknown: utilities.filter((utility) => getSourceStatus(utility.source) === "unknown").length
    };
  }

  return utilitiesByCategory;
}

function createAccessibilityCoverage(buildings, entrances) {
  return {
    verifiedAccessibleEntrances: entrances.filter(
      (entrance) => entrance.accessible === true && isOfficialSource(entrance.source)
    ).length,
    provisionalAccessibleEntrances: entrances.filter(
      (entrance) => entrance.accessible === true && !isOfficialSource(entrance.source)
    ).length,
    inaccessibleEntrancesPendingVerification: entrances.filter((entrance) => entrance.accessible === false).length,
    unknownEntranceAccessibility: entrances.filter(
      (entrance) => entrance.accessible !== true && entrance.accessible !== false
    ).length,
    buildingsWithAccessibilityInformation: buildings.filter(
      (building) => building.accessibilityStatus && building.accessibilityStatus !== "unknown"
    ).length,
    buildingsAwaitingAccessibilityVerification: buildings
      .filter((building) => !building.accessibilityStatus || building.accessibilityStatus === "unknown")
      .map((building) => building.id)
  };
}

function createHousingCoverage(buildings, entrances) {
  const buildingIds = new Set(buildings.map((building) => building.id));
  const entranceBuildingIds = new Set(entrances.map((entrance) => entrance.buildingId));
  const routingAnchorBuildingIds = new Set(
    entrances.filter((entrance) => entrance.routingAnchor).map((entrance) => entrance.buildingId)
  );
  const communities = getAllCampusHousingCommunities();
  const undergraduateCommunities = communities.filter((community) => community.type === "college housing");
  const completeInventories = undergraduateCommunities.filter((community) =>
    String(community.inventoryStatus || "").startsWith("complete")
  );

  const collegeReports = undergraduateCommunities.map((community) => {
    const documentedBuildings = community.documentedResidentialBuildings || [];
    const importedBuildingIds = documentedBuildings
      .map((building) => building.buildingId)
      .filter((buildingId) => buildingId && buildingIds.has(buildingId));
    const importedBuildings = importedBuildingIds
      .map((buildingId) => buildings.find((building) => building.id === buildingId))
      .filter(Boolean);

    return {
      collegeId: community.collegeId,
      name: community.name,
      inventoryStatus: community.inventoryStatus,
      residentialBuildingsDiscovered: documentedBuildings.length,
      residentialBuildingsImported: importedBuildingIds.length,
      buildingsWithVerifiedCoordinates: importedBuildings.filter((building) => building.centroid).length,
      buildingsWithVerifiedEntrances: importedBuildingIds.filter((buildingId) => entranceBuildingIds.has(buildingId)).length,
      buildingsWithRoutingAnchors: importedBuildingIds.filter((buildingId) => routingAnchorBuildingIds.has(buildingId)).length,
      buildingsWithAccessibilityInformation: importedBuildings.filter(
        (building) => building.accessibilityStatus && building.accessibilityStatus !== "unknown"
      ).length,
      buildingsStillRequiringVerification: documentedBuildings
        .filter((building) => !building.buildingId || !buildingIds.has(building.buildingId))
        .map((building) => building.name)
    };
  });

  return {
    expectedColleges: 8,
    discoveredColleges: undergraduateCommunities.length,
    completeCollegeInventories: `${completeInventories.length}/8`,
    colleges: collegeReports,
    upperDivisionCommunities: communities
      .filter((community) => community.type === "housing community")
      .map((community) => ({
        id: community.id,
        name: community.name,
        inventoryStatus: community.inventoryStatus,
        importedBuildingIds: community.buildingIds || [],
        documentedResidentialBuildings: community.documentedResidentialBuildings || []
      }))
  };
}

function createCampusCoverageReport() {
  const buildings = getAllCampusBuildings();
  const entrances = getAllCampusEntrances();
  const rooms = getAllCampusRooms();
  const colleges = getAllCampusColleges();
  const places = getAllCampusPlaces();
  const entranceBuildingIds = new Set(entrances.map((entrance) => entrance.buildingId));
  const routingAnchorBuildingIds = new Set(
    entrances.filter((entrance) => entrance.routingAnchor).map((entrance) => entrance.buildingId)
  );
  const roomBuildingIds = new Set(rooms.map((room) => room.buildingId));
  const indoorDirectionRoomIds = new Set(
    rooms.filter((room) => room.indoorDirections).map((room) => room.id)
  );

  return {
    generatedFor: "development",
    totals: {
      buildings: buildings.length,
      colleges: colleges.length,
      districts: getAllCampusDistricts().length,
      entrances: entrances.length,
      places: places.length,
      utilities: CAMPUS_UTILITIES.length,
      rooms: rooms.length
    },
    buildingsByDistrict: countBy(buildings, (building) => building.district),
    buildingsByCategory: countBy(buildings, (building) => building.type),
    buildingsBySource: countBy(buildings, (building) => sourceAuthority(building.source)),
    sourceStatus: {
      buildings: countBySourceStatus(buildings),
      colleges: countBySourceStatus(colleges),
      entrances: countBySourceStatus(entrances),
      places: countBySourceStatus(places),
      rooms: countBySourceStatus(rooms),
      utilities: countBySourceStatus(CAMPUS_UTILITIES)
    },
    housing: createHousingCoverage(buildings, entrances),
    utilities: createUtilityCoverage(),
    accessibility: createAccessibilityCoverage(buildings, entrances),
    paths: {
      currentSource: "OSM extract routed by Valhalla",
      officialCampusPathImportStatus: "not-imported",
      futureEnhancements: [
        "official pedestrian path geometries",
        "accessible routes and ramps",
        "stairs and surface metadata",
        "closures and restricted paths"
      ]
    },
    completeness: {
      withCentroid: buildings.filter((building) => building.centroid).length,
      withEntrance: buildings.filter((building) => entranceBuildingIds.has(building.id)).length,
      withRoutingAnchor: buildings.filter((building) => routingAnchorBuildingIds.has(building.id)).length,
      withAccessibilityStatus: buildings.filter((building) => building.accessibilityStatus && building.accessibilityStatus !== "unknown").length,
      withRoomData: buildings.filter((building) => roomBuildingIds.has(building.id)).length,
      roomsWithIndoorDirections: indoorDirectionRoomIds.size
    },
    gaps: {
      missingEntranceCoordinates: buildings
        .filter((building) => !entranceBuildingIds.has(building.id))
        .map((building) => building.id),
      missingRoutingAnchors: buildings
        .filter((building) => !routingAnchorBuildingIds.has(building.id))
        .map((building) => building.id),
      missingAccessibilityData: buildings
        .filter((building) => !building.accessibilityStatus || building.accessibilityStatus === "unknown")
        .map((building) => building.id),
      missingAliases: buildings
        .filter((building) => !building.aliases?.length)
        .map((building) => building.id)
    }
  };
}

module.exports = {
  createCampusCoverageReport
};
