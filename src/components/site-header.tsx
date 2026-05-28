"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, cartTotals } from "@/lib/cart-store";
import { HUBS } from "@/lib/mock-data";
import { cn, formatPrice } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const hubId = useCart((s) => s.hub);
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);
  const { itemCount, total } = cartTotals(lines);
  const hub = HUBS.find((h) => h.id === hubId);

  const isOrderingFlow =
    pathname.startsWith("/menu") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            t
          </span>
          <span className="text-lg font-semibold tracking-tight">tabletop</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-foreground/70 md:flex">
          <Link href="/menu" className="hover:text-foreground">Restaurants</Link>
          <Link href="/#how-it-works" className="hover:text-foreground">How it works</Link>
          <Link href="/#offerings" className="hover:text-foreground">For business</Link>
          <Link href="/orders" className="hover:text-foreground">Orders</Link>
        </nav>

        <div className="flex items-center gap-2">
          {isOrderingFlow && hub ? (
            <div className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium lg:flex">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {hub.name}
            </div>
          ) : null}

          <Button
            variant={isOrderingFlow ? "outline" : "default"}
            size="sm"
            className={cn("relative h-10")}
            onClick={() => setDrawerOpen(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Basket</span>
            {itemCount > 0 ? (
              <span className="ml-1 rounded-full bg-background/20 px-2 py-0.5 text-xs font-semibold">
                {itemCount} · {formatPrice(total)}
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </header>
  );
}
