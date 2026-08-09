const VERIFIED_AT = "2026-08-09";

const HDH_NEIGHBORHOODS_URL = "https://hdhughousing.ucsd.edu/living-on-campus/neighborhoods/index.html";
const HDH_PREVIEWS_URL = "https://hdhughousing.ucsd.edu/living-on-campus/room-selection/previews.html";

function hdhSource(url) {
  return {
    authority: "UC San Diego HDH",
    sourceType: "undergraduate-housing",
    url,
    retrievedAt: VERIFIED_AT,
    confidence: "official"
  };
}

const UNDERGRADUATE_COLLEGE_HOUSING = [
  {
    id: "revelle-college-housing",
    collegeId: "revelle-college",
    name: "Revelle College Housing",
    aliases: ["revelle housing", "revelle residence halls", "revelle apartments"],
    type: "college housing",
    source: hdhSource("https://hdhughousing.ucsd.edu/_files/neighborhood-overview-revelle.pdf"),
    inventoryStatus: "complete-from-public-hdh-map",
    documentedResidentialBuildings: [
      { name: "Blake Hall", buildingId: "revelle-blake-hall", category: "residence hall" },
      { name: "Argo Hall", buildingId: "revelle-argo-hall", category: "residence hall" },
      { name: "Discovery Hall", buildingId: "revelle-discovery-hall", category: "residence hall" },
      { name: "Galathea Hall", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Meteor Hall", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Atlantis Hall", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Challenger Hall", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Beagle Hall", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Keeling Apartments", buildingId: "revelle-keeling-apartments", category: "apartment building" }
    ],
    documentedNavigationPlaces: ["64 Degrees / Umi", "Roger's Market", "Residence Life Office", "Revelle Plaza"]
  },
  {
    id: "muir-college-housing",
    collegeId: "muir-college",
    name: "John Muir College Housing",
    aliases: ["muir housing", "muir residence halls", "muir apartments"],
    type: "college housing",
    source: hdhSource("https://hdhughousing.ucsd.edu/_files/neighborhood-overview-muir.pdf"),
    inventoryStatus: "complete-from-public-hdh-map",
    documentedResidentialBuildings: [
      { name: "Tenaya Hall", buildingId: "muir-tenaya-hall", category: "residence hall" },
      { name: "Tioga Hall", buildingId: "muir-tioga-hall", category: "residence hall" },
      { name: "Tuolumne Apartments", buildingId: "muir-tuolumne-apartments", category: "apartment building" },
      { name: "Tamarack Apartments", buildingId: "muir-tamarack-apartments", category: "apartment building" }
    ],
    documentedNavigationPlaces: ["Pines", "Roots", "John's Market", "Residence Life Office"]
  },
  {
    id: "marshall-college-housing",
    collegeId: "marshall-college",
    name: "Thurgood Marshall College Housing",
    aliases: ["marshall housing", "tmc housing", "ridge walk living learning neighborhood"],
    type: "college housing",
    source: hdhSource(HDH_PREVIEWS_URL),
    inventoryStatus: "incomplete-public-building-names-pending",
    documentedResidentialBuildings: [
      {
        name: "Ridge Walk Living Learning Neighborhood apartments",
        buildingId: null,
        category: "apartment complex",
        verificationStatus: "needs-official-building-list-and-coordinates"
      }
    ],
    documentedNavigationPlaces: ["Thurgood Marshall Residence Life Office"]
  },
  {
    id: "warren-college-housing",
    collegeId: "warren-college",
    name: "Earl Warren College Housing",
    aliases: ["warren housing", "earl warren housing", "warren apartments"],
    type: "college housing",
    source: hdhSource(HDH_PREVIEWS_URL),
    inventoryStatus: "partial-public-building-names",
    documentedResidentialBuildings: [
      { name: "Bates Hall", buildingId: "warren-bates-hall", category: "apartment building" },
      { name: "Brown Hall", buildingId: "warren-brown-hall", category: "apartment building" },
      {
        name: "Warren College Apartments",
        buildingId: null,
        category: "apartment complex",
        verificationStatus: "needs-individual-building-list-and-coordinates"
      }
    ],
    documentedNavigationPlaces: ["Canyon Vista", "Earl's Place", "Warren Student Activity Center"]
  },
  {
    id: "roosevelt-college-housing",
    collegeId: "roosevelt-college",
    name: "Eleanor Roosevelt College Housing",
    aliases: ["erc housing", "roosevelt housing", "i-house", "international house"],
    type: "college housing",
    source: hdhSource("https://hdhughousing.ucsd.edu/_files/neighborhood-overview-erc.pdf"),
    inventoryStatus: "complete-from-public-hdh-map",
    documentedResidentialBuildings: [
      { name: "Africa Hall", buildingId: "erc-africa-hall", category: "residence hall" },
      { name: "Asia Hall", buildingId: "erc-asia-hall", category: "residence hall" },
      { name: "Europe Hall", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Latin America Hall", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "North America Hall", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Earth North Hall", buildingId: "erc-earth-north-hall", category: "apartment building" },
      { name: "Earth South Hall", buildingId: null, category: "apartment building", verificationStatus: "needs-coordinate-verification" },
      { name: "Middle East Hall", buildingId: null, category: "apartment building", verificationStatus: "needs-coordinate-verification" },
      { name: "Oceania Hall", buildingId: null, category: "apartment building", verificationStatus: "needs-coordinate-verification" },
      { name: "Mesa Verde Hall", buildingId: "erc-mesa-verde-hall", category: "apartment building" },
      { name: "Geneva Hall", buildingId: null, category: "apartment building", verificationStatus: "needs-coordinate-verification" },
      { name: "Kathmandu House", buildingId: null, category: "apartment building", verificationStatus: "needs-coordinate-verification" },
      { name: "Cuzco House", buildingId: null, category: "apartment building", verificationStatus: "needs-coordinate-verification" },
      { name: "Asante House", buildingId: "erc-asante-house", category: "apartment building" }
    ],
    documentedNavigationPlaces: ["Cafe Ventanas", "The Village Market", "The Bistro", "Residence Life Office"]
  },
  {
    id: "sixth-college-housing",
    collegeId: "sixth-college-area",
    name: "Sixth College Housing",
    aliases: ["sixth housing", "ntplln", "north torrey pines living learning neighborhood"],
    type: "college housing",
    source: hdhSource("https://hdhughousing.ucsd.edu/_files/neighborhood-overview-sixth.pdf"),
    inventoryStatus: "complete-from-public-hdh-map-provisional-coordinates",
    documentedResidentialBuildings: [
      { name: "Kaleidoscope", buildingId: "sixth-kaleidoscope", category: "residence hall" },
      { name: "Catalyst", buildingId: "sixth-catalyst", category: "residence hall" },
      { name: "Tapestry", buildingId: "sixth-tapestry", category: "apartment building" },
      { name: "Mosaic", buildingId: "mos", category: "apartment building" }
    ],
    documentedNavigationPlaces: ["Restaurants at Sixth", "Sixth Market", "Residence Life Office", "Craft Center"]
  },
  {
    id: "seventh-college-housing",
    collegeId: "seventh-college",
    name: "Seventh College Housing",
    aliases: ["seventh housing", "the village housing", "seventh apartments"],
    type: "college housing",
    source: hdhSource(HDH_NEIGHBORHOODS_URL),
    inventoryStatus: "incomplete-public-individual-building-names-pending",
    documentedResidentialBuildings: [
      {
        name: "Seventh College apartment neighborhood",
        buildingId: null,
        category: "apartment complex",
        verificationStatus: "needs-official-individual-building-list-and-coordinates"
      }
    ],
    documentedNavigationPlaces: ["Seventh Market", "Residence Life Office"]
  },
  {
    id: "eighth-college-housing",
    collegeId: "eighth-college",
    name: "Eighth College Housing",
    aliases: ["eighth housing", "eighth college residence halls", "theatre district living learning neighborhood"],
    type: "college housing",
    source: hdhSource("https://hdhughousing.ucsd.edu/_files/neighborhood-overview-eighth.pdf"),
    inventoryStatus: "complete-from-public-hdh-map-needs-coordinate-verification",
    documentedResidentialBuildings: [
      { name: "Pulse", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Podemos", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Sankofa", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Azad", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" },
      { name: "Survivance", buildingId: null, category: "residence hall", verificationStatus: "needs-coordinate-verification" }
    ],
    documentedNavigationPlaces: ["64 Degrees / Umi", "Roger's Market", "Residence Life Office"]
  }
];

const UPPER_DIVISION_HOUSING = [
  {
    id: "rita-atkinson-housing",
    name: "Rita Atkinson Residences",
    aliases: ["rita", "rita atkinson", "the rita", "rita atkinson apartments"],
    type: "housing community",
    buildingIds: ["rita-atkinson-residences"],
    source: hdhSource("https://hdhughousing.ucsd.edu/living-on-campus/neighborhoods/village/rita-atkinson/index.html"),
    inventoryStatus: "community-record-imported-building-details-pending"
  },
  {
    id: "pepper-canyon-east-matthews-housing",
    name: "Pepper Canyon East and Matthews Apartments",
    aliases: ["pepper canyon east", "matthews", "matthews apartments", "pepper canyon apartments"],
    type: "housing community",
    buildingIds: ["pepper-canyon-single-undergraduate-apartments", "matthews-apartments-a"],
    source: hdhSource("https://hdhughousing.ucsd.edu/living-on-campus/neighborhoods/village/village-pepper-canyon/index.html"),
    inventoryStatus: "partial-public-building-records"
  },
  {
    id: "pepper-canyon-west-housing",
    name: "Pepper Canyon West",
    aliases: ["pepper canyon west", "pcw", "rya", "vela"],
    type: "housing community",
    buildingIds: [],
    documentedResidentialBuildings: [
      { name: "Rya", buildingId: null, category: "residential tower", verificationStatus: "needs-coordinate-verification" },
      { name: "Vela", buildingId: null, category: "residential tower", verificationStatus: "needs-coordinate-verification" }
    ],
    source: hdhSource("https://hdhughousing.ucsd.edu/living-on-campus/neighborhoods/village/pepper-canyon-west/index.html"),
    inventoryStatus: "public-building-names-not-yet-routable"
  },
  {
    id: "pangea-housing",
    name: "Pangea Apartments and Residence Halls",
    aliases: ["pangea", "pangea apartments", "pangea residence halls", "marshall uppers"],
    type: "housing community",
    buildingIds: [],
    documentedResidentialBuildings: [
      { name: "Pangea Apartments", buildingId: null, category: "apartment complex", verificationStatus: "needs-coordinate-verification" },
      { name: "Pangea Residence Halls", buildingId: null, category: "residence hall complex", verificationStatus: "needs-coordinate-verification" }
    ],
    source: hdhSource("https://hdhughousing.ucsd.edu/living-on-campus/neighborhoods/village/pangea-apartments-reshalls/index.html"),
    inventoryStatus: "public-complex-names-not-yet-routable"
  }
];

module.exports = {
  UNDERGRADUATE_COLLEGE_HOUSING,
  UPPER_DIVISION_HOUSING,
  default: {
    undergraduate: UNDERGRADUATE_COLLEGE_HOUSING,
    upperDivision: UPPER_DIVISION_HOUSING
  }
};
