"use client";

import { ArrowRightIcon, ClipboardCheckIcon, UserCog2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useAction } from "@hospio/api/actions/use-action";
import {
	assignOnboarding,
	saveOnboardingStep,
} from "@hospio/api/actions/tenant";
import type { AdminUserRow, OnboardingRow } from "@hospio/api/data/types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import {
	ADMIN_ONBOARDING_STEPS,
	type AdminOnboardingData,
	type AdminOnboardingStep,
} from "@hospio/api/types";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { fmtAgo, fmtLongDate } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { STEP_META, stepsOf } from "./onboarding/shared";
import { can, ReadOnlyNote } from "./shared";

/**
 * Admin — J1 · the onboarding board (GET /tenant/onboarding): three columns by status, each card opens
 * the wizard. The side panel shows the steps, lets Support change the next action and reassign (J18).
 */

const GROUPS = [
	{ key: "IN_PROGRESS", label: "In progress", tone: "info" as const },
	{
		key: "READY_FOR_HANDOVER",
		label: "Ready for handover",
		tone: "warning" as const,
	},
	{ key: "DONE", label: "Handed over", tone: "success" as const },
];

const stepLabel = (r: OnboardingRow) => {
	if (r.status === "DONE") return "Handed over";
	if (r.source === "SELF_SERVE")
		return `Owner onboarding · step ${r.step} of ${r.totalSteps}`;
	const key =
		ADMIN_ONBOARDING_STEPS[Math.min(r.totalSteps, Math.max(1, r.step)) - 1];
	return `Step ${r.step} of ${r.totalSteps}${key ? ` · ${STEP_META[key].label}` : ""}`;
};

