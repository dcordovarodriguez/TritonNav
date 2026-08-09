const {
  getAllCampusBuildings,
  getAllCampusDistricts,
  getAllCampusEntrances,
  getAllCampusHousingCommunities,
  getAllCampusRooms
} = require("./resolver.js");

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
      districts: getAllCampusDistricts().length,
      entrances: entrances.length,
      rooms: rooms.length
    },
    buildingsByDistrict: countBy(buildings, (building) => building.district),
    buildingsByCategory: countBy(buildings, (building) => building.type),
    buildingsBySource: countBy(buildings, (building) => sourceAuthority(building.source)),
    housing: createHousingCoverage(buildings, entrances),
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
