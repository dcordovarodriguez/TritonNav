const CAMPUS_ENTRANCES = [
  {
    id: "geisel-library-main",
    buildingId: "geisel-library",
    name: "Library Walk entrance",
    type: "main",
    coordinates: { lat: 32.88114, lng: -117.23758 },
    accessible: true,
    notes: "Curated arrival point used by the existing campus fallback."
  },
  {
    id: "price-center-east-main",
    buildingId: "price-center",
    name: "East entrance (main)",
    type: "main",
    coordinates: { lat: 32.8798, lng: -117.2365 },
    accessible: true,
    notes: "Existing Price Center east entrance from legacy building data."
  },
  {
    id: "price-center-west",
    buildingId: "price-center",
    name: "West entrance",
    type: "secondary",
    coordinates: { lat: 32.8798, lng: -117.2374 },
    accessible: true,
    notes: ""
  },
  {
    id: "price-center-east-ballroom",
    buildingId: "price-center",
    name: "PC East Ballroom entry",
    type: "event",
    coordinates: { lat: 32.88005, lng: -117.2366 },
    accessible: true,
    notes: ""
  },
  {
    id: "mandeville-main",
    buildingId: "mandeville-center",
    name: "Main entrance",
    type: "main",
    coordinates: { lat: 32.87943, lng: -117.24092 },
    accessible: true,
    notes: ""
  },
  {
    id: "mandeville-lower",
    buildingId: "mandeville-center",
    name: "Lower entrance",
    type: "lower-level",
    coordinates: { lat: 32.87928, lng: -117.24125 },
    accessible: false,
    notes: "Legacy preferred entrance for basement rooms; accessibility needs official verification."
  },
  {
    id: "sixth-college-center",
    buildingId: "sixth-college",
    name: "Sixth College center",
    type: "campus-area",
    coordinates: { lat: 32.88043, lng: -117.24108 },
    accessible: true,
    notes: "College centroid until official entrances/paths are imported."
  },
  {
    id: "csb-main-north",
    buildingId: "csb",
    name: "Main entrance (north)",
    type: "main",
    coordinates: { lat: 32.87875, lng: -117.23901 },
    accessible: true,
    notes: ""
  },
  {
    id: "csb-south",
    buildingId: "csb",
    name: "South entrance",
    type: "secondary",
    coordinates: { lat: 32.8784, lng: -117.23895 },
    accessible: true,
    notes: ""
  },
  {
    id: "mos-ridge-walk",
    buildingId: "mos",
    name: "Main entrance (Ridge Walk)",
    type: "main",
    coordinates: { lat: 32.87995, lng: -117.24118 },
    accessible: true,
    notes: ""
  },
  {
    id: "mos-sixth-courtyard",
    buildingId: "mos",
    name: "Sixth College courtyard entrance",
    type: "courtyard",
    coordinates: { lat: 32.88006, lng: -117.2415 },
    accessible: true,
    notes: ""
  },
  {
    id: "dib-main",
    buildingId: "dib",
    name: "Main entrance",
    type: "main",
    coordinates: { lat: 32.87931, lng: -117.23455 },
    accessible: true,
    notes: ""
  },
  {
    id: "dib-pepper-canyon",
    buildingId: "dib",
    name: "Pepper Canyon entrance",
    type: "secondary",
    coordinates: { lat: 32.87945, lng: -117.23485 },
    accessible: true,
    notes: ""
  },
  {
    id: "cse-voigt",
    buildingId: "cse",
    name: "Main entrance (Voigt Dr)",
    type: "main",
    coordinates: { lat: 32.88155, lng: -117.2337 },
    accessible: true,
    notes: ""
  },
  {
    id: "cse-north",
    buildingId: "cse",
    name: "North entrance",
    type: "secondary",
    coordinates: { lat: 32.8821, lng: -117.23348 },
    accessible: true,
    notes: ""
  },
  {
    id: "fah-west",
    buildingId: "fah",
    name: "Main entrance (west)",
    type: "main",
    coordinates: { lat: 32.882, lng: -117.2339 },
    accessible: true,
    notes: ""
  },
  {
    id: "fah-east",
    buildingId: "fah",
    name: "East entrance",
    type: "secondary",
    coordinates: { lat: 32.88197, lng: -117.2333 },
    accessible: true,
    notes: ""
  },
  {
    id: "warren-lecture-main",
    buildingId: "warren-lecture-hall",
    name: "Main entrance",
    type: "main",
    coordinates: { lat: 32.88172, lng: -117.23505 },
    accessible: true,
    notes: ""
  },
  {
    id: "center-hall-main",
    buildingId: "center-hall",
    name: "Main entrance",
    type: "main",
    coordinates: { lat: 32.87788, lng: -117.23604 },
    accessible: true,
    notes: ""
  },
  {
    id: "peterson-main",
    buildingId: "peterson-hall",
    name: "Main entrance",
    type: "main",
    coordinates: { lat: 32.87895, lng: -117.23855 },
    accessible: true,
    notes: ""
  },
  {
    id: "york-main",
    buildingId: "york-hall",
    name: "Main entrance",
    type: "main",
    coordinates: { lat: 32.87595, lng: -117.24064 },
    accessible: true,
    notes: ""
  },
  {
    id: "apm-main",
    buildingId: "apm",
    name: "Main entrance",
    type: "main",
    coordinates: { lat: 32.87815, lng: -117.24108 },
    accessible: true,
    notes: ""
  },
  {
    id: "pcynh-main",
    buildingId: "pcynh",
    name: "Main entrance",
    type: "main",
    coordinates: { lat: 32.87635, lng: -117.24072 },
    accessible: true,
    notes: ""
  }
];

module.exports = {
  CAMPUS_ENTRANCES,
  default: CAMPUS_ENTRANCES
};
