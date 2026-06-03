"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HUBS } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export function LocationPicker({ className }: { className?: string }) {
  const router = useRouter();
  const setHub = useCart((s) => s.setHub);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HUBS;
    return HUBS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.area.toLowerCase().includes(q)
    );
  }, [query]);

  const noMatch = query.trim() !== "" && matches.length === 0;

  const goToWaitlist = () => {
    router.push(`/waitlist?area=${encodeURIComponent(query.trim())}`);
  };

  const handleSelect = (id: string, label: string) => {
    setSelected(id);
    setQuery(label);
    setOpen(false);
  };

  const handleContinue = () => {
    if (noMatch) {
      setLoading(true);
      goToWaitlist();
      return;
    }
    const hub = HUBS.find((h) => h.id === selected) ?? matches[0];
    if (!hub) return;
    setLoading(true);
    setHub(hub.id, hub.area);
    router.push("/menu");
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex items-center gap-2 rounded-full bg-card p-1.5 shadow-lg ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-foreground/20">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Enter delivery address"
            className="h-12 border-0 bg-transparent pl-12 text-base text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0"
          />
        </div>
        <Button
          size="lg"
          className="h-12 shrink-0 rounded-full px-6 text-base font-semibold"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Find Food
        </Button>
      </div>

      {open && matches.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border bg-popover shadow-xl">
          <ul className="max-h-72 overflow-y-auto py-1">
            {matches.map((hub) => (
              <li key={hub.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(hub.id, hub.area)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                >
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">{hub.area}</div>
                    <div className="text-xs text-muted-foreground">
                      Served from {hub.name}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {open && noMatch ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border bg-popover p-4 shadow-xl">
          <p className="text-sm font-medium">
            We are not in {query.trim()} yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Leave your details and we will let you know the moment we go live near you.
          </p>
          <Button
            type="button"
            size="sm"
            variant="dark"
            className="mt-3 rounded-full px-4"
            onMouseDown={(e) => e.preventDefault()}
            onClick={goToWaitlist}
          >
            Register for updates
          </Button>
        </div>
      ) : null}
    </div>
  );
}