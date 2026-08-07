function normalizeCampusValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactCampusValue(value) {
  return normalizeCampusValue(value).replace(/\s+/g, "");
}

function hasValidCampusCoordinate(coordinate) {
  return (
    coordinate &&
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng) &&
    coordinate.lat >= -90 &&
    coordinate.lat <= 90 &&
    coordinate.lng >= -180 &&
    coordinate.lng <= 180
  );
}

function createCoordinateKey(coordinate) {
  if (!hasValidCampusCoordinate(coordinate)) return "";
  return `${coordinate.lat.toFixed(6)},${coordinate.lng.toFixed(6)}`;
}

module.exports = {
  compactCampusValue,
  createCoordinateKey,
  hasValidCampusCoordinate,
  normalizeCampusValue
};
