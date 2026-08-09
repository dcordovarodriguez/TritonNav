const CAMPUS_DISTRICTS = [
  {
    id: "university-center",
    name: "University Center",
    aliases: ["central campus", "price center area", "library walk"],
    source: "official-ucsd-map"
  },
  {
    id: "revelle",
    name: "Revelle",
    aliases: ["revelle college"],
    source: "official-ucsd-map"
  },
  {
    id: "muir",
    name: "Muir",
    aliases: ["john muir", "muir college"],
    source: "official-ucsd-map"
  },
  {
    id: "marshall",
    name: "Marshall",
    aliases: ["thurgood marshall", "marshall college"],
    source: "official-ucsd-map"
  },
  {
    id: "warren",
    name: "Warren",
    aliases: ["earl warren", "warren college"],
    source: "official-ucsd-map"
  },
  {
    id: "roosevelt",
    name: "Roosevelt",
    aliases: ["eleanor roosevelt", "erc"],
    source: "official-ucsd-map"
  },
  {
    id: "sixth",
    name: "Sixth",
    aliases: ["sixth college", "pepper canyon"],
    source: "official-ucsd-map"
  },
  {
    id: "seventh",
    name: "Seventh",
    aliases: ["seventh college", "the village"],
    source: "official-ucsd-map"
  },
  {
    id: "eighth",
    name: "Eighth",
    aliases: ["eighth college"],
    source: "official-ucsd-map"
  },
  {
    id: "health-sciences",
    name: "Health Sciences",
    aliases: ["school of medicine", "east campus health sciences", "la jolla medical campus"],
    source: "official-ucsd-map"
  },
  {
    id: "north-campus",
    name: "North Campus",
    aliases: ["rimac", "north campus recreation"],
    source: "official-ucsd-map"
  }
];

module.exports = {
  CAMPUS_DISTRICTS,
  default: CAMPUS_DISTRICTS
};
