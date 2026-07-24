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

export function formatDurationMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const parts = [];

  if (hours) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  if (remainingMinutes) {
    parts.push(
      `${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}`
    );
  }

  return parts.join(" ");
}
