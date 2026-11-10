"use client";

import { CheckIcon, ShirtIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { markLinenSent } from "@hospio/api/actions/housekeeping";
import { useAction } from "@hospio/api/actions/use-action";
import type { LinenRequestRow } from "@hospio/api/data/types";
import { Note } from "@hospio/ui/shared/detail-list";
import { fmtWhen, plural } from "@hospio/ui/shared/format";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { BigButton } from "../shared-staff/tablet";

/**
 * Laundry · Linen: what housekeeping asked for with "Ask for linen" (oldest first), with "Mark sent" for laundry Edit or a manager;
 * whoever asked gets a notice. The last few sent stay below for reference.
 */
export function LinenRequestsCard({
	open: o0,
	sent,
	canSend,
	failed,
}: {
	open: LinenRequestRow[];
	sent: LinenRequestRow[];
	canSend: boolean;
	failed?: boolean;
}) {
	const [open, setOpen] = useState(o0);
	useEffect(() => setOpen(o0), [o0]);
	const { run, pending } = useAction();
	const [busy, setBusy] = useState<string | null>(null);
	return (
		<SectionCard
			title="Linen asked for by housekeeping"
			subtitle={
				open.length
					? `${plural(open.length, "request")} waiting · oldest first`
					: "Nothing waiting"
			}
			flush
		>
			{failed && (
				<Note tone="danger" className="mx-5 mb-3">
					Linen requests didn't load. Refresh to try again.
				</Note>
			)}
			{open.length === 0 && !failed ? (
				<p className="px-5 pb-5 text-[13px] text-ink-3">
					When an attendant taps Ask for linen on My rooms, it shows here.
				</p>
			) : (
				<ul className="divide-y divide-line">
					{open.map((r) => (
						<li
							key={r.id}
							className="flex flex-wrap items-center gap-3 px-5 py-3"
						>
							<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
								<ShirtIcon className="size-4" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="text-[14px] font-semibold text-ink">{r.items}</p>
								<p className="text-xs text-ink-3">
									{r.requestedBy}
									{r.roomNumber ? ` · Room ${r.roomNumber}` : ""} · asked{" "}
									{fmtWhen(r.requestedAt)}
								</p>
							</div>
							{canSend ? (
								<BigButton
									pending={pending && busy === r.id}
									onClick={() => {
										setBusy(r.id);
										void run(
											() => markLinenSent(r.id),
											`Marked sent · ${r.requestedBy} is told`,
											() => setOpen((xs) => xs.filter((x) => x.id !== r.id)),
										);
									}}
								>
									<CheckIcon className="size-5" /> Mark sent
								</BigButton>
							) : (
								<StatusPill tone="warning">Waiting</StatusPill>
							)}
						</li>
					))}
				</ul>
			)}
			{sent.length > 0 && (
				<details className="border-t border-line px-5 py-3 text-[13px]">
					<summary className="cursor-pointer font-semibold text-ink-2">
						Recently sent ({sent.length})
					</summary>
					<ul className="mt-2 flex flex-col gap-1 text-ink-3">
						{sent.slice(0, 10).map((r) => (
							<li key={r.id}>
								{r.items} · {r.requestedBy} · sent {fmtWhen(r.sentAt)}
								{r.sentBy ? ` by ${r.sentBy}` : ""}
							</li>
						))}
					</ul>
				</details>
			)}
		</SectionCard>
	);
}
