const UCSD_LOCATIONS = [
  {
    id: "csb",
    name: "Cognitive Science Building",
    aliases: ["cognitive science", "cogs building", "cogs", "cognitive science bldg"],
    type: "building",
    shortName: "CSB",
    buildingCode: "CSB",
    coordinates: { lat: 32.87858, lng: -117.23901 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    nearbyLandmarks: ["Ridge Walk", "Social Sciences Public Engagement Building"]
  },
  {
    id: "cse",
    name: "Computer Science and Engineering Building",
    aliases: ["computer science", "computer science building", "engineering building", "jacobs school"],
    type: "building",
    shortName: "CSE",
    buildingCode: "CSE",
    coordinates: { lat: 32.88175, lng: -117.23353 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    nearbyLandmarks: ["Franklin Antonio Hall", "Warren Mall"]
  },
  {
    id: "fah",
    name: "Franklin Antonio Hall",
    aliases: ["antonio hall", "franklin hall", "franklin antonio", "jacobs hall"],
    type: "building",
    shortName: "FAH",
    buildingCode: "FAH",
    coordinates: { lat: 32.88197, lng: -117.23364 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    nearbyLandmarks: ["Warren Mall", "Computer Science and Engineering Building"]
  },
  {
    id: "mos",
    name: "Mosaic",
    aliases: ["mosaic building", "mosaic hall", "mos college building", "sixth mosaic"],
    type: "building",
    shortName: "MOS",
    buildingCode: "MOS",
    coordinates: { lat: 32.87995, lng: -117.24137 },
    address: "9510 Innovation Ln, La Jolla, CA 92093",
    nearbyLandmarks: ["Sixth College", "Ridge Walk", "Catalyst"]
  },
  {
    id: "dib",
    name: "Design and Innovation Building",
    aliases: ["design innovation", "design and innovation", "innovation building", "dib"],
    type: "building",
    shortName: "DIB",
    buildingCode: "DIB",
    coordinates: { lat: 32.87934, lng: -117.23468 },
    address: "9510 Innovation Ln, La Jolla, CA 92093",
    nearbyLandmarks: ["Pepper Canyon", "UC San Diego Design Lab"]
  },
  {
    id: "price-center",
    name: "Price Center",
    aliases: ["pc", "price", "price center east", "price center west", "student center"],
    type: "student center",
    shortName: "PC",
    buildingCode: "PC",
    coordinates: { lat: 32.8798, lng: -117.23695 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    nearbyLandmarks: ["Sun God Lawn", "Matthews Quad"]
  },
  {
    id: "mandeville-center",
    name: "Mandeville Center",
    aliases: ["mandeville", "mande", "mandeville auditorium", "mandeville art gallery"],
    type: "building",
    shortName: "MANDE",
    buildingCode: "MANDE",
    coordinates: { lat: 32.87943, lng: -117.2411 },
    address: "Mandeville Ln, La Jolla, CA 92093",
    nearbyLandmarks: ["Mandeville Auditorium", "Visual Arts Facility", "Ridge Walk"]
  },
  {
    id: "geisel-library",
    name: "Geisel Library",
    aliases: ["geisel", "library", "ucsd library", "main library"],
    type: "library",
    shortName: "Geisel",
    buildingCode: "GEISEL",
    coordinates: { lat: 32.88114, lng: -117.23758 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    nearbyLandmarks: ["Library Walk", "Silent Tree"]
  },
  {
    id: "sixth-college",
    name: "Sixth College",
    aliases: ["sixth", "sixth college neighborhood", "new sixth", "sixth college campus"],
    type: "college",
    shortName: "Sixth",
    buildingCode: "SIXTH",
    coordinates: { lat: 32.88043, lng: -117.24108 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    nearbyLandmarks: ["Mosaic", "Catalyst", "Ridge Walk"]
  },
  {
    id: "muir-college",
    name: "John Muir College",
    aliases: ["muir", "muir college", "john muir", "muir campus"],
    type: "college",
    shortName: "Muir",
    buildingCode: "MUIR",
    coordinates: { lat: 32.87819, lng: -117.24284 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    nearbyLandmarks: ["Muir Quad", "Mandeville Center"]
  },
  {
    id: "sixth-college-parking",
    name: "Sixth College Parking",
    aliases: ["sixth parking", "sixth college garage", "sixth garage", "parking sixth"],
    type: "parking",
    shortName: "Sixth Parking",
    buildingCode: "P602",
    coordinates: { lat: 32.88128, lng: -117.24041 },
    address: "9550 Scholars Dr N, La Jolla, CA 92093",
    nearbyLandmarks: ["Sixth College", "Jeannie Auditorium"]
  },
  {
    id: "rita-atkinson-residences",
    name: "Rita Atkinson Residences",
    aliases: ["rita atkinson", "rita", "atkinson residences", "rar"],
    type: "residence",
    shortName: "Rita Atkinson",
    buildingCode: "RAR",
    coordinates: { lat: 32.87574, lng: -117.22673 },
    address: "9999 Health Sciences Dr, La Jolla, CA 92093",
    nearbyLandmarks: ["School of Medicine", "UC San Diego Health"]
  }
];

export function getAllLocations() {
  return UCSD_LOCATIONS;
}

export function getLocationById(id) {
  if (!id) return null;
  return (
    UCSD_LOCATIONS.find((location) => location.id.toLowerCase() === String(id).toLowerCase()) ??
    null
  );
}

export function getLocationByShortName(value) {
  if (!value) return null;
  const normalizedValue = String(value).toLowerCase();

  return (
    UCSD_LOCATIONS.find(
      (location) =>
        location.shortName?.toLowerCase() === normalizedValue ||
        location.buildingCode?.toLowerCase() === normalizedValue
    ) ?? null
  );
}

export default UCSD_LOCATIONS;
