const CANONICAL_HOST = "tritonnav.diegocordova.net";
const CANONICAL_URL = `https://${CANONICAL_HOST}`;

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
    host: CANONICAL_HOST
  };
}
