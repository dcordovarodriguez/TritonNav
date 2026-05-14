"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DirectionsPanel from "@/components/DirectionsPanel";
import MapView from "@/components/MapView";
import { useNavigation } from "@/hooks/useNavigation";

export default function NavigationClient() {
  const params = useSearchParams();
  const building = params.get("building");
  const room = params.get("room");
  const { navigationData, location, isLocating, error } = useNavigation({
    building,
    room
  });

  if (!navigationData) {
    return (
      <main className="page-stack">
        <section className="section-block empty-state">
          <p className="eyebrow">Navigation</p>
          <h1>Pick a class or search for a building first.</h1>
          <p>
            The route screen expects a building id or short name plus an optional room.
          </p>
          <Link className="primary-link" href="/">
            Back to schedule
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live Route</p>
            <h1>
              {navigationData.building.shortName}
              {navigationData.room ? ` ${navigationData.room}` : ""}
            </h1>
          </div>
          <p className="section-note">
            {error
              ? error
              : isLocating
                ? "Checking your current location for a stronger Google Maps handoff."
                : location
                  ? "Using your current position as the map origin."
                  : "Using a campus-ready fallback until location is enabled."}
          </p>
        </div>

        <div className="navigation-grid">
          <MapView navigationData={navigationData} location={location} />
          <DirectionsPanel navigationData={navigationData} />
        </div>
      </section>
    </main>
  );
}
