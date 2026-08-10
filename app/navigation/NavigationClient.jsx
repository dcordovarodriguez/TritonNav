"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DirectionsPanel from "@/components/DirectionsPanel";
import MapView from "@/components/MapView";
import RouteBottomSheet from "@/components/RouteBottomSheet";
import { useNavigation } from "@/hooks/useNavigation";
import { navigationSelectors, useNavigationStore } from "@/store/useNavigationStore";

export default function NavigationClient() {
  const params = useSearchParams();
  const building = params.get("building");
  const room = params.get("room");
  const selectedLabel = useNavigationStore(navigationSelectors.selectedLabel);
  const selectionSource = useNavigationStore(navigationSelectors.selectionSource);
  const {
    navigationData,
    location,
    isLocating,
    locationStatus,
    locationPermission,
    error,
    retryLocation,
    activeDestination
  } = useNavigation({ building, room });

  if (!navigationData) {
    return (
      <main className="page-stack">
        <section className="section-block empty-state">
          <p className="eyebrow">Navigation</p>
          <h1>
            {activeDestination.building
              ? "We could not build a route for that destination."
              : "Pick a class or search for a building first."}
          </h1>
          <p>
            The route screen expects a valid building id or short name plus an optional room.
          </p>
          <Link className="primary-link" href="/">
            Back to schedule
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack page-with-sheet">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Route Preview</p>
            <h1>
              {navigationData.building.shortName}
              {navigationData.room ? ` ${navigationData.room}` : ""}
            </h1>
            {selectedLabel ? (
              <p className="workflow-selected">
                Selected from {selectionSource === "schedule" ? "your schedule" : "search"}:{" "}
                <strong>{selectedLabel}</strong>
              </p>
            ) : null}
          </div>
          <p className="section-note">
            {error
              ? error
              : isLocating
                ? "Checking your current location for a stronger map origin."
                : location
                  ? locationStatus === "outside"
                    ? "Your current position is outside TritonNav's UCSD routing area."
                    : "Using your current position as the map origin."
                  : "Location has not been requested yet."}
          </p>
        </div>

        {locationPermission === "denied" ? (
          <div className="inline-alert inline-alert-warning">
            <strong>Location permission denied.</strong> TritonNav is still working with a fallback
            origin, and you can retry location access at any time.
          </div>
        ) : null}

        {locationStatus === "unsupported" ? (
          <div className="inline-alert inline-alert-warning">
            <strong>Live location is unavailable in this browser.</strong> The route preview still
            works, but walking estimates may be less precise until you open the app in a browser
            that supports geolocation.
          </div>
        ) : null}

        {locationStatus === "error" && error ? (
          <div className="inline-alert inline-alert-warning">
            <strong>Location update issue.</strong> {error}
          </div>
        ) : null}

        <div className="route-toolbar">
          <Link className="secondary-link" href="/search">
            Change destination
          </Link>
          <Link className="secondary-link" href="/">
            Back to classes
          </Link>
          <span className={`status-chip status-chip-${locationStatus}`}>
            {locationStatus === "ready"
              ? "Live location ready"
              : locationStatus === "outside"
                ? "Outside UCSD routing area"
              : locationStatus === "loading"
                ? "Requesting live location"
                : locationStatus === "idle"
                  ? "Location not requested"
                : "Using fallback origin"}
          </span>
          <span className={`status-chip status-chip-${locationPermission}`}>
            Permission: {locationPermission}
          </span>
          <button className="secondary-link action-button" onClick={retryLocation} type="button">
            Retry location
          </button>
        </div>

        <div className="workflow-note">
          <p className="workflow-selected">
            Destination: <strong>{navigationData.building.name}</strong>
            {navigationData.room ? ` • room ${navigationData.room}` : ""}
          </p>
          <p className="muted-copy">
            Use the embedded map for a quick preview, then hand off to Google Maps for live walking
            directions across campus.
          </p>
        </div>

        <div className="navigation-grid">
          <MapView navigationData={navigationData} location={location} mapMode="route" />
          <DirectionsPanel navigationData={navigationData} />
        </div>
      </section>

      <RouteBottomSheet
        locationStatus={locationStatus}
        navigationData={navigationData}
        onRetryLocation={retryLocation}
      />
    </main>
  );
}
