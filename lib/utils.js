export function formatCoords(coords) {
  if (!coords) return "Unknown";
  return `${coords.lat}, ${coords.lng}`;
}

export function titleCase(value) {
  return String(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
