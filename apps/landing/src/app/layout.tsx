import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { cn } from "@hospio/ui/utils";
import "./globals.css";

/** DM Sans is the one typeface in the design system; the variable font covers every weight. */
const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	display: "swap",
	fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
	title: { default: "Hospio360 · Run your hotels from one place", template: "%s · Hospio360" },
	description:
		"The hotel operating system for Nigerian hotels: rooms, bookings, folios, POS payments, housekeeping, maintenance, kitchen and bar, inventory, finance and night audit, with the owner's view across every branch.",
	metadataBase: new URL("https://hospio360.com"),
	openGraph: {
		title: "Hospio360 · Run your hotels from one place",
		description: "One system for the front desk, the back office and the owner, from booking to night audit.",
		type: "website",
		locale: "en_NG",
	},
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
