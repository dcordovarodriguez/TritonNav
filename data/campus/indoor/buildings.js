const { TRITONNAV_DERIVED_SOURCE } = require("../sources.js");

const INDOOR_BUILDINGS = [
  {
    buildingId: "geisel-library",
    canonicalName: "Geisel Library",
    code: "GEISEL",
    aliases: ["geisel", "library", "ucsd library", "main library"],
    officialId: null,
    caan: null,
    floorIds: [],
    outdoorEntranceIds: ["geisel-library-main"],
    indoorDataAvailable: false,
    indoorGraphAvailable: false,
    proofOfConcept: true,
    verificationStatus: "metadata-only",
    source: {
      ...TRITONNAV_DERIVED_SOURCE,
      notes: "Derived from the existing TritonNav Geisel campus record. No authoritative indoor floor-plan geometry is present in the repository."
    }
  }
];

module.exports = {
  INDOOR_BUILDINGS,
  default: INDOOR_BUILDINGS
};
