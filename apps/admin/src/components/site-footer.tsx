"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRANDS, HUBS, RESTAURANT_BRAND_IDS } from "@/lib/mock-data";

const HIDDEN_ROUTES = ["/sign-in", "/sign-up", "/verify-email"];
const HIDDEN_PREFIXES = [
  "/rider",
  "/rider-demo",
  "/admin",
  "/store",
  "/menu",
  "/cart",
  "/checkout",
  "/orders",
];

export function SiteFooter() {
  const pathname = usePathname();
  if (HIDDEN_ROUTES.includes(pathname)) return null;
  if (
    HIDDEN_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return null;
  }

  return (
    <footer className="bg-secondary/30">
      <div className="container grid gap-10 pt-14 pb-[calc(env(safe-area-inset-bottom)_+_6rem)] sm:grid-cols-2 md:pb-14 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-primary">Gawula</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Food from your favourites, all in one order.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">© 2026 Gawula (Pty) Ltd.</p>
        </div>

        <div>
          <p className="text-sm font-semibold">Company</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-foreground">Terms</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Locations</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {HUBS.map((h) => (
              <li key={h.id}>
                <Link href="/menu" className="hover:text-foreground">
                  {h.area.split(",")[0]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Restaurants</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {BRANDS.filter((b) => RESTAURANT_BRAND_IDS.includes(b.id)).map((b) => (
              <li key={b.id}>
                <Link href={`/menu/${b.id}`} className="hover:text-foreground">
                  {b.name.split("—")[1]?.trim() ?? b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
