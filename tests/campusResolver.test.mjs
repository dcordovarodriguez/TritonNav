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
const { normalizeBuildingFeature } = require("../lib/campus/import/normalizeBuildingFeature.js");
const { normalizeEntranceFeature } = require("../lib/campus/import/normalizeEntranceFeature.js");
const { createCampusImportPreview, createCampusImportRun } = require("../lib/campus/import/importDataset.js");
const { matchCampusRecord } = require("../lib/campus/import/matchCampusRecord.js");
const { normalizePathFeature } = require("../lib/campus/import/normalizePathFeature.js");
const { normalizeUtilityFeature } = require("../lib/campus/import/normalizeUtilityFeature.js");
const { validateCampusDataset } = require("../lib/campus/import/validateDataset.js");

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
  assert.ok(report.totals.colleges >= 8);
  assert.ok(report.totals.districts >= 8);
  assert.ok(report.totals.utilities >= 1);
  assert.ok(report.buildingsByDistrict["health-sciences"] >= 6);
  assert.ok(report.buildingsByCategory.health >= 5);
  assert.ok(report.completeness.withCentroid >= report.totals.buildings);
  assert.ok(report.sourceStatus.buildings);
  assert.equal(report.buildings.discovered, report.totals.buildings);
  assert.ok(report.buildings.verified >= 1);
  assert.equal(report.entrances.total, report.totals.entrances);
  assert.ok(report.entrances.buildingsWithZeroVerifiedEntrances.includes("geisel-library"));
  assert.equal(report.accessibility.elevators.status, "not-imported");
  assert.ok(report.utilities["bike-racks"].provisional >= 1);
  assert.equal(report.paths.importedPedestrianSegments, 0);
  assert.ok(report.readiness.highestImpactMissingDatasets.includes("official entrance points with accessibility metadata"));
  assert.equal(report.paths.currentSource, "OSM extract routed by Valhalla");
  assert.ok(report.gaps.missingEntranceCoordinates.includes("rita-atkinson-residences"));
});

test("GIS building GeoJSON can normalize into the campus building schema", () => {
  const building = normalizeBuildingFeature(
    {
      type: "Feature",
      properties: {
        building_id: "GIS-101",
        building_name: "GIS Test Hall",
        building_code: "GIST",
        aliases: "Test Hall;Official GIS Hall",
        type: "Academic Building",
        address: "9500 Gilman Dr",
        dataset: "campus-buildings",
        verified: true,
        confidence: "official"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-117.2378, 32.881],
            [-117.2376, 32.881],
            [-117.2376, 32.8812],
            [-117.2378, 32.8812],
            [-117.2378, 32.881]
          ]
        ]
      }
    },
    {
      source: {
        authority: "UC San Diego",
        sourceType: "arcgis-feature-service",
        status: "official",
        sourceUrl: "https://example.ucsd.edu/FeatureServer/0",
        verified: true,
        confidence: "official"
      }
    }
  );

  assert.equal(building.id, "gis-101");
  assert.equal(building.name, "GIS Test Hall");
  assert.equal(building.code, "GIST");
  assert.deepEqual(building.aliases, ["Test Hall", "Official GIS Hall"]);
  assertCoordinate(building.centroid);
  assert.equal(building.source.authority, "UC San Diego");
  assert.equal(building.source.status, "official");
});

test("GIS entrance GeoJSON can normalize into the campus entrance schema", () => {
  const entrance = normalizeEntranceFeature({
    type: "Feature",
    properties: {
      entrance_id: "GIS-101-main",
      building_id: "gis-101",
      entrance_name: "Main south entrance",
      entrance_type: "main",
      accessible: "yes",
      public_access: "true",
      has_stairs: "no",
      door_notes: "Public entrance from Library Walk",
      confidence: "official"
    },
    geometry: {
      type: "Point",
      coordinates: [-117.2377, 32.88105]
    }
  });

  assert.equal(entrance.id, "gis-101-main");
  assert.equal(entrance.buildingId, "gis-101");
  assert.equal(entrance.accessible, true);
  assert.equal(entrance.publicAccess, true);
  assert.equal(entrance.stairs, false);
  assertCoordinate(entrance.coordinates);
});

