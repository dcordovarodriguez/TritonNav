"use client";

import { useMemo } from "react";
import campusBounds from "@/lib/campus/campusBounds";
import { useNavigationStore } from "@/store/useNavigationStore";

const { getUcsdRoutingCoverage } = campusBounds;

function getGeolocationErrorMessage(error) {
  if (error?.code === error?.PERMISSION_DENIED) {
    return "Location permission was denied. You can still preview routes from campus.";
  }

  if (error?.code === error?.TIMEOUT) {
    return "TritonNav could not get your location before the request timed out.";
  }

  return "Your device location is unavailable right now.";
}

export function useLocation() {
  const location = useNavigationStore((state) => state.userLocation);
  const status = useNavigationStore((state) => state.userLocationStatus);
  const permission = useNavigationStore((state) => state.userLocationPermission);
  const error = useNavigationStore((state) => state.userLocationError);
  const setUserLocationRequested = useNavigationStore((state) => state.setUserLocationRequested);
  const setUserLocationResolved = useNavigationStore((state) => state.setUserLocationResolved);
  const setUserLocationFailed = useNavigationStore((state) => state.setUserLocationFailed);
  const setUserLocationPermission = useNavigationStore((state) => state.setUserLocationPermission);
  const resetUserLocationState = useNavigationStore((state) => state.resetUserLocationState);
  const coverage = useMemo(() => getUcsdRoutingCoverage(location), [location]);

  function requestCurrentLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setUserLocationPermission("unsupported");
      setUserLocationFailed("Geolocation is not available in this browser.", "unsupported");
      return;
    }

    setUserLocationRequested();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const nextCoverage = getUcsdRoutingCoverage(nextLocation);

        setUserLocationPermission("granted");
        setUserLocationResolved(nextLocation, nextCoverage.isInside ? "ready" : "outside");
      },
      (geoError) => {
        const nextStatus = geoError.code === geoError.PERMISSION_DENIED ? "denied" : "error";

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setUserLocationPermission("denied");
        }

        setUserLocationFailed(getGeolocationErrorMessage(geoError), nextStatus);
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );
  }

  function retryLocation() {
    resetUserLocationState();
    requestCurrentLocation();
  }

  return {
    location,
    status,
    permission,
    coverage,
    isLocating: status === "loading",
    error,
    requestCurrentLocation,
    retryLocation
  };
}
