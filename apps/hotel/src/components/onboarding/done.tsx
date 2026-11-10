"use client";

import {
	ArrowRightIcon,
	CheckIcon,
	ClockIcon,
	CircleIcon,
	Loader2Icon,
	PartyPopperIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeMyOnboarding } from "@hospio/api/actions/onboarding";
import { useAction } from "@hospio/api/actions/use-action";
import type { Business } from "@hospio/api/api/schema";
import type { OwnerOnboardingData } from "@hospio/api/types";
import { Button } from "@hospio/ui/primitives/button";
import { plural } from "@hospio/ui/shared/format";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { SideCard, StepCard, StepPage } from "./common";
import { useInviteAccepted } from "./invite-status";
import { forgetAllSteps } from "./persist";
import { stepHref } from "./steps";

/** All set (Figma 3165:16555): what is in, what is still open, then POST /tenant/onboarding/mine/complete → the dashboard. */
export function DoneStep({
	draft,
	business,
	firstName,
	ownerId,
}: {
	draft: OwnerOnboardingData;
	business: Business | null;
	firstName: string;
	ownerId?: string;
}) {
	const router = useRouter();
	const accepted = useInviteAccepted(draft.manager?.userId);
	const { run, pending } = useAction();
	// What the hotel really has (the board), not what was typed: retries and skipped numbers don't inflate it.
	const hotelRow = business?.hotels?.find((h) => h.id === draft.hotel?.hotelId);
	const typeCount = new Set(
		(draft.rooms?.roomTypes ?? []).map((t) => t.roomTypeId || t.name),
	).size;
	const rooms =
		hotelRow?.roomCount ??
		draft.rooms?.roomTypes.reduce((s, t) => s + t.count, 0) ??
		0;
	const hotelName = draft.hotel?.name ?? "Your hotel";
	const items: {
		label: string;
		detail: string;
		done: boolean;
		pending?: boolean;
		href?: string;
		action?: string;
	}[] = [
		{
			label: "Business details",
			detail:
				[
					draft.business?.legalName ?? business?.legalName,
					draft.business?.name ?? business?.name,
				]
					.filter(Boolean)
					.join(" · ") || "Not saved yet",
			done: !!(draft.business || business?.name),
			href: stepHref("business"),
		},
		{
			label: "First hotel and rooms",
			detail: draft.hotel
				? `${hotelName}${rooms ? ` · ${plural(rooms, "room")} · ${plural(typeCount, "type")}` : " · rooms not added yet"}`
				: "No hotel yet",
			done: !!draft.hotel && rooms > 0,
			href: draft.hotel ? stepHref("rooms") : stepHref("hotel"),
		},
		{
			label: draft.manager
				? accepted
					? `${draft.manager.fullName} accepted the invite`
					: `${draft.manager.fullName} hasn't accepted yet`
				: "Invite a manager",
			detail: draft.manager
				? accepted
					? `${draft.manager.email} can sign in and run the hotel`
					: `Invite sent to ${draft.manager.email} · waiting for them to accept · the link works for 7 days`
				: "Skipped · invite one from Users whenever you like",
			// An invite is only done once it is accepted; this page checks every 10 seconds (DEF-028).
			done: accepted,
			pending: !!draft.manager && !accepted,
			href: stepHref("manager"),
			action: draft.manager ? "See invite" : "Invite",
		},
		{
			label: "Add your other hotels",
			detail: "Each one takes about 2 minutes from Hotels → Add new hotel",
			done: false,
		},
		{
			label: "Taxes, approval limits and brand colour",
			detail:
				"Hotel setup → Taxes & currency, Approval limits, Brand & colours",
			done: false,
		},
	];
	const doneCount = items.filter((i) => i.done).length;

	return (
		<StepPage
			aside={
				<>
					<SideCard title="What appears here next">
						<p className="flex justify-between">
							<span>Today at your hotels</span>
							<span className="font-semibold text-ink">
								after first check-in
							</span>
						</p>
						<p className="flex justify-between">
							<span>Revenue and profit</span>
							<span className="font-semibold text-ink">
								after first night audit
							</span>
						</p>
						<p className="flex justify-between">
							<span>Branch comparison</span>
							<span className="font-semibold text-ink">
								when you add a 2nd hotel
							</span>
						</p>
					</SideCard>
					<SideCard title="Need a hand?">
						<p>
							Help centre and videos under Help. WhatsApp support · 8am–8pm.
						</p>
					</SideCard>
				</>
			}
		>
			<StepCard
				title={`You're all set, ${firstName}`}
				intro={`${business?.name ?? "Your business"} · ${draft.hotel ? "1 hotel" : "no hotel yet"}${rooms ? ` · ${plural(rooms, "room")}` : ""} · set up today`}
			>
				<div className="flex items-center gap-4 rounded-xl bg-brand px-5 py-4 text-white">
					<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
						<PartyPopperIcon className="size-5" />
					</span>
					<div className="min-w-0 flex-1">
						<p className="text-[15px] font-bold">
							{draft.hotel
								? `${hotelName} is set up and ready for guests`
								: "Your business is ready"}
						</p>
						<p className="text-xs text-white/75">
							{rooms
								? `${plural(rooms, "room")}, ${plural(draft.rooms?.roomTypes.length ?? 0, "room type")} and prices are in. `
								: ""}
							Your numbers show here after the first bookings and the first
							night audit.
						</p>
					</div>
				</div>
				<div className="rounded-xl border border-line">
					<div className="flex items-center gap-3 border-b border-line px-4 py-3">
						<div className="flex-1">
							<p className="text-[13px] font-bold text-ink">
								Finish setting up
							</p>
							<p className="text-xs text-ink-3">
								A few more things make the dashboard useful from day one
							</p>
						</div>
						<span className="text-xs font-semibold text-ink-2">
							{doneCount} of {items.length} done
						</span>
					</div>
					<ul className="divide-y divide-line">
						{items.map((it) => (
							<li key={it.label} className="flex items-center gap-3 px-4 py-3">
								<span
									className={cn(
										"flex size-6 shrink-0 items-center justify-center rounded-full",
										it.done
											? "bg-success-soft text-success"
											: it.pending
												? "bg-warning-soft text-warning"
												: "border border-line text-ink-3",
									)}
								>
									{it.done ? (
										<CheckIcon className="size-3" />
									) : it.pending ? (
										<ClockIcon className="size-3" />
									) : (
										<CircleIcon className="size-2" />
									)}
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-[13px] font-semibold text-ink">
										{it.label}
									</p>
									<p className="text-xs text-ink-3">{it.detail}</p>
								</div>
								{it.href && (
									<Link href={it.href} className={cn(btn.secondary, btn.small)}>
										{it.action ?? (it.done ? "Review" : "Add")}
									</Link>
								)}
							</li>
						))}
					</ul>
				</div>
				<div className="flex items-center gap-3">
					<p className="flex-1 text-xs text-ink-3">
						Your business goes live now; the rest can be done from the
						dashboard.
					</p>
					<Button
						className={cn(btn.primary, btn.large, "flex items-center gap-2")}
						disabled={pending}
						onClick={() =>
							run(
								() => completeMyOnboarding(),
								"Welcome to your dashboard",
								() => {
									forgetAllSteps(ownerId);
									router.replace("/dashboard");
								},
							)
						}
					>
						{pending ? (
							<Loader2Icon className="size-4 animate-spin" />
						) : (
							<ArrowRightIcon className="size-4" />
						)}{" "}
						Go to my dashboard
					</Button>
				</div>
			</StepCard>
		</StepPage>
	);
}
