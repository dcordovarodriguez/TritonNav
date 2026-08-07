const { CAMPUS_BUILDINGS } = require("./buildings.js");
const { CAMPUS_COLLEGES } = require("./colleges.js");
const { CAMPUS_ENTRANCES } = require("./entrances.js");
const { CAMPUS_PLACES } = require("./places.js");
const { CAMPUS_ROOMS } = require("./rooms.js");

module.exports = {
  CAMPUS_BUILDINGS,
  CAMPUS_COLLEGES,
  CAMPUS_ENTRANCES,
  CAMPUS_PLACES,
  CAMPUS_ROOMS,
  default: {
    buildings: CAMPUS_BUILDINGS,
    colleges: CAMPUS_COLLEGES,
    entrances: CAMPUS_ENTRANCES,
    places: CAMPUS_PLACES,
    rooms: CAMPUS_ROOMS
  }
};
