"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	ArrowDownToLineIcon,
	ArrowUpFromLineIcon,
	BeakerIcon,
	LockIcon,
	ShirtIcon,
	TrashIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { useOrWasteStock } from "@hospio/api/actions/fnb";
import {
	closeLinenBatch,
	receiveLinen,
	returnLinen,
} from "@hospio/api/actions/laundry";
import { useAction } from "@hospio/api/actions/use-action";
import type { LinenBatchRow, StockItemRow } from "@hospio/api/data/types";
import { BigButton, Stepper } from "../shared-staff/tablet";

export const BATCH_STATUS: Record<
	LinenBatchRow["status"],
	{ label: string; tone: "warning" | "info" | "success" | "grey" | "danger" }
> = {
	SENT: { label: "On its way", tone: "warning" },
	RECEIVED: { label: "At the laundry", tone: "info" },
	PART_RETURNED: { label: "Part returned", tone: "info" },
	RETURNED: { label: "Returned", tone: "success" },
	CLOSED: { label: "Closed short", tone: "grey" },
};
const openBatch = (b: LinenBatchRow) =>
	b.status === "SENT" ||
	b.status === "RECEIVED" ||
	b.status === "PART_RETURNED";

export function batchColumns(): ColumnDef<LinenBatchRow, unknown>[] {
	return [
		{
			id: "n",
			header: "Batch",
			cell: ({ row: { original: b } }) => (
				<TwoLine
					primary={b.number}
					secondary={`${b.sentByName ?? "Housekeeping"} · ${fmtWhen(b.createdAt)}`}
				/>
			),
		},
		{
			id: "lines",
			header: "Linen",
			cell: ({ row: { original: b } }) =>
				b.lines.map((l) => `${l.sent} ${l.name}`).join(", "),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row: { original: b } }) => (
				<StatusPill tone={BATCH_STATUS[b.status].tone}>
					{BATCH_STATUS[b.status].label}
				</StatusPill>
			),
		},
		{
			id: "short",
			header: "Short / condemned",
			cell: ({ row: { original: b } }) => {
				const condemned = b.lines.reduce((s, l) => s + l.condemned, 0);
				const lost = b.lines.reduce((s, l) => s + l.lost, 0);
				return lost || condemned ? (
					<span className="text-[13px] text-danger">
						{lost ? `${lost} missing/lost` : ""}
						{lost && condemned ? " · " : ""}
						{condemned ? `${condemned} condemned` : ""}
					</span>
				) : (
					<span className="text-ink-3">—</span>
				);
			},
		},
		{
			id: "out",
			header: "Still at laundry",
			cell: ({ row: { original: b } }) => b.outstanding || "—",
		},
	];
}

/** One batch's lines: sent, received, back, condemned, lost and what is still at the laundry, plus its value written off. */
export function BatchDetail({ b }: { b: LinenBatchRow }) {
	return (
		<div className="flex flex-col gap-5">
			{b.missing > 0 && (
				<Note tone="danger">
					{b.missing} pieces didn't arrive at the laundry · written off as
					missing.
				</Note>
			)}
			{b.closedReason && (
				<Note tone="info">Closed short: {b.closedReason}</Note>
			)}
			<DetailList
				columns={2}
				items={[
					{
						label: "Status",
						value: (
							<StatusPill tone={BATCH_STATUS[b.status].tone}>
								{BATCH_STATUS[b.status].label}
							</StatusPill>
						),
					},
					{
						label: "Sent by",
						value: `${b.sentByName ?? "—"} · ${fmtWhen(b.createdAt)}`,
					},
					{
						label: "Received",
						value: b.receivedAt
							? `${b.receivedByName ?? ""} · ${fmtWhen(b.receivedAt)}`
							: "Not yet",
					},
					{
						label: "Written off",
						value: naira(b.condemnedValue + b.lostValue),
					},
				]}
			/>
			<table className="w-full text-left text-[13px]">
				<thead>
					<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						<th className="px-3 py-2">Linen</th>
						<th className="py-2">Sent</th>
						<th className="py-2">Arrived</th>
						<th className="py-2">Back</th>
						<th className="py-2">Condemned</th>
						<th className="py-2">Lost</th>
						<th className="py-2 pr-3">At laundry</th>
					</tr>
				</thead>
				<tbody>
					{b.lines.map((l) => (
						<tr key={l.itemId} className="border-b border-line last:border-b-0">
							<td className="px-3 py-2 font-semibold text-ink">{l.name}</td>
							<td className="py-2">{l.sent}</td>
							<td className="py-2">{l.received ?? "—"}</td>
							<td className="py-2">{l.returned}</td>
							<td className="py-2">{l.condemned || "—"}</td>
							<td className="py-2">{l.lost || "—"}</td>
							<td className="py-2 pr-3 font-semibold">{l.outstanding}</td>
						</tr>
					))}
				</tbody>
			</table>
			{b.note && (
				<p className="rounded-control bg-subtle px-4 py-3 text-[13px] text-ink">
					{b.note}
				</p>
			)}
		</div>
	);
}

