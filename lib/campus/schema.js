const CAMPUS_ENTITY_TYPES = {
  BUILDING: "building",
  COLLEGE: "college",
  ENTRANCE: "entrance",
  PLACE: "place",
  ROOM: "room"
};

const CAMPUS_SOURCES = {
  CURATED: "curated",
  LEGACY_NORMALIZED: "legacy-normalized",
  MANUAL_APPROXIMATION: "manual-approximation",
  OFFICIAL_UCSD_MAP: "official-ucsd-map",
  OFFICIAL_UCSD_HEALTH: "official-ucsd-health"
};

const CAMPUS_DATA_QUALITY = {
  BUILDING_ONLY: "building-only",
  ENTRANCE_VERIFIED: "entrance-verified",
  ROUTING_READY: "routing-ready",
  ACCESSIBILITY_VERIFIED: "accessibility-verified",
  INDOOR_PARTIAL: "indoor-partial",
  INDOOR_VERIFIED: "indoor-verified"
};

function createCoordinate(lat, lng) {
  return { lat, lng };
}

module.exports = {
  CAMPUS_DATA_QUALITY,
  CAMPUS_ENTITY_TYPES,
  CAMPUS_SOURCES,
  createCoordinate
};
