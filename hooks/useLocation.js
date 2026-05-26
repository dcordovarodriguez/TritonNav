"use client";

import { useEffect, useRef } from "react";
import { useNavigationStore } from "@/store/useNavigationStore";

export function useLocation() {
  const location = useNavigationStore((state) => state.userLocation);
  const status = useNavigationStore((state) => state.userLocationStatus);
  const permission = useNavigationStore((state) => state.userLocationPermission);
  const requestId = useNavigationStore((state) => state.userLocationRequestId);
  const error = useNavigationStore((state) => state.userLocationError);
  const setUserLocationRequested = useNavigationStore((state) => state.setUserLocationRequested);
  const setUserLocationResolved = useNavigationStore((state) => state.setUserLocationResolved);
  const setUserLocationFailed = useNavigationStore((state) => state.setUserLocationFailed);
  const setUserLocationPermission = useNavigationStore((state) => state.setUserLocationPermission);
  const resetUserLocationState = useNavigationStore((state) => state.resetUserLocationState);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    let isActive = true;
    let permissionStatus;

    function stopWatching() {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    if (!("geolocation" in navigator)) {
      setUserLocationPermission("unsupported");
      setUserLocationFailed("Geolocation is not available in this browser.", "unsupported");
      return;
    }

    function startWatching() {
      if (watchIdRef.current !== null) return;

      setUserLocationRequested();
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!isActive) return;

          setUserLocationPermission("granted");
          setUserLocationResolved({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (geoError) => {
          if (!isActive) return;

          const message =
            geoError.code === geoError.PERMISSION_DENIED
              ? "Location permission was denied, so the route is using a simple fallback."
              : geoError.code === geoError.TIMEOUT
                ? "We could not update your location in time, so the route is using a simple fallback."
                : "Live location updates are temporarily unavailable, so the route is using a simple fallback.";

          const nextStatus =
            geoError.code === geoError.PERMISSION_DENIED ? "denied" : "error";

          if (geoError.code === geoError.PERMISSION_DENIED) {
            setUserLocationPermission("denied");
            stopWatching();
          }

          setUserLocationFailed(message, nextStatus);
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
      );
    }

    async function prepareWatcher() {
      if (!navigator.permissions?.query) {
        startWatching();
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        if (!isActive) return;

        setUserLocationPermission(permissionStatus.state);

        if (permissionStatus.state === "denied") {
          setUserLocationFailed(
            "Location permission was denied, so the route is using a simple fallback.",
            "denied"
          );
        } else {
          startWatching();
        }

        permissionStatus.onchange = () => {
          if (!isActive) return;

          setUserLocationPermission(permissionStatus.state);

          if (permissionStatus.state === "denied") {
            stopWatching();
            setUserLocationFailed(
              "Location permission was denied, so the route is using a simple fallback.",
              "denied"
            );
            return;
          }

          if (permissionStatus.state === "prompt") {
            stopWatching();
            setUserLocationPermission("prompt");
            setUserLocationRequested();
            startWatching();
            return;
          }

          startWatching();
        };
      } catch {
        startWatching();
      }
    }

    prepareWatcher();

    return () => {
      isActive = false;
      stopWatching();
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [
    resetUserLocationState,
    setUserLocationFailed,
    setUserLocationPermission,
    setUserLocationRequested,
    setUserLocationResolved,
    requestId
  ]);

  return {
    location,
    status,
    permission,
    isLocating: status === "idle" || status === "loading",
    error,
    retryLocation: resetUserLocationState
  };
}
