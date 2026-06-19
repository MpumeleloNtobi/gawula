import type { Metadata } from "next";
import { SITE_NAME } from "./site";

// Builds per-route metadata with a consistent shape. `title` is the bare page
// label; the root layout's title template appends " | Gawula" automatically.
export function pageMetadata(opts: {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
}): Metadata {
  const { title, description, path, noindex } = opts;
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      ...(path ? { url: path } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}
