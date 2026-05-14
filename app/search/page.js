"use client";

import Link from "next/link";
import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import { searchCampusLocations } from "@/lib/navigation";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const results = searchCampusLocations(query);

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
          onChange={setQuery}
          placeholder="Try CSE 1202, FAH, Price Center, East Ballroom..."
        />

        <div className="search-results">
          {results.map((result) => (
            <article className="search-card" key={result.key}>
              <div>
                <p className="building-short">{result.shortName}</p>
                <h2>{result.name}</h2>
                <p>{result.description}</p>
              </div>
              <Link className="secondary-link" href={result.href}>
                Open route
              </Link>
            </article>
          ))}

          {!results.length && query.trim() ? (
            <p className="empty-copy">No matches yet. Try a building code, room number, or full name.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
