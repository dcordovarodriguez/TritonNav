const { INDOOR_BUILDINGS } = require("./buildings.js");
const { INDOOR_EDGES } = require("./edges.js");
const { INDOOR_FLOORS } = require("./floors.js");
const { INDOOR_NODES } = require("./nodes.js");
const { INDOOR_SPACES } = require("./spaces.js");

module.exports = {
  INDOOR_BUILDINGS,
  INDOOR_EDGES,
  INDOOR_FLOORS,
  INDOOR_NODES,
  INDOOR_SPACES,
  default: {
    buildings: INDOOR_BUILDINGS,
    edges: INDOOR_EDGES,
    floors: INDOOR_FLOORS,
    nodes: INDOOR_NODES,
    spaces: INDOOR_SPACES
  }
};
