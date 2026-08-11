import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const campusResolver = require("../lib/campus/resolver.js");
const { createCampusCoverageReport } = require("../lib/campus/coverageReport.js");
const {
  createDestinationIntelligence,
  getNearbyUtilities,
  getRoomsForBuilding,
  UTILITY_CATEGORIES
} = require("../lib/campus/destinationIntelligence.js");
const { createCampusSearchDocuments } = require("../lib/campus/searchDocuments.js");

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
  assert.equal(destination.destinationSource, "entrance-coordinate");
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

test("resolves FAH 1100 as a Franklin Antonio Hall room destination", () => {
  const destination = campusResolver.resolveCampusDestination("FAH 1100");

  assert.equal(destination?.building.id, "fah");
  assert.equal(destination.room.number, "1100");
  assert.equal(destination.entrance.id, "fah-west");
  assertCoordinate(destination.destination);
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
  assert.equal(destination.destinationSource, "entrance-coordinate");
  assert.notDeepEqual(destination.destination, destination.building.centroid);
  assertSameCoordinate(destination.destination, destination.entrance.coordinates);
});

test("room routable coordinates use preferred entrance coordinates instead of building centroids", () => {
  const destination = campusResolver.resolveCampusDestination("MANDE B202");
  assert.equal(destination.destinationSource, "entrance-coordinate");
  assert.equal(destination.entrance.id, "mandeville-lower");
  assert.notDeepEqual(destination.destination, destination.building.centroid);
  assertSameCoordinate(destination.destination, destination.entrance.coordinates);
});

test("entrance routing anchors keep display and routing coordinates separate", () => {
  const destination = campusResolver.resolveCampusDestination("Geisel Library");

  assert.equal(destination.entrance.id, "geisel-library-main");
  assert.equal(destination.destinationSource, "entrance-routing-anchor");
  assertSameCoordinate(destination.displayCoordinate, destination.entrance.coordinates);
  assertSameCoordinate(destination.routingCoordinate, destination.entrance.routingAnchor);
  assert.notDeepEqual(destination.displayCoordinate, destination.routingCoordinate);
});

test("routable coordinate details expose display and routing metadata", () => {
  const details = campusResolver.resolveDestinationToRoutableCoordinateDetails("Geisel Library");

  assert.equal(details.routingCoordinateSource, "entrance-routing-anchor");
  assertSameCoordinate(details.displayCoordinate, { lat: 32.88114, lng: -117.23758 });
  assertSameCoordinate(details.routingCoordinate, { lat: 32.88085, lng: -117.23753 });
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

  assert.equal(resolved.source, "centroid-fallback");
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
  assert.equal(details.source, "entrance-coordinate");
  assert.equal(details.routingCoordinateSource, "entrance-coordinate");
  assert.equal(details.entranceId, "csb-main-north");
  assert.equal(details.buildingId, "csb");
  assert.equal(details.roomId, "csb-115");
  assertCoordinate(details.coordinate);
});

