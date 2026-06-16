"use client";

import Image from "next/image";
import Link from "next/link";
import { LuMinus as Minus, LuPlus as Plus } from "react-icons/lu";
import { useCart } from "@/lib/cart-store";
import { BRANDS, MenuItem, getDisplayTags, getMostLikedBadge } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

type Props = {
  item: MenuItem;
};

export function MenuItemCard({ item }: Props) {
  const addLine = useCart((s) => s.addLine);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);
  const itemLines = useCart((s) => s.lines.filter((l) => l.itemId === item.id));
  const totalQty = itemLines.reduce((sum, l) => sum + l.quantity, 0);
  const brand = BRANDS.find((b) => b.id === item.brandId);
  const requiresModifiers = item.modifiers?.some((g) => g.required);
  const displayBadge = getMostLikedBadge(item) ?? getDisplayTags(item)[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (requiresModifiers) return;
    addLine({
      itemId: item.id,
      quantity: 1,
      modifiers: [],
      unitPrice: item.price,
    });
    setDrawerOpen(true);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    const line = itemLines[0];
    if (!line) return;
    updateQuantity(line.lineId, line.quantity - 1);
  };

  const displayBrand = brand?.name.split("—")[1]?.trim() ?? brand?.name;

  return (
    <Link
      href={`/menu/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 ease-out hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {displayBadge ? (
          <div className="absolute left-3 top-3 text-[11px] font-medium text-white drop-shadow-sm">
            {displayBadge}
          </div>
        ) : null}
        {totalQty > 0 && !requiresModifiers ? (
          <div
            className="absolute bottom-3 right-3 flex items-center overflow-hidden rounded-full bg-foreground text-background shadow-md"
            onClick={(e) => e.preventDefault()}
          >
            <button
              type="button"
              onClick={handleDecrement}
              aria-label="Remove one"
              className="grid h-10 w-10 place-items-center hover:opacity-80"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.25rem] text-center text-sm font-semibold">{totalQty}</span>
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label="Add one more"
              className="grid h-10 w-10 place-items-center hover:opacity-80"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={requiresModifiers ? undefined : handleQuickAdd}
            aria-label={requiresModifiers ? "Customise and add" : "Add to cart"}
            className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-foreground text-background shadow-md transition-transform hover:scale-105"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {displayBrand ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: brand?.logoColor }}
              aria-hidden
            />
            {displayBrand}
          </div>
        ) : null}
        <h3 className="text-base font-semibold leading-tight">{item.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-auto pt-3 text-sm font-semibold">{formatPrice(item.price)}</div>
      </div>
    </Link>
  );
}
