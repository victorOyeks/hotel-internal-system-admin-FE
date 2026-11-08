"use client";

import { CopyIcon, MegaphoneIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { FieldRow, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtLongDate } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { MarketerRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import type { ReferralRow } from "@hospio/api/demo/fixtures/platform-extra";
import { cn } from "@hospio/ui/utils";
import { referralLink, stageLabel, stageTone } from "./shared";

const steps = ["LEAD", "CONTACTED", "ONBOARDING", "LIVE"] as const;

export function MarketerRefer({ me, referrals: initial }: { me: MarketerRow; referrals: ReferralRow[] }) {
	const { run, pending } = useDemoAction();
	const [referrals, setReferrals] = useState(initial);
	const [hotel, setHotel] = useState("");
	const [owner, setOwner] = useState("");
	const [phone, setPhone] = useState("");
	const [city, setCity] = useState("");
	const [notes, setNotes] = useState("");
	const link = referralLink(me);

	return (
		<>
			<PageHeader title="Refer a hotel" subtitle="Tell us who to call, or share your link. We contact them, set them up, and you earn from the month they go live." />
			<div className="grid gap-4 xl:grid-cols-[1fr_420px]">
				<SectionCard title="Their details" subtitle="The owner or the person who decides" bodyClassName="gap-4 pt-2">
					<FieldRow>
						<TextField label="Hotel or business name" value={hotel} onChange={setHotel} placeholder="Lagoon Breeze Suites" required />
						<TextField label="City" value={city} onChange={setCity} placeholder="Lagos" required />
					</FieldRow>
					<FieldRow>
						<TextField label="Owner's name" value={owner} onChange={setOwner} placeholder="Mr Dele Oni" required />
						<TextField label="Phone (WhatsApp)" value={phone} onChange={setPhone} placeholder="+234 …" required />
					</FieldRow>
					<TextareaField label="Anything we should know" value={notes} onChange={setNotes} placeholder="How many rooms, what they use today, when to call…" />
					<div className="flex justify-end">
						<button type="button" disabled={!hotel || !owner || !phone || !city || pending} className={cn(btn.primary, "flex items-center gap-2")} onClick={() => run("Referral sent · we'll call them within 2 working days", () => { setReferrals((r) => [{ id: `rf-${Date.now()}`, marketerId: me.id, hotelName: hotel, ownerName: owner, phone, city, stage: "LEAD", sentOn: new Date().toISOString().slice(0, 10), note: notes || undefined }, ...r]); setHotel(""); setOwner(""); setPhone(""); setCity(""); setNotes(""); })}>
							<MegaphoneIcon className="size-4" /> Send referral
						</button>
					</div>
				</SectionCard>

				<SectionCard title="Your link" subtitle="Anyone who signs up through it is yours" bodyClassName="gap-3 pt-2">
					<div className="flex items-center gap-2 rounded-control bg-subtle px-3 py-[10px] text-[13px] font-medium text-ink">
						<span className="min-w-0 flex-1 truncate">{link}</span>
						<button type="button" onClick={() => run("Link copied", undefined, { tone: "info", ms: 100 })} className="text-ink-3 hover:text-ink" aria-label="Copy link"><CopyIcon className="size-4" /></button>
					</div>
					<button type="button" onClick={() => run("Opened WhatsApp with your link", undefined, { tone: "info" })} className={cn(btn.secondary, "flex w-fit items-center gap-2")}><Share2Icon className="size-4" /> Share on WhatsApp</button>
					<p className="text-xs text-ink-3">You earn {me.sharePct}% of the H.M.S share for {me.months} months on every business that goes live.</p>
				</SectionCard>
			</div>

			<SectionCard title="Your referrals" subtitle="Where each one is" count={referrals.length} flush>
				{referrals.length === 0 ? <EmptyState title="No referrals yet" className="mx-5 mb-5" /> : (
					<ul className="divide-y divide-line">
						{referrals.map((r) => {
							const idx = steps.indexOf(r.stage as (typeof steps)[number]);
							return (
								<li key={r.id} className="flex items-center gap-4 px-5 py-3">
									<div className="min-w-0 flex-1">
										<p className="text-[13px] font-semibold text-ink">{r.hotelName}</p>
										<p className="text-xs text-ink-3">{r.ownerName} · {r.city} · sent {fmtLongDate(r.sentOn)}{r.note ? ` · ${r.note}` : ""}</p>
									</div>
									{r.stage === "LOST" ? <StatusPill tone="grey">Didn't sign up</StatusPill> : (
										<div className="flex items-center gap-1">
											{steps.map((s, i) => (
												<span key={s} className={cn("h-[6px] w-8 rounded-full", i <= idx ? "bg-brand" : "bg-subtle")} title={stageLabel[s]} />
											))}
										</div>
									)}
									<StatusPill tone={stageTone[r.stage]}>{stageLabel[r.stage]}</StatusPill>
								</li>
							);
						})}
					</ul>
				)}
			</SectionCard>
		</>
	);
}
