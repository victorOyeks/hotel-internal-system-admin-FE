import type { PropsWithChildren } from "react";
import { APP } from "@hospio/api/app";

/** The sign-in pages' frame: brand panel on the left, the form on the right. */
export function AuthShell({ children }: PropsWithChildren) {
	const admin = APP === "admin";
	return (
		<main className="flex min-h-screen bg-card">
			<aside className="hidden w-[560px] shrink-0 flex-col justify-between bg-brand px-14 py-12 text-white lg:flex">
				<p className="text-[22px] font-bold tracking-[0.2em]">H.M.S</p>
				<div className="flex flex-col gap-[14px]">
					<p className="text-[32px] font-bold leading-tight">{admin ? "The platform, in one view" : "Run your hotels from one place"}</p>
					<p className="text-base text-white/75">{admin ? "Businesses, onboarding, support, fees and marketers." : "Rooms, bookings, guests, money and your team, in one view."}</p>
				</div>
			</aside>
			<section className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
				<p className="mb-10 text-lg font-bold tracking-[0.2em] text-brand lg:hidden">H.M.S</p>
				<div className="w-full max-w-[420px]">{children}</div>
			</section>
		</main>
	);
}
