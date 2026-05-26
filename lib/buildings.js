/**
 * buildings.js
 * UCSD Campus Building Coordinates & Room Data
 *
 * Each building entry contains:
 *  - id:          unique slug used in routing
 *  - name:        full official building name
 *  - shortName:   abbreviation shown in course schedules (e.g. WebReg)
 *  - coords:      { lat, lng } of the main entrance
 *  - address:     street address for Google Maps fallback
 *  - entrances:   named entrances with their own coords (for precise routing)
 *  - rooms:       known rooms with optional per-room entrance hint
 *  - image:       placeholder path - swap with your actual building photos
 */

const UCSD_BUILDINGS = [
  {
    id: "csb",
    name: "Cognitive Science Building",
    shortName: "CSB",
    coords: { lat: 32.87858, lng: -117.23901 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    entrances: [
      { label: "Main entrance (north)", coords: { lat: 32.87875, lng: -117.23901 } },
      { label: "South entrance", coords: { lat: 32.8784, lng: -117.23895 } }
    ],
    rooms: [
      { number: "001", floor: 0, nearestEntrance: "South entrance" },
      { number: "002", floor: 0, nearestEntrance: "South entrance" },
      { number: "100", floor: 1, nearestEntrance: "Main entrance (north)" },
      { number: "115", floor: 1, nearestEntrance: "Main entrance (north)" },
      { number: "255", floor: 2, nearestEntrance: "Main entrance (north)" }
    ],
    image: "/images/buildings/csb.jpg"
  },
  {
    id: "fah",
    name: "Franklin Antonio Hall",
    shortName: "FAH",
    coords: { lat: 32.88197, lng: -117.23364 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    entrances: [
      { label: "Main entrance (west)", coords: { lat: 32.882, lng: -117.2339 } },
      { label: "East entrance", coords: { lat: 32.88197, lng: -117.2333 } }
    ],
    rooms: [
      { number: "1100", floor: 1, nearestEntrance: "Main entrance (west)" },
      { number: "1301", floor: 1, nearestEntrance: "Main entrance (west)" },
      { number: "1450", floor: 1, nearestEntrance: "East entrance" },
      { number: "2100", floor: 2, nearestEntrance: "Main entrance (west)" },
      { number: "3100", floor: 3, nearestEntrance: "Main entrance (west)" }
    ],
    image: "/images/buildings/fah.jpg"
  },
  {
    id: "cse",
    name: "Computer Science and Engineering Building",
    shortName: "CSE",
    coords: { lat: 32.88175, lng: -117.23353 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    entrances: [
      { label: "Main entrance (Voigt Dr)", coords: { lat: 32.88155, lng: -117.2337 } },
      { label: "North entrance", coords: { lat: 32.8821, lng: -117.23348 } }
    ],
    rooms: [
      { number: "1202", floor: 1, nearestEntrance: "Main entrance (Voigt Dr)" },
      { number: "2154", floor: 2, nearestEntrance: "Main entrance (Voigt Dr)" },
      { number: "3109", floor: 3, nearestEntrance: "North entrance" },
      { number: "4140", floor: 4, nearestEntrance: "North entrance" }
    ],
    image: "/images/buildings/cse.jpg"
  },
  {
    id: "pcynh",
    name: "Pepper Canyon Hall",
    shortName: "PCYNH",
    coords: { lat: 32.87622, lng: -117.24072 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    entrances: [
      { label: "Main entrance", coords: { lat: 32.87635, lng: -117.24072 } },
      { label: "Lower entrance", coords: { lat: 32.87605, lng: -117.2406 } }
    ],
    rooms: [
      { number: "106", floor: 1, nearestEntrance: "Main entrance" },
      { number: "109", floor: 1, nearestEntrance: "Main entrance" },
      { number: "120", floor: 1, nearestEntrance: "Main entrance" },
      { number: "122", floor: 1, nearestEntrance: "Main entrance" },
      { number: "218", floor: 2, nearestEntrance: "Main entrance" }
    ],
    image: "/images/buildings/pcynh.jpg"
  },
  {
    id: "price-center",
    name: "Price Center",
    shortName: "PC",
    coords: { lat: 32.8798, lng: -117.23695 },
    address: "9500 Gilman Dr, La Jolla, CA 92093",
    entrances: [
      { label: "East entrance (main)", coords: { lat: 32.8798, lng: -117.2365 } },
      { label: "West entrance", coords: { lat: 32.8798, lng: -117.2374 } },
      { label: "PC East Ballroom entry", coords: { lat: 32.88005, lng: -117.2366 } }
    ],
    rooms: [
      { number: "East Ballroom", floor: 2, nearestEntrance: "PC East Ballroom entry" },
      { number: "West Ballroom", floor: 2, nearestEntrance: "West entrance" },
      { number: "Theatre", floor: 1, nearestEntrance: "East entrance (main)" },
      { number: "Food Court", floor: 1, nearestEntrance: "East entrance (main)" }
    ],
    image: "/images/buildings/price-center.jpg"
  }
];

export function getRoomDirections(buildingId, roomNumber) {
  const building = getBuildingById(buildingId);
  if (!building) return null;

  const room = building.rooms.find((entry) => entry.number === String(roomNumber));
  if (!room) {
    return `Enter ${building.name} and look for room ${roomNumber} on the directory near the entrance.`;
  }

  const floorLabel =
    room.floor === 0
      ? "basement level"
      : room.floor === 1
        ? "ground floor"
        : `floor ${room.floor}`;

  const entranceHint = room.nearestEntrance
    ? `Enter via the ${room.nearestEntrance}.`
    : "Enter through the main entrance.";

  return `${entranceHint} Head to the ${floorLabel} and proceed to room ${room.number}.`;
}

export function getBuildingById(id) {
  return UCSD_BUILDINGS.find((building) => building.id === id) ?? null;
}

export function getBuildingByShortName(shortName) {
  return (
    UCSD_BUILDINGS.find(
      (building) => building.shortName.toLowerCase() === shortName.toLowerCase()
    ) ?? null
  );
}

export function getDestinationCoords(buildingId, roomNumber) {
  const building = getBuildingById(buildingId);
  if (!building) return null;

  const room = building.rooms.find((entry) => entry.number === String(roomNumber));
  if (room?.nearestEntrance) {
    const entrance = building.entrances.find((entry) => entry.label === room.nearestEntrance);
    if (entrance) return entrance.coords;
  }

  return building.entrances[0]?.coords ?? building.coords;
}

export function getAllBuildings() {
  return UCSD_BUILDINGS;
}

export function getBuildingByName(name) {
  if (!name) return null;

  return (
    UCSD_BUILDINGS.find((building) => building.name.toLowerCase() === String(name).toLowerCase()) ??
    null
  );
}

export default UCSD_BUILDINGS;
