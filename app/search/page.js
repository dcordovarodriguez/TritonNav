"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { buildNavigationHref, searchCampusLocations } from "@/lib/navigation";
import { navigationSelectors, useNavigationStore } from "@/store/useNavigationStore";

export default function SearchPage() {
  const router = useRouter();
  const query = useNavigationStore(navigationSelectors.searchQuery);
  const setSearchQuery = useNavigationStore((state) => state.setSearchQuery);
  const selectDestination = useNavigationStore((state) => state.selectDestination);
  const selectedLabel = useNavigationStore(navigationSelectors.selectedLabel);
  const selectedBuilding = useNavigationStore(navigationSelectors.selectedBuilding);
  const selectedRoom = useNavigationStore(navigationSelectors.selectedRoom);
  const selectedResultKey = useNavigationStore(navigationSelectors.selectedResultKey);
  const results = useMemo(() => searchCampusLocations(query), [query]);

  function openRoute(result) {
    selectDestination({
      building: result.buildingId,
      room: result.room,
      label: result.name,
      source: "search"
    });

    router.push(buildNavigationHref(result.buildingId, result.room));
  }

  function handlePreviewSubmit() {
    if (results.length) {
      openRoute(results[0]);
    }
  }

  return (
    <main className="page-stack">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Search</p>
            <h1>Find a UCSD building or room</h1>
          </div>
          <p className="section-note">
            This is useful once you move beyond the fixed class schedule demo.
          </p>
        </div>

        <SearchBar
          value={query}
          onChange={setSearchQuery}
          onSubmit={handlePreviewSubmit}
          onSelectResult={openRoute}
          results={results}
          selectedKey={selectedResultKey}
          placeholder="Try CSE 1202, FAH, Price Center, East Ballroom..."
        />

        <div className="workflow-note">
          <p className="muted-copy">
            Search a building or room, tap a suggestion to store the destination, then preview the route.
          </p>
          {selectedBuilding ? (
            <p className="workflow-selected">
              Current selection: <strong>{selectedLabel || selectedBuilding}</strong>
              {selectedRoom ? ` • room ${selectedRoom}` : ""}
            </p>
          ) : null}
        </div>

        <div className="search-results">
          {results.map((result) => (
            <article className="search-card" key={result.key}>
              <div>
                <p className="building-short">{result.shortName}</p>
                <h2>{result.name}</h2>
                <p>{result.description}</p>
                <p className="muted-copy">
                  {result.typeLabel}
                  {result.buildingCode ? ` • ${result.buildingCode}` : ""}
                  {result.room ? ` • room ${result.room}` : ""}
                </p>
              </div>
              <button
                className="secondary-link action-button"
                onClick={() => openRoute(result)}
                type="button"
              >
                Preview route
              </button>
            </article>
          ))}

          {!results.length && query.trim() ? (
            <p className="empty-copy">
              No campus results yet. Try a building code, alias, room number, or partial name such as
              "MANDE".
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
