"use client";

import * as React from "react";

type Prediction = { description: string; placeId: string };

type PlacePrediction = {
  text: { text: string };
  placeId: string;
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
};

let placesPromise: Promise<PlacesLib> | null = null;

function loadPlaces(apiKey: string): Promise<PlacesLib> {
  if (typeof window === "undefined") return Promise.reject();
  if (placesPromise) return placesPromise;
  const w = window as unknown as {
    google?: { maps?: { importLibrary?: (name: string) => Promise<unknown> } };
  };
  if (!w.google?.maps?.importLibrary) {
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
  placesPromise = w
    .google!.maps!.importLibrary!("places")
    .then((lib) => lib as PlacesLib);
  return placesPromise;
}

export function AddressAutocomplete({
  id,
  value,
  onValueChange,
  onSelect,
  onBlur,
  className,
  invalid,
  describedby,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect?: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  invalid?: boolean;
  describedby?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [suggestions, setSuggestions] = React.useState<Prediction[]>([]);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const skipFetch = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const libRef = React.useRef<PlacesLib | null>(null);
  const tokenRef = React.useRef<unknown>(null);

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
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const choose = (description: string) => {
    skipFetch.current = true;
    onValueChange(description);
    onSelect?.(description);
    setOpen(false);
    setSuggestions([]);
    if (libRef.current) tokenRef.current = new libRef.current.AutocompleteSessionToken();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(suggestions[active].description);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-invalid={invalid}
        aria-describedby={describedby}
        className={className}
      />
      {open && suggestions.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-card py-1 shadow-lg ring-1 ring-black/10">
          {suggestions.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(s.description);
                }}
                onMouseEnter={() => setActive(i)}
                className={`block w-full px-4 py-2 text-left text-sm ${
                  i === active ? "bg-secondary" : "bg-transparent"
                }`}
              >
                {s.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

