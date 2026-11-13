"use client";

import { ActivityIcon, EyeIcon, Undo2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { undoChange } from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	AdminActivityRow,
	AdminChangeRow,
	Paged,
	SupportAccessGrantItem,
} from "@hospio/api/data/admin-types";
import type { BusinessRow } from "@hospio/api/data/types";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { fmtLongDate, fmtWhen, naira } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { SupportAccessButton } from "../support-access-button";
import { BusinessTabHeader } from "./nav";

/**
 * Business · Contract & activity: the contract fields, GET /platform/activity?businessId=, the changes
 * Hospio360 made here (with undo while the window is open) and who viewed it as the owner.
 */
export function ActivityTab({
	business,
	activity,
	changes: initialChanges,
	grants,
	canEdit,
}: {
	business: BusinessRow;
	activity: Paged<AdminActivityRow>;
	changes: AdminChangeRow[];
	grants: SupportAccessGrantItem[];
	canEdit: boolean;
}) {
	const [changes, setChanges] = useState(initialChanges);
	useEffect(() => setChanges(initialChanges), [initialChanges]);
	const [undo, setUndo] = useState<AdminChangeRow | null>(null);
	const { run, pending } = useAction();
	const now = Date.now();
	return (
		<>
			<BusinessTabHeader
				businessId={business.id}
				businessName={business.name}
				active="activity"
				subtitle="The agreement, everything that happened in the account, and every time Hospio360 changed or viewed it"
			>
				<SupportAccessButton
					businessId={business.id}
					businessName={business.name}
				/>
			</BusinessTabHeader>
			<SectionCard
				title="Contract"
				subtitle="From the business record; edit it on the Overview"
			>
				<DetailList
					columns={2}
					items={[
						{
							label: "Fee model",
							value: business.feeValue
								? `${business.feeModel} · ${business.feeModel.includes("%") ? `${business.feeValue}%` : naira(business.feeValue)}`
								: business.feeModel,
						},
						{
							label: "Contract starts",
							value: business.contractStartsOn
								? fmtLongDate(business.contractStartsOn)
								: "—",
						},
						{ label: "Account manager", value: business.accountManager },
						{
							label: "Marketer",
							value:
								business.marketer ?? (business.marketerId ? "Assigned" : "—"),
						},
						{ label: "Currency", value: business.currency ?? "NGN" },
						{ label: "Notes", value: business.contractNotes ?? "—" },
					]}
				/>
			</SectionCard>
			<div className="grid gap-4 xl:grid-cols-2">
				<SectionCard
					title="Activity"
					subtitle="Everything that happened in this account"
					count={activity.total}
					flush
				>
					{activity.content.length === 0 ? (
						<EmptyState title="Nothing recorded yet" className="mx-5 mb-5" />
					) : (
						<ul className="divide-y divide-line">
							{activity.content.map((a) => (
								<li key={a.id} className="flex items-center gap-3 px-5 py-3">
									<ActivityIcon className="size-4 shrink-0 text-ink-3" />
									<div className="min-w-0 flex-1">
										<p className="text-[13px] font-semibold text-ink">
											{a.action}
										</p>
										<p className="text-xs text-ink-3">
											{a.by} · {a.eventType.toLowerCase().replace(/_/g, " ")}
										</p>
									</div>
									<span className="text-xs text-ink-3">{fmtWhen(a.at)}</span>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
				<div className="flex flex-col gap-4">
					<SectionCard
						title="Changes by Hospio360"
						subtitle="The owner can ask support to undo one within 7 days"
						count={changes.length}
						action={{
							label: "All changes",
							href: `/dashboard/changes?businessId=${business.id}`,
						}}
						flush
					>
						{changes.length === 0 ? (
							<EmptyState
								title="Hospio360 has not changed anything here"
								className="mx-5 mb-5"
							/>
						) : (
							<ul className="divide-y divide-line">
								{changes.map((c) => {
									const open =
										!c.undone && new Date(c.undoUntil).getTime() > now;
									return (
										<li
											key={c.id}
											className="flex items-center gap-3 px-5 py-3"
										>
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-semibold text-ink">
													{c.description}
												</p>
												<p className="text-xs text-ink-3">
													{c.area} · {c.reason} · {c.madeBy} · {fmtWhen(c.at)}
												</p>
											</div>
											{c.undone ? (
												<StatusPill tone="grey" dot={false}>
													undone
												</StatusPill>
											) : open && canEdit ? (
												<button
													type="button"
													className={cn(
														btn.secondary,
														btn.small,
														"flex items-center gap-1",
													)}
													onClick={() => setUndo(c)}
												>
													<Undo2Icon className="size-3" /> Undo
												</button>
											) : (
												<StatusPill tone="grey" dot={false}>
													{open ? "open" : "window closed"}
												</StatusPill>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</SectionCard>
					<SectionCard
						title="Viewed as owner"
						subtitle="Support access grants: who looked, why, until when"
						count={grants.length}
						flush
					>
						{grants.length === 0 ? (
							<EmptyState
								title="Nobody has viewed this business as its owner"
								className="mx-5 mb-5"
							/>
						) : (
							<ul className="divide-y divide-line">
								{grants.map((g) => (
									<li key={g.id} className="flex items-center gap-3 px-5 py-3">
										<EyeIcon className="size-4 shrink-0 text-ink-3" />
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{g.adminName}
											</p>
											<p className="text-xs text-ink-3">
												{g.reason} · {g.createdAt ? fmtWhen(g.createdAt) : "—"}
												{g.expiresAt ? ` · until ${fmtWhen(g.expiresAt)}` : ""}
											</p>
										</div>
										<StatusPill tone={g.expired ? "grey" : "success"}>
											{g.expired ? "ended" : "active"}
										</StatusPill>
									</li>
								))}
							</ul>
						)}
					</SectionCard>
				</div>
			</div>
			<p className="text-xs text-ink-3">
				Guests and bookings of this business are view-only through the hotel
				app:{" "}
				<Link
					href={`/dashboard/businesses/${business.id}`}
					className="font-semibold text-brand hover:underline"
				>
					use "View as owner" on the business page
				</Link>
				.
			</p>

			<ConfirmModal
				open={!!undo}
				onOpenChange={(o) => !o && setUndo(null)}
				tone="danger"
				title="Undo this change?"
				subtitle={undo?.description}
				confirmLabel="Mark undone"
				pending={pending}
				onConfirm={() =>
					undo &&
					run(
						() => undoChange(undo.id, undo),
						"Marked undone",
						(c) => {
							setChanges((all) => all.map((x) => (x.id === c.id ? c : x)));
							setUndo(null);
						},
					)
				}
			>
				<WhatHappens
					tone="warning"
					items={[
						"Put the previous value back first (for example with Edit as Hospio360): Undo doesn't change the setting itself",
						"The change is marked undone; the owner sees 'undone by Hospio360' in their activity log",
					]}
				/>
			</ConfirmModal>
		</>
	);
}
