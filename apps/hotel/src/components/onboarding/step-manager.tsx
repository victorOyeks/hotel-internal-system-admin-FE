"use client";

import { CheckIcon, MailIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUser } from "@hospio/api/actions/identity";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { saveMyOnboardingStep } from "@hospio/api/actions/onboarding";
import { useAction } from "@hospio/api/actions/use-action";
import type { Business, Me } from "@hospio/api/api/schema";
import type { OwnerOnboardingData } from "@hospio/api/types";
import { Note } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, FieldRow, TextField } from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { InviteCard } from "@hospio/ui/shared/invite-card";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { SideCard, StepCard, StepFooter, StepPage } from "./common";
import { useFreshOnOpen, useStepForm } from "./persist";
import { stepHref } from "./steps";
import { checkEmail, checkName, checkPhone, only } from "./validate";

type Created = NonNullable<OwnerOnboardingData["manager"]> & {
	phone?: string;
	inviteExpiresAt?: string | null;
	temporaryPasswordExpiresAt?: string | null;
};

/** Step 4 · Your first manager (Figma 3165:16113) → POST /identity/users (MANAGER, the new hotel) → the invite card. */
export function ManagerStep({
	draft,
	business,
	user,
}: {
	draft: OwnerOnboardingData;
	business: Business | null;
	user: Me | null;
}) {
	const router = useRouter();
	const hotel = draft.hotel;
	const [created, setCreated] = useState<Created | null>(draft.manager ?? null);
	useFreshOnOpen();
	const { form, update, forget } = useStepForm("manager", user?.id, {
		fullName: "",
		phone: "",
		email: "",
	});
	const [errors, setErrors] = useState<Partial<typeof form>>({});
	const set = <K extends keyof typeof form>(k: K, v: string) =>
		update({ [k]: v } as Partial<typeof form>);
	const { run, pending } = useAction();
	const hotelName = hotel?.name ?? "your hotel";
	const inviter = user?.fullName ?? business?.ownerName ?? "The owner";

	const check = () =>
		only({
			fullName: checkName(form.fullName, "their full name"),
			email: checkEmail(form.email),
			phone: checkPhone(form.phone, false),
		});

	function submit() {
		const e = check();
		setErrors(e);
		if (Object.keys(e).length) return;
		if (!hotel?.hotelId) return;
		const fullName = form.fullName.trim();
		const email = form.email.trim();
		const phone = form.phone.trim() || null;
		run(
			async () => {
				const r = await withDeliveries(
					createUser({
						fullName,
						email,
						phone,
						role: "MANAGER",
						level: "FULL",
						hotelId: hotel.hotelId,
					}),
					`Invite for ${fullName}`,
				);
				if (!r.ok) return r;
				const step = await saveMyOnboardingStep("manager", {
					userId: r.data.userId,
					fullName,
					email,
					temporaryPassword: r.data.temporaryPassword ?? undefined,
					inviteToken: r.data.inviteToken ?? undefined,
				});
				if (!step.ok) return step;
				forget();
				return {
					ok: true as const,
					data: {
						userId: r.data.userId,
						fullName,
						email,
						phone: phone ?? undefined,
						temporaryPassword: r.data.temporaryPassword ?? undefined,
						inviteToken: r.data.inviteToken ?? undefined,
						inviteExpiresAt: r.data.inviteExpiresAt,
						temporaryPasswordExpiresAt: r.data.temporaryPasswordExpiresAt,
					} satisfies Created,
				};
			},
			`${fullName} invited`,
			setCreated,
		);
	}

	if (!hotel?.hotelId) {
		return (
			<StepPage>
				<StepCard
					step="manager"
					title="Your first manager"
					intro="A manager is given a hotel, so the hotel comes first."
				>
					<Note tone="info">Step 2 has not been saved yet.</Note>
					<Link href={stepHref("hotel")} className={cn(btn.primary, "w-fit")}>
						Go to Your first hotel
					</Link>
				</StepCard>
			</StepPage>
		);
	}

	return (
		<StepPage
			aside={
				<>
					<SideCard
						eyebrow={`The invite ${created?.fullName.split(" ")[0] ?? "they"} get${created ? "s" : ""}`}
						title={`${inviter} invited you to ${business?.name ?? "your hotels"}`}
						icon={MailIcon}
					>
						<p>
							You're the General manager for {hotelName}. Set a password to get
							started — the link works for 7 days.
						</p>
						<span
							className={cn(btn.primary, btn.small, "w-fit cursor-default")}
						>
							Accept invite
						</span>
					</SideCard>
					<SideCard title="Only what they need" icon={ShieldIcon}>
						<p>
							A manager only sees the hotels you give them. Add or remove hotels
							any time from Users.
						</p>
					</SideCard>
				</>
			}
		>
			<StepCard
				step="manager"
				title={`Invite a manager for ${hotelName}`}
				intro="They'll run the hotel day to day. You can invite more managers, an accountant or a co-owner later from Users."
			>
				{created ? (
					<>
						<InviteCard
							title={`${created.fullName} is invited`}
							fullName={created.fullName}
							email={created.email}
							phone={created.phone}
							roleLabel="General manager"
							hotelName={hotelName}
							businessName={business?.name ?? "Hospio360"}
							inviterName={inviter}
							temporaryPassword={created.temporaryPassword}
							inviteToken={created.inviteToken}
							inviteExpiresAt={created.inviteExpiresAt}
							temporaryPasswordExpiresAt={created.temporaryPasswordExpiresAt}
						/>
						<StepFooter
							back={stepHref("rooms")}
							label="Continue"
							onContinue={() => router.push(stepHref("done"))}
							info={`${created.fullName} sets a password on the link and lands on ${hotelName}'s dashboard`}
						/>
					</>
				) : (
					<form
						className="flex flex-col gap-4"
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
					>
						<FieldRow>
							<TextField
								label="Full name"
								value={form.fullName}
								onChange={(v) => set("fullName", v)}
								placeholder="Tunde Bakare"
								required
								error={errors.fullName}
							/>
							<TextField
								label="Phone"
								type="tel"
								value={form.phone}
								onChange={(v) => set("phone", v)}
								placeholder="+234 807 220 1145"
								error={errors.phone}
								hint="Optional · for sharing the invite on WhatsApp yourself"
							/>
						</FieldRow>
						<TextField
							label="Email"
							type="email"
							value={form.email}
							onChange={(v) => set("email", v)}
							placeholder="tunde.b@royalsuites.ng"
							required
							error={errors.email}
							hint="They sign in with this"
						/>
						<ChoiceCards
							label="Role"
							value="MANAGER"
							onChange={() => undefined}
							options={[
								{
									value: "MANAGER",
									label: "General manager",
									hint: "Runs the hotels you give them: rooms, bookings, folios, staff, stock and branch money. Can't see other hotels or who has access.",
								},
							]}
						/>
						<div className="flex flex-col gap-2">
							<span className="text-[13px] font-medium text-ink-2">
								Hotels they'll run
							</span>
							<div className="flex flex-wrap items-center gap-2">
								<span className="inline-flex items-center gap-1 rounded-pill border border-brand bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
									<CheckIcon className="size-3" /> {hotelName}
								</span>
								<span className="text-xs text-ink-3">
									Your other hotels appear here once you add them
								</span>
							</div>
						</div>
						<div className="rounded-xl bg-subtle/70 px-4 py-3">
							<div className="flex items-center">
								<p className="flex-1 text-[13px] font-semibold text-ink">
									What needs your OK
								</p>
								<span className="text-xs text-ink-3">
									Change later in Hotel setup → Approval limits
								</span>
							</div>
							<ul className="mt-2 flex flex-col gap-1 text-xs text-ink-2">
								{[
									`Expenses over ${naira(200000)}`,
									"Discounts over 10%",
									"Room price changes",
								].map((t) => (
									<li key={t} className="flex items-center gap-2">
										<CheckIcon className="size-3 text-success" /> {t}
									</li>
								))}
							</ul>
						</div>
						<StepFooter
							back={stepHref("rooms")}
							skip={{ href: stepHref("done") }}
							label="Create login & continue"
							pending={pending}
							onContinue={submit}
							info="They get a temporary password and an invite link you can send"
						/>
					</form>
				)}
			</StepCard>
		</StepPage>
	);
}
