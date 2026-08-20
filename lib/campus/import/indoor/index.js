module.exports = {
  ...require("./importIndoorBuilding.js"),
  ...require("./normalizeFloorFeature.js"),
  ...require("./normalizeIndoorEdgeFeature.js"),
  ...require("./normalizeIndoorNodeFeature.js"),
  ...require("./normalizeRoomFeature.js"),
  ...require("./normalizeVerticalConnection.js")
};
