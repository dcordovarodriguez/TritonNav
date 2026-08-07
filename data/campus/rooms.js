const CAMPUS_ROOMS = [
  { id: "csb-001", buildingId: "csb", number: "001", name: "CSB 001", floor: 0, preferredEntranceId: "csb-south" },
  { id: "csb-002", buildingId: "csb", number: "002", name: "CSB 002", floor: 0, preferredEntranceId: "csb-south" },
  { id: "csb-004", buildingId: "csb", number: "004", name: "CSB 004", floor: 0, preferredEntranceId: "csb-south" },
  { id: "csb-005", buildingId: "csb", number: "005", name: "CSB 005", floor: 0, preferredEntranceId: "csb-south" },
  { id: "csb-100", buildingId: "csb", number: "100", name: "CSB 100", floor: 1, preferredEntranceId: "csb-main-north" },
  { id: "csb-115", buildingId: "csb", number: "115", name: "CSB 115", floor: 1, preferredEntranceId: "csb-main-north" },
  { id: "csb-255", buildingId: "csb", number: "255", name: "CSB 255", floor: 2, preferredEntranceId: "csb-main-north" },
  { id: "mos-0113", buildingId: "mos", number: "0113", name: "MOS 0113", floor: 0, preferredEntranceId: "mos-ridge-walk" },
  { id: "mos-0114", buildingId: "mos", number: "0114", name: "MOS 0114", floor: 0, preferredEntranceId: "mos-ridge-walk" },
  { id: "mos-0204", buildingId: "mos", number: "0204", name: "MOS 0204", floor: 0, preferredEntranceId: "mos-sixth-courtyard" },
  { id: "mandeville-center-b104", buildingId: "mandeville-center", number: "B104", name: "MANDE B104", floor: 0, preferredEntranceId: "mandeville-lower" },
  { id: "mandeville-center-b146", buildingId: "mandeville-center", number: "B146", name: "MANDE B146", floor: 0, preferredEntranceId: "mandeville-lower" },
  { id: "mandeville-center-b150", buildingId: "mandeville-center", number: "B150", name: "MANDE B150", floor: 0, preferredEntranceId: "mandeville-lower" },
  { id: "mandeville-center-b152", buildingId: "mandeville-center", number: "B152", name: "MANDE B152", floor: 0, preferredEntranceId: "mandeville-lower" },
  { id: "mandeville-center-b202", buildingId: "mandeville-center", number: "B202", name: "MANDE B202", floor: 0, preferredEntranceId: "mandeville-lower" },
  { id: "dib-122", buildingId: "dib", number: "122", name: "DIB 122", floor: 1, preferredEntranceId: "dib-main" },
  { id: "price-center-room-east-ballroom", buildingId: "price-center", number: "East Ballroom", name: "Price Center East Ballroom", floor: 2, preferredEntranceId: "price-center-east-ballroom" },
  { id: "price-center-west-ballroom", buildingId: "price-center", number: "West Ballroom", name: "Price Center West Ballroom", floor: 2, preferredEntranceId: "price-center-west" },
  { id: "price-center-theatre", buildingId: "price-center", number: "Theatre", name: "Price Center Theatre", floor: 1, preferredEntranceId: "price-center-east-main" },
  { id: "price-center-food-court", buildingId: "price-center", number: "Food Court", name: "Price Center Food Court", floor: 1, preferredEntranceId: "price-center-east-main" },
  { id: "cse-1202", buildingId: "cse", number: "1202", name: "CSE 1202", floor: 1, preferredEntranceId: "cse-voigt" },
  { id: "fah-1450", buildingId: "fah", number: "1450", name: "FAH 1450", floor: 1, preferredEntranceId: "fah-east" }
];

module.exports = {
  CAMPUS_ROOMS,
  default: CAMPUS_ROOMS
};
