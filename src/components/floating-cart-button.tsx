"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart, cartTotals } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

export function FloatingCartButton() {
  const lines = useCart((s) => s.lines);
  const { itemCount, total } = cartTotals(lines);
  if (itemCount === 0) return null;
  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-3 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg transition-transform hover:scale-105 sm:bottom-8 sm:right-8"
    >
      <ShoppingBag className="h-4 w-4" />
      <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
      <span className="h-4 w-px bg-background/30" aria-hidden />
      <span>{formatPrice(total)}</span>
    </Link>
  );
}
