import Providers from "@/components/react-query";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
	fallback: ["system-ui", "sans-serif"],
	preload: true,
	adjustFontFallback: true,
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	style: ["normal", "italic"],
});

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
	display: "swap",
	fallback: ["system-ui", "sans-serif"],
	preload: true,
	adjustFontFallback: true,
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	style: ["normal", "italic"],
});

export const metadata: Metadata = {
	title: "Hospio360",
};

export const viewport: Viewport = {
	viewportFit: "cover",
	interactiveWidget: "resizes-content",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					inter.variable,
					dmSans.variable,
					"text-foreground",
				)}
			>
				<Providers>
					{children}

					<Toaster richColors theme="light" duration={5000} />
					<ReactQueryDevtools initialIsOpen={false} />
				</Providers>
			</body>
		</html>
	);
}
