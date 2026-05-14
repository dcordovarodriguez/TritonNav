"use client";

import { useEffect, useState } from "react";
import { getNavigationData } from "@/lib/navigation";
import { useLocation } from "@/hooks/useLocation";

export function useNavigation({ building, room }) {
  const { location, isLocating, error } = useLocation();
  const [navigationData, setNavigationData] = useState(() =>
    getNavigationData(building, room)
  );

  useEffect(() => {
    setNavigationData(getNavigationData(building, room, location));
  }, [building, room, location]);

  return {
    navigationData,
    location,
    isLocating,
    error
  };
}
