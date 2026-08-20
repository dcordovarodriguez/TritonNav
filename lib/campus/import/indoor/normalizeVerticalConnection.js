const { normalizeIndoorEdgeFeature } = require("./normalizeIndoorEdgeFeature.js");

function normalizeVerticalConnection(feature, options = {}) {
  const edge = normalizeIndoorEdgeFeature(feature, options);
  if (!edge) return null;

  return {
    ...edge,
    floorId: null,
    connectsFloors: true,
    traversalType: edge.traversalType === "stairs" || edge.traversalType === "elevator" || edge.traversalType === "ramp"
      ? edge.traversalType
      : "elevator"
  };
}

module.exports = {
  normalizeVerticalConnection
};
