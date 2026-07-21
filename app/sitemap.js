const CANONICAL_URL = "https://tritonnav.diegocordova.net";

export default function sitemap() {
  return ["", "/search", "/navigation"].map((path) => ({
    url: `${CANONICAL_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8
  }));
}
