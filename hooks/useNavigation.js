"use client";

import { useEffect, useMemo } from "react";
import { getNavigationData } from "@/lib/navigation";
import { useLocation } from "@/hooks/useLocation";
import { useNavigationStore } from "@/store/useNavigationStore";

export function useNavigation({ building, room }) {
  const { location, status, permission, isLocating, error, retryLocation } = useLocation();
  const selectedBuilding = useNavigationStore((state) => state.selectedBuilding);
  const selectedRoom = useNavigationStore((state) => state.selectedRoom);
  const hydrateFromParams = useNavigationStore((state) => state.hydrateFromParams);
  const hasRouteParams = building !== null || room !== null;

  useEffect(() => {
    if (hasRouteParams) {
      hydrateFromParams(building, room);
    }
  }, [building, hasRouteParams, hydrateFromParams, room]);

  const activeBuilding = building ?? selectedBuilding;
  const activeRoom = room !== null ? room : building !== null ? "" : selectedRoom;
  const navigationData = useMemo(
    () =>
      activeBuilding
        ? getNavigationData(activeBuilding, activeRoom, location)
        : null,
    [activeBuilding, activeRoom, location]
  );

  return {
    navigationData,
    location,
    locationStatus: status,
    locationPermission: permission,
    isLocating,
    error,
    retryLocation,
    activeDestination: {
      building: activeBuilding,
      room: activeRoom
    }
  };
}
