"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RiderVehicle = "bicycle" | "scooter" | "motorbike" | "car";

export const RIDER_VEHICLES: { id: RiderVehicle; label: string }[] = [
  { id: "bicycle", label: "Bicycle" },
  { id: "scooter", label: "Scooter" },
  { id: "motorbike", label: "Motorbike" },
  { id: "car", label: "Car" },
];

export type ApplicationStage =
  | "submitted"
  | "in-review"
  | "verification"
  | "approved";

export const APPLICATION_STAGES: { id: ApplicationStage; label: string }[] = [
  { id: "submitted", label: "Application received" },
  { id: "in-review", label: "In review" },
  { id: "verification", label: "Document verification" },
  { id: "approved", label: "Approved to ride" },
];

export type RiderApplication = {
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  areaId: string;
  areaLabel: string;
  waitlisted: boolean;
  vehicle: RiderVehicle;
  hasSmartphone: boolean;
  idNumber: string;
  idFrontDocName?: string;
  idBackDocName?: string;
  selfieDocName?: string;
  fullBodyDocName?: string;
  licenceDocName?: string;
  submittedAt: number;
  stage: ApplicationStage;
};

type RiderApplicationState = {
  application: RiderApplication | null;
  setApplication: (application: RiderApplication) => void;
  clear: () => void;
};

export const useRiderApplication = create<RiderApplicationState>()(
  persist(
    (set) => ({
      application: null,
      setApplication: (application) => set({ application }),
      clear: () => set({ application: null }),
    }),
    { name: "gawula-rider-application" }
  )
);

export function stageIndex(stage: ApplicationStage) {
  return APPLICATION_STAGES.findIndex((s) => s.id === stage);
}
