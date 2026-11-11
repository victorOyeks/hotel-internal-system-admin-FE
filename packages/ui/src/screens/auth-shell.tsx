import type { PropsWithChildren, ReactNode } from "react";
import { APP } from "@hospio/api/app";
import { cn } from "../utils";

/** The bed mark of the Hospio360 wordmark (the same drawing as the landing page's). */
function Mark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 20 20"
			fill="none"
			aria-hidden="true"
			className={className}
		>
			<path
				d="M1.667 16.667v-3.334m0 0V10a1.667 1.667 0 0 1 1.666-1.667H5m-3.333 5h16.666M5 8.333h5m-5 0v-2.5A.833.833 0 0 1 5.833 5h3.334a.833.833 0 0 1 .833.833v2.5m0 0h6.667A1.667 1.667 0 0 1 18.333 10v3.333m0 0v3.334"
				stroke="currentColor"
				strokeWidth="2.2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function Wordmark({
	light = false,
	className,
}: {
	light?: boolean;
	className?: string;
}) {
	return (
		<span className={cn("flex items-center gap-[10px]", className)}>
			<span
				className={cn(
					"flex size-9 items-center justify-center rounded-[10px]",
					light
						? "bg-white/12 text-white ring-1 ring-white/15"
						: "bg-brand text-white",
				)}
			>
				<Mark className="size-5" />
			</span>
			<span
				className={cn(
					"text-[20px] font-bold leading-none tracking-[-0.01em]",
					light ? "text-white" : "text-brand",
				)}
			>
				Hospio360
			</span>
		</span>
	);
}

/** A still of the product for the brand panel: shapes of the real screens, not live data. */
function Glimpse({ admin }: { admin: boolean }) {
	const stats: [string, string][] = admin
		? [
				["Live businesses", "24"],
				["Open tickets", "3"],
				["Fees collected", "92%"],
			]
		: [
				["Arrivals", "12"],
				["In house", "46"],
				["Departures", "9"],
			];
	const rows: [string, string, string][] = admin
		? [
				["Setup", "Business details · step 2 of 4", "bg-amber-400"],
				["Live", "First booking taken", "bg-emerald-400"],
			]
		: [
				["Room 204", "Cleaned · ready for arrival", "bg-emerald-400"],
				["Table 6", "Order sent to the kitchen", "bg-amber-400"],
			];
	return (
		<div
			aria-hidden="true"
			className="relative mx-auto w-full max-w-[400px] select-none"
		>
			<div className="rounded-[18px] bg-white p-5 text-ink shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
							Today
						</p>
						<p className="mt-1 text-[15px] font-semibold">
							{admin ? "The platform" : "Front desk"}
						</p>
					</div>
					<div className="relative size-14">
						<svg
							viewBox="0 0 36 36"
							aria-hidden="true"
							className="size-14 -rotate-90"
						>
							<circle
								cx="18"
								cy="18"
								r="15"
								fill="none"
								stroke="currentColor"
								strokeWidth="4"
								className="text-brand-soft"
							/>
							<circle
								cx="18"
								cy="18"
								r="15"
								fill="none"
								stroke="currentColor"
								strokeWidth="4"
								strokeLinecap="round"
								strokeDasharray={`${0.82 * 94.25} 94.25`}
								className="text-brand"
							/>
						</svg>
						<span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold">
							82%
						</span>
					</div>
				</div>
				<div className="mt-4 grid grid-cols-3 gap-2">
					{stats.map(([label, value]) => (
						<div key={label} className="rounded-xl bg-subtle px-3 py-2.5">
							<p className="text-[18px] font-bold leading-none">{value}</p>
							<p className="mt-1.5 text-[11px] text-ink-3">{label}</p>
						</div>
					))}
				</div>
				<div className="mt-4 flex flex-col gap-2">
					{rows.map(([title, sub, dot]) => (
						<div
							key={title}
							className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
						>
							<span className={cn("size-2 shrink-0 rounded-full", dot)} />
							<p className="text-[13px] font-semibold">{title}</p>
							<p className="truncate text-[12px] text-ink-3">{sub}</p>
						</div>
					))}
				</div>
			</div>
			<div className="absolute -right-6 -bottom-7 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink shadow-[0_18px_40px_-10px_rgba(0,0,0,0.5)]">
				<span className="flex size-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
					<svg
						viewBox="0 0 20 20"
						fill="none"
						aria-hidden="true"
						className="size-4"
					>
						<path
							d="m5 10.5 3.2 3L15 6.5"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
				<div>
					<p className="text-[13px] font-semibold leading-tight">
						{admin ? "Statement paid" : "Payment received"}
					</p>
					<p className="text-[12px] text-ink-3">
						{admin ? "June fees · ₦240,000" : "Folio 1042 · ₦85,000"}
					</p>
				</div>
			</div>
		</div>
	);
}

function Chip({ children }: { children: ReactNode }) {
	return (
		<span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[13px] text-white/80">
			{children}
		</span>
	);
}

/** The sign-in pages' frame: brand panel on the left, the form on the right. */
export function AuthShell({ children }: PropsWithChildren) {
	const admin = APP === "admin";
	const areas = admin
		? ["Businesses", "Support", "Fees", "Marketers"]
		: [
				"Front desk",
				"Restaurant & bar",
				"Housekeeping",
				"Finance",
			];
	return (
		<main className="flex min-h-screen bg-card">
			<aside className="relative hidden w-[46%] max-w-[640px] min-w-[480px] shrink-0 flex-col overflow-hidden bg-brand px-12 py-11 text-white lg:flex xl:px-14">
				{/* light from the top right and a faint dot grid, so the colour has depth */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(900px 520px at 100% 0%, rgba(255,255,255,0.13), transparent 60%), radial-gradient(700px 500px at 0% 100%, rgba(0,0,0,0.28), transparent 60%)",
					}}
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 opacity-[0.07]"
					style={{
						backgroundImage:
							"radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)",
						backgroundSize: "22px 22px",
						maskImage: "linear-gradient(to bottom, black, transparent 75%)",
					}}
				/>
				<Wordmark light className="relative" />
				<div className="relative flex min-h-0 flex-1 items-center py-10 [@media(max-height:820px)]:py-6 [@media(max-height:820px)]:[&>*]:scale-90">
					<Glimpse admin={admin} />
				</div>
				<div className="relative flex flex-col gap-4">
					<h2 className="max-w-[460px] text-[34px] font-bold leading-[1.12] tracking-[-0.02em]">
						{admin
							? "The whole platform, in one view."
							: "Run your hotels from one place."}
					</h2>
					<p className="max-w-[440px] text-[16px] leading-[1.55] text-white/75">
						{admin
							? "Every business from sign-up to live: onboarding, support, fees and the marketers who bring them in."
							: "Rooms, bookings, guests, money and your team, with every department working from the same screen."}
					</p>
					<div className="mt-2 flex flex-wrap gap-2 [@media(max-height:820px)]:hidden">
						{areas.map((a) => (
							<Chip key={a}>{a}</Chip>
						))}
					</div>
				</div>
			</aside>
			<section className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
				<Wordmark className="mb-10 lg:hidden" />
				<div className="w-full max-w-[420px]">{children}</div>
			</section>
		</main>
	);
}
