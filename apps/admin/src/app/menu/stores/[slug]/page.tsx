"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, MapPin, Minus, Plus } from "lucide-react";
import { NearbyShopLogo } from "@/components/nearby-shop";
import { getNearbyShopBySlug, shopSlug } from "@/components/nearby-shop-data";
import { canAddBrandToCart, useCart } from "@/lib/cart-store";
import { categorySlug, getNearbyStoreMenu, type MenuItem } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export default function NearbyStorePage() {
  const { slug } = useParams<{ slug: string }>();
  const shop = getNearbyShopBySlug(slug);
  if (!shop) notFound();

  const brandId = shopSlug(shop.name);
  const categories = getNearbyStoreMenu(brandId);
  const lines = useCart((s) => s.lines);
  const addLine = useCart((s) => s.addLine);
  const [notice, setNotice] = React.useState<string | null>(null);

  const compatibility = React.useMemo(() => canAddBrandToCart(lines, brandId), [brandId, lines]);

  const quickAdd = (item: MenuItem) => {
    const result = addLine({ itemId: item.id, quantity: 1, modifiers: [], unitPrice: item.price });
    if (!result.ok) {
      setNotice(result.reason);
      return;
    }
    setNotice(null);
  };

  return (
    <main className="container pb-24 pt-12 md:pt-16">
      <header className="flex items-center gap-5">
        <NearbyShopLogo shop={shop} />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{shop.name}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            {shop.area}
          </p>
          {shop.badge ? (
            <p className="mt-2 text-sm font-semibold text-[#e11900]">{shop.badge}</p>
          ) : null}
        </div>
      </header>

      {notice ? (
        <div className="mt-8 rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-foreground">
          {notice}
        </div>
      ) : null}

      <div className="mt-10 grid gap-10">
        {categories.map((category) => (
          <CategoryCarousel
            key={category.title}
            slug={slug}
            category={category}
            compatibility={compatibility}
            onQuickAdd={quickAdd}
          />
        ))}
      </div>
    </main>
  );
}

type CategoryCarouselProps = {
  slug: string;
  category: { title: string; items: MenuItem[] };
  compatibility: ReturnType<typeof canAddBrandToCart>;
  onQuickAdd: (item: MenuItem) => void;
};

function CategoryCarousel({ slug, category, compatibility, onQuickAdd }: CategoryCarouselProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = React.useState({ canScrollLeft: false, canScrollRight: false });
  const href = `/menu/stores/${slug}/${categorySlug(category.title)}`;

  const updateScroll = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setScroll({
      canScrollLeft: el.scrollLeft > 1,
      canScrollRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScroll();
    el.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    return () => {
      el.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, [updateScroll]);

  const scrollByDirection = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 200);
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{category.title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={href} className="hidden text-sm font-semibold sm:inline">
            Show all
          </Link>
          <button
            type="button"
            aria-label={`Scroll ${category.title} left`}
            className="hidden h-8 w-8 place-items-center rounded-full bg-secondary disabled:opacity-35 sm:grid"
            disabled={!scroll.canScrollLeft}
            onClick={() => scrollByDirection("left")}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${category.title} right`}
            className="hidden h-8 w-8 place-items-center rounded-full bg-secondary disabled:opacity-35 sm:grid"
            disabled={!scroll.canScrollRight}
            onClick={() => scrollByDirection("right")}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <Link
            href={href}
            aria-label={`Show all ${category.title}`}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary sm:hidden"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="mt-4 flex gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {category.items.map((item) => (
          <ProductCard key={item.id} item={item} compatibility={compatibility} onAdd={onQuickAdd} />
        ))}
      </div>
    </section>
  );
}

type ProductCardProps = {
  item: MenuItem;
  compatibility: ReturnType<typeof canAddBrandToCart>;
  onAdd: (item: MenuItem) => void;
};

function ProductCard({ item, compatibility, onAdd }: ProductCardProps) {
  const line = useCart((s) => s.lines.find((l) => l.itemId === item.id && l.modifiers.length === 0));
  const updateQuantity = useCart((s) => s.updateQuantity);
  const quantity = line?.quantity ?? 0;

  return (
    <article className="w-40 shrink-0 sm:w-44">
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
        <Image src={item.image} alt={item.name} fill sizes="176px" className="object-cover" />
        {quantity > 0 ? (
          <div className="absolute bottom-2 right-2 flex h-9 items-center gap-0.5 rounded-full border border-border bg-background px-1 text-foreground shadow-md">
            <button
              type="button"
              aria-label={`Decrease ${item.name}`}
              onClick={() => updateQuantity(line!.lineId, quantity - 1)}
              className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-secondary"
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <span className="min-w-[1.25rem] text-center text-sm font-medium tabular-nums">{quantity}</span>
            <button
              type="button"
              aria-label={`Increase ${item.name}`}
              onClick={() => updateQuantity(line!.lineId, quantity + 1)}
              className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-secondary"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Add ${item.name} to cart`}
            title={compatibility.ok ? undefined : compatibility.reason}
            disabled={!compatibility.ok}
            onClick={() => onAdd(item)}
            className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground shadow-md transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
      <div className="mt-2 text-sm font-bold">{formatPrice(item.price)}</div>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.name}</p>
    </article>
  );
}


