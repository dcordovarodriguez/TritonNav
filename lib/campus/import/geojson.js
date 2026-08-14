const { hasValidCampusCoordinate } = require("../normalize.js");

function getFeatureProperties(feature) {
  return feature?.properties && typeof feature.properties === "object" ? feature.properties : {};
}

function getGeometry(feature) {
  return feature?.geometry && typeof feature.geometry === "object" ? feature.geometry : null;
}

function coordinateFromPosition(position) {
  if (!Array.isArray(position) || position.length < 2) return null;
  const [lng, lat] = position;
  const coordinate = { lat: Number(lat), lng: Number(lng) };
  return hasValidCampusCoordinate(coordinate) ? coordinate : null;
}

function flattenPositions(coordinates) {
  if (!Array.isArray(coordinates)) return [];
  if (typeof coordinates[0] === "number") return [coordinates];
  return coordinates.flatMap((item) => flattenPositions(item));
}

function coordinateFromGeometry(geometry) {
  if (!geometry) return null;

  if (geometry.type === "Point") {
    return coordinateFromPosition(geometry.coordinates);
  }

  const positions = flattenPositions(geometry.coordinates)
    .map(coordinateFromPosition)
    .filter(Boolean);
  if (!positions.length) return null;

  const summed = positions.reduce(
    (total, coordinate) => ({
      lat: total.lat + coordinate.lat,
      lng: total.lng + coordinate.lng
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: Number((summed.lat / positions.length).toFixed(7)),
    lng: Number((summed.lng / positions.length).toFixed(7))
  };
}

function lineStringFromGeometry(geometry) {
  if (!geometry || geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) {
    return [];
  }

  return geometry.coordinates.map(coordinateFromPosition).filter(Boolean);
}

function pickProperty(properties, keys, fallback = "") {
  for (const key of keys) {
    const value = properties[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
}

module.exports = {
  coordinateFromGeometry,
  coordinateFromPosition,
  getFeatureProperties,
  getGeometry,
  lineStringFromGeometry,
  pickProperty
};
