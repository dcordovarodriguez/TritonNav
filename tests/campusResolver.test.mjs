import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const campusResolver = require("../lib/campus/resolver.js");

function assertCoordinate(coordinate) {
  assert.equal(typeof coordinate?.lat, "number");
  assert.equal(typeof coordinate?.lng, "number");
  assert.ok(coordinate.lat > 32.87 && coordinate.lat < 32.89);
  assert.ok(coordinate.lng < -117.22 && coordinate.lng > -117.25);
}

function assertSameCoordinate(actual, expected) {
  assert.equal(actual?.lat, expected?.lat);
  assert.equal(actual?.lng, expected?.lng);
}

test("resolves GEISEL by building code", () => {
  const building = campusResolver.resolveBuilding("GEISEL");
  assert.equal(building?.id, "geisel-library");
  assert.equal(building.code, "GEISEL");
});

test("resolves Geisel Library by building name", () => {
  const building = campusResolver.resolveBuildingByName("Geisel Library");
  assert.equal(building?.id, "geisel-library");
});

test("resolves Price Center by name", () => {
  const destination = campusResolver.resolveCampusDestination("Price Center");
  assert.equal(destination?.building.id, "price-center");
  assert.equal(destination.kind, "building");
  assertCoordinate(destination.destination);
  assert.equal(destination.destinationSource, "entrance");
  assert.equal(destination.entrance.id, "price-center-east-main");
});

test("resolves MANDE B202 as a room destination", () => {
  const destination = campusResolver.resolveCampusDestination("MANDE B202");
  assert.equal(destination?.building.id, "mandeville-center");
  assert.equal(destination.room.number, "B202");
  assert.equal(destination.entrance.id, "mandeville-lower");
});

test("resolves CSB 115 as a room destination", () => {
  const destination = campusResolver.resolveCampusDestination("CSB 115");
  assert.equal(destination?.building.id, "csb");
  assert.equal(destination.room.number, "115");
  assert.equal(destination.entrance.id, "csb-main-north");
});

test("resolves MOS 0114 as a room destination", () => {
  const destination = campusResolver.resolveCampusDestination("MOS 0114");
  assert.equal(destination?.building.id, "mos");
  assert.equal(destination.room.number, "0114");
  assert.equal(destination.entrance.id, "mos-ridge-walk");
});

test("resolves DIB 122 as a room destination", () => {
  const destination = campusResolver.resolveCampusDestination("DIB 122");
  assert.equal(destination?.building.id, "dib");
  assert.equal(destination.room.number, "122");
  assert.equal(destination.entrance.id, "dib-main");
});

test("resolves Sixth College", () => {
  const destination = campusResolver.resolveCampusDestination("Sixth College");
  assert.equal(destination?.building.id, "sixth-college");
  assert.equal(destination.kind, "college");
  assertCoordinate(destination.destination);
});

test("supports alias resolution", () => {
  assert.equal(campusResolver.resolveBuildingByAlias("mande")?.id, "mandeville-center");
  assert.equal(campusResolver.resolveBuildingByAlias("main library")?.id, "geisel-library");
});

test("supports building-code resolution", () => {
  assert.equal(campusResolver.resolveBuildingByCode("PC")?.id, "price-center");
  assert.equal(campusResolver.resolveBuildingByCode("MOS")?.id, "mos");
});

test("resolves a room to its building", () => {
  const building = campusResolver.resolveRoomToBuilding("MANDE B202");
  assert.equal(building?.id, "mandeville-center");
});

test("resolves a room to its preferred entrance", () => {
  const entrance = campusResolver.resolveRoomToPreferredEntrance("CSB 115");
  assert.equal(entrance?.id, "csb-main-north");
  assertCoordinate(entrance.coordinates);
});

test("resolves supported destinations to routable coordinates", () => {
  for (const query of [
    "GEISEL",
    "Price Center",
    "MANDE B202",
    "CSB 115",
    "MOS 0114",
    "DIB 122",
    "Sixth College"
  ]) {
    assertCoordinate(campusResolver.resolveDestinationToRoutableCoordinate(query));
  }
});

