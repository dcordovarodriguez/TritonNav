const { CAMPUS_BUILDINGS } = require("./buildings.js");
const { CAMPUS_COLLEGES } = require("./colleges.js");
const { CAMPUS_DISTRICTS } = require("./districts.js");
const { CAMPUS_ENTRANCES } = require("./entrances.js");
const { UNDERGRADUATE_COLLEGE_HOUSING, UPPER_DIVISION_HOUSING } = require("./housing.js");
const { CAMPUS_PLACES } = require("./places.js");
const { CAMPUS_ROOMS } = require("./rooms.js");
const { CAMPUS_UTILITIES, UTILITY_CATEGORIES } = require("./utilities.js");

module.exports = {
  CAMPUS_BUILDINGS,
  CAMPUS_COLLEGES,
  CAMPUS_DISTRICTS,
  CAMPUS_ENTRANCES,
  UNDERGRADUATE_COLLEGE_HOUSING,
  CAMPUS_PLACES,
  CAMPUS_ROOMS,
  CAMPUS_UTILITIES,
  UTILITY_CATEGORIES,
  UPPER_DIVISION_HOUSING,
  default: {
    buildings: CAMPUS_BUILDINGS,
    colleges: CAMPUS_COLLEGES,
    districts: CAMPUS_DISTRICTS,
    entrances: CAMPUS_ENTRANCES,
    housing: {
      undergraduate: UNDERGRADUATE_COLLEGE_HOUSING,
      upperDivision: UPPER_DIVISION_HOUSING
    },
    places: CAMPUS_PLACES,
    rooms: CAMPUS_ROOMS,
    utilities: CAMPUS_UTILITIES,
    utilityCategories: UTILITY_CATEGORIES
  }
};
