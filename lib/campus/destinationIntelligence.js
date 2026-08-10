const {
  CAMPUS_UTILITIES,
  UTILITY_CATEGORIES,
  CAMPUS_ROOMS
} = require("../../data/campus/index.js");
const { resolveEntranceById } = require("./resolver.js");

const DEFAULT_RESULT_LIMIT = 5;

function calculateDistanceMeters(origin, destination) {
  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(destination.lat - origin.lat);
  const longitudeDelta = toRadians(destination.lng - origin.lng);
  const originLatitude = toRadians(origin.lat);
  const destinationLatitude = toRadians(destination.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return Math.round(earthRadius * arc);
}

function formatDistanceFeet(meters) {
  if (!meters) return "";
  return `${Math.round(meters * 3.28084).toLocaleString()} ft`;
}

function getReferenceCoordinate(navigationData) {
  return (
    navigationData?.displayCoordinate ||
    navigationData?.destination ||
    navigationData?.routingDestination ||
    navigationData?.building?.coords ||
    null
  );
}

function formatUtilityDistance(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) return "";
  return formatDistanceFeet(distanceMeters);
}

function normalizeUtilityItem(item, referenceCoordinate) {
  const distanceMeters = referenceCoordinate
    ? calculateDistanceMeters(referenceCoordinate, item.coordinates)
    : null;

  return {
    ...item,
    distanceMeters,
    distanceLabel: formatUtilityDistance(distanceMeters),
    sourceConfidence: item.source?.confidence || "unknown"
  };
}

function getNearbyUtilities(categoryId, navigationData, limit = DEFAULT_RESULT_LIMIT) {
  const referenceCoordinate = getReferenceCoordinate(navigationData);
  const buildingId = navigationData?.building?.id || "";
  const candidates = CAMPUS_UTILITIES.filter((item) => item.categoryId === categoryId)
    .map((item) => normalizeUtilityItem(item, referenceCoordinate))
    .sort((left, right) => {
      const leftRelated = left.relatedBuildingIds?.includes(buildingId) ? 0 : 1;
      const rightRelated = right.relatedBuildingIds?.includes(buildingId) ? 0 : 1;
      if (leftRelated !== rightRelated) return leftRelated - rightRelated;
      return (left.distanceMeters || Number.POSITIVE_INFINITY) -
        (right.distanceMeters || Number.POSITIVE_INFINITY);
    });

  return candidates.slice(0, limit);
}

function getRoomsForBuilding(buildingId) {
  if (!buildingId) return [];

  return CAMPUS_ROOMS.filter((room) => room.buildingId === buildingId).map((room) => {
    const entrance = resolveEntranceById(room.preferredEntranceId);

    return {
      ...room,
      entranceName: entrance?.name || "",
      hasIndoorDirections: Boolean(
        room.indoorDirections?.summary || room.indoorDirections?.steps?.length
      )
    };
  });
}

function createDestinationIntelligence(navigationData) {
  if (!navigationData) return null;

  const building = navigationData.building || null;
  const room = navigationData.room || "";
  const selectedEntrance = navigationData.selectedEntrance || null;
  const routeDetails = navigationData.routeDetails || {};
  const indoorDirections = navigationData.indoorDirections || routeDetails.indoorDirections || null;
  const roomRecords = getRoomsForBuilding(building?.id);
  const utilities = Object.fromEntries(
    UTILITY_CATEGORIES.map((category) => [
      category.id,
      {
        category,
        results:
          category.id === "room-lookup"
            ? roomRecords
            : getNearbyUtilities(category.id, navigationData)
      }
    ])
  );

  return {
    building,
    room,
    destinationName: routeDetails.destinationLabel || building?.name || "Campus destination",
    destinationType: routeDetails.destinationType || navigationData.destinationType || "destination",
    selectedEntrance,
    accessibilityStatus:
      selectedEntrance?.accessible === true
        ? "Verified accessible entrance"
        : selectedEntrance?.accessible === false
          ? "Accessibility unverified"
          : "Accessibility data unavailable",
    accessibilityVerified: selectedEntrance?.accessible === true,
    indoorDirections,
    roomRecords,
    utilities,
    buildingInfo: {
      aliases: building?.aliases || [],
      college: navigationData.normalizedBuilding?.college || "",
      district: navigationData.normalizedBuilding?.district || "",
      image: navigationData.normalizedBuilding?.image || null
    }
  };
}

module.exports = {
  createDestinationIntelligence,
  getNearbyUtilities,
  getRoomsForBuilding,
  UTILITY_CATEGORIES
};
