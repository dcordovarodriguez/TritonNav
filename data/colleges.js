const UCSD_COLLEGES = [
  {
    id: "warren-college",
    name: "Warren College",
    shortName: "Warren",
    aliases: ["warren", "earl warren", "earl warren college", "warren college"],
    type: "college",
    coordinates: { lat: 32.88218, lng: -117.23392 },
    boundarySource: "manual-approximation",
    boundaryPolygon: [
      { lat: 32.88345, lng: -117.2358 },
      { lat: 32.8835, lng: -117.2316 },
      { lat: 32.88072, lng: -117.23145 },
      { lat: 32.88055, lng: -117.23565 }
    ],
    associatedBuildings: [
      "Warren Lecture Hall",
      "Computer Science and Engineering Building",
      "Franklin Antonio Hall",
      "Jacobs Hall / Engineering Building Unit I",
      "Engineering Building Unit II",
      "Atkinson Hall"
    ],
    residenceHalls: [
      "Warren Residential Area",
      "Bates Hall",
      "Brown Hall",
      "Douglas Hall",
      "Goldberg Hall",
      "Harlan Hall",
      "Stewart Hall"
    ],
    landmarks: ["Warren Mall", "Canyon Vista", "Jacobs School of Engineering"]
  },
  {
    id: "muir-college",
    name: "John Muir College",
    shortName: "Muir",
    aliases: ["muir", "john muir", "john muir college", "muir college"],
    type: "college",
    coordinates: { lat: 32.87819, lng: -117.24284 },
    boundarySource: "manual-approximation",
    boundaryPolygon: [
      { lat: 32.87925, lng: -117.24405 },
      { lat: 32.8793, lng: -117.24075 },
      { lat: 32.877, lng: -117.24065 },
      { lat: 32.87675, lng: -117.2442 }
    ],
    associatedBuildings: ["Applied Physics and Mathematics", "Mandeville Center", "Muir College Center"],
    residenceHalls: ["Tioga Hall", "Tenaya Hall", "Muir Apartments"],
    landmarks: ["Muir Quad", "Mandeville Auditorium", "Scholars Parking Structure"]
  },
  {
    id: "sixth-college",
    name: "Sixth College",
    shortName: "Sixth",
    aliases: ["sixth", "sixth college", "new sixth", "sixth college neighborhood"],
    type: "college",
    coordinates: { lat: 32.88043, lng: -117.24108 },
    boundarySource: "manual-approximation",
    boundaryPolygon: [
      { lat: 32.8816, lng: -117.24235 },
      { lat: 32.8815, lng: -117.2399 },
      { lat: 32.879, lng: -117.2398 },
      { lat: 32.8789, lng: -117.24225 }
    ],
    associatedBuildings: ["Mosaic", "Catalyst", "Kaleidoscope", "Jeannie Auditorium"],
    residenceHalls: ["Sixth College Residence Halls", "Tapestry", "Kaleidoscope", "Catalyst"],
    landmarks: ["Ridge Walk", "Sixth Market", "Scholars Parking Structure"]
  },
  {
    id: "revelle-college",
    name: "Revelle College",
    shortName: "Revelle",
    aliases: ["revelle", "revelle college"],
    type: "college",
    coordinates: { lat: 32.87538, lng: -117.24102 },
    boundarySource: "manual-approximation",
    boundaryPolygon: [
      { lat: 32.8767, lng: -117.2427 },
      { lat: 32.8767, lng: -117.2392 },
      { lat: 32.8738, lng: -117.2391 },
      { lat: 32.8737, lng: -117.2426 }
    ],
    associatedBuildings: ["York Hall", "Urey Hall", "Galbraith Hall", "Pacific Hall"],
    residenceHalls: ["Argo Hall", "Blake Hall", "Revelle Apartments"],
    landmarks: ["Revelle Plaza", "64 Degrees", "Main Gym"]
  },
  {
    id: "marshall-college",
    name: "Thurgood Marshall College",
    shortName: "Marshall",
    aliases: ["marshall", "thurgood marshall", "thurgood marshall college", "tmc"],
    type: "college",
    coordinates: { lat: 32.883, lng: -117.2416 },
    boundarySource: "manual-approximation",
    boundaryPolygon: [
      { lat: 32.88455, lng: -117.24335 },
      { lat: 32.8845, lng: -117.2396 },
      { lat: 32.88145, lng: -117.2396 },
      { lat: 32.88135, lng: -117.24335 }
    ],
    associatedBuildings: ["Marshall College Administration", "OceanView Terrace"],
    residenceHalls: ["Marshall Residence Halls", "Marshall Apartments"],
    landmarks: ["Ridge Walk", "OceanView Terrace", "Marshall Lower Quad"]
  },
  {
    id: "roosevelt-college",
    name: "Eleanor Roosevelt College",
    shortName: "ERC",
    aliases: ["erc", "roosevelt", "eleanor roosevelt", "eleanor roosevelt college"],
    type: "college",
    coordinates: { lat: 32.8864, lng: -117.2422 },
    boundarySource: "manual-approximation",
    boundaryPolygon: [
      { lat: 32.8882, lng: -117.2442 },
      { lat: 32.888, lng: -117.2401 },
      { lat: 32.8848, lng: -117.2402 },
      { lat: 32.8848, lng: -117.2441 }
    ],
    associatedBuildings: ["International House", "Great Hall", "ERC Administration"],
    residenceHalls: ["International House", "ERC Residence Halls", "ERC Apartments"],
    landmarks: ["RIMAC", "ERC Green", "North Campus"]
  },
  {
    id: "seventh-college",
    name: "Seventh College",
    shortName: "Seventh",
    aliases: ["seventh", "seventh college", "the village", "seventh college neighborhood"],
    type: "college",
    coordinates: { lat: 32.8887, lng: -117.2403 },
    boundarySource: "manual-approximation",
    boundaryPolygon: [
      { lat: 32.8903, lng: -117.2424 },
      { lat: 32.8902, lng: -117.2383 },
      { lat: 32.8871, lng: -117.2384 },
      { lat: 32.887, lng: -117.2425 }
    ],
    associatedBuildings: ["Seventh College West", "Seventh College East", "The Bistro"],
    residenceHalls: ["Seventh College Apartments", "The Village"],
    landmarks: ["North Campus", "RIMAC", "The Bistro"]
  },
  {
    id: "eighth-college",
    name: "Eighth College",
    shortName: "Eighth",
    aliases: ["eighth", "eighth college", "theatre district living and learning neighborhood"],
    type: "college",
    coordinates: { lat: 32.8729, lng: -117.242 },
    boundarySource: "manual-approximation",
    boundaryPolygon: [
      { lat: 32.8744, lng: -117.2435 },
      { lat: 32.8743, lng: -117.2403 },
      { lat: 32.8713, lng: -117.2403 },
      { lat: 32.8712, lng: -117.2436 }
    ],
    associatedBuildings: ["Eighth College Administration", "Theatre District Living and Learning Neighborhood"],
    residenceHalls: ["Eighth College Residence Halls", "Theatre District Living and Learning Neighborhood"],
    landmarks: ["Theatre District", "Revelle College", "La Jolla Playhouse"]
  }
];

function normalizeCollegeValue(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getAllColleges() {
  return UCSD_COLLEGES;
}

export function getCollegeById(id) {
  if (!id) return null;
  return UCSD_COLLEGES.find((college) => college.id === String(id).toLowerCase()) ?? null;
}

export function getCollegeByShortName(value) {
  if (!value) return null;
  const normalizedValue = normalizeCollegeValue(value);

  return (
    UCSD_COLLEGES.find(
      (college) =>
        normalizeCollegeValue(college.shortName) === normalizedValue ||
        college.aliases.some((alias) => normalizeCollegeValue(alias) === normalizedValue)
    ) ?? null
  );
}

export default UCSD_COLLEGES;