test("GIS pedestrian path and utility features normalize without touching runtime routing", () => {
  const path = normalizePathFeature({
    type: "Feature",
    properties: {
      path_id: "walk-1",
      name: "Library Walk sample",
      surface: "concrete",
      stairs: "false",
      accessible: "true"
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [-117.2378, 32.8808],
        [-117.2372, 32.8809]
      ]
    }
  });
  const utility = normalizeUtilityFeature({
    type: "Feature",
    properties: {
      utility_id: "rack-1",
      category: "bike-racks",
      name: "Sample bike rack",
      related_building_ids: "geisel-library;price-center"
    },
    geometry: {
      type: "Point",
      coordinates: [-117.2377, 32.88082]
    }
  });

  assert.equal(path.id, "walk-1");
  assert.equal(path.geometry.length, 2);
  assert.equal(path.accessible, true);
  assert.equal(utility.id, "rack-1");
  assert.equal(utility.categoryId, "bike-racks");
  assert.deepEqual(utility.relatedBuildingIds, ["geisel-library", "price-center"]);
});

test("campus GIS dataset validation rejects malformed required inputs", () => {
  const validation = validateCampusDataset({
    id: "bad-buildings",
    entityType: "building",
    required: true,
    input: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { building_name: "Broken Hall" }
        }
      ]
    }
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("missing geometry")));
});

test("official building imports can supersede provisional records by stable code match", () => {
  const preview = createCampusImportPreview({
    id: "official-buildings",
    entityType: "building",
    source: {
      authority: "UC San Diego",
      status: "official",
      sourceType: "geojson",
      confidence: "official",
      verified: true
    },
    input: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            building_id: "UCSD-GEISEL",
            building_name: "Geisel Library",
            building_code: "GEISEL"
          },
          geometry: {
            type: "Point",
            coordinates: [-117.23758, 32.88114]
          }
        }
      ]
    }
  });

  assert.equal(preview.valid, true);
  assert.equal(preview.summary.normalized, 1);
  assert.equal(preview.summary.supersede, 1);
  assert.equal(preview.matches[0].matchId, "geisel-library");
  assert.equal(preview.normalized[0].source.status, "official");
});

test("ambiguous GIS matches require review instead of silent merging", () => {
  const match = matchCampusRecord(
    { id: "new-record", name: "Alpha Hall", aliases: ["shared"], code: "" },
    [
      { id: "alpha-one", name: "Alpha One", aliases: ["shared"], code: "" },
      { id: "alpha-two", name: "Alpha Two", aliases: ["shared"], code: "" }
    ],
    "building"
  );

  assert.equal(match.action, "review");
  assert.equal(match.reason, "ambiguous-match");
  assert.deepEqual(match.candidates.map((candidate) => candidate.record.id), ["alpha-one", "alpha-two"]);
});

test("campus GIS import runs summarize create, supersede, and rejected records", () => {
  const run = createCampusImportRun({
    source: {
      authority: "UC San Diego",
      status: "official",
      sourceType: "geojson",
      confidence: "official"
    },
    datasets: [
      {
        id: "buildings",
        entityType: "building",
        input: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                building_name: "Geisel Library",
                building_code: "GEISEL"
              },
              geometry: { type: "Point", coordinates: [-117.23758, 32.88114] }
            },
            {
              type: "Feature",
              properties: {
                building_id: "NEW-101",
                building_name: "New Official Test Building"
              },
              geometry: { type: "Point", coordinates: [-117.238, 32.881] }
            },
            {
              type: "Feature",
              properties: {
                building_id: "NO-GEOMETRY",
                building_name: "Missing Geometry"
              },
              geometry: null
            }
          ]
        }
      }
    ]
  });

  assert.equal(run.datasetCount, 1);
  assert.equal(run.summary.features, 3);
  assert.equal(run.summary.normalized, 0);
  assert.equal(run.previews[0].valid, false);
  assert.ok(run.previews[0].validation.errors.some((error) => error.includes("missing geometry")));
});
