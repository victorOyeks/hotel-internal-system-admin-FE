import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { cn } from "@hospio/ui/utils";
import { SITE_INDEXABLE, SITE_URL } from "@/components/site";
import "./globals.css";

/** DM Sans is the one typeface in the design system; the variable font covers every weight. */
const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	display: "swap",
	fallback: ["system-ui", "sans-serif"],
});

const title = "Hospio360 · Hotel management for Nigerian hotels";
const description =
	"Hospio360 runs a Nigerian hotel from one place: bookings and front desk, folios and payments, housekeeping, laundry, maintenance, restaurant and bar, inventory, reports and night audit, with the owner's view across every hotel.";

export const metadata: Metadata = {
	title: { default: title, template: "%s · Hospio360" },
	description,
	applicationName: "Hospio360",
	metadataBase: new URL(SITE_URL),
	// Staging (and any build without NEXT_PUBLIC_SITE_INDEXABLE=true) asks search engines to stay away.
	robots: SITE_INDEXABLE
		? { index: true, follow: true }
		: { index: false, follow: false },
	openGraph: {
		title,
		description:
			"One system for the front desk, every department and the owner, from booking to night audit.",
		url: "/",
		siteName: "Hospio360",
		type: "website",
		locale: "en_NG",
	},
	twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
	viewportFit: "cover",
	themeColor: "#4c091e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className={cn("min-h-screen bg-card font-sans text-ink antialiased", dmSans.variable)}>{children}</body>
		</html>
	);
}
