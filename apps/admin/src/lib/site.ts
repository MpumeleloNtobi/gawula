// Central site identity used for SEO metadata, canonical URLs, and JSON-LD.
// The canonical host can be overridden per-environment with NEXT_PUBLIC_SITE_URL;
// it defaults to the production apex domain.
export const SITE_NAME = "Gawula";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gawula.co.za"
).replace(/\/$/, "");

export const SITE_DESCRIPTION =
  "Food from your favourites, all in one order.";

// Social profiles for Organization JSON-LD (sameAs). None published yet.
export const SITE_SAME_AS: string[] = [];
