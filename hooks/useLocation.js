"use client";

import { useEffect, useState } from "react";

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not available in this browser.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      () => {
        setError("Location access is off, so the route is using a simple fallback.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, isLocating, error };
}
