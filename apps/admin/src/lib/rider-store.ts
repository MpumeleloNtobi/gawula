"use client";

import { create } from "zustand";

export type RiderStatus = "online" | "offline" | null;

type RiderState = {
  status: RiderStatus;
  setStatus: (status: RiderStatus) => void;
  onTrip: boolean;
  setOnTrip: (onTrip: boolean) => void;
  refresh: (() => Promise<void>) | null;
  setRefresh: (fn: (() => Promise<void>) | null) => void;
};

export const useRiderStore = create<RiderState>((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
  onTrip: false,
  setOnTrip: (onTrip) => set({ onTrip }),
  refresh: null,
  setRefresh: (fn) => set({ refresh: fn }),
}));
