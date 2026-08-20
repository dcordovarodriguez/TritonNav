function createIndoorRoute({
  buildingId,
  startNodeId,
  destinationNodeId,
  steps = [],
  distanceMeters = null,
  durationSeconds = null,
  accessibility = { status: "unknown" },
  available = false,
  message = "Indoor navigation data unavailable"
} = {}) {
  return {
    buildingId,
    startNodeId,
    destinationNodeId,
    steps,
    distanceMeters,
    durationSeconds,
    accessibility,
    available,
    message
  };
}

function composeIndoorOutdoorRoute({ outdoorRoute, transition, indoorRoute = null, destination }) {
  return {
    outdoorRoute,
    transition,
    indoorRoute,
    destination,
    hasIndoorRoute: Boolean(indoorRoute?.available && indoorRoute.steps?.length),
    summary: {
      outdoorAvailable: Boolean(outdoorRoute),
      transitionAvailable: Boolean(transition?.outdoorEntranceId && transition?.indoorNodeId),
      indoorAvailable: Boolean(indoorRoute?.available),
      message: indoorRoute?.message || "Indoor navigation data unavailable"
    }
  };
}

function createOutdoorIndoorTransition({ outdoorEntrance, indoorEntranceNode }) {
  if (!outdoorEntrance || !indoorEntranceNode) return null;
  return {
    buildingId: outdoorEntrance.buildingId,
    outdoorEntranceId: outdoorEntrance.id,
    outdoorEntranceName: outdoorEntrance.name,
    indoorNodeId: indoorEntranceNode.id,
    transferType: "building-entrance"
  };
}

module.exports = {
  composeIndoorOutdoorRoute,
  createIndoorRoute,
  createOutdoorIndoorTransition
};
