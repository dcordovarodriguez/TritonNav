const CAMPUS_ENTITY_TYPES = {
  BUILDING: "building",
  COLLEGE: "college",
  ENTRANCE: "entrance",
  PATH: "path",
  PLACE: "place",
  ROOM: "room",
  UTILITY: "utility"
};

const CAMPUS_SOURCES = {
  CURATED: "curated",
  DERIVED: "derived",
  GIS_IMPORT: "gis-import",
  LEGACY_NORMALIZED: "legacy-normalized",
  MANUAL_APPROXIMATION: "manual-approximation",
  OFFICIAL_UCSD_MAP: "official-ucsd-map",
  OFFICIAL_UCSD_HEALTH: "official-ucsd-health",
  PROVISIONAL: "provisional",
  UNKNOWN: "unknown"
};

const CAMPUS_SOURCE_STATUS = {
  DERIVED: "derived",
  OFFICIAL: "official",
  PROVISIONAL: "provisional",
  UNKNOWN: "unknown",
  VERIFIED: "verified"
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

function createCampusSource({
  authority = "TritonNav",
  dataset = "",
  status = CAMPUS_SOURCE_STATUS.UNKNOWN,
  sourceType = "",
  sourceUrl = "",
  verified = false,
  verifiedAt = null,
  confidence = status,
  notes = ""
} = {}) {
  return {
    authority,
    dataset,
    status,
    sourceType,
    sourceUrl,
    verified,
    verifiedAt,
    confidence,
    notes
  };
}

module.exports = {
  CAMPUS_DATA_QUALITY,
  CAMPUS_ENTITY_TYPES,
  CAMPUS_SOURCES,
  CAMPUS_SOURCE_STATUS,
  createCampusSource,
  createCoordinate
};
