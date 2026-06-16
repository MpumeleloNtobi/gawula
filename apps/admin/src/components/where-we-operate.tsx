"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { LuMapPin as MapPin } from "react-icons/lu";
import { api } from "@/lib/api";

type City = { name: string; x: number; y: number; lat: number; lng: number };

const CITIES: City[] = [
  { name: "Johannesburg", x: 70.6, y: 30.8, lat: -26.2041, lng: 28.0473 },
  { name: "Pretoria", x: 72.2, y: 28.0, lat: -25.7479, lng: 28.2293 },
  { name: "Bloemfontein", x: 59.8, y: 54.5, lat: -29.0852, lng: 26.1596 },
  { name: "Cape Town", x: 14.3, y: 91.7, lat: -33.9249, lng: 18.4241 },
  { name: "Durban", x: 88.4, y: 60.5, lat: -29.8587, lng: 31.0218 },
  { name: "Polokwane", x: 79.2, y: 14.6, lat: -23.9045, lng: 29.4689 },
  { name: "Port Elizabeth", x: 56.5, y: 92.0, lat: -33.9608, lng: 25.6022 },
];

const MAX_CITY_RADIUS_KM = 80;

type ComplexSummary = {
  id: string;
  centroid: { lat: number; lng: number };
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function nearestCityName(point: { lat: number; lng: number }) {
  let best: City | null = null;
  let bestDistance = Infinity;
  for (const city of CITIES) {
    const distance = haversineKm(point, city);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = city;
    }
  }
  return best && bestDistance <= MAX_CITY_RADIUS_KM ? best.name : null;
}

export function WhereWeOperate() {
  const [liveCities, setLiveCities] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    api<ComplexSummary[]>("/complexes")
      .then((complexes) => {
        if (cancelled) return;
        const live = new Set<string>();
        for (const complex of complexes) {
          const name = nearestCityName(complex.centroid);
          if (name) live.add(name);
        }
        setLiveCities(live);
      })
      .catch(() => {
        // Leave the footprint empty if the catalog can't be reached.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-accent/60">
      <div className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          <div className="relative mx-auto aspect-[1280/1029] w-full max-w-2xl overflow-hidden rounded-3xl bg-card">
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/South_Africa_location_map.svg/1280px-South_Africa_location_map.svg.png"
              alt="Map of South Africa highlighting the cities where Gawula operates"
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
            {CITIES.map((city) => {
              const live = liveCities.has(city.name);
              return (
                <span
                  key={city.name}
                  aria-hidden
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
                >
                  {live ? (
                    <MapPin className="h-7 w-7 text-[#EA580C] drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]" strokeWidth={2} />
                  ) : (
                    <MapPin className="h-6 w-6 text-muted-foreground drop-shadow" strokeWidth={1.5} />
                  )}
                </span>
              );
            })}
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Where we operate
            </h2>
            <ul className="mt-6 space-y-1">
              {CITIES.map((city) => {
                const live = liveCities.has(city.name);
                return (
                  <li
                    key={city.name}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={`h-2.5 w-2.5 rounded-full ${
                          live ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                      <span className="text-base text-foreground">{city.name}</span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        live
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {live ? "Live" : "Coming soon"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
