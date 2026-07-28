export function createGoogleMapsDirectionsUrl({ destination, origin }) {
  if (!destination) return "https://www.google.com/maps";

  const destinationValue = `${destination.lat},${destination.lng}`;
  const params = new URLSearchParams({
    api: "1",
    destination: destinationValue,
    travelmode: "walking"
  });

  if (origin?.lat && origin?.lng) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