type Sub = "receive" | "return" | "close" | "chem" | null;

/**
 * Laundry · Linen in & out (3244:13987): soiled batches from housekeeping are counted in (what didn't arrive is written
 * off as missing), returned clean, condemned linen written off, a batch closed short; chemicals used from the Laundry store.
 */
export function LaundryLinenScreen({
	batches: b0,
	storeItems,
	storeId,
	canClose,
}: {
	batches: LinenBatchRow[];
	storeItems: StockItemRow[];
	storeId?: string;
	canClose: boolean;
}) {
	const [batches, setBatches] = useState(b0);
	useEffect(() => setBatches(b0), [b0]);
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [sub, setSub] = useState<Sub>(null);
	const current = batches.find((b) => b.id === openId) ?? null;
	const patch = (b: LinenBatchRow) =>
		setBatches((bs) => bs.map((x) => (x.id === b.id ? b : x)));
	const done = (b: LinenBatchRow) => {
		patch(b);
		setSub(null);
	};
	const incoming = batches.filter((b) => b.status === "SENT");
	const atLaundry = batches.filter(
		(b) => b.status === "RECEIVED" || b.status === "PART_RETURNED",
	);
	const list = tab === "all" ? batches : batches.filter(openBatch);
	const linenHere = storeItems.filter(
		(i) => i.category.toLowerCase() === "linen",
	);
	const chemicals = storeItems.filter(
		(i) => i.category.toLowerCase() !== "linen",
	);
	const writtenOff = batches.reduce(
		(s, b) => s + b.condemnedValue + b.lostValue,
		0,
	);

	return (
		<>
			<PageHeader
				title="Linen in & out"
				subtitle="Hotel linen from housekeeping: count it in, send it back clean, write off what can't be used"
			>
				<BigButton
					tone="secondary"
					onClick={() => setSub("chem")}
					disabled={!storeId}
				>
					<BeakerIcon className="size-5" /> Chemicals used
				</BigButton>
			</PageHeader>
			{!storeId && (
				<Note tone="warning">
					There is no Laundry store yet, so linen can't be counted in. The
					storekeeper adds one in Inventory → Stores.
				</Note>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Batches on their way"
					value={incoming.length}
					icon={ArrowDownToLineIcon}
					hint={`${incoming.reduce((s, b) => s + b.sent, 0)} pieces`}
				/>
				<KpiCard
					label="Linen at the laundry"
					value={atLaundry.reduce((s, b) => s + b.outstanding, 0)}
					icon={ShirtIcon}
					hint={plural(atLaundry.length, "batch", "batches")}
				/>
				<KpiCard
					label="Written off"
					value={naira(writtenOff)}
					icon={TrashIcon}
					hint="Condemned, missing and lost"
				/>
				<KpiCard
					label="Chemicals low"
					value={chemicals.filter((c) => c.quantity <= c.minLevel).length}
					icon={BeakerIcon}
					hint={
						chemicals
							.filter((c) => c.quantity <= c.minLevel)
							.map((c) => c.name)
							.join(", ") || "All above minimum"
					}
				/>
			</div>
			<PillTabs
				tabs={[
					{
						key: "open",
						label: "Open batches",
						count: batches.filter(openBatch).length,
					},
					{ key: "all", label: "All batches", count: batches.length },
				]}
				value={tab === "all" ? "all" : "open"}
				onChange={(k) => void setTab(k === "open" ? null : k)}
			/>
			<DataTable
				columns={batchColumns()}
				data={list}
				onRowClick={(b) => void setOpenId(b.id)}
				emptyTitle="No linen batches"
				emptyHint="Housekeeping sends soiled linen from their Linen screen"
			/>
			<SectionCard
				title="Laundry store"
				subtitle="Linen here and the chemicals the laundry uses"
				flush
			>
				<table className="w-full text-left">
					<thead>
						<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="px-5 py-3">Item</th>
							<th className="py-3">Kind</th>
							<th className="py-3">Here</th>
							<th className="py-3 pr-5">Minimum</th>
						</tr>
					</thead>
					<tbody>
						{[...linenHere, ...chemicals].map((i) => (
							<tr key={i.id} className="border-b border-line last:border-b-0">
								<td className="px-5 py-3 text-[15px] font-semibold text-ink">
									{i.name}
								</td>
								<td className="py-3 text-[13px] text-ink-2">{i.category}</td>
								<td
									className={
										i.quantity <= i.minLevel &&
										i.category.toLowerCase() !== "linen"
											? "py-3 text-[15px] font-semibold text-warning"
											: "py-3 text-[15px]"
									}
								>
									{i.quantity} {i.unit}
								</td>
								<td className="py-3 pr-5 text-[13px] text-ink-3">
									{i.category.toLowerCase() === "linen"
										? "—"
										: `${i.minLevel} ${i.unit}`}
								</td>
							</tr>
						))}
						{storeItems.length === 0 && (
							<tr>
								<td
									colSpan={4}
									className="px-5 py-6 text-center text-[13px] text-ink-3"
								>
									Nothing in the Laundry store yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</SectionCard>

			<SidePanel
				open={!!current && sub === null}
				onOpenChange={(o) => {
					if (!o) void setOpenId(null);
				}}
				title={current ? `${current.number} · ${current.sent} pieces` : ""}
				subtitle={current ? BATCH_STATUS[current.status].label : undefined}
				icon={ShirtIcon}
				width="lg"
				footer={
					current &&
					(current.status === "SENT" ? (
						<BigButton onClick={() => setSub("receive")} disabled={!storeId}>
							<ArrowDownToLineIcon className="size-5" /> Count it in
						</BigButton>
					) : openBatch(current) ? (
						<>
							{canClose && (
								<BigButton tone="ghost" onClick={() => setSub("close")}>
									<LockIcon className="size-5" /> Close short
								</BigButton>
							)}
							<BigButton onClick={() => setSub("return")}>
								<ArrowUpFromLineIcon className="size-5" /> Send back clean
							</BigButton>
						</>
					) : (
						<BigButton tone="secondary" onClick={() => void setOpenId(null)}>
							Close
						</BigButton>
					))
				}
			>
				{current && <BatchDetail b={current} />}
			</SidePanel>

			{current && (
				<>
					<ReceiveModal
						open={sub === "receive"}
						b={current}
						onClose={() => setSub(null)}
						onDone={done}
					/>
					<ReturnModal
						open={sub === "return"}
						b={current}
						onClose={() => setSub(null)}
						onDone={done}
					/>
					<CloseModal
						open={sub === "close"}
						b={current}
						onClose={() => setSub(null)}
						onDone={done}
					/>
				</>
			)}
			<ChemicalsModal
				open={sub === "chem"}
				items={chemicals}
				storeId={storeId}
				onClose={() => setSub(null)}
			/>
		</>
	);
}

function ReceiveModal({
	open,
	b,
	onClose,
	onDone,
}: {
	open: boolean;
	b: LinenBatchRow;
	onClose: () => void;
	onDone: (b: LinenBatchRow) => void;
}) {
	const [counts, setCounts] = useState<Record<string, number>>({});
	const { run, pending } = useAction();
	useEffect(() => {
		if (open)
			setCounts(Object.fromEntries(b.lines.map((l) => [l.itemId, l.sent])));
	}, [open, b.lines]);
	const short = b.lines.reduce(
		(s, l) => s + Math.max(0, l.sent - (counts[l.itemId] ?? l.sent)),
		0,
	);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`Count ${b.number} in`}
			subtitle="Count what actually arrived from housekeeping"
			icon={ArrowDownToLineIcon}
			footerInfo={short ? `${short} short` : "Matches what was sent"}
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						pending={pending}
						onClick={() =>
							run(
								() =>
									receiveLinen(
										b.id,
										b.lines.map((l) => ({
											itemId: l.itemId,
											quantity: counts[l.itemId] ?? l.sent,
										})),
									),
								short
									? `${b.number} counted in · ${short} missing, housekeeping told`
									: `${b.number} counted in`,
								onDone,
							)
						}
					>
						Count in
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ul className="divide-y divide-line rounded-control border border-line">
					{b.lines.map((l) => (
						<li key={l.itemId} className="flex items-center gap-3 px-4 py-2">
							<span className="min-w-0 flex-1">
								<span className="block text-[15px] font-medium text-ink">
									{l.name}
								</span>
								<span className="block text-xs text-ink-3">{l.sent} sent</span>
							</span>
							<Stepper
								value={counts[l.itemId] ?? l.sent}
								max={l.sent}
								onChange={(v) => setCounts({ ...counts, [l.itemId]: v })}
							/>
						</li>
					))}
				</ul>
				{short > 0 && (
					<Note tone="warning">
						{short} pieces short: they are written off as missing and
						housekeeping and the manager are told.
					</Note>
				)}
			</div>
		</Modal>
	);
}

function ReturnModal({
	open,
	b,
	onClose,
	onDone,
}: {
	open: boolean;
	b: LinenBatchRow;
	onClose: () => void;
	onDone: (b: LinenBatchRow) => void;
}) {
	const [back, setBack] = useState<Record<string, number>>({});
	const [condemned, setCondemned] = useState<Record<string, number>>({});
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) {
			setBack(
				Object.fromEntries(b.lines.map((l) => [l.itemId, l.outstanding])),
			);
			setCondemned({});
			setReason("");
		}
	}, [open, b.lines]);
	const over = b.lines.filter(
		(l) => (back[l.itemId] ?? 0) + (condemned[l.itemId] ?? 0) > l.outstanding,
	);
	const anyCondemned = Object.values(condemned).some((q) => q > 0);
	const total =
		Object.values(back).reduce((s, q) => s + q, 0) +
		Object.values(condemned).reduce((s, q) => s + q, 0);
	const value = b.lines.reduce(
		(s, l) => s + (condemned[l.itemId] ?? 0) * l.unitCost,
		0,
	);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`Send ${b.number} back`}
			subtitle="Clean linen to housekeeping · condemned linen written off"
			icon={ArrowUpFromLineIcon}
			size="large"
			footerInfo={anyCondemned ? `Condemned ${naira(value)}` : undefined}
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						pending={pending}
						disabled={
							total === 0 || over.length > 0 || (anyCondemned && !reason.trim())
						}
						onClick={() =>
							run(
								() =>
									returnLinen(
										b.id,
										b.lines
											.map((l) => ({
												itemId: l.itemId,
												returned: back[l.itemId] ?? 0,
												condemned: condemned[l.itemId] ?? 0,
											}))
											.filter((l) => l.returned + l.condemned > 0),
										reason,
									),
								(r) =>
									r.status === "RETURNED"
										? `${b.number} returned · housekeeping told`
										: `Part of ${b.number} returned · housekeeping told`,
								onDone,
							)
						}
					>
						Send back
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<table className="w-full text-left text-[13px]">
					<thead>
						<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="px-3 py-2">Linen</th>
							<th className="py-2">At laundry</th>
							<th className="py-2">Clean back</th>
							<th className="py-2 pr-3">Condemned</th>
						</tr>
					</thead>
					<tbody>
						{b.lines
							.filter((l) => l.outstanding > 0)
							.map((l) => (
								<tr
									key={l.itemId}
									className="border-b border-line last:border-b-0"
								>
									<td className="px-3 py-2 font-semibold text-ink">{l.name}</td>
									<td className="py-2">{l.outstanding}</td>
									<td className="py-2">
										<Stepper
											value={back[l.itemId] ?? 0}
											max={l.outstanding}
											onChange={(v) => setBack({ ...back, [l.itemId]: v })}
										/>
									</td>
									<td className="py-2 pr-3">
										<Stepper
											value={condemned[l.itemId] ?? 0}
											max={l.outstanding}
											onChange={(v) =>
												setCondemned({ ...condemned, [l.itemId]: v })
											}
										/>
									</td>
								</tr>
							))}
					</tbody>
				</table>
				{over.length > 0 && (
					<Note tone="danger">
						More than is at the laundry for {over.map((l) => l.name).join(", ")}
						.
					</Note>
				)}
				{anyCondemned && (
					<SelectField
						label="Why condemned"
						value={reason}
						onChange={setReason}
						options={[
							"Torn",
							"Bleach stains",
							"Burn",
							"Worn out",
							"Permanent stain",
						]}
						placeholder="Pick a reason"
					/>
				)}
				<WhatHappens
					items={[
						"Clean linen moves to the Housekeeping store",
						"Condemned linen comes off the stock at its cost",
						"Whatever is left stays here until it goes back or the batch is closed short",
					]}
				/>
			</div>
		</Modal>
	);
}

