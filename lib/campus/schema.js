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
  MANUAL_APPROXIMATION: "manual-approximation"
};

function createCoordinate(lat, lng) {
  return { lat, lng };
}

module.exports = {
  CAMPUS_ENTITY_TYPES,
  CAMPUS_SOURCES,
  createCoordinate
};
