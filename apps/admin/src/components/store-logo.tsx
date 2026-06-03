"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type StoreLogoProps = {
  name: string;
  initials: string;
  color: string;
  logoUrl?: string;
  className?: string;
};

export function StoreLogo({ name, initials, color, logoUrl, className }: StoreLogoProps) {
  const [failed, setFailed] = React.useState(false);
  const showLogo = Boolean(logoUrl && !failed);

  return (
    <span
      role="img"
      aria-label={`${name} logo`}
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full",
        showLogo ? "border border-border bg-white dark:bg-zinc-900" : "text-xs font-semibold text-white",
        className,
      )}
      style={showLogo ? undefined : { backgroundColor: color }}
    >
      {showLogo ? (
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}
