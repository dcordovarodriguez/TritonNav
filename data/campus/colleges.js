const CAMPUS_COLLEGES = [
  {
    id: "sixth-college-area",
    name: "Sixth College",
    aliases: ["sixth", "sixth college", "new sixth", "sixth college neighborhood"],
    centroid: { lat: 32.88043, lng: -117.24108 },
    boundaryPolygon: [
      { lat: 32.8816, lng: -117.24235 },
      { lat: 32.8815, lng: -117.2399 },
      { lat: 32.879, lng: -117.2398 },
      { lat: 32.8789, lng: -117.24225 }
    ],
    associatedBuildingIds: ["sixth-college", "mos"],
    source: "manual-approximation"
  },
  {
    id: "warren-college",
    name: "Warren College",
    aliases: ["warren", "earl warren", "earl warren college", "warren college"],
    centroid: { lat: 32.88218, lng: -117.23392 },
    boundaryPolygon: [
      { lat: 32.88345, lng: -117.2358 },
      { lat: 32.8835, lng: -117.2316 },
      { lat: 32.88072, lng: -117.23145 },
      { lat: 32.88055, lng: -117.23565 }
    ],
    associatedBuildingIds: ["warren-lecture-hall", "cse", "fah"],
    source: "manual-approximation"
  },
  {
    id: "muir-college",
    name: "John Muir College",
    aliases: ["muir", "john muir", "john muir college", "muir college"],
    centroid: { lat: 32.87819, lng: -117.24284 },
    boundaryPolygon: [
      { lat: 32.87925, lng: -117.24405 },
      { lat: 32.8793, lng: -117.24075 },
      { lat: 32.877, lng: -117.24065 },
      { lat: 32.87675, lng: -117.2442 }
    ],
    associatedBuildingIds: ["apm", "mandeville-center"],
    source: "manual-approximation"
  },
  {
    id: "revelle-college",
    name: "Revelle College",
    aliases: ["revelle", "revelle college"],
    centroid: { lat: 32.87538, lng: -117.24102 },
    boundaryPolygon: [
      { lat: 32.8767, lng: -117.2427 },
      { lat: 32.8767, lng: -117.2392 },
      { lat: 32.8738, lng: -117.2391 },
      { lat: 32.8737, lng: -117.2426 }
    ],
    associatedBuildingIds: ["york-hall"],
    source: "manual-approximation"
  },
  {
    id: "marshall-college",
    name: "Thurgood Marshall College",
    aliases: ["marshall", "thurgood marshall", "thurgood marshall college", "tmc"],
    centroid: { lat: 32.883, lng: -117.2416 },
    boundaryPolygon: [
      { lat: 32.88455, lng: -117.24335 },
      { lat: 32.8845, lng: -117.2396 },
      { lat: 32.88145, lng: -117.2396 },
      { lat: 32.88135, lng: -117.24335 }
    ],
    associatedBuildingIds: [],
    source: "manual-approximation"
  },
  {
    id: "roosevelt-college",
    name: "Eleanor Roosevelt College",
    aliases: ["erc", "roosevelt", "eleanor roosevelt", "eleanor roosevelt college"],
    centroid: { lat: 32.8864, lng: -117.2422 },
    boundaryPolygon: [
      { lat: 32.8882, lng: -117.2442 },
      { lat: 32.888, lng: -117.2401 },
      { lat: 32.8848, lng: -117.2402 },
      { lat: 32.8848, lng: -117.2441 }
    ],
    associatedBuildingIds: [],
    source: "manual-approximation"
  },
  {
    id: "seventh-college",
    name: "Seventh College",
    aliases: ["seventh", "seventh college", "the village", "seventh college neighborhood"],
    centroid: { lat: 32.8887, lng: -117.2403 },
    boundaryPolygon: [
      { lat: 32.8903, lng: -117.2424 },
      { lat: 32.8902, lng: -117.2383 },
      { lat: 32.8871, lng: -117.2384 },
      { lat: 32.887, lng: -117.2425 }
    ],
    associatedBuildingIds: [],
    source: "manual-approximation"
  },
  {
    id: "eighth-college",
    name: "Eighth College",
    aliases: ["eighth", "eighth college", "theatre district living and learning neighborhood"],
    centroid: { lat: 32.8729, lng: -117.242 },
    boundaryPolygon: [
      { lat: 32.8744, lng: -117.2435 },
      { lat: 32.8743, lng: -117.2403 },
      { lat: 32.8713, lng: -117.2403 },
      { lat: 32.8712, lng: -117.2436 }
    ],
    associatedBuildingIds: [],
    source: "manual-approximation"
  }
];

module.exports = {
  CAMPUS_COLLEGES,
  default: CAMPUS_COLLEGES
};
