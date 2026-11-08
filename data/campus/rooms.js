const CAMPUS_ROOMS = [
  { id: "csb-001", buildingId: "csb", number: "001", name: "CSB 001", floor: 0, preferredEntranceId: "csb-south" },
  { id: "csb-002", buildingId: "csb", number: "002", name: "CSB 002", floor: 0, preferredEntranceId: "csb-south" },
  { id: "csb-004", buildingId: "csb", number: "004", name: "CSB 004", floor: 0, preferredEntranceId: "csb-south" },
  { id: "csb-005", buildingId: "csb", number: "005", name: "CSB 005", floor: 0, preferredEntranceId: "csb-south" },
  { id: "csb-100", buildingId: "csb", number: "100", name: "CSB 100", floor: 1, preferredEntranceId: "csb-main-north" },
  {
    id: "csb-115",
    buildingId: "csb",
    number: "115",
    name: "CSB 115",
    floor: 1,
    preferredEntranceId: "csb-main-north",
    indoorDirections: {
      summary: "Use the north entrance and confirm the exact room location from building signage.",
      steps: [
        "Enter through the main north entrance.",
        "Stay on the ground floor.",
        "Follow posted classroom signage for room 115."
      ],
      finalLandmark: "Room 115 signage",
      source: "curated-provisional"
    }
  },
  { id: "csb-255", buildingId: "csb", number: "255", name: "CSB 255", floor: 2, preferredEntranceId: "csb-main-north" },
  { id: "mos-0113", buildingId: "mos", number: "0113", name: "MOS 0113", floor: 0, preferredEntranceId: "mos-ridge-walk" },
  {
    id: "mos-0114",
    buildingId: "mos",
    number: "0114",
    name: "MOS 0114",
    floor: 0,
    preferredEntranceId: "mos-ridge-walk",
    indoorDirections: {
      summary: "Use the Ridge Walk entrance and verify the basement-level room from posted signage.",
      steps: [
        "Enter through the Ridge Walk entrance.",
        "Head to the basement level.",
        "Follow Mosaic classroom signage for room 0114."
      ],
      finalLandmark: "Room 0114 signage",
      source: "curated-provisional"
    }
  },
  { id: "mos-0204", buildingId: "mos", number: "0204", name: "MOS 0204", floor: 0, preferredEntranceId: "mos-sixth-courtyard" },
  { id: "mandeville-center-b104", buildingId: "mandeville-center", number: "B104", name: "MANDE B104", floor: 0, preferredEntranceId: "mandeville-lower" },
  { id: "mandeville-center-b146", buildingId: "mandeville-center", number: "B146", name: "MANDE B146", floor: 0, preferredEntranceId: "mandeville-lower" },
  { id: "mandeville-center-b150", buildingId: "mandeville-center", number: "B150", name: "MANDE B150", floor: 0, preferredEntranceId: "mandeville-lower" },
  { id: "mandeville-center-b152", buildingId: "mandeville-center", number: "B152", name: "MANDE B152", floor: 0, preferredEntranceId: "mandeville-lower" },
  {
    id: "mandeville-center-b202",
    buildingId: "mandeville-center",
    number: "B202",
    name: "MANDE B202",
    floor: 0,
    preferredEntranceId: "mandeville-lower",
    indoorDirections: {
      summary: "Use the lower entrance and confirm the basement room from Mandeville signage.",
      steps: [
        "Enter through the lower entrance.",
        "Continue on the basement level.",
        "Follow posted room signage to B202."
      ],
      finalLandmark: "Room B202 signage",
      source: "curated-provisional"
    }
  },
  {
    id: "dib-122",
    buildingId: "dib",
    number: "122",
    name: "DIB 122",
    floor: 1,
    preferredEntranceId: "dib-main",
    indoorDirections: {
      summary: "Use the main entrance and verify room 122 from Design and Innovation Building signage.",
      steps: [
        "Enter through the main entrance.",
        "Remain on the ground floor.",
        "Follow posted room signage to 122."
      ],
      finalLandmark: "Room 122 signage",
      source: "curated-provisional"
    }
  },
  { id: "price-center-room-east-ballroom", buildingId: "price-center", number: "East Ballroom", name: "Price Center East Ballroom", floor: 2, preferredEntranceId: "price-center-east-ballroom" },
  { id: "price-center-west-ballroom", buildingId: "price-center", number: "West Ballroom", name: "Price Center West Ballroom", floor: 2, preferredEntranceId: "price-center-west" },
  { id: "price-center-theatre", buildingId: "price-center", number: "Theatre", name: "Price Center Theatre", floor: 1, preferredEntranceId: "price-center-east-main" },
  { id: "price-center-food-court", buildingId: "price-center", number: "Food Court", name: "Price Center Food Court", floor: 1, preferredEntranceId: "price-center-east-main" },
  { id: "cse-1202", buildingId: "cse", number: "1202", name: "CSE 1202", floor: 1, preferredEntranceId: "cse-voigt" },
  { id: "fah-1100", buildingId: "fah", number: "1100", name: "FAH 1100", floor: 1, preferredEntranceId: "fah-west" },
  { id: "fah-1450", buildingId: "fah", number: "1450", name: "FAH 1450", floor: 1, preferredEntranceId: "fah-east" },
  {
    "id": "malk-hall-b90",
    "buildingId": "malk-hall",
    "number": "B90",
    "name": "MALK B90",
    "floor": 0,
    "roomType": "Classroom",
    "capacity": 58,
    "wheelchairSeats": 2,
    "registrarCode": "MALK B90",
    "sourceRoomNumber": "EB90",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.881Z"
    }
  },
  {
    "id": "malk-hall-b91",
    "buildingId": "malk-hall",
    "number": "B91",
    "name": "MALK B91",
    "floor": 0,
    "roomType": "Classroom",
    "capacity": 58,
    "wheelchairSeats": 2,
    "registrarCode": "MALK B91",
    "sourceRoomNumber": "EB91",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.882Z"
    }
  },
  {
    "id": "malk-hall-b92",
    "buildingId": "malk-hall",
    "number": "B92",
    "name": "MALK B92",
    "floor": 0,
    "roomType": "Classroom",
    "capacity": 40,
    "wheelchairSeats": 1,
    "registrarCode": "MALK B92",
    "sourceRoomNumber": "EB92",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.882Z"
    }
  },
  {
    "id": "coalition-b17",
    "buildingId": "coalition",
    "number": "B17",
    "name": "COA B17",
    "floor": 0,
    "roomType": "Classroom",
    "capacity": 60,
    "wheelchairSeats": 1,
    "registrarCode": "COA B17",
    "sourceRoomNumber": "B17",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-b21",
    "buildingId": "coalition",
    "number": "B21",
    "name": "COA B21",
    "floor": 0,
    "roomType": "Classroom",
    "capacity": 60,
    "wheelchairSeats": 1,
    "registrarCode": "COA B21",
    "sourceRoomNumber": "B21",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-b23",
    "buildingId": "coalition",
    "number": "B23",
    "name": "COA B23",
    "floor": 0,
    "roomType": "Classroom",
    "capacity": 60,
    "wheelchairSeats": 1,
    "registrarCode": "COA B23",
    "sourceRoomNumber": "B23",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-b26",
    "buildingId": "coalition",
    "number": "B26",
    "name": "COA B26",
    "floor": 0,
    "roomType": "Classroom",
    "capacity": 60,
    "wheelchairSeats": 1,
    "registrarCode": "COA B26",
    "sourceRoomNumber": "B26",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-b27",
    "buildingId": "coalition",
    "number": "B27",
    "name": "COA B27",
    "floor": 0,
    "roomType": "Lecture Hall",
    "capacity": 100,
    "wheelchairSeats": 1,
    "registrarCode": "COA B27",
    "sourceRoomNumber": "B27",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-b30",
    "buildingId": "coalition",
    "number": "B30",
    "name": "COA B30",
    "floor": 0,
    "roomType": "Classroom",
    "capacity": 58,
    "wheelchairSeats": 1,
    "registrarCode": "COA B30",
    "sourceRoomNumber": "B30",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-117",
    "buildingId": "coalition",
    "number": "117",
    "name": "COA 117",
    "floor": 1,
    "roomType": "Classroom",
    "capacity": 56,
    "wheelchairSeats": 1,
    "registrarCode": "COA 117",
    "sourceRoomNumber": "117",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-121",
    "buildingId": "coalition",
    "number": "121",
    "name": "COA 121",
    "floor": 1,
    "roomType": "Classroom",
    "capacity": 40,
    "wheelchairSeats": 1,
    "registrarCode": "COA 121",
    "sourceRoomNumber": "121",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-122",
    "buildingId": "coalition",
    "number": "122",
    "name": "COA 122",
    "floor": 1,
    "roomType": "Classroom",
    "capacity": 40,
    "wheelchairSeats": 1,
    "registrarCode": "COA 122",
    "sourceRoomNumber": "122",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-123",
    "buildingId": "coalition",
    "number": "123",
    "name": "COA 123",
    "floor": 1,
    "roomType": "Classroom",
    "capacity": 60,
    "wheelchairSeats": 1,
    "registrarCode": "COA 123",
    "sourceRoomNumber": "123",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-124",
    "buildingId": "coalition",
    "number": "124",
    "name": "COA 124",
    "floor": 1,
    "roomType": "Classroom",
    "capacity": 40,
    "wheelchairSeats": 1,
    "registrarCode": "COA 124",
    "sourceRoomNumber": "124",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-125",
    "buildingId": "coalition",
    "number": "125",
    "name": "COA 125",
    "floor": 1,
    "roomType": "Lecture Hall",
    "capacity": 110,
    "wheelchairSeats": 1,
    "registrarCode": "COA 125",
    "sourceRoomNumber": "125",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-126",
    "buildingId": "coalition",
    "number": "126",
    "name": "COA 126",
    "floor": 1,
    "roomType": "Classroom",
    "capacity": null,
    "wheelchairSeats": 1,
    "registrarCode": "COA 126",
    "sourceRoomNumber": "126",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-127",
    "buildingId": "coalition",
    "number": "127",
    "name": "COA 127",
    "floor": 1,
    "roomType": "Lecture Hall",
    "capacity": 104,
    "wheelchairSeats": 1,
    "registrarCode": "COA 127",
    "sourceRoomNumber": "127",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-128",
    "buildingId": "coalition",
    "number": "128",
    "name": "COA 128",
    "floor": 1,
    "roomType": "Classroom",
    "capacity": null,
    "wheelchairSeats": 1,
    "registrarCode": "COA 128",
    "sourceRoomNumber": "128",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  },
  {
    "id": "coalition-130",
    "buildingId": "coalition",
    "number": "130",
    "name": "COA 130",
    "floor": 1,
    "roomType": "Lecture Hall",
    "capacity": 140,
    "wheelchairSeats": 1,
    "registrarCode": "COA 130",
    "sourceRoomNumber": "130",
    "source": {
      "authority": "UC San Diego Facilities",
      "sourceType": "classroom-attributes",
      "url": "https://facilities.ucsd.edu/NA/ClassroomAttributes/Default.htm?view=ClassroomAttributes",
      "retrievedAt": "2026-11-08T03:54:35.883Z"
    }
  }
];

module.exports = {
  CAMPUS_ROOMS,
  default: CAMPUS_ROOMS
};
