const UCSD_REC_LINKS = {
  facilityHours: "https://recreation.ucsd.edu/facilities/",
  openRec: "https://recreation.ucsd.edu/open-rec/",
  courtBookings: "https://rec.ucsd.edu/booking",
  outdoorCourts: "https://recreation.ucsd.edu/facilities/outdoor-courts-and-sporting-sites/",
  gearRentals: "https://recreation.ucsd.edu/adventures/outdoor-gear-rentals/",
  outbackDirections: "https://recreation.ucsd.edu/adventures/wilderness-orientation/directions/"
};

const UCSD_RECREATION_FACILITIES = [
  {
    id: "rimac",
    name: "RIMAC",
    shortName: "RIMAC",
    aliases: ["rimac gym", "rimac arena", "rimac aux gym", "rimac fitness gym", "rimac rec"],
    type: "recreation",
    coordinates: { lat: 32.88548, lng: -117.23974 },
    address: "9860 Hopkins Drive, La Jolla CA 92093",
    relatedCollege: "Eleanor Roosevelt College",
    nearbyTriggerRadiusMeters: 220,
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
    }
  },
  {
    id: "main-gym",
    name: "Main Gym",
    shortName: "Main Gym",
    aliases: ["main gymnasium", "ucsd main gym", "rec gym", "main gym fitness"],
    type: "recreation",
    coordinates: { lat: 32.87595, lng: -117.24212 },
    address: "2995 Scholars Lane, La Jolla CA 92093",
    relatedCollege: "Revelle College",
    nearbyTriggerRadiusMeters: 220,
    amenities: ["Main gym floor", "Rec Gym", "Natatorium", "Equipment checkout"],
    ctas: [
      { label: "Facility Hours", url: UCSD_REC_LINKS.facilityHours },
      { label: "Open Rec Hours", url: UCSD_REC_LINKS.openRec }
    ],
    sourceUrls: {
      hours: UCSD_REC_LINKS.facilityHours,
      openRec: UCSD_REC_LINKS.openRec
    }
  },
  {
    id: "muir-courts",
    name: "Muir Courts",
    shortName: "Muir Courts",
    aliases: ["muir tennis courts", "muir pickleball courts", "muir basketball courts", "muir volleyball courts", "muir athletic area"],
    type: "recreation",
    coordinates: { lat: 32.87703, lng: -117.2432 },
    address: "Muir College Athletic Area, La Jolla CA 92093",
    relatedCollege: "John Muir College",
    nearbyTriggerRadiusMeters: 180,
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
    }
  },
  {
    id: "warren-courts",
    name: "Warren Courts",
    shortName: "Warren Courts",
    aliases: ["warren tennis courts", "warren pickleball courts", "warren field", "warren athletic area"],
    type: "recreation",
    coordinates: { lat: 32.8821, lng: -117.23575 },
    address: "Warren College Athletic Area, La Jolla CA 92093",
    relatedCollege: "Warren College",
    nearbyTriggerRadiusMeters: 180,
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
    }
  },
  {
    id: "outback-adventures-rental-shop",
    name: "Outback Adventures Rental Shop",
    shortName: "Outback",
    aliases: ["outback", "outback adventures", "outback rental shop", "gear rentals", "outdoor gear rentals"],
    type: "recreation",
    coordinates: { lat: 32.8877, lng: -117.2391 },
    address: "10235 North Point Lane, La Jolla CA 92093",
    relatedCollege: "Eleanor Roosevelt College",
    nearbyTriggerRadiusMeters: 220,
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
    }
  },
  {
    id: "spanos-athletic-training-facility",
    name: "Spanos Athletic Training Facility",
    shortName: "Spanos",
    aliases: ["spanos", "spanos training facility", "spanos athletic performance center", "span"],
    type: "recreation",
    coordinates: { lat: 32.88795, lng: -117.23932 },
    address: "10265 North Point Lane, La Jolla CA 92093",
    relatedCollege: "Eleanor Roosevelt College",
    nearbyTriggerRadiusMeters: 180,
    amenities: ["Athletic training", "Performance center", "Nearby Outback Rental Shop"],
    ctas: [
      { label: "Facility Hours", url: UCSD_REC_LINKS.facilityHours },
      { label: "Outback Gear Rentals", url: UCSD_REC_LINKS.gearRentals }
    ],
    sourceUrls: {
      hours: UCSD_REC_LINKS.facilityHours,
      rentals: UCSD_REC_LINKS.gearRentals
    }
  },
  {
    id: "north-campus-recreation-field",
    name: "North Campus Recreation Field",
    shortName: "North Rec Field",
    aliases: ["north campus field", "north campus recreation field", "north campus athletic area", "rimac field"],
    type: "recreation",
    coordinates: { lat: 32.88828, lng: -117.24095 },
    address: "North Campus Recreation Area, La Jolla CA 92093",
    relatedCollege: "Seventh College",
    nearbyTriggerRadiusMeters: 240,
    amenities: ["Open field space", "Track nearby", "North campus courts nearby"],
    ctas: [
      { label: "Open Rec Hours", url: UCSD_REC_LINKS.openRec },
      { label: "Facility Hours", url: UCSD_REC_LINKS.facilityHours }
    ],
    sourceUrls: {
      openRec: UCSD_REC_LINKS.openRec,
      hours: UCSD_REC_LINKS.facilityHours
    }
  }
];

function normalizeRecFacilityValue(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getAllRecreationFacilities() {
  return UCSD_RECREATION_FACILITIES;
}

export function getRecreationFacilityById(id) {
  if (!id) return null;
  return (
    UCSD_RECREATION_FACILITIES.find(
      (facility) => facility.id.toLowerCase() === String(id).toLowerCase()
    ) ?? null
  );
}

export function getRecreationFacilityByShortName(value) {
  if (!value) return null;
  const normalizedValue = normalizeRecFacilityValue(value);

  return (
    UCSD_RECREATION_FACILITIES.find(
      (facility) =>
        normalizeRecFacilityValue(facility.shortName) === normalizedValue ||
        facility.aliases.some((alias) => normalizeRecFacilityValue(alias) === normalizedValue)
    ) ?? null
  );
}

export default UCSD_RECREATION_FACILITIES;
