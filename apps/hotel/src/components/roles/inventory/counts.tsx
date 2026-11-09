"use client";

import { CheckCircle2Icon, ClipboardCheckIcon, PlayIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn, input } from "@hospio/ui/shared/ui";
import {
	approveCount,
	cancelCount,
	startCount,
	submitCount,
} from "@hospio/api/actions/inventory";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	StockCountRow,
	StockItemRow,
	StoreRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { useInvPerms } from "./nav";

const tone: Record<
	StockCountRow["status"],
	{ label: string; tone: "success" | "warning" | "info" | "grey" }
> = {
	OPEN: { label: "Counting", tone: "info" },
	COUNTED: { label: "Needs approval", tone: "warning" },
	APPROVED: { label: "Approved", tone: "success" },
	CANCELLED: { label: "Cancelled", tone: "grey" },
};
const q = (n: number) => Number(n.toFixed(2)).toLocaleString("en-NG");

/** Inventory 5.x · Stock counts: start, count sheet, submit, the manager approves the difference, cancel; past counts. */
export function CountsScreen({
	counts,
	stores,
	items,
}: {
	counts: StockCountRow[];
	stores: StoreRow[];
	items: StockItemRow[];
}) {
	const perms = useInvPerms();
	const [isNew, setIsNew] = useQueryState("new");
	const [openId, setOpenId] = useQueryState("open");
	const [storeId, setStoreId] = useState("");
	const [sheet, setSheet] = useState<Record<string, string>>({});
	const [note, setNote] = useState("");
	const [cancelling, setCancelling] = useState(false);
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	const count = counts.find((c) => c.id === openId) ?? null;
	const sheetItems = count
		? items.filter((i) => i.storeId === count.storeId)
		: [];
	const countKey =
		count && (count.status === "OPEN" || count.status === "COUNTED")
			? `${count.id}:${count.status}`
			: null;
	useEffect(() => {
		if (!count) return;
		const prior = new Map(
			(count.lines ?? []).map((l) => [l.itemId, l.counted]),
		);
		setSheet(
			Object.fromEntries(
				items
					.filter((i) => i.storeId === count.storeId)
					.map((i) => [i.id, prior.has(i.id) ? String(prior.get(i.id)) : ""]),
			),
		);
		setNote(count.note ?? "");
	}, [countKey]);
	const filled = sheetItems.filter((i) => (sheet[i.id] ?? "") !== "").length;
	const variance = sheetItems.reduce(
		(s, i) =>
			s +
			((sheet[i.id] ?? "") === ""
				? 0
				: (Number(sheet[i.id]) - i.quantity) * i.unitCost),
		0,
	);
	const openCounts = counts.filter(
		(c) => c.status === "OPEN" || c.status === "COUNTED",
	);
	const busyStores = new Set(openCounts.map((c) => c.storeId));
	const editable =
		count &&
		(count.status === "OPEN" || count.status === "COUNTED") &&
		perms.store;

	return (
		<>
			<PageHeader
				title="Stock counts"
				subtitle="Count a store, compare with the system, a manager approves the difference"
			>
				{perms.store && (
					<button
						type="button"
						className={btn.primary}
						onClick={() => {
							setStoreId("");
							void setIsNew("1");
						}}
					>
						<PlayIcon className="mr-1 inline size-4" /> Start a count
					</button>
				)}
			</PageHeader>
			{openCounts.length > 0 && (
				<div className="grid gap-4 md:grid-cols-2">
					{openCounts.map((c) => (
						<button
							key={c.id}
							type="button"
							onClick={() => void setOpenId(c.id)}
							className="flex flex-col gap-2 rounded-card border border-line bg-card p-5 text-left hover:shadow-md"
						>
							<span className="flex items-center gap-2">
								<span className="flex-1 text-base font-bold text-ink">
									{c.storeName}
								</span>
								<StatusPill tone={tone[c.status].tone}>
									{tone[c.status].label}
								</StatusPill>
							</span>
							<span className="text-xs text-ink-3">
								Started by {c.startedBy} · {fmtWhen(c.startedAt)}
							</span>
							{c.status === "COUNTED" && (
								<span
									className={cn(
										"text-[13px] font-semibold",
										(c.varianceValue ?? 0) < 0 ? "text-danger" : "text-success",
									)}
								>
									{(c.varianceValue ?? 0) === 0
										? "Everything matched"
										: `${(c.varianceValue ?? 0) < 0 ? "Missing" : "Extra"} worth ${naira(Math.abs(c.varianceValue ?? 0))}`}
								</span>
							)}
							{c.status === "OPEN" && (
								<span className="text-[13px] text-info">Tap to count</span>
							)}
						</button>
					))}
				</div>
			)}
			<SectionCard title="All counts" flush>
				<table className="w-full text-left text-[13px]">
					<thead>
						<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="px-5 py-2">Store</th>
							<th className="py-2">Started</th>
							<th className="py-2">By</th>
							<th className="py-2 text-right">Difference</th>
							<th className="px-5 py-2 text-right">Status</th>
						</tr>
					</thead>
					<tbody>
						{counts.length === 0 && (
							<tr>
								<td colSpan={5} className="px-5 py-6 text-center text-ink-3">
									No counts yet
								</td>
							</tr>
						)}
						{counts.map((c) => (
							<tr
								key={c.id}
								className="cursor-pointer border-b border-line last:border-b-0 hover:bg-subtle/50"
								onClick={() => void setOpenId(c.id)}
							>
								<td className="px-5 py-3 font-semibold text-ink">
									{c.storeName}
								</td>
								<td className="py-3 text-ink-2">{fmtWhen(c.startedAt)}</td>
								<td className="py-3">{c.startedBy}</td>
								<td
									className={cn(
										"py-3 text-right font-semibold",
										c.varianceValue === undefined
											? "text-ink-3"
											: c.varianceValue === 0
												? "text-success"
												: c.varianceValue < 0
													? "text-danger"
													: "text-warning",
									)}
								>
									{c.varianceValue === undefined
										? "—"
										: c.varianceValue === 0
											? "matched"
											: naira(c.varianceValue)}
								</td>
								<td className="px-5 py-3 text-right">
									<StatusPill tone={tone[c.status].tone}>
										{tone[c.status].label}
									</StatusPill>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</SectionCard>

			<Modal
				open={isNew === "1"}
				onOpenChange={(o) => !o && void setIsNew(null)}
				title="Start a stock count"
				subtitle="One count per store at a time"
				icon={ClipboardCheckIcon}
				size="confirm"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => void setIsNew(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={!storeId || pending}
							onClick={() =>
								void run(
									() => startCount(storeId),
									"Count started · enter what you find",
									(c) => {
										void setIsNew(null);
										void setOpenId(c.id);
									},
								)
							}
						>
							Start
						</button>
					</>
				}
			>
				<SelectField
					label="Store"
					value={storeId}
					onChange={setStoreId}
					options={stores.map((s) => ({
						value: s.id,
						label: s.name,
						hint: busyStores.has(s.id)
							? "a count is already open"
							: plural(s.items, "item"),
					}))}
				/>
			</Modal>

			<SidePanel
				open={!!count}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={
					count
						? `${count.storeName} · ${count.status === "OPEN" ? "count sheet" : "results"}`
						: ""
				}
				subtitle={
					count
						? `Started by ${count.startedBy} · ${fmtWhen(count.startedAt)}${count.countedBy ? ` · counted by ${count.countedBy}` : ""}`
						: undefined
				}
				icon={ClipboardCheckIcon}
				width="lg"
				footer={
					count && (
						<>
							{editable && (
								<button
									type="button"
									className={btn.dangerSoft}
									onClick={() => {
										setReason("");
										setCancelling(true);
									}}
								>
									Cancel count
								</button>
							)}
							{editable && (
								<button
									type="button"
									className={
										count.status === "COUNTED" ? btn.secondary : btn.primary
									}
									disabled={
										filled < sheetItems.length ||
										sheetItems.length === 0 ||
										pending
									}
									onClick={() =>
										void run(
											() =>
												submitCount({
													id: count.id,
													lines: sheetItems.map((i) => ({
														itemId: i.id,
														quantity: Number(sheet[i.id]),
													})),
													note,
												}),
											"Count submitted · a manager approves the difference",
										)
									}
								>
									{count.status === "COUNTED"
										? "Submit again"
										: `Submit count (${filled}/${sheetItems.length})`}
								</button>
							)}
							{count.status === "COUNTED" &&
								(perms.manager ? (
									<button
										type="button"
										className={btn.primary}
										disabled={pending}
										onClick={() =>
											void run(
												() => approveCount(count.id),
												"Count approved · levels corrected",
												() => void setOpenId(null),
											)
										}
									>
										<CheckCircle2Icon className="mr-1 inline size-4" /> Approve
									</button>
								) : (
									<span className="flex items-center gap-2 text-xs text-ink-3">
										<ManagerMark /> Waiting on a manager
									</span>
								))}
						</>
					)
				}
				footerInfo={
					count && count.status === "OPEN" ? (
						variance !== 0 ? (
							<span className={variance < 0 ? "text-danger" : "text-success"}>
								{variance < 0 ? "Missing" : "Extra"} worth{" "}
								{naira(Math.abs(variance))} so far
							</span>
						) : (
							"Type what you count · leave nothing blank"
						)
					) : undefined
				}
			>
				{count && editable && (
					<PanelSection
						title={`${plural(sheetItems.length, "item")} in ${count.storeName}`}
					>
						<table className="w-full text-left text-[13px]">
							<thead>
								<tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									<th className="py-2">Item</th>
									<th className="py-2 text-right">System</th>
									<th className="py-2 text-right">Counted</th>
									<th className="py-2 text-right">Diff</th>
								</tr>
							</thead>
							<tbody>
								{sheetItems.map((i) => {
									const v = sheet[i.id] ?? "";
									const diff = v === "" ? null : Number(v) - i.quantity;
									return (
										<tr
											key={i.id}
											className="border-b border-line last:border-b-0"
										>
											<td className="py-2 font-medium text-ink">{i.name}</td>
											<td className="py-2 text-right text-ink-2">
												{q(i.quantity)} {i.unit}
											</td>
											<td className="py-2 text-right">
												<input
													type="number"
													min={0}
													aria-label={`Counted ${i.name}`}
													value={v}
													onChange={(e) =>
														setSheet((s) => ({ ...s, [i.id]: e.target.value }))
													}
													className={cn(input, "w-20 py-1 text-right")}
												/>
											</td>
											<td
												className={cn(
													"py-2 text-right font-semibold",
													diff === null
														? "text-ink-3"
														: diff === 0
															? "text-success"
															: diff < 0
																? "text-danger"
																: "text-warning",
												)}
											>
												{diff === null
													? "—"
													: diff === 0
														? "✓"
														: diff > 0
															? `+${q(diff)}`
															: q(diff)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
						<TextareaField
							label="Note"
							value={note}
							onChange={setNote}
							rows={2}
							placeholder="Broken bottles, items in transit…"
						/>
					</PanelSection>
				)}
				{count && count.status !== "OPEN" && count.lines && (
					<div className="mt-5 flex flex-col gap-5">
						{(count.varianceValue ?? 0) === 0 ? (
							<Note tone="success">Everything matched the system.</Note>
						) : (
							<Note
								tone={(count.varianceValue ?? 0) < 0 ? "danger" : "warning"}
							>
								{count.lines.filter((l) => l.counted !== l.expected).length}{" "}
								lines differ ·{" "}
								{(count.varianceValue ?? 0) < 0 ? "missing" : "extra"} worth{" "}
								{naira(Math.abs(count.varianceValue ?? 0))}.
							</Note>
						)}
						{count.cancelReason && (
							<Note tone="danger">Cancelled: {count.cancelReason}</Note>
						)}
						{count.note && <Note tone="info">{count.note}</Note>}
						<PanelSection title="Lines with a difference">
							<table className="w-full text-left text-[13px]">
								<thead>
									<tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
										<th className="py-2">Item</th>
										<th className="py-2 text-right">System</th>
										<th className="py-2 text-right">Counted</th>
										<th className="py-2 text-right">Diff</th>
										<th className="py-2 text-right">Value</th>
									</tr>
								</thead>
								<tbody>
									{count.lines
										.filter((l) => l.counted !== l.expected)
										.map((l) => (
											<tr
												key={l.itemId ?? l.name}
												className="border-b border-line last:border-b-0"
											>
												<td className="py-2 font-medium text-ink">{l.name}</td>
												<td className="py-2 text-right text-ink-2">
													{q(l.expected)}
												</td>
												<td className="py-2 text-right">{q(l.counted)}</td>
												<td
													className={cn(
														"py-2 text-right font-semibold",
														l.counted < l.expected
															? "text-danger"
															: "text-warning",
													)}
												>
													{q(l.counted - l.expected)}
												</td>
												<td className="py-2 text-right">
													{naira(l.value ?? 0)}
												</td>
											</tr>
										))}
								</tbody>
							</table>
						</PanelSection>
						<TotalsList
							rows={[
								{
									label: "Difference at cost",
									value: naira(count.varianceValue ?? 0),
									tone: (count.varianceValue ?? 0) < 0 ? "danger" : undefined,
								},
								{
									label: "Status",
									value: `${tone[count.status].label}${count.approvedBy ? ` by ${count.approvedBy}` : ""}`,
									strong: true,
								},
							]}
						/>
					</div>
				)}
			</SidePanel>

			<ConfirmModal
				open={cancelling}
				onOpenChange={setCancelling}
				title="Cancel this count?"
				subtitle="Nothing changes in the store; you can start a new count"
				tone="danger"
				confirmLabel="Cancel count"
				pending={pending}
				confirmDisabled={!reason.trim()}
				onConfirm={() =>
					count &&
					void run(
						() => cancelCount({ id: count.id, reason }),
						"Count cancelled",
						() => {
							setCancelling(false);
							void setOpenId(null);
						},
					)
				}
			>
				<TextareaField
					label="Reason"
					value={reason}
					onChange={setReason}
					rows={2}
					placeholder="e.g. Started the wrong store"
				/>
			</ConfirmModal>
		</>
	);
}
