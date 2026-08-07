const { CAMPUS_SOURCES } = require("../../lib/campus/schema.js");

const CAMPUS_BUILDINGS = [
  {
    id: "geisel-library",
    name: "Geisel Library",
    code: "GEISEL",
    aliases: ["geisel", "library", "ucsd library", "main library"],
    type: "library",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.88114, lng: -117.23758 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "price-center",
    name: "Price Center",
    code: "PC",
    aliases: ["pc", "price", "price center east", "price center west", "student center"],
    type: "student center",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.8798, lng: -117.23695 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "mandeville-center",
    name: "Mandeville Center",
    code: "MANDE",
    aliases: ["mandeville", "mande", "mandeville auditorium", "mandeville art gallery"],
    type: "building",
    address: "Mandeville Ln, La Jolla, CA 92093",
    centroid: { lat: 32.87943, lng: -117.2411 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "sixth-college",
    name: "Sixth College",
    code: "SIXTH",
    aliases: ["sixth", "sixth college neighborhood", "new sixth", "sixth college campus"],
    type: "college",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.88043, lng: -117.24108 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "csb",
    name: "Cognitive Science Building",
    code: "CSB",
    aliases: ["cognitive science", "cogs building", "cogs", "cognitive science bldg"],
    type: "building",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.87858, lng: -117.23901 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "mos",
    name: "Mosaic",
    code: "MOS",
    aliases: ["mosaic building", "mosaic hall", "mos college building", "sixth mosaic"],
    type: "building",
    address: "9510 Innovation Ln, La Jolla, CA 92093",
    centroid: { lat: 32.87995, lng: -117.24137 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "dib",
    name: "Design and Innovation Building",
    code: "DIB",
    aliases: ["design innovation", "design and innovation", "innovation building", "dib"],
    type: "building",
    address: "9510 Innovation Ln, La Jolla, CA 92093",
    centroid: { lat: 32.87934, lng: -117.23468 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "cse",
    name: "Computer Science and Engineering Building",
    code: "CSE",
    aliases: ["computer science", "computer science building", "engineering building", "jacobs school"],
    type: "building",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.88175, lng: -117.23353 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "fah",
    name: "Franklin Antonio Hall",
    code: "FAH",
    aliases: ["antonio hall", "franklin hall", "franklin antonio", "jacobs hall"],
    type: "building",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.88197, lng: -117.23364 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "warren-lecture-hall",
    name: "Warren Lecture Hall",
    code: "WLH",
    aliases: ["warren lecture", "warren lecture halls", "warren", "wlh"],
    type: "building",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.88172, lng: -117.23505 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "center-hall",
    name: "Center Hall",
    code: "CENTR",
    aliases: ["center", "centre hall", "centr"],
    type: "building",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.87788, lng: -117.23604 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "peterson-hall",
    name: "Peterson Hall",
    code: "PETER",
    aliases: ["peterson", "peter"],
    type: "building",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.87895, lng: -117.23855 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "york-hall",
    name: "York Hall",
    code: "YORK",
    aliases: ["york"],
    type: "building",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.87595, lng: -117.24064 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "apm",
    name: "Applied Physics and Mathematics",
    code: "APM",
    aliases: ["apm", "ap m", "ap and m", "ap&m", "applied physics mathematics"],
    type: "building",
    address: "2985 Muir Lane, La Jolla, CA 92093",
    centroid: { lat: 32.87815, lng: -117.24108 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  },
  {
    id: "pcynh",
    name: "Pepper Canyon Hall",
    code: "PCYNH",
    aliases: ["pepper canyon", "pepper canyon hall"],
    type: "building",
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    centroid: { lat: 32.87622, lng: -117.24072 },
    source: CAMPUS_SOURCES.LEGACY_NORMALIZED
  }
];

module.exports = {
  CAMPUS_BUILDINGS,
  default: CAMPUS_BUILDINGS
};
