import type { MetadataRoute } from "next";
import { SITE_INDEXABLE, SITE_URL } from "@/components/site";

/** Staging is closed to crawlers; production (NEXT_PUBLIC_SITE_INDEXABLE=true) is open and lists the sitemap. */
export default function robots(): MetadataRoute.Robots {
	if (!SITE_INDEXABLE) return { rules: { userAgent: "*", disallow: "/" } };
	return {
		rules: { userAgent: "*", allow: "/" },
		sitemap: `${SITE_URL}/sitemap.xml`,
	};
}
