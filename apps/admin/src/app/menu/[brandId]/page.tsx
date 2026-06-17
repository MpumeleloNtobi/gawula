"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { LuClock as Clock, LuHeart as Heart, LuHeart as HeartFilled, LuMapPin as MapPin, LuMinus as Minus, LuPlus as Plus, LuSearch as Search, LuStar as Star, LuTag as Tag } from "react-icons/lu";
import { FloatingContactButton } from "@/components/floating-contact-button";
import { Input } from "@/components/ui/input";
import { canAddBrandToCart, useCart, type AddLineResult } from "@/lib/cart-store";
import { BRANDS, MENU_ITEMS, categorySlug, getBrand, getBrandLocation, getMostLikedBadge, getNearbyStoreMenu, type MenuItem } from "@/lib/mock-data";
import { cn, formatPrice } from "@/lib/utils";

type BrandPageDetails = {
  rating: number;
  ratingCount: number;
  area: string;
  opening: string;
  offer: string;
  labels: string[];
};

type MenuSectionConfig = {
  id: string;
  title: string;
  description: string;
  itemIds?: string[];
  terms?: string[];
  tagged?: boolean;
};

const DEFAULT_DETAILS: BrandPageDetails = {
  rating: 4.6,
  ratingCount: 900,
  area: "Johannesburg",
  opening: "Open until 21:00",
  offer: "Fresh picks available today",
  labels: ["Local", "Lunch", "Dinner"],
};

const BRAND_DETAILS: Record<string, BrandPageDetails> = {
  ember: {
    rating: 4.6,
    ratingCount: 4200,
    area: "Waterfall",
    opening: "Open until 22:00",
    offer: "Save on selected flame-grilled meals",
    labels: ["Burgers", "Chicken", "Grills"],
  },
  harvest: {
    rating: 4.7,
    ratingCount: 1200,
    area: "Waterfall",
    opening: "Open until 21:00",
    offer: "Save R20 when you spend R150",
    labels: ["Bowls", "Salads", "Vegetarian"],
  },
  noodlebar: {
    rating: 4.6,
    ratingCount: 3000,
    area: "Rosebank",
    opening: "Open until 22:30",
    offer: "Free side on selected noodle bowls",
    labels: ["Noodles", "Soup", "Asian"],
  },
  dough: {
    rating: 4.5,
    ratingCount: 2200,
    area: "Waterfall",
    opening: "Open until 23:00",
    offer: "Buy 1 get 1 free on selected pizzas",
    labels: ["Pizza", "Bakery", "Desserts"],
  },
};

const DEFAULT_SECTIONS: MenuSectionConfig[] = [
  {
    id: "popular",
    title: "Popular",
    description: "",
    tagged: true,
  },
  {
    id: "mains",
    title: "Mains",
    description: "",
    terms: ["burger", "bowl", "ramen", "pizza", "chicken", "stir-fry"],
  },
  {
    id: "sides",
    title: "Sides and extras",
    description: "",
    terms: ["fries", "rings", "gyoza", "edamame", "focaccia", "shake", "tiramisu", "soup"],
  },
];

const BRAND_SECTIONS: Record<string, MenuSectionConfig[]> = {
  harvest: [
    {
      id: "popular",
      title: "Popular",
      description: "",
      itemIds: ["harvest-mediterranean"],
    },
    {
      id: "bowls",
      title: "Bowls",
      description: "",
      itemIds: ["harvest-poke", "harvest-buddha"],
    },
    {
      id: "greens-soup",
      title: "Greens and soup",
      description: "",
      itemIds: ["harvest-caesar", "harvest-greens", "harvest-soup"],
    },
  ],
};

function itemText(item: MenuItem) {
  return [item.name, item.description, ...(item.tags ?? [])].join(" ").toLowerCase();
}

function itemMatchesSection(item: MenuItem, section: MenuSectionConfig) {
  if (section.itemIds) return section.itemIds.includes(item.id);

  const text = itemText(item);
  const tagMatch = section.tagged && Boolean(item.tags?.length);
  const termMatch = section.terms?.some((term) => text.includes(term)) ?? false;
  return tagMatch || termMatch;
}

function buildMenuSections(brandId: string, items: MenuItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchedItems = normalizedQuery
    ? items.filter((item) => itemText(item).includes(normalizedQuery))
    : items;

  if (normalizedQuery) {
    return [
      {
        id: "matches",
        title: "Search results",
        description: `${matchedItems.length} ${matchedItems.length === 1 ? "dish" : "dishes"} found`,
        items: matchedItems,
      },
    ];
  }

  const nearbyCategories = getNearbyStoreMenu(brandId);
  if (nearbyCategories.length > 0) {
    return nearbyCategories
      .map((category) => ({
        id: categorySlug(category.title),
        title: category.title,
        description: "",
        items: category.items,
      }))
      .filter((section) => section.items.length > 0);
  }

  const configs = BRAND_SECTIONS[brandId] ?? DEFAULT_SECTIONS;
  const usedItemIds = new Set<string>();
  const sections = configs
    .map((section) => {
      const sectionItems = items.filter((item) => {
        if (usedItemIds.has(item.id) || !itemMatchesSection(item, section)) return false;
        usedItemIds.add(item.id);
        return true;
      });

      return {
        id: section.id,
        title: section.title,
        description: section.description,
        items: sectionItems,
      };
    })
    .filter((section) => section.items.length > 0);

  const remainingItems = items.filter((item) => !usedItemIds.has(item.id));

  if (remainingItems.length > 0) {
    sections.push({
      id: "more",
      title: "More from the menu",
      description: "Extra dishes worth a look.",
      items: remainingItems,
    });
  }

  return sections;
}

