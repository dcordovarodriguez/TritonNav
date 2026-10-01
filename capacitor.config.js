const localServerUrl = process.env.CAPACITOR_SERVER_URL?.trim();

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: "net.diegocordova.tritonnav",
  appName: "TritonNav",
  webDir: "out",
  server: localServerUrl
    ? {
        url: localServerUrl,
        cleartext: localServerUrl.startsWith("http://")
      }
    : {
        url: "https://tritonnav.diegocordova.net",
        cleartext: false
      },
  ios: {
    contentInset: "automatic"
  }
};

module.exports = config;