test("seeded classroom records include provisional indoor directions", () => {
  for (const query of ["CSB 115", "MOS 0114", "MANDE B202", "DIB 122"]) {
    const destination = campusResolver.resolveCampusDestination(query);

    assert.equal(destination.indoorDirections?.source, "curated-provisional");
    assert.ok(destination.indoorDirections.summary);
    assert.ok(destination.indoorDirections.steps.length >= 3);
  }
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

test("campus search documents preserve required UI-facing destinations", () => {
  const documents = createCampusSearchDocuments();

  for (const query of ["Geisel Library", "Price Center", "Sixth College"]) {
    assert.ok(documents.some((document) => document.name === query), `${query} search document missing`);
  }

  for (const roomName of ["CSB 115", "MOS 0114", "MANDE B202", "DIB 122"]) {
    assert.ok(documents.some((document) => document.name === roomName), `${roomName} room document missing`);
  }

  assert.ok(documents.some((document) => document.name === "FAH 1100"), "FAH 1100 room document missing");
});

test("campus search documents keep legacy result shape fields", () => {
  const documents = createCampusSearchDocuments();
  const room = documents.find((document) => document.name === "MANDE B202");

  assert.equal(room.destinationId, "mandeville-center");
  assert.equal(room.buildingId, "mandeville-center");
  assert.equal(room.room, "B202");
  assert.equal(room.type, "classroom");
  assert.equal(room.shortName, "MANDE");
  assert.equal(room.buildingCode, "MANDE");
  assert.ok(Array.isArray(room.searchValues));
});

test("resolves Rita Atkinson aliases to the canonical housing record", () => {
  for (const query of ["Rita", "Rita Atkinson", "Rita Atkinson Residences", "Rita L. Atkinson Residences", "RIAT"]) {
    const destination = campusResolver.resolveCampusDestination(query);

    assert.equal(destination?.building.id, "rita-atkinson-residences");
    assert.equal(destination.destinationSource, "centroid-fallback");
    assertCoordinate(destination.destination);
  }
});

test("resolves first-batch Health Sciences destinations", () => {
  for (const query of [
    "Jacobs Medical Center",
    "Moores Cancer Center",
    "Shiley Eye Institute",
    "Perlman Medical Offices",
    "Sulpizio Cardiovascular Center",
    "ACTRI"
  ]) {
    const destination = campusResolver.resolveCampusDestination(query);

    assert.equal(destination?.building.district, "health-sciences");
    assertCoordinate(destination.destination);
  }
});

test("expanded search documents include district and official-name lookup values", () => {
  const documents = createCampusSearchDocuments();
  const rita = documents.find((document) => document.destinationId === "rita-atkinson-residences");
  const jacobs = documents.find((document) => document.destinationId === "jacobs-medical-center");

  assert.ok(rita);
  assert.ok(rita.searchValues.includes("RIAT"));
  assert.ok(rita.searchValues.includes("health-sciences"));
  assert.ok(jacobs);
  assert.ok(jacobs.searchValues.includes("Jacobs Medical Center"));
});

test("housing coverage explicitly discovers all eight undergraduate colleges", () => {
  const report = createCampusCoverageReport();

  assert.equal(report.housing.expectedColleges, 8);
  assert.equal(report.housing.discoveredColleges, 8);
  assert.equal(report.housing.colleges.length, 8);
  assert.ok(report.housing.completeCollegeInventories.endsWith("/8"));
});

test("housing coverage reports imported and pending residential buildings", () => {
  const report = createCampusCoverageReport();
  const revelle = report.housing.colleges.find((college) => college.collegeId === "revelle-college");
  const erc = report.housing.colleges.find((college) => college.collegeId === "roosevelt-college");
  const eighth = report.housing.colleges.find((college) => college.collegeId === "eighth-college");

  assert.ok(revelle);
  assert.ok(revelle.residentialBuildingsDiscovered >= 9);
  assert.ok(revelle.residentialBuildingsImported >= 4);
  assert.ok(revelle.buildingsStillRequiringVerification.includes("Galathea Hall"));
  assert.ok(erc);
  assert.ok(erc.residentialBuildingsDiscovered >= 14);
  assert.ok(erc.residentialBuildingsImported >= 5);
  assert.ok(eighth);
  assert.equal(eighth.residentialBuildingsImported, 0);
  assert.ok(eighth.buildingsStillRequiringVerification.includes("Pulse"));
});

test("housing community search documents distinguish residential entity types", () => {
  const documents = createCampusSearchDocuments();
  const rita = documents.find((document) => document.name === "Rita Atkinson Residences");
  const pepperWest = documents.find((document) => document.name === "Pepper Canyon West");
  const pangea = documents.find((document) => document.name === "Pangea Apartments and Residence Halls");

  assert.equal(rita?.typeLabel, "housing community");
  assert.equal(rita.destinationId, "rita-atkinson-residences");
  assert.equal(pepperWest?.typeLabel, "housing community");
  assert.equal(pepperWest.coordinates, null);
  assert.equal(pangea?.typeLabel, "housing community");
  assert.ok(pangea.searchValues.includes("Pangea Residence Halls"));
});

test("individual residential buildings are searchable when official coordinates are available", () => {
  const documents = createCampusSearchDocuments();

  for (const name of ["Blake Hall", "Tenaya Hall", "Bates Hall", "Africa Hall", "Matthews Apartments A"]) {
    const document = documents.find((entry) => entry.name === name);

    assert.ok(document, `${name} search document missing`);
    assert.ok(["residence hall", "apartment building"].includes(document.typeLabel));
    assertCoordinate(document.coordinates);
  }
});

test("destination intelligence exposes configurable utility categories", () => {
  assert.deepEqual(
    UTILITY_CATEGORIES.map((category) => category.id),
    ["bike-racks", "restrooms", "room-lookup", "food"]
  );
});

test("destination intelligence ranks nearby utilities by destination context", () => {
  const destination = campusResolver.resolveCampusDestination("Price Center");
  const navigationData = {
    building: campusResolver.toLegacyBuilding(destination.building),
    selectedEntrance: destination.entrance,
    routeDetails: {
      destinationLabel: "Price Center",
      destinationType: "student center"
    },
    displayCoordinate: destination.displayCoordinate,
    destination: destination.displayCoordinate
  };
  const restrooms = getNearbyUtilities("restrooms", navigationData);

  assert.equal(restrooms[0]?.id, "restroom-price-center-single-occupancy");
  assert.ok(restrooms[0].distanceMeters < 220);
});

test("destination intelligence room lookup uses known room records only", () => {
  const rooms = getRoomsForBuilding("mandeville-center");

  assert.ok(rooms.some((room) => room.number === "B202"));
  assert.equal(rooms.find((room) => room.number === "B202")?.hasIndoorDirections, true);
  assert.deepEqual(getRoomsForBuilding("center-hall"), []);
});

test("destination intelligence represents unavailable data without inventing it", () => {
  const destination = campusResolver.resolveCampusDestination("MANDE B202");
  const navigationData = {
    building: campusResolver.toLegacyBuilding(destination.building),
    selectedEntrance: destination.entrance,
    indoorDirections: destination.indoorDirections,
    room: destination.room.number,
    routeDetails: {
      destinationLabel: "MANDE B202",
      destinationType: "building"
    },
    displayCoordinate: destination.displayCoordinate,
    destination: destination.destination
  };
  const intelligence = createDestinationIntelligence(navigationData);

  assert.equal(intelligence.destinationName, "MANDE B202");
  assert.equal(intelligence.room, "B202");
  assert.equal(intelligence.selectedEntrance.id, "mandeville-lower");
  assert.ok(intelligence.utilities.food.results.length > 0);
});

test("campus coverage report summarizes first-batch data quality", () => {
  const report = createCampusCoverageReport();

  assert.ok(report.totals.buildings >= 54);
  assert.ok(report.totals.districts >= 8);
  assert.ok(report.buildingsByDistrict["health-sciences"] >= 6);
  assert.ok(report.buildingsByCategory.health >= 5);
  assert.ok(report.completeness.withCentroid >= report.totals.buildings);
  assert.ok(report.gaps.missingEntranceCoordinates.includes("rita-atkinson-residences"));
});
