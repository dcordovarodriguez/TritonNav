import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  INDOOR_ACCESSIBILITY_STATUS,
  INDOOR_EDGE_TYPES,
  INDOOR_NODE_TYPES,
  createIndoorCoverageReport,
  createIndoorDirectionsStep,
  createIndoorRoute,
  createOutdoorIndoorTransition,
  composeIndoorOutdoorRoute,
  getIndoorBuilding,
  getIndoorEntranceNodeForOutdoorEntrance,
  resolveIndoorDestination,
  validateIndoorDataset,
  validateIndoorEdge,
  validateIndoorNode
} = require("../lib/campus/indoor/index.js");
const {
  importIndoorBuilding,
  normalizeFloorFeature,
  normalizeIndoorEdgeFeature,
  normalizeIndoorNodeFeature,
  normalizeRoomFeature,
  normalizeVerticalConnection
} = require("../lib/campus/import/indoor/index.js");
const campusResolver = require("../lib/campus/resolver.js");
const { createDestinationIntelligence } = require("../lib/campus/destinationIntelligence.js");

const TEST_SOURCE = {
  authority: "Synthetic TritonNav test fixture",
  dataset: "Indoor graph unit test only",
  status: "synthetic-test-only",
  sourceType: "test-fixture",
  verified: false,
  confidence: "synthetic-test-only",
  notes: "Synthetic geometry used only to exercise indoor graph behavior in tests."
};

function createSyntheticIndoorDataset() {
  const building = {
    buildingId: "synthetic-geisel-test",
    canonicalName: "Synthetic Geisel Test Building",
    code: "SYN-GEISEL",
    aliases: ["synthetic geisel"],
    officialId: null,
    caan: null,
    floorIds: ["synthetic-geisel-floor-1", "synthetic-geisel-floor-2"],
    outdoorEntranceIds: ["synthetic-geisel-main"],
    indoorDataAvailable: true,
    indoorGraphAvailable: true,
    verificationStatus: "synthetic-test-only",
    source: TEST_SOURCE
  };
  const floors = [
    {
      floorId: "synthetic-geisel-floor-1",
      buildingId: building.buildingId,
      floorNumber: 1,
      displayName: "Synthetic Floor 1",
      floorOrder: 1,
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    },
    {
      floorId: "synthetic-geisel-floor-2",
      buildingId: building.buildingId,
      floorNumber: 2,
      displayName: "Synthetic Floor 2",
      floorOrder: 2,
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    }
  ];
  const nodes = [
    {
      id: "synthetic-entry",
      buildingId: building.buildingId,
      floorId: "synthetic-geisel-floor-1",
      outdoorEntranceId: "synthetic-geisel-main",
      nodeType: INDOOR_NODE_TYPES.BUILDING_ENTRANCE,
      accessibility: { status: INDOOR_ACCESSIBILITY_STATUS.UNKNOWN },
      publicAccess: "unknown",
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    },
    {
      id: "synthetic-elevator-1",
      buildingId: building.buildingId,
      floorId: "synthetic-geisel-floor-1",
      nodeType: INDOOR_NODE_TYPES.ELEVATOR,
      accessibility: { status: INDOOR_ACCESSIBILITY_STATUS.UNKNOWN },
      publicAccess: "unknown",
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    },
    {
      id: "synthetic-elevator-2",
      buildingId: building.buildingId,
      floorId: "synthetic-geisel-floor-2",
      nodeType: INDOOR_NODE_TYPES.ELEVATOR,
      accessibility: { status: INDOOR_ACCESSIBILITY_STATUS.UNKNOWN },
      publicAccess: "unknown",
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    },
    {
      id: "synthetic-room-entry",
      buildingId: building.buildingId,
      floorId: "synthetic-geisel-floor-2",
      nodeType: INDOOR_NODE_TYPES.ROOM_ENTRANCE,
      accessibility: { status: INDOOR_ACCESSIBILITY_STATUS.UNKNOWN },
      publicAccess: "unknown",
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    }
  ];
  const spaces = [
    {
      roomId: "synthetic-room-201",
      buildingId: building.buildingId,
      floorId: "synthetic-geisel-floor-2",
      roomNumber: "201",
      roomName: "Synthetic Room 201",
      roomType: "room",
      searchableLabel: "Synthetic Room 201",
      nearestIndoorNodeId: "synthetic-room-entry",
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    }
  ];
  const edges = [
    {
      id: "synthetic-entry-to-elevator",
      buildingId: building.buildingId,
      floorId: "synthetic-geisel-floor-1",
      startNodeId: "synthetic-entry",
      endNodeId: "synthetic-elevator-1",
      distanceMeters: 8,
      traversalType: INDOOR_EDGE_TYPES.HALLWAY,
      accessibility: { status: INDOOR_ACCESSIBILITY_STATUS.UNKNOWN },
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    },
    {
      id: "synthetic-elevator-vertical",
      buildingId: building.buildingId,
      floorId: null,
      startNodeId: "synthetic-elevator-1",
      endNodeId: "synthetic-elevator-2",
      distanceMeters: null,
      traversalType: INDOOR_EDGE_TYPES.ELEVATOR,
      accessibility: { status: INDOOR_ACCESSIBILITY_STATUS.UNKNOWN },
      source: TEST_SOURCE,
      verificationStatus: "synthetic-test-only"
    }
  ];

  return { buildings: [building], floors, spaces, nodes, edges };
}

