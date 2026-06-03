"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const TRADE_TYPES: { id: string; label: string }[] = [
  { id: "mall", label: "Mall" },
  { id: "complex", label: "Complex" },
  { id: "strip", label: "Block of stores" },
  { id: "standalone", label: "Stand alone" },
];

export type PartnerStage =
  | "submitted"
  | "in-review"
  | "verification"
  | "live";

export const PARTNER_STAGES: { id: PartnerStage; label: string }[] = [
  { id: "submitted", label: "Application received" },
  { id: "in-review", label: "In review" },
  { id: "verification", label: "Store verification" },
  { id: "live", label: "Live on Gawula" },
];

export type PartnerApplication = {
  id?: string;
  storeName: string;
  description: string;
  logoDocName?: string;
  tradeType: string;
  tradeTypeLabel: string;
  locationName?: string;
  address: string;
  areaId: string;
  areaLabel: string;
  waitlisted: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactEmail: string;
  contactPhone: string;
  contactEmailVerified: boolean;
  soleProprietor: boolean;
  registrationNumber?: string;
  registrationDocName?: string;
  storefrontDocName?: string;
  submittedAt: number;
  stage: PartnerStage;
};

type PartnerApplicationState = {
  application: PartnerApplication | null;
  setApplication: (application: PartnerApplication) => void;
  markVerified: () => void;
  clear: () => void;
};

export const usePartnerApplication = create<PartnerApplicationState>()(
  persist(
    (set) => ({
      application: null,
      setApplication: (application) => set({ application }),
      markVerified: () =>
        set((state) =>
          state.application
            ? { application: { ...state.application, contactEmailVerified: true } }
            : state
        ),
      clear: () => set({ application: null }),
    }),
    { name: "gawula-partner-application" }
  )
);

export function partnerStageIndex(stage: PartnerStage) {
  return PARTNER_STAGES.findIndex((s) => s.id === stage);
}