test("building destinations use preferred entrance coordinates instead of centroids", () => {
  const destination = campusResolver.resolveCampusDestination("Price Center");
  assert.equal(destination.destinationSource, "entrance");
  assert.notDeepEqual(destination.destination, destination.building.centroid);
  assertSameCoordinate(destination.destination, destination.entrance.coordinates);
});

test("room routable coordinates use preferred entrance coordinates instead of building centroids", () => {
  const destination = campusResolver.resolveCampusDestination("MANDE B202");
  assert.equal(destination.destinationSource, "entrance");
  assert.equal(destination.entrance.id, "mandeville-lower");
  assert.notDeepEqual(destination.destination, destination.building.centroid);
  assertSameCoordinate(destination.destination, destination.entrance.coordinates);
});

test("room without its own preferred entrance inherits the building default entrance", () => {
  const room = {
    id: "test-room",
    buildingId: "test-building",
    number: "101",
    preferredEntranceId: ""
  };
  const entrances = [
    {
      id: "test-secondary",
      buildingId: "test-building",
      type: "secondary",
      accessible: true,
      coordinates: { lat: 32.8801, lng: -117.2401 }
    },
    {
      id: "test-main",
      buildingId: "test-building",
      type: "main",
      accessible: true,
      coordinates: { lat: 32.8802, lng: -117.2402 }
    }
  ];

  assert.equal(campusResolver.selectEntranceForRoom(room, entrances)?.id, "test-main");
});

test("building routable coordinate falls back to centroid when no valid entrance exists", () => {
  const building = {
    id: "test-building",
    centroid: { lat: 32.8805, lng: -117.2405 }
  };

  const resolved = campusResolver.resolveRoutableCoordinateForBuilding(building, {
    id: "bad-entrance",
    buildingId: "test-building",
    coordinates: { lat: Number.NaN, lng: -117.2404 }
  });

  assert.equal(resolved.source, "centroid");
  assertSameCoordinate(resolved.coordinates, building.centroid);
});

test("invalid or mismatched entrance references fail safely to the building entrance", () => {
  const room = {
    id: "test-room",
    buildingId: "test-building",
    number: "101",
    preferredEntranceId: "wrong-building-entrance"
  };
  const entrances = [
    {
      id: "wrong-building-entrance",
      buildingId: "other-building",
      type: "main",
      accessible: true,
      coordinates: { lat: 32.881, lng: -117.241 }
    },
    {
      id: "safe-building-entrance",
      buildingId: "test-building",
      type: "main",
      accessible: true,
      coordinates: { lat: 32.882, lng: -117.242 }
    }
  ];

  assert.equal(campusResolver.selectEntranceForRoom(room, entrances)?.id, "safe-building-entrance");
});

test("routable coordinate details identify entrance versus centroid source", () => {
  const details = campusResolver.resolveDestinationToRoutableCoordinateDetails("CSB 115");
  assert.equal(details.source, "entrance");
  assert.equal(details.entranceId, "csb-main-north");
  assert.equal(details.buildingId, "csb");
  assert.equal(details.roomId, "csb-115");
  assertCoordinate(details.coordinate);
});

test("legacy building shape remains compatible for navigation consumers", () => {
  const legacyBuilding = campusResolver.toLegacyBuilding(campusResolver.resolveBuilding("DIB"));
  assert.equal(legacyBuilding.id, "dib");
  assert.equal(legacyBuilding.shortName, "DIB");
  assertCoordinate(legacyBuilding.coords);
  assert.ok(Array.isArray(legacyBuilding.entrances));
  assert.ok(Array.isArray(legacyBuilding.rooms));
  assert.equal(legacyBuilding.rooms.find((room) => room.number === "122")?.nearestEntrance, "Main entrance");
});
