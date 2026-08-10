const VERIFIED_AT = "2026-08-10";

function officialMapSource(markerId) {
  return {
    authority: "UC San Diego",
    sourceType: "campus-map",
    url: `https://m.ucsd.edu/maps/static/location/${markerId}?query=`,
    retrievedAt: VERIFIED_AT,
    confidence: "official"
  };
}

function curatedProvisionalSource(note) {
  return {
    authority: "TritonNav",
    sourceType: "curated-provisional",
    note,
    retrievedAt: VERIFIED_AT,
    confidence: "provisional"
  };
}

const UTILITY_CATEGORIES = [
  {
    id: "bike-racks",
    label: "Bike Racks",
    shortLabel: "Bike",
    iconLabel: "B",
    mapLayer: true,
    description: "Nearby bike parking anchors. Official rack inventory still needs import."
  },
  {
    id: "restrooms",
    label: "Restrooms",
    shortLabel: "Restrooms",
    iconLabel: "R",
    mapLayer: true,
    description: "Single-occupancy restroom records from UC San Diego MapLink where available."
  },
  {
    id: "room-lookup",
    label: "Room Lookup",
    shortLabel: "Rooms",
    iconLabel: "#",
    mapLayer: false,
    description: "Known room records inside the selected building."
  },
  {
    id: "food",
    label: "Coffee / Food",
    shortLabel: "Food",
    iconLabel: "F",
    mapLayer: true,
    description: "Dining and market destinations from UC San Diego MapLink and HDH references."
  }
];

const CAMPUS_UTILITIES = [
  {
    id: "bike-geisel-south",
    categoryId: "bike-racks",
    name: "Geisel Library south bike parking",
    type: "Bike Rack",
    coordinates: { lat: 32.88082, lng: -117.2377 },
    relatedBuildingIds: ["geisel-library"],
    verificationStatus: "provisional",
    source: curatedProvisionalSource("Approximate bike-parking anchor pending official rack inventory import.")
  },
  {
    id: "bike-price-center-east",
    categoryId: "bike-racks",
    name: "Price Center east bike parking",
    type: "Bike Rack",
    coordinates: { lat: 32.87954, lng: -117.23586 },
    relatedBuildingIds: ["price-center"],
    verificationStatus: "provisional",
    source: curatedProvisionalSource("Approximate bike-parking anchor pending official rack inventory import.")
  },
  {
    id: "bike-sixth-ridge-walk",
    categoryId: "bike-racks",
    name: "Sixth College Ridge Walk bike parking",
    type: "Bike Rack",
    coordinates: { lat: 32.88008, lng: -117.24105 },
    relatedBuildingIds: ["sixth-college", "mos"],
    verificationStatus: "provisional",
    source: curatedProvisionalSource("Approximate bike-parking anchor pending official rack inventory import.")
  },
  {
    id: "restroom-price-center-single-occupancy",
    categoryId: "restrooms",
    name: "Single Occupancy Bathroom - Price Center",
    type: "Restroom",
    coordinates: { lat: 32.879630000000006, lng: -117.23581999999999 },
    relatedBuildingIds: ["price-center"],
    verificationStatus: "official-map",
    source: officialMapSource("1701434107989046")
  },
  {
    id: "restroom-cafe-ventanas-single-occupancy",
    categoryId: "restrooms",
    name: "Single Occupancy Bathroom - Cafe Ventanas",
    type: "Restroom",
    coordinates: { lat: 32.88608, lng: -117.24272000000002 },
    relatedBuildingIds: ["erc-africa-hall", "roosevelt-college-administration"],
    verificationStatus: "official-map",
    source: officialMapSource("1701434107988551")
  },
  {
    id: "restroom-canyon-vista-single-occupancy",
    categoryId: "restrooms",
    name: "Single Occupancy Bathroom - Canyon Vista",
    type: "Restroom",
    coordinates: { lat: 32.88402, lng: -117.23324000000002 },
    relatedBuildingIds: ["warren-canyon-vista"],
    verificationStatus: "official-map",
    source: officialMapSource("1701434107986530")
  },
  {
    id: "food-sunshine-market",
    categoryId: "food",
    name: "Sunshine Market",
    type: "Market",
    coordinates: { lat: 32.8795, lng: -117.23608 },
    relatedBuildingIds: ["price-center"],
    verificationStatus: "official-map",
    source: officialMapSource("650")
  },
  {
    id: "food-sixth-place-market",
    categoryId: "food",
    name: "Sixth College Place and Market",
    type: "Dining / Market",
    coordinates: { lat: 32.87916, lng: -117.231 },
    relatedBuildingIds: ["sixth-restaurants-market", "sixth-college", "mos"],
    verificationStatus: "official-map",
    source: officialMapSource("2121308678939844")
  },
  {
    id: "food-roots",
    categoryId: "food",
    name: "Roots",
    type: "Food",
    coordinates: { lat: 32.87889, lng: -117.24255 },
    relatedBuildingIds: ["muir-college-administration", "muir-tenaya-hall"],
    verificationStatus: "official-map",
    source: officialMapSource("1431320232615444")
  },
  {
    id: "food-cafe-ventanas",
    categoryId: "food",
    name: "Cafe Ventanas",
    type: "Dining",
    coordinates: { lat: 32.88619, lng: -117.24303 },
    relatedBuildingIds: ["erc-africa-hall", "roosevelt-college-administration"],
    verificationStatus: "official-map",
    source: officialMapSource("2121299502320008")
  },
  {
    id: "food-canyon-vista",
    categoryId: "food",
    name: "Canyon Vista",
    type: "Dining",
    coordinates: { lat: 32.88409, lng: -117.2334 },
    relatedBuildingIds: ["warren-canyon-vista"],
    verificationStatus: "official-map",
    source: officialMapSource("682")
  },
  {
    id: "food-earls-place-market",
    categoryId: "food",
    name: "Earl's Place and Market",
    type: "Market",
    coordinates: { lat: 32.8842, lng: -117.2332 },
    relatedBuildingIds: ["warren-canyon-vista"],
    verificationStatus: "official-map",
    source: officialMapSource("683")
  }
];

module.exports = {
  CAMPUS_UTILITIES,
  UTILITY_CATEGORIES,
  default: {
    categories: UTILITY_CATEGORIES,
    utilities: CAMPUS_UTILITIES
  }
};
