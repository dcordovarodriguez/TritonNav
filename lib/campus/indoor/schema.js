const INDOOR_NODE_TYPES = {
  BUILDING_ENTRANCE: "building entrance",
  DOORWAY: "doorway",
  HALLWAY: "hallway",
  CORRIDOR_INTERSECTION: "corridor intersection",
  ROOM_ENTRANCE: "room entrance",
  STAIR: "stair",
  ELEVATOR: "elevator",
  RAMP: "ramp",
  LANDMARK: "indoor landmark"
};

const INDOOR_EDGE_TYPES = {
  HALLWAY: "hallway/corridor",
  STAIRS: "stairs",
  ELEVATOR: "elevator",
  RAMP: "ramp",
  DOORWAY: "doorway"
};

const INDOOR_ACCESSIBILITY_STATUS = {
  VERIFIED: "verified",
  PROVISIONAL: "provisional",
  UNKNOWN: "unknown"
};

const INDOOR_VERIFICATION_STATUS = {
  AUTHORITATIVE: "authoritative",
  METADATA_ONLY: "metadata-only",
  PROVISIONAL: "provisional",
  SYNTHETIC_TEST_ONLY: "synthetic-test-only",
  UNKNOWN: "unknown"
};

function createIndoorDirectionsStep({
  instruction,
  floor = null,
  maneuverType = "continue",
  distanceMeters = null,
  fromNode = null,
  toNode = null,
  accessibility = { status: INDOOR_ACCESSIBILITY_STATUS.UNKNOWN },
  landmark = ""
}) {
  return {
    instruction,
    floor,
    maneuverType,
    distanceMeters,
    fromNode,
    toNode,
    accessibility,
    landmark
  };
}

module.exports = {
  INDOOR_ACCESSIBILITY_STATUS,
  INDOOR_EDGE_TYPES,
  INDOOR_NODE_TYPES,
  INDOOR_VERIFICATION_STATUS,
  createIndoorDirectionsStep
};
