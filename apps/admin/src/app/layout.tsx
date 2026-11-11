import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import Providers from "@hospio/ui/react-query";
import { Toaster } from "@hospio/ui/primitives/sonner";
import { ApiLog } from "@hospio/ui/shared/api-log";
import { UpdateNotice } from "@hospio/ui/shared/update-notice";
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
	title: "Hospio360 Admin",
	description: "Run your hotels from one place",
};

export const viewport: Viewport = {
	viewportFit: "cover",
	interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body className={cn("min-h-screen bg-background font-sans text-foreground antialiased", dmSans.variable)}>
				<Providers>
					{children}
					<Toaster richColors theme="light" duration={5000} position="bottom-right" />
					<UpdateNotice />
					<ApiLog />
				</Providers>
			</body>
		</html>
	);
}