function formatRatingCount(count: number) {
  return `${new Intl.NumberFormat("en-US").format(count)}+`;
}

function brandDisplayName(name: string) {
  return name.split("—")[1]?.trim() ?? name;
}

function brandInitials(name: string) {
  return name
    .split(/\s+/)
    .filter((part) => part !== "&")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export default function BrandMenuPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const brand = getBrand(brandId);
  if (!brand) notFound();

  const lines = useCart((s) => s.lines);
  const addLine = useCart((s) => s.addLine);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const [query, setQuery] = React.useState("");
  const [liked, setLiked] = React.useState(false);
  const [cartNotice, setCartNotice] = React.useState<string | null>(null);

  const displayName = brandDisplayName(brand.name);
  const logoText = brandInitials(displayName);
  const details = BRAND_DETAILS[brand.id] ?? DEFAULT_DETAILS;
  const location = getBrandLocation(brand.id);
  const tripSiblings = React.useMemo(
    () =>
      location
        ? BRANDS.filter((b) => b.storeLocationId === location.id && b.id !== brand.id)
        : [],
    [brand.id, location],
  );
  const compatibility = React.useMemo(
    () => canAddBrandToCart(lines, brand.id),
    [brand.id, lines],
  );

  const items = React.useMemo(
    () => MENU_ITEMS.filter((item) => item.brandId === brand.id),
    [brand.id],
  );
  const menuSections = React.useMemo(
    () => buildMenuSections(brand.id, items, query),
    [brand.id, items, query],
  );
  const visibleItemCount = menuSections.reduce((sum, section) => sum + section.items.length, 0);

  const quickAddItem = (item: MenuItem) => {
    const result = addLine({
      itemId: item.id,
      quantity: 1,
      modifiers: [],
      unitPrice: item.price,
    });
    if (!result.ok) {
      setCartNotice(result.reason);
      return;
    }
    setCartNotice(null);
  };

  const decrementItem = (item: MenuItem) => {
    const line = lines.find((l) => l.itemId === item.id);
    if (line) updateQuantity(line.lineId, line.quantity - 1);
  };

  return (
    <div className="bg-background pb-28">
      <section className="sm:pt-6">
        <div className="sm:container">
          <div className="relative">
            <div className="relative h-48 overflow-hidden bg-secondary sm:h-72 sm:rounded-lg lg:h-[340px]">
              <Image
                src={brand.cover}
                alt={brand.name}
                fill
                sizes="(min-width: 1280px) 1180px, 100vw"
                className="object-cover"
                priority
              />
            </div>
            <div
              className="absolute bottom-0 left-5 grid h-14 w-14 translate-y-1/2 place-items-center rounded-lg text-lg font-semibold text-white shadow-sm ring-4 ring-background sm:left-9 sm:h-16 sm:w-16 sm:text-xl"
              style={{ backgroundColor: brand.logoColor }}
              aria-hidden
            >
              {logoText}
            </div>
          </div>
        </div>

        <div className="container py-6 sm:py-8">
          <div className="flex gap-5 sm:items-start sm:justify-between">
            <div className="max-w-4xl">
              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl lg:text-[2.5rem]">
                {displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {brand.tagline}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <Star className="h-4 w-4" />
                  {details.rating.toFixed(1)}
                  <span className="font-normal text-muted-foreground">
                    ({formatRatingCount(details.ratingCount)})
                  </span>
                </span>
                <span>{details.labels.join(", ")}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {location
                    ? `${location.name}, ${location.area} (${location.proximityLabel})`
                    : details.area}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" />
                  {details.opening}
                </span>
              </div>
              {details.offer ? (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Tag className="h-4 w-4 shrink-0" />
                  {details.offer}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={liked ? `Unlike ${displayName}` : `Like ${displayName}`}
              aria-pressed={liked}
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors",
                liked ? "text-[#e11900] hover:text-[#e11900]/80" : "text-foreground hover:text-foreground/70",
              )}
              onClick={() => setLiked((current) => !current)}
            >
              {liked ? <HeartFilled className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </section>

      {location && tripSiblings.length > 0 ? (
        <section className="container pb-2">
          <div className="rounded-2xl bg-secondary/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Add another stop on this trip
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You’re at {displayName} in {location.name}. Same pickup, one delivery.
                </p>
              </div>
              <Link
                href={`/menu?location=${location.id}`}
                className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
              >
                View bundle
              </Link>
            </div>
            <div className="no-scrollbar -mx-1 mt-4 flex gap-3 overflow-x-auto pb-1">
              {tripSiblings.map((sibling) => {
                const siblingName = brandDisplayName(sibling.name);
                return (
                  <Link
                    key={sibling.id}
                    href={`/menu/${sibling.id}`}
                    className="flex shrink-0 items-center gap-3 rounded-full bg-background px-3 py-2 text-sm font-semibold shadow-sm hover:bg-secondary"
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: sibling.logoColor }}
                      aria-hidden
                    >
                      {brandInitials(siblingName)}
                    </span>
                    <span className="pr-1">{siblingName}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {cartNotice ? (
        <section className="container pb-3">
          <div className="rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-foreground">
            {cartNotice}
          </div>
        </section>
      ) : null}

      <section className="sticky top-0 z-20 bg-background/95 shadow-[0_1px_0_rgba(0,0,0,0.07)] backdrop-blur sm:top-16">
        <div className="container">
          <div className="grid gap-3 py-3 lg:grid-cols-[minmax(260px,360px)_1fr] lg:items-center">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${displayName}`}
                className="h-11 rounded-full border-0 bg-secondary pl-10 pr-4 text-[15px] shadow-none focus-visible:ring-2 focus-visible:ring-foreground/15"
              />
            </div>
            <nav className="no-scrollbar -mx-4 flex gap-7 overflow-x-auto px-4 lg:mx-0 lg:justify-end lg:px-0" aria-label="Menu sections">
              {menuSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                    window.history.replaceState(null, "", `#${section.id}`);
                  }}
                  className="inline-flex h-10 shrink-0 items-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="container py-7">
        {visibleItemCount === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No dishes match your search.
          </div>
        ) : (
          <div className="grid gap-10">
            {menuSections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 sm:scroll-mt-36">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  {section.description ? (
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{section.description}</p>
                  ) : null}
                </div>
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-8">
                  {section.items.map((item) => (
                    <MenuItemTile
                      key={item.id}
                      item={item}
                      qty={lines.filter((l) => l.itemId === item.id).reduce((sum, l) => sum + l.quantity, 0)}
                      compatibility={compatibility}
                      onQuickAdd={quickAddItem}
                      onDecrement={decrementItem}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <FloatingContactButton />
    </div>
  );
}

function MenuItemTile({
  item,
  qty,
  compatibility,
  onQuickAdd,
  onDecrement,
}: {
  item: MenuItem;
  qty: number;
  compatibility: AddLineResult;
  onQuickAdd: (item: MenuItem) => void;
  onDecrement: (item: MenuItem) => void;
}) {
  const requiresModifiers = item.modifiers?.some((group) => group.required);
  const mostLikedBadge = getMostLikedBadge(item);

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_104px] gap-4 sm:grid-cols-[minmax(0,1fr)_136px]">
      <Link href={`/menu/item/${item.id}`} className="flex min-w-0 flex-col">
        {mostLikedBadge ? (
          <span className="mb-2 text-xs font-semibold text-[#116B35]">
            {mostLikedBadge}
          </span>
        ) : null}
        <h3 className="text-base font-semibold leading-tight sm:text-lg">{item.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground sm:mt-2 sm:min-h-12">{item.description}</p>
        <div className="mt-auto pt-3 text-base font-semibold sm:pt-4">{formatPrice(item.price)}</div>
      </Link>
      <div className="relative aspect-square overflow-hidden rounded-md bg-secondary sm:aspect-auto sm:min-h-full">
        <Link href={`/menu/item/${item.id}`} aria-label={`View ${item.name}`} className="block h-full">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 136px, 104px"
            className="object-cover"
          />
        </Link>
        {requiresModifiers ? (
          <Link
            href={`/menu/item/${item.id}`}
            aria-label={`Customise ${item.name}`}
            className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-background text-foreground shadow-sm transition-transform hover:scale-105 sm:bottom-3 sm:right-3 sm:h-10 sm:w-10"
          >
            <Plus className="h-5 w-5" />
          </Link>
        ) : qty > 0 ? (
          <div className="absolute bottom-2 right-2 flex items-center overflow-hidden rounded-full bg-background text-foreground shadow-sm sm:bottom-3 sm:right-3">
            <button
              type="button"
              aria-label="Remove one"
              className="grid h-9 w-9 place-items-center hover:opacity-80 sm:h-10 sm:w-10"
              onClick={() => onDecrement(item)}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.25rem] text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              aria-label="Add one more"
              disabled={!compatibility.ok}
              className="grid h-9 w-9 place-items-center hover:opacity-80 disabled:opacity-40 sm:h-10 sm:w-10"
              onClick={() => onQuickAdd(item)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Add ${item.name} to cart`}
            title={compatibility.ok ? undefined : compatibility.reason}
            disabled={!compatibility.ok}
            className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-background text-foreground shadow-sm transition-transform hover:scale-105 disabled:opacity-40 sm:bottom-3 sm:right-3 sm:h-10 sm:w-10"
            onClick={() => onQuickAdd(item)}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>
    </article>
  );
}