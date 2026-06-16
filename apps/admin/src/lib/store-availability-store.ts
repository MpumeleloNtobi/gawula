"use client";

import { create } from "zustand";

type State = {
  paused: boolean | null;
  setPaused: (paused: boolean | null) => void;
  refresh: (() => Promise<void>) | null;
  setRefresh: (fn: (() => Promise<void>) | null) => void;
};

export const useStoreAvailability = create<State>((set) => ({
  paused: null,
  setPaused: (paused) => set({ paused }),
  refresh: null,
  setRefresh: (fn) => set({ refresh: fn }),
}));
