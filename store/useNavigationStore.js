import { create } from "zustand";

export const useNavigationStore = create((set, get) => ({
  searchQuery: "",
  selectedBuilding: "",
  selectedRoom: "",
  selectedLabel: "",
  selectedResultKey: "",
  selectionSource: "idle",
  userLocation: null,
  userLocationStatus: "idle",
  userLocationPermission: "unknown",
  userLocationRequestId: 0,
  userLocationError: "",
  mapStatus: "idle",
  mapError: "",
  bottomSheetExpanded: true,

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectDestination: ({ building = "", room = "", label = "", source = "manual" }) =>
    set({
      selectedBuilding: building ? String(building) : "",
      selectedRoom: room ? decodeURIComponent(String(room)).trim() : "",
      selectedLabel: label,
      selectedResultKey: building ? `${String(building)}:${room ? String(room) : ""}` : "",
      selectionSource: source,
      mapStatus: building ? "loading" : "idle",
      mapError: ""
    }),

  hydrateFromParams: (building, room) => {
    const nextBuilding = building ? String(building) : "";
    const nextRoom = room ? decodeURIComponent(String(room)).trim() : "";
    const current = get();

    if (current.selectedBuilding === nextBuilding && current.selectedRoom === nextRoom) {
      return;
    }

    set({
      selectedBuilding: nextBuilding,
      selectedRoom: nextRoom,
      selectedLabel: "",
      selectedResultKey: nextBuilding ? `${nextBuilding}:${nextRoom}` : "",
      selectionSource: "url",
      mapStatus: nextBuilding ? "loading" : "idle",
      mapError: ""
    });
  },

  setUserLocationPermission: (userLocationPermission) => set({ userLocationPermission }),

  setUserLocationRequested: () =>
    set((state) =>
      state.userLocationStatus === "loading"
        ? state
        : {
            userLocationStatus: "loading",
            userLocationError: ""
          }
    ),

  setUserLocationResolved: (userLocation, status = "ready") =>
    set({
      userLocation,
      userLocationStatus: status,
      userLocationError: ""
    }),

  setUserLocationFailed: (message, status = "error") =>
    set({
      userLocation: null,
      userLocationStatus: status,
      userLocationError: message
    }),

  resetUserLocationState: () =>
    set((state) => ({
      userLocationStatus: "idle",
      userLocationPermission: "unknown",
      userLocationError: "",
      userLocationRequestId: state.userLocationRequestId + 1
    })),

  setMapLoading: () =>
    set({
      mapStatus: "loading",
      mapError: ""
    }),

  setMapReady: () =>
    set({
      mapStatus: "ready",
      mapError: ""
    }),

  setMapFailed: (message) =>
    set({
      mapStatus: "error",
      mapError: message
    }),

  toggleBottomSheet: () =>
    set((state) => ({
      bottomSheetExpanded: !state.bottomSheetExpanded
    })),

  setBottomSheetExpanded: (bottomSheetExpanded) => set({ bottomSheetExpanded })
}));

export const navigationSelectors = {
  searchQuery: (state) => state.searchQuery,
  selectedLabel: (state) => state.selectedLabel,
  selectedBuilding: (state) => state.selectedBuilding,
  selectedRoom: (state) => state.selectedRoom,
  selectedResultKey: (state) => state.selectedResultKey,
  selectionSource: (state) => state.selectionSource,
  mapStatus: (state) => state.mapStatus,
  mapError: (state) => state.mapError,
  bottomSheetExpanded: (state) => state.bottomSheetExpanded,
  userLocationPermission: (state) => state.userLocationPermission,
  userLocationRequestId: (state) => state.userLocationRequestId
};