export function OnboardingScreen({
	role,
	rows: initialRows,
	admins,
}: {
	role: AdminRole;
	rows: OnboardingRow[];
	admins: AdminUserRow[];
}) {
	const router = useRouter();
	const [rows, setRows] = useState(initialRows);
	const [open, setOpen] = useQueryState("open");
	const [reassign, setReassign] = useState<OnboardingRow | null>(null);
	const selected =
		rows.find((r) => r.businessId === open || r.id === open) ?? null;
	const editable = can.editBusiness(role);
	const patch = (row: OnboardingRow) =>
		setRows((list) =>
			list.map((r) =>
				r.businessId === row.businessId
					? {
							...r,
							...row,
							data: { ...r.data, ...row.data },
							businessName: r.businessName,
						}
					: r,
			),
		);

	return (
		<>
			<PageHeader
				title="Onboarding"
				subtitle="Businesses H.M.S is setting up, and owners setting up themselves"
			>
				{editable && (
					<Link href="/dashboard/businesses?new=1" className={btn.primary}>
						Set up a business for them
					</Link>
				)}
			</PageHeader>
			{!editable && (
				<ReadOnlyNote>
					Onboarding is run by Support or a Super admin.
				</ReadOnlyNote>
			)}
			<div className="grid gap-4 md:grid-cols-3">
				{GROUPS.map((g) => {
					const list = rows.filter((r) => r.status === g.key);
					return (
						<SectionCard
							key={g.key}
							title={g.label}
							count={list.length}
							bodyClassName="gap-3 pt-2"
						>
							{list.length === 0 ? (
								<EmptyState title="Nothing here" />
							) : (
								list.map((r) => {
									const n =
										r.status === "DONE"
											? r.totalSteps
											: r.completedSteps.length;
									return (
										<div
											key={r.businessId}
											className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4 transition-colors hover:bg-subtle/60"
										>
											<Link
												href={
													r.source === "SELF_SERVE"
														? `/dashboard/businesses/${r.businessId}`
														: `/dashboard/onboarding/${r.businessId}`
												}
												className="flex flex-col gap-2"
											>
												<div className="flex items-center gap-2">
													<span className="flex-1 text-[13px] font-semibold text-ink">
														{r.businessName}
													</span>
													<StatusPill tone={g.tone} dot={false}>
														{n} / {r.totalSteps}
													</StatusPill>
												</div>
												<ProgressBar
													value={n}
													max={r.totalSteps}
													tone={g.key === "DONE" ? "success" : undefined}
												/>
												<p className="text-xs text-ink-3">
													{r.source === "SELF_SERVE"
														? "Owner"
														: `H.M.S · ${r.assignedTo}`}{" "}
													·{" "}
													{r.updatedAt
														? `saved ${fmtAgo(r.updatedAt)}`
														: `started ${fmtAgo(r.startedAt)}`}
												</p>
												<p className="text-xs font-medium text-ink-2">
													{stepLabel(r)}
												</p>
												{r.status !== "DONE" &&
													r.nextAction &&
													!r.nextAction.startsWith("Step ") && (
														<p className="text-xs text-ink-2">
															Next: {r.nextAction}
														</p>
													)}
											</Link>
											<button
												type="button"
												onClick={() => void setOpen(r.businessId)}
												className="self-start text-xs font-semibold text-brand hover:underline"
											>
												Details
											</button>
										</div>
									);
								})
							)}
						</SectionCard>
					);
				})}
			</div>
			<p className="text-xs text-ink-3">
				H.M.S can set a business up end to end, then hand it over. Owners who
				prefer can still do it themselves after an invite.
			</p>

			<SidePanel
				open={!!selected}
				onOpenChange={(o) => !o && void setOpen(null)}
				title={selected?.businessName ?? ""}
				subtitle={
					selected
						? `${selected.source === "SELF_SERVE" ? "Self-serve" : "Back-office"} onboarding · ${selected.assignedTo} · started ${fmtLongDate(selected.startedAt)}`
						: undefined
				}
				icon={ClipboardCheckIcon}
				width="md"
				footerInfo={
					selected && selected.status !== "DONE"
						? `${selected.completedSteps.length} of ${selected.totalSteps} steps done`
						: undefined
				}
				footer={
					selected ? (
						<>
							{editable && selected.status !== "DONE" && (
								<button
									type="button"
									className={cn(btn.secondary, "flex items-center gap-2")}
									onClick={() => setReassign(selected)}
								>
									<UserCog2Icon className="size-4" /> Reassign
								</button>
							)}
							{selected.source === "BACK_OFFICE" && (
								<button
									type="button"
									className={cn(btn.primary, "flex items-center gap-2")}
									onClick={() =>
										router.push(`/dashboard/onboarding/${selected.businessId}`)
									}
								>
									{selected.status === "DONE" ? "Open" : "Continue"}{" "}
									<ArrowRightIcon className="size-4" />
								</button>
							)}
						</>
					) : undefined
				}
			>
				{selected && (
					<OnboardingDetails
						row={selected}
						editable={
							editable &&
							selected.status !== "DONE" &&
							selected.source === "BACK_OFFICE"
						}
						onSaved={patch}
					/>
				)}
			</SidePanel>

			<ReassignModal
				open={!!reassign}
				onOpenChange={(o) => !o && setReassign(null)}
				row={reassign}
				admins={admins}
				onSaved={(row) => {
					patch(row);
					setReassign(null);
				}}
			/>
		</>
	);
}

