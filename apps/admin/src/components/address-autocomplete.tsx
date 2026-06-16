"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type Prediction = { description: string; placeId: string };

type PlacePrediction = {
  text: { text: string };
  placeId: string;
};

type PlaceInstance = {
  fetchFields: (request: { fields: string[] }) => Promise<unknown>;
  location?: { lat: () => number; lng: () => number } | null;
};

type PlacesLib = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      includedRegionCodes?: string[];
      sessionToken?: unknown;
    }) => Promise<{ suggestions: { placePrediction: PlacePrediction | null }[] }>;
  };
  AutocompleteSessionToken: new () => unknown;
  Place: new (options: { id: string }) => PlaceInstance;
};

type MapsWindow = {
  google?: { maps?: { importLibrary?: (name: string) => Promise<unknown> } };
};

function ensureBootstrap(apiKey: string) {
  const w = window as unknown as MapsWindow;
  if (w.google?.maps?.importLibrary) return;
  ((g: Record<string, unknown>) => {
      let h: Promise<void> | undefined;
      const c = "google";
      const l = "importLibrary";
      const q = "__ib__";
      const m = document;
      const b = window as unknown as Record<string, Record<string, unknown>>;
      const win = b[c] || (b[c] = {});
      const d = (win.maps as Record<string, unknown>) || (win.maps = {});
      const r = new Set<string>();
      const e = new URLSearchParams();
      const u = () =>
        h ||
        (h = new Promise<void>((f, n) => {
          const a = m.createElement("script");
          e.set("libraries", [...r] + "");
          for (const k in g)
            e.set(
              k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
              String(g[k])
            );
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          (d as Record<string, unknown>)[q] = f;
          a.onerror = () => {
            h = Promise.reject(new Error("Google Maps could not load."));
            n(new Error("Google Maps could not load."));
          };
          a.nonce = m.querySelector("script[nonce]")?.getAttribute("nonce") || "";
          m.head.append(a);
        }));
      const dl = d as Record<string, unknown>;
      if (!dl[l])
        dl[l] = (f: string, ...n: unknown[]) =>
          r.add(f) && u().then(() => (dl[l] as (...x: unknown[]) => unknown)(f, ...n));
    })({ key: apiKey, v: "weekly" });
}

let placesPromise: Promise<PlacesLib> | null = null;

function loadPlaces(apiKey: string): Promise<PlacesLib> {
  if (typeof window === "undefined") return Promise.reject();
  if (placesPromise) return placesPromise;
  ensureBootstrap(apiKey);
  const w = window as unknown as MapsWindow;
  placesPromise = w
    .google!.maps!.importLibrary!("places")
    .then((lib) => lib as PlacesLib);
  return placesPromise;
}

export async function fetchPlaceLocation(
  apiKey: string,
  placeId: string
): Promise<{ lat: number; lng: number } | null> {
  const lib = await loadPlaces(apiKey);
  const place = new lib.Place({ id: placeId });
  await place.fetchFields({ fields: ["location"] });
  const loc = place.location;
  if (!loc) return null;
  return { lat: loc.lat(), lng: loc.lng() };
}

export function AddressAutocomplete({
  id,
  value,
  onValueChange,
  onSelect,
  onBlur,
  onKeyDownEnter,
  placeholder,
  className,
  containerClassName = "relative",
  menuClassName = "absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-card py-1 text-foreground shadow-lg ring-1 ring-black/10",
  portal = false,
  anchorRef,
  invalid,
  describedby,
  includedPrimaryTypes,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect?: (value: string, placeId?: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDownEnter?: () => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  menuClassName?: string;
  portal?: boolean;
  anchorRef?: React.RefObject<HTMLElement | null>;
  invalid?: boolean;
  describedby?: string;
  includedPrimaryTypes?: string[];
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [suggestions, setSuggestions] = React.useState<Prediction[]>([]);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const skipFetch = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLUListElement>(null);
  const libRef = React.useRef<PlacesLib | null>(null);
  const tokenRef = React.useRef<unknown>(null);
  const [menuRect, setMenuRect] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  React.useEffect(() => {
    if (!portal || !open) {
      setMenuRect(null);
      return;
    }
    const anchor = anchorRef?.current ?? containerRef.current;
    if (!anchor) return;
    const update = () => {
      const rect = anchor.getBoundingClientRect();
      setMenuRect({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [portal, open, anchorRef]);

  React.useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadPlaces(apiKey)
      .then((lib) => {
        if (cancelled) return;
        libRef.current = lib;
        tokenRef.current = new lib.AutocompleteSessionToken();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  React.useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 3 || !libRef.current) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      const lib = libRef.current;
      if (!lib) return;
      lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        includedRegionCodes: ["za"],
        sessionToken: tokenRef.current ?? undefined,
        ...(includedPrimaryTypes ? { includedPrimaryTypes } : {}),
      })
        .then(({ suggestions: results }) => {
          if (cancelled) return;
          const next = results
            .map((s) => s.placePrediction)
            .filter((p): p is PlacePrediction => p !== null)
            .map((p) => ({ description: p.text.text, placeId: p.placeId }));
          setSuggestions(next);
          setActive(-1);
          setOpen(next.length > 0);
        })
        .catch(() => {});
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const choose = (prediction: Prediction) => {
    skipFetch.current = true;
    onValueChange(prediction.description);
    onSelect?.(prediction.description, prediction.placeId);
    setOpen(false);
    setSuggestions([]);
    if (libRef.current) tokenRef.current = new libRef.current.AutocompleteSessionToken();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (event.key === "Enter" && onKeyDownEnter) {
        event.preventDefault();
        onKeyDownEnter();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === "Enter" && onKeyDownEnter) {
      event.preventDefault();
      onKeyDownEnter();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const menu =
    open && suggestions.length > 0 ? (
      <ul
        ref={menuRef}
        className={menuClassName}
        style={
          portal && menuRect
            ? {
                position: "fixed",
                top: menuRect.top,
                left: menuRect.left,
                width: menuRect.width,
              }
            : undefined
        }
      >
        {suggestions.map((s, i) => (
          <li key={s.placeId}>
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`block w-full px-4 py-2 text-left text-sm text-foreground ${
                i === active ? "bg-secondary" : "bg-transparent"
              }`}
            >
              {s.description}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={containerRef} className={containerClassName}>
      <input
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoComplete="off"
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-invalid={invalid}
        aria-describedby={describedby}
        className={className}
      />
      {portal
        ? menu && typeof document !== "undefined"
          ? createPortal(menu, document.body)
          : null
        : menu}
    </div>
  );
}

