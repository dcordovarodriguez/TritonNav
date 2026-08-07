const UCSD_REC_LINKS = {
  facilityHours: "https://recreation.ucsd.edu/facilities/",
  openRec: "https://recreation.ucsd.edu/open-rec/",
  courtBookings: "https://rec.ucsd.edu/booking",
  outdoorCourts: "https://recreation.ucsd.edu/facilities/outdoor-courts-and-sporting-sites/",
  gearRentals: "https://recreation.ucsd.edu/adventures/outdoor-gear-rentals/",
  outbackDirections: "https://recreation.ucsd.edu/adventures/wilderness-orientation/directions/"
};

const CAMPUS_PLACES = [
  {
    id: "geisel-library-place",
    name: "Geisel Library",
    type: "library",
    aliases: ["geisel", "library", "ucsd library", "main library"],
    coordinates: { lat: 32.88114, lng: -117.23758 },
    relatedBuildingId: "geisel-library",
    source: "legacy-normalized"
  },
  {
    id: "price-center-place",
    name: "Price Center",
    type: "student center",
    aliases: ["pc", "price", "student center"],
    coordinates: { lat: 32.8798, lng: -117.23695 },
    relatedBuildingId: "price-center",
    source: "legacy-normalized"
  },
  {
    id: "mandeville-center-place",
    name: "Mandeville Center",
    type: "building",
    aliases: ["mandeville", "mande"],
    coordinates: { lat: 32.87943, lng: -117.2411 },
    relatedBuildingId: "mandeville-center",
    source: "legacy-normalized"
  },
  {
    id: "sixth-college-place",
    name: "Sixth College",
    type: "college",
    aliases: ["sixth", "sixth college", "new sixth"],
    coordinates: { lat: 32.88043, lng: -117.24108 },
    relatedBuildingId: "sixth-college",
    source: "legacy-normalized"
  },
  {
    id: "rimac",
    name: "RIMAC",
    type: "recreation",
    aliases: ["rimac gym", "rimac arena", "rimac aux gym", "rimac fitness gym", "rimac rec"],
    coordinates: { lat: 32.88548, lng: -117.23974 },
    relatedBuildingId: null,
    amenities: ["Fitness gym", "Arena", "Aux gym", "Table tennis", "Equipment checkout"],
    ctas: [
      { label: "Facility Hours", url: UCSD_REC_LINKS.facilityHours },
      { label: "Open Rec Hours", url: UCSD_REC_LINKS.openRec },
      { label: "Court Bookings", url: UCSD_REC_LINKS.courtBookings }
    ],
    sourceUrls: {
      hours: UCSD_REC_LINKS.facilityHours,
      openRec: UCSD_REC_LINKS.openRec,
      booking: UCSD_REC_LINKS.courtBookings
    },
    source: "legacy-normalized"
  },
  {
    id: "main-gym",
    name: "Main Gym",
    type: "recreation",
    aliases: ["main gymnasium", "ucsd main gym", "rec gym", "main gym fitness"],
    coordinates: { lat: 32.87595, lng: -117.24212 },
    relatedBuildingId: null,
    amenities: ["Main gym floor", "Rec Gym", "Natatorium", "Equipment checkout"],
    ctas: [
      { label: "Facility Hours", url: UCSD_REC_LINKS.facilityHours },
      { label: "Open Rec Hours", url: UCSD_REC_LINKS.openRec }
    ],
    sourceUrls: {
      hours: UCSD_REC_LINKS.facilityHours,
      openRec: UCSD_REC_LINKS.openRec
    },
    source: "legacy-normalized"
  },
  {
    id: "muir-courts",
    name: "Muir Courts",
    type: "recreation",
    aliases: ["muir tennis courts", "muir pickleball courts", "muir basketball courts", "muir volleyball courts", "muir athletic area"],
    coordinates: { lat: 32.87703, lng: -117.2432 },
    relatedBuildingId: null,
    amenities: ["Tennis courts", "Pickleball courts", "Basketball courts", "Sand volleyball courts"],
    ctas: [
      { label: "Outdoor Courts", url: UCSD_REC_LINKS.outdoorCourts },
      { label: "Court Bookings", url: UCSD_REC_LINKS.courtBookings },
      { label: "Open Rec Hours", url: UCSD_REC_LINKS.openRec }
    ],
    sourceUrls: {
      outdoorCourts: UCSD_REC_LINKS.outdoorCourts,
      booking: UCSD_REC_LINKS.courtBookings,
      openRec: UCSD_REC_LINKS.openRec
    },
    source: "legacy-normalized"
  },
  {
    id: "warren-courts",
    name: "Warren Courts",
    type: "recreation",
    aliases: ["warren tennis courts", "warren pickleball courts", "warren field", "warren athletic area"],
    coordinates: { lat: 32.8821, lng: -117.23575 },
    relatedBuildingId: null,
    amenities: ["Tennis court", "Pickleball courts", "Warren Field"],
    ctas: [
      { label: "Outdoor Courts", url: UCSD_REC_LINKS.outdoorCourts },
      { label: "Court Bookings", url: UCSD_REC_LINKS.courtBookings },
      { label: "Open Rec Hours", url: UCSD_REC_LINKS.openRec }
    ],
    sourceUrls: {
      outdoorCourts: UCSD_REC_LINKS.outdoorCourts,
      booking: UCSD_REC_LINKS.courtBookings,
      openRec: UCSD_REC_LINKS.openRec
    },
    source: "legacy-normalized"
  },
  {
    id: "outback-adventures-rental-shop",
    name: "Outback Adventures Rental Shop",
    type: "recreation",
    aliases: ["outback", "outback adventures", "outback rental shop", "gear rentals", "outdoor gear rentals"],
    coordinates: { lat: 32.8877, lng: -117.2391 },
    relatedBuildingId: null,
    amenities: ["Outdoor gear rentals", "Trip support", "Adventure program info"],
    ctas: [
      { label: "Gear Rentals", url: UCSD_REC_LINKS.gearRentals },
      { label: "Outback Directions", url: UCSD_REC_LINKS.outbackDirections },
      { label: "Facility Hours", url: UCSD_REC_LINKS.facilityHours }
    ],
    sourceUrls: {
      rentals: UCSD_REC_LINKS.gearRentals,
      directions: UCSD_REC_LINKS.outbackDirections,
      hours: UCSD_REC_LINKS.facilityHours
    },
    source: "legacy-normalized"
  },
  {
    id: "spanos-athletic-training-facility",
    name: "Spanos Athletic Training Facility",
    type: "recreation",
    aliases: ["spanos", "spanos training facility", "spanos athletic performance center", "span"],
    coordinates: { lat: 32.88795, lng: -117.23932 },
    relatedBuildingId: null,
    amenities: ["Athletic training", "Performance center", "Nearby Outback Rental Shop"],
    ctas: [
      { label: "Facility Hours", url: UCSD_REC_LINKS.facilityHours },
      { label: "Outback Gear Rentals", url: UCSD_REC_LINKS.gearRentals }
    ],
    sourceUrls: {
      hours: UCSD_REC_LINKS.facilityHours,
      rentals: UCSD_REC_LINKS.gearRentals
    },
    source: "legacy-normalized"
  },
  {
    id: "north-campus-recreation-field",
    name: "North Campus Recreation Field",
    type: "recreation",
    aliases: ["north campus field", "north campus recreation field", "north campus athletic area", "rimac field"],
    coordinates: { lat: 32.88828, lng: -117.24095 },
    relatedBuildingId: null,
    amenities: ["Open field space", "Track nearby", "North campus courts nearby"],
    ctas: [
      { label: "Open Rec Hours", url: UCSD_REC_LINKS.openRec },
      { label: "Facility Hours", url: UCSD_REC_LINKS.facilityHours }
    ],
    sourceUrls: {
      openRec: UCSD_REC_LINKS.openRec,
      hours: UCSD_REC_LINKS.facilityHours
    },
    source: "legacy-normalized"
  }
];

module.exports = {
  CAMPUS_PLACES,
  default: CAMPUS_PLACES
};