test("Geisel indoor metadata preserves existing outdoor canonical IDs", () => {
  const indoorBuilding = getIndoorBuilding("geisel-library");
  const entranceNode = getIndoorEntranceNodeForOutdoorEntrance("geisel-library-main");

  assert.equal(indoorBuilding?.buildingId, "geisel-library");
  assert.equal(indoorBuilding.code, "GEISEL");
  assert.equal(indoorBuilding.indoorDataAvailable, false);
  assert.equal(indoorBuilding.indoorGraphAvailable, false);
  assert.equal(entranceNode?.buildingId, "geisel-library");
  assert.equal(entranceNode.outdoorEntranceId, "geisel-library-main");
  assert.equal(entranceNode.coordinates, null);
});

test("indoor dataset validation supports building, floor, room, node, and edge relationships", () => {
  const dataset = createSyntheticIndoorDataset();
  const validation = validateIndoorDataset(dataset);

  assert.equal(validation.valid, true);
  assert.equal(validation.errors.length, 0);
});

test("indoor validation fails safely for missing relationships", () => {
  const nodeErrors = validateIndoorNode({
    id: "bad-node",
    buildingId: "geisel-library",
    nodeType: "imaginary portal",
    accessibility: { status: "unknown" }
  });
  const edgeErrors = validateIndoorEdge(
    {
      id: "bad-edge",
      buildingId: "geisel-library",
      startNodeId: "missing-start",
      endNodeId: "missing-end",
      traversalType: INDOOR_EDGE_TYPES.HALLWAY,
      accessibility: { status: "unknown" }
    },
    []
  );

  assert.ok(nodeErrors.includes("nodeType is unsupported"));
  assert.ok(edgeErrors.includes("startNodeId does not resolve"));
  assert.ok(edgeErrors.includes("endNodeId does not resolve"));
});

test("unknown indoor accessibility remains unknown, not false", () => {
  const dataset = createSyntheticIndoorDataset();
  const elevatorNode = dataset.nodes.find((node) => node.nodeType === INDOOR_NODE_TYPES.ELEVATOR);

  assert.equal(elevatorNode.accessibility.status, INDOOR_ACCESSIBILITY_STATUS.UNKNOWN);
  assert.equal(elevatorNode.accessibility.wheelchairAccessible, undefined);
});

test("indoor route composition preserves outdoor route and adds transition separately", () => {
  const outdoorEntrance = {
    id: "geisel-library-main",
    buildingId: "geisel-library",
    name: "Library Walk entrance"
  };
  const indoorNode = getIndoorEntranceNodeForOutdoorEntrance("geisel-library-main");
  const transition = createOutdoorIndoorTransition({ outdoorEntrance, indoorEntranceNode: indoorNode });
  const indoorRoute = createIndoorRoute({
    buildingId: "geisel-library",
    startNodeId: indoorNode.id,
    available: false,
    message: "Indoor navigation data unavailable"
  });
  const composed = composeIndoorOutdoorRoute({
    outdoorRoute: { provider: "valhalla", isEstimated: false },
    transition,
    indoorRoute,
    destination: { buildingId: "geisel-library" }
  });

  assert.equal(composed.outdoorRoute.provider, "valhalla");
  assert.equal(composed.transition.outdoorEntranceId, "geisel-library-main");
  assert.equal(composed.hasIndoorRoute, false);
  assert.equal(composed.summary.transitionAvailable, true);
});

test("indoor directions step model is renderer-ready without fake Geisel directions", () => {
  const step = createIndoorDirectionsStep({
    instruction: "Synthetic test step only.",
    floor: "Synthetic Floor 2",
    maneuverType: "elevator",
    fromNode: "synthetic-elevator-1",
    toNode: "synthetic-elevator-2",
    accessibility: { status: INDOOR_ACCESSIBILITY_STATUS.UNKNOWN }
  });

  assert.equal(step.instruction, "Synthetic test step only.");
  assert.equal(step.maneuverType, "elevator");
  assert.equal(step.accessibility.status, "unknown");
});

test("resolver falls back when no indoor graph exists for current Geisel destination", () => {
  const destination = resolveIndoorDestination("Geisel Library");

  assert.equal(destination.outdoorDestination.building.id, "geisel-library");
  assert.equal(destination.entranceNode.id, "geisel-indoor-entrance-main");
  assert.equal(destination.indoorDataAvailable, false);
  assert.equal(destination.indoorGraphAvailable, false);
  assert.equal(destination.fallback, true);
});

