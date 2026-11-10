"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type PropsWithChildren, useState } from "react";
import { toast } from "sonner";
import {
	OWNER_ONBOARDING_STEPS,
	type OwnerOnboardingStep,
} from "@hospio/api/types";
import { HomeIcon } from "@hospio/ui/svgs/home";
import { cn } from "@hospio/ui/utils";
import { logout } from "@hospio/api/actions";
import { saveForLater } from "./persist";
import { STEP_META, stepHref } from "./steps";

/**
 * The wizard's frame (Figma 3164:16113): logo, the step bar with the four steps and "All set", and
 * "Save and finish later". The welcome checklist and the handover page share the frame without the bar.
 */
export function OnboardingShell({ children }: PropsWithChildren) {
	const pathname = usePathname();
	const current = pathname.split("/")[2] ?? "";
	const bar = pathname.startsWith("/onboarding/");
	const handover = pathname.startsWith("/handover");
	const activeIndex =
		current === "done"
			? OWNER_ONBOARDING_STEPS.length
			: OWNER_ONBOARDING_STEPS.indexOf(current as OwnerOnboardingStep);

	return (
		<main className="flex min-h-screen flex-col bg-page">
			<header className="flex h-[52px] items-center gap-6 border-b border-line bg-card px-6">
				<Link href="/dashboard" className="flex items-center gap-[10px]">
					<span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white [&_svg]:size-4">
						<HomeIcon />
					</span>
					<span className="text-sm font-bold tracking-[0.2em] text-brand">
						H.M.S
					</span>
				</Link>
				{bar && (
					<ol className="mx-auto hidden items-center md:flex">
						{[...OWNER_ONBOARDING_STEPS, "done" as const].map((key, i) => {
							const done = i < activeIndex;
							const active = i === activeIndex;
							const label = key === "done" ? "All set" : STEP_META[key].title;
							const reachable = done || active;
							const inner = (
								<span className="flex items-center gap-2">
									<span
										className={cn(
											"flex size-[22px] items-center justify-center rounded-full text-[11px] font-bold",
											done
												? "bg-brand text-white"
												: active
													? "bg-brand text-white"
													: "bg-subtle text-ink-3",
										)}
									>
										{done ? <CheckIcon className="size-3" /> : i + 1}
									</span>
									<span
										className={cn(
											"text-[13px]",
											active
												? "font-semibold text-ink"
												: done
													? "font-medium text-ink-2"
													: "text-ink-3",
										)}
									>
										{label}
									</span>
								</span>
							);
							return (
								<li key={key} className="flex items-center">
									{reachable && key !== "done" ? (
										<Link href={stepHref(key)}>{inner}</Link>
									) : (
										inner
									)}
									{i < OWNER_ONBOARDING_STEPS.length && (
										<span
											className={cn(
												"mx-3 h-px w-6",
												done ? "bg-brand" : "bg-line",
											)}
										/>
									)}
								</li>
							);
						})}
					</ol>
				)}
				{!bar && <span className="mx-auto" />}
				{!handover && <SaveLater />}
			</header>
			<div className="flex flex-1 flex-col items-center px-4 py-10">
				{children}
			</div>
		</main>
	);
}

/**
 * Saves the open step when its entries are complete (or keeps them in this browser when they are not),
 * then signs out to the sign-in page. Signing in again opens the checklist at the first unfinished step.
 */
function SaveLater() {
	const [busy, setBusy] = useState(false);
	return (
		<button
			type="button"
			disabled={busy}
			onClick={async () => {
				setBusy(true);
				const r = await saveForLater();
				setBusy(false);
				if (r === "failed") {
					toast.error(
						"This step couldn't be saved. Check the form and try again",
					);
					return;
				}
				if (r === "kept")
					toast.success(
						"This step isn't complete yet, so its entries are kept on this device",
					);
				// Leave the wizard: sign out and land on sign-in, which says the setup was saved.
				await logout("saved");
			}}
			className="text-[13px] font-semibold text-brand hover:underline disabled:opacity-60"
		>
			{busy ? "Saving…" : "Save and finish later"}
		</button>
	);
}
