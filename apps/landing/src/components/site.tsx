import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

/** The hotel app (sign-in and sign-up) for this environment; the staging host is the fallback. */
export const HOTEL_APP_URL = (
	process.env.NEXT_PUBLIC_HOTEL_APP_URL ?? "https://web-staging.hospio360.com"
).replace(/\/+$/, "");
export const SIGN_UP_URL = `${HOTEL_APP_URL}/sign-up`;
export const SIGN_IN_URL = `${HOTEL_APP_URL}/auth`;
/** Where demo requests, sales and support questions go. Set NEXT_PUBLIC_CONTACT_EMAIL to the real inbox. */
export const CONTACT_EMAIL =
	process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@hospio360.com";
export const DEMO_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("H.M.S demo request")}&body=${encodeURIComponent("Hotel name:\nCity:\nNumber of rooms:\nBest phone number:\n")}`;
/** The public site's own address (canonical links, Open Graph, robots). */
export const SITE_URL = (
	process.env.NEXT_PUBLIC_SITE_URL ?? "https://hospio360.com"
).replace(/\/+$/, "");
/** Search engines index the site only when NEXT_PUBLIC_SITE_INDEXABLE=true (production); staging stays noindex. */
export const SITE_INDEXABLE = process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

/** The design's 1200px content column (1440 frame with 120px margins), with 16px gutters on small screens. */
export const container = "mx-auto w-full max-w-[1200px] px-4";
/** The design's large button: 15px label with 13px vertical padding, layered over the kit's `btn` recipes. */
export const btnLg = "px-4 py-[13px] text-[15px]";

const nav = [
	{ href: "/#product", label: "Product" },
	{ href: "/#departments", label: "Departments" },
	{ href: "/#payments", label: "Payments" },
	{ href: "/#onboarding", label: "Onboarding" },
	{ href: "/#pricing", label: "Pricing" },
];

export function Wordmark({
	dark = false,
	className,
}: {
	dark?: boolean;
	className?: string;
}) {
	return (
		<Link
			href="/"
			aria-label="H.M.S home"
			className={cn("flex shrink-0 items-center gap-[10px]", className)}
		>
			<span
				className={cn(
					"flex size-9 items-center justify-center rounded-control",
					dark ? "bg-white/10" : "bg-brand",
				)}
			>
				<Image src="/landing/hms-mark.svg" alt="" width={20} height={20} />
			</span>
			<span
				className={cn(
					"text-[20px] font-bold leading-none tracking-[0.16em]",
					dark ? "text-white" : "text-brand",
				)}
			>
				H.M.S
			</span>
		</Link>
	);
}

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-30 border-b border-line/70 bg-page/90 backdrop-blur">
			<div
				className={cn(
					container,
					"flex h-[72px] items-center justify-between gap-6 md:h-[87px]",
				)}
			>
				<Wordmark />
				<nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
					{nav.map((n) => (
						<Link
							key={n.href}
							href={n.href}
							className="text-[15px] font-medium text-ink-2 transition-colors hover:text-ink"
						>
							{n.label}
						</Link>
					))}
				</nav>
				<div className="flex items-center gap-3">
					<a
						href={SIGN_IN_URL}
						className={cn(btn.secondary, "hidden sm:inline-flex")}
					>
						Sign in
					</a>
					<a href={SIGN_UP_URL} className={btn.primary}>
						Get started
					</a>
					<MobileMenu />
				</div>
			</div>
		</header>
	);
}

/** Small-screen menu with no JavaScript: a <details> that drops the nav links under the header. */
function MobileMenu() {
	return (
		<details className="relative lg:hidden">
			<summary
				aria-label="Open menu"
				className={cn(
					btn.icon,
					"cursor-pointer list-none [&::-webkit-details-marker]:hidden",
				)}
			>
				<MenuIcon className="size-[18px]" />
			</summary>
			<div className="absolute top-[calc(100%+10px)] right-0 flex w-56 flex-col gap-1 rounded-card border border-line bg-card p-2 shadow-[0_16px_40px_rgba(77,8,31,0.12)]">
				{nav.map((n) => (
					<Link
						key={n.href}
						href={n.href}
						className="rounded-control px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-subtle hover:text-ink"
					>
						{n.label}
					</Link>
				))}
				<a
					href={SIGN_IN_URL}
					className="rounded-control px-3 py-2 text-[15px] font-medium text-ink-2 hover:bg-subtle hover:text-ink sm:hidden"
				>
					Sign in
				</a>
			</div>
		</details>
	);
}

const footerColumns: {
	title: string;
	links: { href: string; label: string }[];
}[] = [
	{
		title: "Product",
		links: [
			{ href: "/#product", label: "Owner portal" },
			{ href: "/#product", label: "Manager portal" },
			{ href: "/#product", label: "Staff tablet app" },
			{ href: "/#payments", label: "Payments" },
			{ href: "/#pricing", label: "Pricing" },
		],
	},
	{
		title: "Get started",
		links: [
			{ href: SIGN_UP_URL, label: "Create an account" },
			{ href: SIGN_IN_URL, label: "Sign in" },
			{ href: DEMO_MAILTO, label: "Book a demo" },
		],
	},
	{
		title: "Company",
		links: [
			{ href: "/#partners", label: "Partner program" },
			{ href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
			{
				href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Support")}`,
				label: "Support",
			},
		],
	},
];

