import Link from "next/link";
import type { ReactNode } from "react";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";

export const HOTEL_APP_URL = process.env.NEXT_PUBLIC_HOTEL_APP_URL ?? "https://web-staging.hospio360.com";
export const ADMIN_APP_URL = process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://admin-staging.hospio360.com";
export const CONTACT_EMAIL = "hello@hospio360.com";
/** Placeholder until the business number is confirmed. */
export const WHATSAPP_URL = "https://wa.me/2348010000000?text=Hello%20Hospio360%2C%20I%20run%20a%20hotel%20and%20would%20like%20a%20demo";

const nav = [
	{ href: "/#desks", label: "Who it's for" },
	{ href: "/#day", label: "How a day runs" },
	{ href: "/#owners", label: "For owners" },
	{ href: "/#pricing", label: "Pricing" },
	{ href: "/#contact", label: "Contact" },
];

export function Wordmark({ dark = false }: { dark?: boolean }) {
	return (
		<Link href="/" className={cn("flex items-center gap-[10px] text-sm font-bold tracking-[0.2em]", dark ? "text-white" : "text-brand")} aria-label="Hospio360 home">
			<span className={cn("flex size-7 items-center justify-center rounded-[8px] text-[10px] tracking-normal", dark ? "bg-white text-brand" : "bg-brand text-white")}>H</span>
			H.M.S
		</Link>
	);
}

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur">
			<div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-6 px-4 sm:px-6">
				<Wordmark />
				<nav aria-label="Main" className="hidden items-center gap-6 md:flex">
					{nav.map((n) => (
						<Link key={n.href} href={n.href} className="text-[13px] font-medium text-ink-2 hover:text-ink">
							{n.label}
						</Link>
					))}
				</nav>
				<div className="flex items-center gap-2">
					<a href="/#contact" className={cn(btn.secondary, "hidden sm:inline-flex")}>
						Talk to us
					</a>
					<a href={HOTEL_APP_URL} className={btn.primary}>
						Sign in
					</a>
				</div>
			</div>
		</header>
	);
}

export function SiteFooter() {
	return (
		<footer className="border-t border-line bg-page">
			<div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
				<div className="flex max-w-sm flex-col gap-3">
					<Wordmark />
					<p className="text-[13px] text-ink-2">Hospio360 is the hotel operating system for hotels in Nigeria: one place for the front desk, every department, the money and the owner.</p>
				</div>
				<div className="grid grid-cols-2 gap-8 text-[13px] sm:grid-cols-3">
					<FooterColumn title="Product" links={[{ href: "/#desks", label: "Who it's for" }, { href: "/#day", label: "How a day runs" }, { href: "/#owners", label: "For owners" }, { href: "/#pricing", label: "Pricing" }]} />
					<FooterColumn title="Sign in" links={[{ href: HOTEL_APP_URL, label: "Hotel app" }, { href: ADMIN_APP_URL, label: "H.M.S admin" }]} />
					<FooterColumn title="Company" links={[{ href: "/#contact", label: "Contact" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }]} />
				</div>
			</div>
			<div className="border-t border-line">
				<p className="mx-auto w-full max-w-[1120px] px-4 py-4 text-xs text-ink-3 sm:px-6">© {new Date().getFullYear()} Hospio360. Lagos, Nigeria.</p>
			</div>
		</footer>
	);
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
	return (
		<div className="flex flex-col gap-2">
			<p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{title}</p>
			{links.map((l) => (
				<a key={l.href + l.label} href={l.href} className="font-medium text-ink-2 hover:text-ink">
					{l.label}
				</a>
			))}
		</div>
	);
}

export function Section({ id, eyebrow, title, intro, children, tone = "card", className }: { id?: string; eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: "card" | "page" | "brand"; className?: string }) {
	const dark = tone === "brand";
	return (
		<section id={id} className={cn(tone === "page" && "bg-page", dark && "bg-brand text-white", "scroll-mt-20", className)}>
			<div className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-4 py-16 sm:px-6 md:py-24">
				<div className="flex max-w-2xl flex-col gap-3">
					{eyebrow && <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em]", dark ? "text-white/70" : "text-brand")}>{eyebrow}</p>}
					<h2 className={cn("text-[28px] font-bold leading-[1.15] tracking-[-0.01em] md:text-[36px]", dark ? "text-white" : "text-ink")}>{title}</h2>
					{intro && <p className={cn("text-base leading-relaxed", dark ? "text-white/75" : "text-ink-2")}>{intro}</p>}
				</div>
				{children}
			</div>
		</section>
	);
}

/** Static legal pages share this frame. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
	return (
		<>
			<SiteHeader />
			<main className="mx-auto w-full max-w-[760px] px-4 py-16 sm:px-6">
				<h1 className="text-[32px] font-bold leading-tight tracking-[-0.01em] text-ink">{title}</h1>
				<p className="mt-2 text-[13px] text-ink-3">Last updated {updated}</p>
				<div className="prose-hospio mt-8 flex flex-col gap-5 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink">{children}</div>
			</main>
			<SiteFooter />
		</>
	);
}
