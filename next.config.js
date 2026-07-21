const nextConfig = {
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
