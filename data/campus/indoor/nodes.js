const INDOOR_NODES = [
  {
    id: "geisel-indoor-entrance-main",
    buildingId: "geisel-library",
    floorId: null,
    outdoorEntranceId: "geisel-library-main",
    nodeType: "building entrance",
    coordinates: null,
    geometryRef: null,
    accessibility: {
      status: "unknown",
      wheelchairAccessible: null,
      notes: "Awaiting authoritative UCSD entrance and indoor accessibility data."
    },
    publicAccess: "unknown",
    verificationStatus: "metadata-only",
    source: {
      authority: "TritonNav",
      dataset: "Indoor navigation proof-of-concept metadata",
      status: "derived",
      sourceType: "outdoor-entrance-link",
      verified: false,
      verifiedAt: null,
      confidence: "derived",
      notes: "Stable transfer node linked to the existing outdoor Geisel entrance. No indoor geometry is asserted."
    }
  }
];

module.exports = {
  INDOOR_NODES,
  default: INDOOR_NODES
};
