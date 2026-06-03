"use client";

import * as React from "react";
import type { NearbyShop } from "./nearby-shop-data";

export function NearbyShopLogo({
  shop,
  size = "lg",
}: {
  shop: NearbyShop;
  size?: "sm" | "lg";
}) {
  const [logoFailed, setLogoFailed] = React.useState(false);
  const showLogo = Boolean(shop.logoUrl && !logoFailed);
  const sizeClass = size === "sm" ? "h-14 w-14" : "h-20 w-20 sm:h-28 sm:w-28 lg:h-32 lg:w-32";
  const fontClass = size === "sm" ? "text-sm" : "text-base sm:text-lg lg:text-xl";

  return (
    <span
      className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white dark:bg-zinc-900`}
      role="img"
      aria-label={`${shop.name} logo`}
    >
      {showLogo ? (
        <img
          src={shop.logoUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span
          className={`${fontClass} font-bold`}
          style={{ color: shop.logoColor }}
        >
          {shop.logoText}
        </span>
      )}
    </span>
  );
}
