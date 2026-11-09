"use client";

import { MegaphoneIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import { createReferral } from "@hospio/api/actions/marketer";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	MarketerMeData,
	ReferralItem,
} from "@hospio/api/data/admin-types";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { FieldRow, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	ReferralLinkBox,
	stageLabel,
	stageTone,
	whatsappShare,
} from "./shared";

const steps = ["LEAD", "CONTACTED", "ONBOARDING", "LIVE"] as const;

/** Marketer — F3 · Refer a business: POST /platform/marketer/referrals and the list of GET /platform/marketer/referrals. */
export function MarketerRefer({
	me,
	referrals: initial,
}: {
	me: MarketerMeData;
	referrals: ReferralItem[];
}) {
	const { run, pending } = useAction();
	const [referrals, setReferrals] = useState(initial);
	const [hotel, setHotel] = useState("");
	const [owner, setOwner] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [city, setCity] = useState("");
	const [notes, setNotes] = useState("");
	const p = me.profile;

	return (
		<>
			<PageHeader
				title="Refer a hotel"
				subtitle="Tell us who to call, or share your link. We contact them, set them up, and you earn from the month they go live."
			/>
			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<SectionCard
					title="Their details"
					subtitle="The owner or the person who decides"
					bodyClassName="gap-4 pt-2"
				>
					<FieldRow>
						<TextField
							label="Hotel or business name"
							value={hotel}
							onChange={setHotel}
							placeholder="Lagoon Breeze Suites"
							required
						/>
						<TextField
							label="City"
							value={city}
							onChange={setCity}
							placeholder="Lagos"
						/>
					</FieldRow>
					<FieldRow>
						<TextField
							label="Owner's name"
							value={owner}
							onChange={setOwner}
							placeholder="Mr Dele Oni"
						/>
						<TextField
							label="Phone (WhatsApp)"
							value={phone}
							onChange={setPhone}
							placeholder="+234 …"
						/>
					</FieldRow>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={setEmail}
						placeholder="owner@hotel.com"
					/>
					<TextareaField
						label="Anything we should know"
						value={notes}
						onChange={setNotes}
						placeholder="How many rooms, what they use today, when to call…"
					/>
					<div className="flex justify-end">
						<button
							type="button"
							disabled={!hotel || pending}
							className={cn(btn.primary, "flex items-center gap-2")}
							onClick={() =>
								run(
									() =>
										createReferral({
											hotelName: hotel,
											ownerName: owner || undefined,
											phone: phone || undefined,
											email: email || undefined,
											city: city || undefined,
											note: notes || undefined,
										}),
									"Referral sent · we'll call them within 2 working days",
									(r) => {
										setReferrals((all) => [r, ...all]);
										setHotel("");
										setOwner("");
										setPhone("");
										setEmail("");
										setCity("");
										setNotes("");
									},
								)
							}
						>
							<MegaphoneIcon className="size-4" /> Send referral
						</button>
					</div>
				</SectionCard>

				<SectionCard
					title="Your link"
					subtitle="Anyone who signs up through it is yours"
					bodyClassName="gap-3 pt-2"
				>
					<ReferralLinkBox me={p} />
					<a
						href={whatsappShare(p)}
						target="_blank"
						rel="noreferrer"
						className={cn(btn.secondary, "flex w-fit items-center gap-2")}
					>
						<Share2Icon className="size-4" /> Share on WhatsApp
					</a>
					<p className="text-xs text-ink-3">
						You earn {p.sharePct}% of the H.M.S share for {p.months} months on
						every business that goes live.
						{p.referralCode ? ` Your code: ${p.referralCode}.` : ""}
					</p>
				</SectionCard>
			</div>

			<SectionCard
				title="Your referrals"
				subtitle="Where each one is"
				count={referrals.length}
				flush
			>
				{referrals.length === 0 ? (
					<EmptyState title="No referrals yet" className="mx-5 mb-5" />
				) : (
					<ul className="divide-y divide-line">
						{referrals.map((r) => {
							const idx = steps.indexOf(r.stage as (typeof steps)[number]);
							return (
								<li key={r.id} className="flex items-center gap-4 px-5 py-3">
									<div className="min-w-0 flex-1">
										<p className="text-[13px] font-semibold text-ink">
											{r.hotelName}
										</p>
										<p className="text-xs text-ink-3">
											{r.ownerName} · {r.city || "—"} · sent{" "}
											{fmtLongDate(r.sentAt)}
											{r.note ? ` · ${r.note}` : ""}
										</p>
									</div>
									{r.stage === "LOST" ? (
										<StatusPill tone="grey">Didn't sign up</StatusPill>
									) : (
										<div className="flex items-center gap-1">
											{steps.map((s, i) => (
												<span
													key={s}
													className={cn(
														"h-[6px] w-8 rounded-full",
														i <= idx ? "bg-brand" : "bg-subtle",
													)}
													title={stageLabel[s]}
												/>
											))}
										</div>
									)}
									<StatusPill tone={stageTone[r.stage]}>
										{stageLabel[r.stage]}
									</StatusPill>
								</li>
							);
						})}
					</ul>
				)}
			</SectionCard>
		</>
	);
}
