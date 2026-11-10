import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_URL } from "@/components/site";

/** Only the home page is public content for now (the legal pages are still being prepared). Empty on staging. */
export default function sitemap(): MetadataRoute.Sitemap {
	if (!SITE_INDEXABLE) return [];
	return [{ url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 }];
}
