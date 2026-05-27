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
            This is useful once you move beyond the fixed class schedule demo and want a more
            flexible campus destination flow.
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
            Search a building, room, alias, or campus keyword, tap a suggestion, then preview the
            route with room-aware guidance.
          </p>
          <p className="muted-copy">
            Demo tip: try <strong>MANDE</strong>, <strong>CSB 115</strong>, or <strong>PC East Ballroom</strong>.
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
            <div className="empty-copy empty-message-card">
              <p>No campus results matched that query yet.</p>
              <p>
                Try a building code, alias, room number, or partial name such as
                {" "}
                <strong>MANDE</strong>, <strong>CSB</strong>, or <strong>Price Center</strong>.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
