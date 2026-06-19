import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public, indexable routes. Keep in sync with the indexable page layouts.
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/menu", priority: 0.9, changeFrequency: "daily" },
  { path: "/partners", priority: 0.8, changeFrequency: "weekly" },
  { path: "/riders", priority: 0.8, changeFrequency: "weekly" },
  { path: "/waitlist", priority: 0.7, changeFrequency: "weekly" },
  { path: "/launch-partner", priority: 0.6, changeFrequency: "weekly" },
  { path: "/catering", priority: 0.6, changeFrequency: "monthly" },
  { path: "/download", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.5, changeFrequency: "weekly" },
  { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
