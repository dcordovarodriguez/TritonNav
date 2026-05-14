import {
  getAllBuildings,
  getBuildingById,
  getBuildingByShortName,
  getDestinationCoords,
  getRoomDirections
} from "@/lib/buildings";
import { createGoogleMapsDirectionsUrl } from "@/services/mapsService";

export function resolveBuilding(buildingInput) {
  if (!buildingInput) return null;
  return getBuildingById(buildingInput) ?? getBuildingByShortName(buildingInput);
}

export function getNavigationData(buildingInput, roomNumber, origin = null) {
  const building = resolveBuilding(buildingInput);
  if (!building) return null;

  const normalizedRoom = roomNumber ? decodeURIComponent(String(roomNumber)).trim() : "";
  const destination = getDestinationCoords(building.id, normalizedRoom);
  const instructions =
    getRoomDirections(building.id, normalizedRoom) ??
    `Arrive at ${building.name} and use the main entrance.`;

  const roomMatch = building.rooms.find((room) => room.number === normalizedRoom);
  const entranceLabel =
    roomMatch?.nearestEntrance ??
    building.entrances[0]?.label ??
    "main entrance";

  return {
    building,
    room: normalizedRoom,
    destination,
    instructions,
    matchedBy: building.id === buildingInput ? "building id" : "short name",
    googleMapsUrl: createGoogleMapsDirectionsUrl({ destination, origin }),
    steps: [
      `Walk or ride to ${building.name}.`,
      `Use Google Maps to reach the ${entranceLabel}.`,
      instructions
    ]
  };
}

export function searchCampusLocations(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return getAllBuildings().map((building) => ({
      key: building.id,
      name: building.name,
      shortName: building.shortName,
      description: `${building.address} • ${building.rooms.length} seeded rooms`,
      href: `/navigation?building=${building.id}`
    }));
  }

  const results = [];

  getAllBuildings().forEach((building) => {
    const buildingText = `${building.name} ${building.shortName} ${building.id}`.toLowerCase();

    if (buildingText.includes(normalizedQuery)) {
      results.push({
        key: building.id,
        name: building.name,
        shortName: building.shortName,
        description: `${building.address} • building match`,
        href: `/navigation?building=${building.id}`
      });
    }

    building.rooms.forEach((room) => {
      const roomText = `${building.shortName} ${room.number} ${building.name}`.toLowerCase();
      if (roomText.includes(normalizedQuery)) {
        results.push({
          key: `${building.id}-${room.number}`,
          name: `${building.name} ${room.number}`,
          shortName: building.shortName,
          description: `Room ${room.number} • floor ${room.floor}`,
          href: `/navigation?building=${building.id}&room=${encodeURIComponent(room.number)}`
        });
      }
    });
  });

  return results.slice(0, 12);
}