export function SiteFooter() {
	return (
		<footer className="border-t border-line bg-page">
			<div className={cn(container, "flex flex-col gap-12 pt-16 pb-10")}>
				<div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[minmax(0,360px)_repeat(3,minmax(0,1fr))] md:gap-12">
					<div className="flex flex-col gap-[14px] sm:col-span-2 md:col-span-1">
						<Wordmark />
						<p className="text-sm leading-[1.55] text-ink-2">
							Hotel Management System — one system for owners, managers and
							every department.
						</p>
					</div>
					{footerColumns.map((c) => (
						<div key={c.title} className="flex flex-col gap-3 text-sm">
							<p className="font-bold text-ink">{c.title}</p>
							{c.links.map((l) => (
								<a
									key={l.label + l.href}
									href={l.href}
									className="text-ink-2 hover:text-ink"
								>
									{l.label}
								</a>
							))}
						</div>
					))}
				</div>
				<div className="flex flex-col gap-2 text-[13px] text-ink-2 sm:flex-row sm:items-center sm:justify-between">
					<p>© {new Date().getFullYear()} H.M.S · Hotel Management System</p>
					<a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">
						{CONTACT_EMAIL}
					</a>
				</div>
			</div>
		</footer>
	);
}

type SectionHeaderProps = {
	eyebrow: string;
	title: string;
	intro?: string;
	align?: "center" | "left";
	dark?: boolean;
	className?: string;
	titleClassName?: string;
};

/** Eyebrow, headline and intro in the design's section-header style; centred by default. */
export function SectionHeader({
	eyebrow,
	title,
	intro,
	align = "center",
	dark = false,
	className,
	titleClassName,
}: SectionHeaderProps) {
	const center = align === "center";
	return (
		<div
			className={cn(
				"flex w-full flex-col gap-4",
				center && "items-center text-center",
				className,
			)}
		>
			<p
				className={cn(
					"text-[13px] font-bold uppercase tracking-[0.1em]",
					dark ? "text-nav-foreground" : "text-brand",
				)}
			>
				{eyebrow}
			</p>
			<h2
				className={cn(
					"text-[34px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[48px]",
					dark ? "text-white" : "text-ink",
					center && "max-w-[820px]",
					titleClassName,
				)}
			>
				{title}
			</h2>
			{intro && (
				<p
					className={cn(
						"text-[17px] leading-[1.55] md:text-[18px]",
						dark ? "text-nav-foreground" : "text-ink-2",
						center && "max-w-[720px]",
					)}
				>
					{intro}
				</p>
			)}
		</div>
	);
}

type SectionProps = SectionHeaderProps & {
	id?: string;
	children: ReactNode;
	tone?: "card" | "page" | "brand";
	contentClassName?: string;
};

/** A full-width band with the design's section header above its content. */
export function Section({
	id,
	children,
	tone = "page",
	className,
	contentClassName,
	...header
}: SectionProps) {
	const dark = tone === "brand";
	return (
		<section
			id={id}
			className={cn(
				"scroll-mt-[88px]",
				tone === "card" && "bg-card",
				tone === "page" && "bg-page",
				dark && "bg-brand",
				className,
			)}
		>
			<div
				className={cn(
					container,
					"flex flex-col gap-12 py-16 md:gap-14 md:py-[112px]",
					contentClassName,
				)}
			>
				<SectionHeader {...header} dark={dark} />
				{children}
			</div>
		</section>
	);
}

/** Static legal pages share this frame. */
export function LegalPage({
	title,
	updated,
	children,
}: {
	title: string;
	updated?: string;
	children: ReactNode;
}) {
	return (
		<>
			<SiteHeader />
			<main className="bg-page">
				<div className="mx-auto w-full max-w-[760px] px-4 py-16">
					<h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-ink md:text-[48px]">
						{title}
					</h1>
					{updated && (
						<p className="mt-3 text-[13px] text-ink-3">
							Last updated {updated}
						</p>
					)}
					<div className="mt-8 flex flex-col gap-5 text-[15px] leading-[1.6] text-ink-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink">
						{children}
					</div>
				</div>
			</main>
			<SiteFooter />
		</>
	);
}