function OnboardingDetails({
	row,
	editable,
	onSaved,
}: {
	row: OnboardingRow;
	editable: boolean;
	onSaved: (row: OnboardingRow) => void;
}) {
	const { run, pending } = useAction();
	const [nextAction, setNextAction] = useState(
		row.nextAction.startsWith("Step ") ? "" : row.nextAction,
	);
	const dirty =
		nextAction.trim() !==
		(row.nextAction.startsWith("Step ") ? "" : row.nextAction);
	const steps =
		row.source === "SELF_SERVE"
			? ["business", "hotel", "rooms", "manager"]
			: [...ADMIN_ONBOARDING_STEPS];
	const labelOf = (key: string) =>
		key in STEP_META
			? STEP_META[key as AdminOnboardingStep].label
			: key[0].toUpperCase() + key.slice(1);

	/** Re-saves the last completed step with its own data so only the next action changes. */
	const saveNextAction = () => {
		const data = stepsOf(row.data);
		const lastDone = [...ADMIN_ONBOARDING_STEPS]
			.reverse()
			.find((s) => row.completedSteps.includes(s));
		const step: AdminOnboardingStep = lastDone ?? "business";
		const stepData = (data[step] ??
			(step === "business" ? { name: row.businessName } : {})) as NonNullable<
			AdminOnboardingData[typeof step]
		>;
		run(
			() =>
				saveOnboardingStep(
					row.businessId,
					step,
					stepData,
					nextAction.trim() || undefined,
				),
			"Next action saved",
			(saved) => onSaved(saved),
		);
	};

	return (
		<div className="flex flex-col gap-5">
			<DetailList
				columns={2}
				items={[
					{
						label: "Business",
						value: (
							<Link
								href={`/dashboard/businesses/${row.businessId}`}
								className="text-brand hover:underline"
							>
								{row.businessName}
							</Link>
						),
					},
					{ label: "Assigned to", value: row.assignedTo },
					{
						label: "Status",
						value:
							GROUPS.find((g) => g.key === row.status)?.label ?? row.status,
					},
					{
						label: "Last saved",
						value: row.updatedAt ? fmtAgo(row.updatedAt) : "—",
					},
				]}
			/>
			<PanelSection title="Steps">
				<ol className="flex flex-col gap-1">
					{steps.map((s, i) => {
						const done =
							row.status === "DONE" || row.completedSteps.includes(s);
						const current = row.status !== "DONE" && i + 1 === row.step;
						return (
							<li
								key={s}
								className={cn(
									"flex items-center gap-3 rounded-control px-3 py-2 text-[13px]",
									current
										? "bg-brand-soft font-semibold text-brand"
										: done
											? "text-ink"
											: "text-ink-3",
								)}
							>
								<span
									className={cn(
										"flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
										done
											? "border-success bg-success text-white"
											: current
												? "border-brand bg-brand text-white"
												: "border-line-strong",
									)}
								>
									{done ? "✓" : i + 1}
								</span>
								{labelOf(s)}
								{row.source === "BACK_OFFICE" && (
									<Link
										href={`/dashboard/onboarding/${row.businessId}?step=${s}`}
										className="ml-auto text-xs font-semibold text-brand hover:underline"
									>
										Open
									</Link>
								)}
							</li>
						);
					})}
				</ol>
			</PanelSection>
			{editable && (
				<PanelSection title="Next action">
					<TextareaField
						label="What happens next"
						value={nextAction}
						onChange={setNextAction}
						rows={2}
						placeholder="Import rooms from the owner's spreadsheet"
						hint="Shown on the card so the team knows who is waiting on what."
					/>
					<div>
						<button
							type="button"
							className={btn.secondary}
							disabled={!dirty || pending}
							onClick={saveNextAction}
						>
							Save next action
						</button>
					</div>
				</PanelSection>
			)}
		</div>
	);
}

/** J18 · Reassign the onboarding to another admin (PUT /tenant/onboarding/{id}/assign?adminId=). */
function ReassignModal({
	open,
	onOpenChange,
	row,
	admins,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	row: OnboardingRow | null;
	admins: AdminUserRow[];
	onSaved: (row: OnboardingRow) => void;
}) {
	const { run, pending } = useAction();
	const [adminId, setAdminId] = useState("");
	const options = admins
		.filter((a) => a.status === "ACTIVE" && a.role !== "FINANCE_ADMIN")
		.map((a) => ({
			value: a.id,
			label: a.fullName,
			hint: a.role === "SUPER_ADMIN" ? "Super admin" : "Support",
		}));
	const chosen = admins.find((a) => a.id === adminId);
	return (
		<Modal
			open={open}
			onOpenChange={onOpenChange}
			title={`Reassign ${row?.businessName ?? ""}`}
			subtitle={row ? `Now with ${row.assignedTo}` : undefined}
			icon={UserCog2Icon}
			size="confirm"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
						disabled={pending}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!adminId || adminId === row?.assignedToId || pending}
						onClick={() =>
							row &&
							run(
								() => assignOnboarding(row.businessId, adminId),
								`${row.businessName} is now with ${chosen?.fullName ?? "another admin"}`,
								(saved) =>
									onSaved({
										...saved,
										assignedTo: chosen?.fullName ?? saved.assignedTo,
										assignedToId: adminId,
									}),
							)
						}
					>
						Reassign
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<SelectField
					label="Assign to"
					value={adminId}
					onChange={setAdminId}
					options={options}
					placeholder="Choose an admin"
					hint="Platform staff are listed from the team page until identity lists them."
				/>
				<WhatHappens
					items={[
						"The card shows the new owner of this onboarding",
						"Nothing changes for the business or its draft",
						"Steps already done stay done",
					]}
				/>
			</div>
		</Modal>
	);
}