test("existing non-Geisel room search still routes through outdoor behavior", () => {
  const destination = resolveIndoorDestination("FAH 1100");
  const outdoorDestination = campusResolver.resolveCampusDestination("FAH 1100");

  assert.equal(outdoorDestination.building.id, "fah");
  assert.equal(outdoorDestination.entrance.id, "fah-west");
  assert.equal(destination.indoorBuilding, null);
  assert.equal(destination.fallback, true);
});

test("destination intelligence exposes neutral indoor availability state", () => {
  const destination = campusResolver.resolveCampusDestination("Geisel Library");
  const intelligence = createDestinationIntelligence({
    building: campusResolver.toLegacyBuilding(destination.building),
    selectedEntrance: destination.entrance,
    routeDetails: { destinationLabel: "Geisel Library", destinationType: "library" },
    displayCoordinate: destination.displayCoordinate,
    destination: destination.destination
  });

  assert.equal(intelligence.indoorNavigation.buildingId, "geisel-library");
  assert.equal(intelligence.indoorNavigation.available, false);
  assert.equal(intelligence.indoorNavigation.transferNodeId, "geisel-indoor-entrance-main");
  assert.equal(intelligence.indoorNavigation.message, "Indoor navigation data unavailable");
});

test("indoor import normalizers support future authoritative floor-plan datasets", () => {
  const floor = normalizeFloorFeature({
    type: "Feature",
    properties: {
      building_id: "synthetic-geisel-test",
      floor_id: "synthetic-floor-1",
      floor_number: 1,
      display_name: "Synthetic Floor 1",
      floor_order: 1
    },
    geometry: null
  }, { source: TEST_SOURCE });
  const room = normalizeRoomFeature({
    type: "Feature",
    properties: {
      building_id: "synthetic-geisel-test",
      floor_id: "synthetic-floor-1",
      room_number: "101",
      room_name: "Synthetic Room 101",
      nearest_indoor_node_id: "synthetic-room-entry"
    },
    geometry: { type: "Point", coordinates: [-117.2375, 32.881] }
  }, { source: TEST_SOURCE });
  const node = normalizeIndoorNodeFeature({
    type: "Feature",
    properties: {
      node_id: "synthetic-node",
      building_id: "synthetic-geisel-test",
      floor_id: "synthetic-floor-1",
      node_type: "room entrance",
      accessibility_status: "unknown"
    },
    geometry: { type: "Point", coordinates: [-117.2375, 32.881] }
  }, { source: TEST_SOURCE });
  const edge = normalizeIndoorEdgeFeature({
    type: "Feature",
    properties: {
      edge_id: "synthetic-edge",
      building_id: "synthetic-geisel-test",
      floor_id: "synthetic-floor-1",
      start_node_id: "synthetic-node",
      end_node_id: "synthetic-node-2",
      traversal_type: "hallway/corridor",
      distance_meters: 4
    },
    geometry: null
  }, { source: TEST_SOURCE });
  const vertical = normalizeVerticalConnection({
    type: "Feature",
    properties: {
      edge_id: "synthetic-elevator",
      building_id: "synthetic-geisel-test",
      start_node_id: "synthetic-elevator-1",
      end_node_id: "synthetic-elevator-2",
      traversal_type: "elevator"
    },
    geometry: null
  }, { source: TEST_SOURCE });

  assert.equal(floor.floorId, "synthetic-floor-1");
  assert.equal(room.roomId, "synthetic-geisel-test-101");
  assert.equal(node.nodeType, "room entrance");
  assert.equal(edge.distanceMeters, 4);
  assert.equal(vertical.connectsFloors, true);
});

test("synthetic Geisel indoor graph import validates only in test fixtures", () => {
  const imported = importIndoorBuilding({
    building: createSyntheticIndoorDataset().buildings[0],
    source: TEST_SOURCE,
    floors: [
      {
        type: "Feature",
        properties: {
          building_id: "synthetic-geisel-test",
          floor_id: "synthetic-geisel-floor-1",
          floor_number: 1,
          display_name: "Synthetic Floor 1",
          floor_order: 1
        },
        geometry: null
      }
    ],
    nodes: [
      {
        type: "Feature",
        properties: {
          node_id: "synthetic-entry",
          building_id: "synthetic-geisel-test",
          floor_id: "synthetic-geisel-floor-1",
          node_type: "building entrance",
          outdoor_entrance_id: "synthetic-geisel-main"
        },
        geometry: null
      }
    ]
  });

  assert.equal(imported.summary.buildings, 1);
  assert.equal(imported.summary.floors, 1);
  assert.equal(imported.summary.nodes, 1);
  assert.equal(imported.validation.valid, true);
});

test("indoor coverage report names Geisel as metadata-only proof of concept", () => {
  const coverage = createIndoorCoverageReport();

  assert.equal(coverage.proofOfConceptBuildingId, "geisel-library");
  assert.equal(coverage.buildingsWithIndoorMetadata, 1);
  assert.equal(coverage.buildingsWithIndoorGraph, 0);
  assert.equal(coverage.outdoorEntrancesConnectedToIndoorNodes, 1);
  assert.equal(coverage.geisel.authoritativeGraphAvailable, false);
});