function CloseModal({
	open,
	b,
	onClose,
	onDone,
}: {
	open: boolean;
	b: LinenBatchRow;
	onClose: () => void;
	onDone: (b: LinenBatchRow) => void;
}) {
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) setReason("");
	}, [open]);
	const value = b.lines.reduce((s, l) => s + l.outstanding * l.unitCost, 0);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`Close ${b.number} short`}
			subtitle={`${b.outstanding} pieces never come back · about ${naira(value)} written off`}
			icon={LockIcon}
			tone="danger"
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						tone="danger"
						pending={pending}
						disabled={!reason.trim()}
						onClick={() =>
							run(
								() => closeLinenBatch(b.id, reason),
								`${b.number} closed · ${b.outstanding} written off as lost`,
								onDone,
							)
						}
					>
						Close short
					</BigButton>
				</>
			}
		>
			<TextareaField
				label="What happened to the rest"
				value={reason}
				onChange={setReason}
				rows={2}
				placeholder="e.g. Searched the laundry, not found"
			/>
		</Modal>
	);
}

function ChemicalsModal({
	open,
	items,
	storeId,
	onClose,
}: {
	open: boolean;
	items: StockItemRow[];
	storeId?: string;
	onClose: () => void;
}) {
	const [used, setUsed] = useState<Record<string, number>>({});
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) setUsed({});
	}, [open]);
	const lines = Object.entries(used).filter(([, q]) => q > 0);
	const over = lines.filter(
		([id, q]) => q > (items.find((i) => i.id === id)?.quantity ?? 0),
	);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Chemicals used"
			subtitle="Comes off the Laundry store at its cost"
			icon={BeakerIcon}
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Cancel
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!storeId || lines.length === 0 || over.length > 0}
						onClick={() =>
							run(
								async () => {
									for (const [itemId, quantity] of lines) {
										const r = await useOrWasteStock({
											itemId,
											storeId: storeId as string,
											quantity,
											waste: false,
											note: "Laundry chemicals",
										});
										if (!r.ok) return r;
									}
									return { ok: true as const, data: null };
								},
								"Chemicals recorded",
								onClose,
							)
						}
					>
						Record
					</BigButton>
				</>
			}
		>
			{items.length === 0 ? (
				<Note tone="info">
					No chemicals in the Laundry store yet · ask the store for some.
				</Note>
			) : (
				<div className="flex flex-col gap-3">
					<ul className="divide-y divide-line rounded-control border border-line">
						{items.map((i) => (
							<li key={i.id} className="flex items-center gap-3 px-4 py-2">
								<span className="min-w-0 flex-1">
									<span className="block text-[15px] font-medium text-ink">
										{i.name}
									</span>
									<span className="block text-xs text-ink-3">
										{i.quantity} {i.unit} in store
									</span>
								</span>
								<Stepper
									value={used[i.id] ?? 0}
									onChange={(v) => setUsed({ ...used, [i.id]: v })}
								/>
								<span className="w-12 text-xs text-ink-3">{i.unit}</span>
							</li>
						))}
					</ul>
					{over.length > 0 && (
						<Note tone="danger">More than the store holds.</Note>
					)}
				</div>
			)}
		</Modal>
	);
}
