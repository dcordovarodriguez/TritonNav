const nextConfig = {
  outputFileTracingIncludes: {
    "/maplibre-gl-worker.mjs": ["./node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"],
    "/maplibre-gl-shared.mjs": ["./node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs"]
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "triton-nav.vercel.app"
          }
        ],
        destination: "https://tritonnav.diegocordova.net/:path*",
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig;
