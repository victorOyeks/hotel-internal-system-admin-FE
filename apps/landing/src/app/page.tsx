import type { Metadata } from "next";
import { ClosingCta } from "@/components/sections/closing-cta";
import { Control } from "@/components/sections/control";
import { Departments } from "@/components/sections/departments";
import { Faq } from "@/components/sections/faq";
import { GuestFolio } from "@/components/sections/guest-folio";
import { Hero } from "@/components/sections/hero";
import { Onboarding } from "@/components/sections/onboarding";
import { Payments } from "@/components/sections/payments";
import { Pricing } from "@/components/sections/pricing";
import { RolesStrip } from "@/components/sections/roles-strip";
import { ThreeApps } from "@/components/sections/three-apps";
import { YourBrand } from "@/components/sections/your-brand";
import { SiteFooter, SiteHeader } from "@/components/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/** The public landing page (Figma "Hospio360 — Landing page (1440)", node 3396:3), one component per section. */
export default function HomePage() {
	return (
		<>
			<SiteHeader />
			<main className="bg-page">
				<Hero />
				<RolesStrip />
				<ThreeApps />
				<GuestFolio />
				<Payments />
				<Control />
				<Departments />
				<YourBrand />
				<Onboarding />
				<Pricing />
				<Faq />
				<ClosingCta />
			</main>
			<SiteFooter />
		</>
	);
}
