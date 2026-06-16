"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LuMapPin as MapPin } from "react-icons/lu";
import { AddressAutocomplete, fetchPlaceLocation } from "@/components/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { LoadingDots } from "@/components/ui/loading-dots";
import { HUBS } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const MAX_HUB_KM = 25;

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearestHub(point: { lat: number; lng: number }) {
  let best: (typeof HUBS)[number] | null = null;
  let bestKm = Infinity;
  for (const hub of HUBS) {
    const km = haversineKm(point, hub.coordinates);
    if (km < bestKm) {
      bestKm = km;
      best = hub;
    }
  }
  return best && bestKm <= MAX_HUB_KM ? best : null;
}

export function LocationPicker({ className }: { className?: string }) {
  const router = useRouter();
  const setHub = useCart((s) => s.setHub);
  const setCoords = useCart((s) => s.setCoords);
  const savedHub = useCart((s) => s.hub);
  const savedAddress = useCart((s) => s.address);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const pillRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [placeId, setPlaceId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pendingWaitlist, setPendingWaitlist] = React.useState<string | null>(null);
  const [confirmedArea, setConfirmedArea] = React.useState("");

  const getDisplayArea = (area: string) => {
    const parts = area.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1 && /^\d/.test(parts[0])) return parts[1];
    return parts[0] ?? area;
  };

  React.useEffect(() => {
    if (savedAddress) setQuery((current) => current || savedAddress);
  }, [savedAddress]);

  const goToWaitlist = (area: string) => {
    router.push(`/waitlist?area=${encodeURIComponent(area)}`);
  };

  const confirmWaitlist = (area: string) => {
    setLoading(false);
    setConfirmedArea(getDisplayArea(area));
    setPendingWaitlist(area);
  };

  const routeToHub = (hub: (typeof HUBS)[number], address: string) => {
    setHub(hub.id, address);
    router.push("/menu");
  };

  const handleSelect = (value: string, id?: string) => {
    setQuery(value);
    setPlaceId(id ?? null);
  };

  const handleContinue = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);

    if (!placeId && savedHub && trimmed === savedAddress) {
      router.push("/menu");
      return;
    }

    if (apiKey && placeId) {
      try {
        const point = await fetchPlaceLocation(apiKey, placeId);
        if (point) {
          setCoords(point);
          const hub = nearestHub(point);
          if (hub) {
            routeToHub(hub, trimmed);
            return;
          }
          confirmWaitlist(trimmed);
          return;
        }
      } catch {
        // fall through to text matching below
      }
    }

    const q = trimmed.toLowerCase();
    const hub = HUBS.find(
      (h) =>
        h.area.toLowerCase().includes(q) || h.name.toLowerCase().includes(q)
    );
    if (hub) {
      routeToHub(hub, hub.area);
    } else {
      confirmWaitlist(trimmed);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={pillRef}
        className="relative flex items-center gap-2 rounded-full bg-card p-1.5 shadow-lg ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-foreground/20"
      >
        <MapPin className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-foreground" />
        <AddressAutocomplete
          id="location-picker-address"
          value={query}
          onValueChange={(value) => {
            setQuery(value);
            setPlaceId(null);
            setPendingWaitlist(null);
          }}
          onSelect={handleSelect}
          onKeyDownEnter={handleContinue}
          placeholder="Enter delivery address"
          containerClassName="flex-1"
          portal
          anchorRef={pillRef}
          menuClassName="z-[60] max-h-72 overflow-auto rounded-2xl border bg-card py-1 text-foreground shadow-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          className="h-12 w-full rounded-full border-0 bg-transparent pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-0"
        />
        <Button
          size="lg"
          className="h-12 shrink-0 rounded-full px-6 text-base font-semibold"
          onClick={handleContinue}
          disabled={loading}
        >
          Find Food
          {loading ? <LoadingDots className="ml-2" /> : null}
        </Button>
      </div>
      <Dialog open={!!pendingWaitlist} onOpenChange={(open) => { if (!open) setPendingWaitlist(null); }}>
        <DialogContent>
          <DialogTitle>Confirm your area</DialogTitle>
          <DialogDescription>
            Is this the right area? Correct it if not.
          </DialogDescription>
          <div className="mt-5 grid gap-1.5">
            <label className="sr-only" htmlFor="lp-confirm-area">Your area</label>
            <input
              id="lp-confirm-area"
              value={confirmedArea}
              onChange={(e) => setConfirmedArea(e.target.value)}
              className="h-12 rounded-xl border-0 bg-secondary px-4 text-base outline-none focus:ring-2 focus:ring-foreground/40"
            />
          </div>
          <div className="mt-5">
            <Button
              variant="dark"
              size="lg"
              className="w-full rounded-full"
              disabled={!confirmedArea.trim()}
              onClick={() => goToWaitlist(confirmedArea.trim())}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}