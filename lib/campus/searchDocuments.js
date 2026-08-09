const {
  getAllCampusBuildings,
  getAllCampusColleges,
  getAllCampusHousingCommunities,
  getAllCampusPlaces,
  getAllCampusRooms,
  resolveBuildingById,
  resolveEntranceById
} = require("./resolver.js");

const MOCK_SCHEDULE_DOCUMENTS = [
  {
    id: "cogs101",
    course: "COGS 101B",
    building: "CSB",
    buildingId: "csb",
    buildingName: "Cognitive Science Building",
    room: "115",
    time: "10:00 AM"
  },
  {
    id: "cse100",
    course: "CSE 100",
    building: "CSE",
    buildingId: "cse",
    buildingName: "Computer Science and Engineering Building",
    room: "1202",
    time: "1:00 PM"
  },
  {
    id: "cogs14a",
    course: "COGS 14A",
    building: "FAH",
    buildingId: "fah",
    buildingName: "Franklin Antonio Hall",
    room: "1450",
    time: "3:30 PM"
  },
  {
    id: "student-org",
    course: "Student Org Meeting",
    building: "PC",
    buildingId: "price-center",
    buildingName: "Price Center",
    room: "East Ballroom",
    time: "6:00 PM"
  }
];

function createBuildingDocuments() {
  return getAllCampusBuildings().map((building) => ({
    key: building.id,
    destinationId: building.id,
    buildingId: building.id,
    room: "",
    name: building.name,
    shortName: building.code,
    buildingCode: building.code,
    type: building.type,
    typeLabel: building.type,
    address: building.address,
    aliases: building.aliases,
    district: building.district || "",
    college: building.college || "",
    officialName: building.officialName || building.name,
    dataQuality: building.dataQuality || [],
    entranceDataStatus: building.entranceDataStatus || "",
    accessibilityStatus: building.accessibilityStatus || "",
    nearbyLandmarks: [],
    coordinates: building.centroid,
    searchValues: [
      building.name,
      building.officialName,
      building.code,
      building.district,
      building.college,
      ...(building.aliases || [])
    ]
  }));
}

function createRoomDocuments() {
  return getAllCampusRooms().map((room) => {
    const building = getAllCampusBuildings().find((entry) => entry.id === room.buildingId);
    const entrance = resolveEntranceById(room.preferredEntranceId);

    return {
      key: room.id,
      destinationId: room.buildingId,
      buildingId: room.buildingId,
      room: room.number,
      name: room.name || `${building?.name || room.buildingId} ${room.number}`,
      shortName: building?.code || "",
      buildingCode: building?.code || "",
      type: "classroom",
      typeLabel: "classroom",
      address: building?.address || "UC San Diego, La Jolla, CA 92093",
      aliases: [
        `${building?.code || ""} ${room.number}`.trim(),
        `${building?.name || ""} room ${room.number}`.trim(),
        ...(building?.aliases || []).map((alias) => `${alias} ${room.number}`)
      ],
      nearbyLandmarks: entrance ? [entrance.name] : [],
      coordinates: building?.centroid || null,
      preferredEntranceId: room.preferredEntranceId,
      searchValues: [
        building?.name,
        building?.code,
        room.number,
        room.name,
        `${building?.code || ""} ${room.number}`,
        `${building?.name || ""} ${room.number}`,
        ...(building?.aliases || []).map((alias) => `${alias} ${room.number}`)
      ]
    };
  });
}

function createCollegeDocuments() {
  return getAllCampusColleges().map((college) => ({
    key: college.id,
    destinationId: college.id,
    buildingId: college.id,
    room: "",
    name: college.name,
    shortName: college.name.replace(/\s+College$/i, ""),
    buildingCode: college.name.replace(/\s+College$/i, ""),
    type: "college",
    typeLabel: "college",
    address: "UC San Diego, La Jolla, CA 92093",
    aliases: college.aliases,
    nearbyLandmarks: [],
    coordinates: college.centroid,
    boundaryPolygon: college.boundaryPolygon,
    associatedBuildings: college.associatedBuildingIds,
    residenceHalls: [],
    landmarks: [],
    searchValues: [
      college.name,
      college.name.replace(/\s+College$/i, ""),
      ...(college.aliases || []),
      ...(college.associatedBuildingIds || [])
    ]
  }));
}

function createHousingDocuments() {
  return getAllCampusHousingCommunities().map((community) => {
    const primaryBuildingId =
      community.buildingIds?.[0] ||
      community.documentedResidentialBuildings?.find((building) => building.buildingId)?.buildingId ||
      "";
    const primaryBuilding = resolveBuildingById(primaryBuildingId);

    return {
      key: community.id,
      destinationId: primaryBuilding?.id || community.id,
      buildingId: primaryBuilding?.id || community.id,
      room: "",
      name: community.name,
      shortName: community.name,
      buildingCode: primaryBuilding?.code || "",
      type: community.type || "housing community",
      typeLabel: community.type || "housing community",
      address: primaryBuilding?.address || "UC San Diego, La Jolla, CA 92093",
      aliases: community.aliases || [],
      coordinates: primaryBuilding?.centroid || null,
      associatedBuildings: community.buildingIds || [],
      documentedResidentialBuildings: community.documentedResidentialBuildings || [],
      inventoryStatus: community.inventoryStatus || "",
      source: community.source,
      searchValues: [
        community.name,
        community.type,
        community.inventoryStatus,
        ...(community.aliases || []),
        ...(community.buildingIds || []),
        ...(community.documentedResidentialBuildings || []).flatMap((building) => [
          building.name,
          building.category
        ])
      ]
    };
  });
}

function createPlaceDocuments() {
  return getAllCampusPlaces().map((place) => ({
    key: place.id,
    destinationId: place.relatedBuildingId || place.id,
    buildingId: place.relatedBuildingId || place.id,
    room: "",
    name: place.name,
    shortName: place.name,
    buildingCode: "",
    type: place.type,
    typeLabel: place.type,
    address: "UC San Diego, La Jolla, CA 92093",
      aliases: place.aliases,
      nearbyLandmarks: place.amenities || [],
      coordinates: place.coordinates,
      amenities: place.amenities || [],
      ctas: place.ctas || [],
      sourceUrls: place.sourceUrls || {},
      searchValues: [place.name, ...(place.aliases || []), ...(place.amenities || [])]
    }));
}

function createCourseDocuments() {
  return MOCK_SCHEDULE_DOCUMENTS.map((classItem) => ({
    key: `course-${classItem.id}`,
    destinationId: classItem.buildingId,
    buildingId: classItem.buildingId,
    room: classItem.room,
    name: classItem.course,
    shortName: classItem.building,
    buildingCode: classItem.building,
    type: "course",
    typeLabel: "course",
    address: classItem.buildingName,
    aliases: [
      classItem.course,
      `${classItem.course} ${classItem.building}`,
      `${classItem.building} ${classItem.room}`,
      classItem.buildingName
    ],
    nearbyLandmarks: [],
    coordinates: null,
    searchValues: [
      classItem.course,
      classItem.building,
      classItem.buildingName,
      classItem.room,
      `${classItem.building} ${classItem.room}`
    ]
  }));
}

function createCampusSearchDocuments() {
  return [
    ...createBuildingDocuments(),
    ...createCollegeDocuments(),
    ...createHousingDocuments(),
    ...createPlaceDocuments(),
    ...createRoomDocuments(),
    ...createCourseDocuments()
  ];
}

module.exports = {
  createCampusSearchDocuments
};
