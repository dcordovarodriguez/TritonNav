const { CAMPUS_SOURCE_STATUS, createCampusSource } = require("../../lib/campus/schema.js");

const GIS_IMPORT_PENDING_SOURCE = createCampusSource({
  authority: "UC San Diego",
  dataset: "Official campus GIS dataset pending",
  status: CAMPUS_SOURCE_STATUS.UNKNOWN,
  sourceType: "future-gis-import",
  verified: false,
  confidence: "unknown",
  notes: "Placeholder provenance for records that should be replaced or augmented after official UC San Diego GIS data is received."
});

const TRITONNAV_PROVISIONAL_SOURCE = createCampusSource({
  authority: "TritonNav",
  dataset: "Curated local campus fixtures",
  status: CAMPUS_SOURCE_STATUS.PROVISIONAL,
  sourceType: "manual-curation",
  verified: false,
  confidence: "provisional",
  notes: "Manual local record used to keep the app functional until official GIS sources are available."
});

const TRITONNAV_DERIVED_SOURCE = createCampusSource({
  authority: "TritonNav",
  dataset: "Derived campus resolver data",
  status: CAMPUS_SOURCE_STATUS.DERIVED,
  sourceType: "derived",
  verified: false,
  confidence: "derived",
  notes: "Derived from another campus record for compatibility or search indexing."
});

function normalizeSource(source, fallback = TRITONNAV_PROVISIONAL_SOURCE) {
  if (!source) return { ...fallback };

  if (typeof source === "string") {
    return {
      ...fallback,
      status: source,
      confidence: source,
      notes: fallback.notes
    };
  }

  return {
    authority: source.authority || fallback.authority,
    dataset: source.dataset || source.sourceDataset || fallback.dataset,
    status: source.status || source.confidence || fallback.status,
    sourceType: source.sourceType || fallback.sourceType,
    sourceUrl: source.sourceUrl || source.url || fallback.sourceUrl,
    verified: Boolean(source.verified),
    verifiedAt: source.verifiedAt || source.retrievedAt || fallback.verifiedAt,
    confidence: source.confidence || source.status || fallback.confidence,
    notes: source.notes || source.note || fallback.notes
  };
}

function getSourceStatus(source) {
  return normalizeSource(source, GIS_IMPORT_PENDING_SOURCE).status || CAMPUS_SOURCE_STATUS.UNKNOWN;
}

module.exports = {
  GIS_IMPORT_PENDING_SOURCE,
  TRITONNAV_DERIVED_SOURCE,
  TRITONNAV_PROVISIONAL_SOURCE,
  getSourceStatus,
  normalizeSource
};
