const indoorData = require("../../../data/campus/indoor/index.js");
const availability = require("./availability.js");
const coverage = require("./coverage.js");
const resolver = require("./resolver.js");
const routeComposition = require("./routeComposition.js");
const schema = require("./schema.js");
const validate = require("./validate.js");

module.exports = {
  ...indoorData,
  ...availability,
  ...coverage,
  ...resolver,
  ...routeComposition,
  ...schema,
  ...validate
};
