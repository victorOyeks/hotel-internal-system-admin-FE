"use client";

import {
	AlertTriangleIcon,
	PackageIcon,
	SendIcon,
	TrashIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	SelectField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { fmtWhen, naira, nairaShort, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { askTheStore, useOrWasteStock } from "@hospio/api/actions/fnb";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	StockItemRow,
	StockRequestRow,
	TeamRequests,
} from "@hospio/api/data/types";
import { BigButton, ShiftPill, Stepper } from "./tablet";

export type RequestLine = { item: StockItemRow; qty: number };

/**
 * A department's own store (Kitchen store 3251:12915, Bar stock 3264:12805): what is on the shelf,
 * what is running low, "Ask the store" to request more from the main store, and "Use or waste".
 * `extraActions` lets the Bar add breakage / count / close shift to the header.
 */
export function StoreScreen({
	items,
	requests,
	team,
	storeId,
	title,
	subtitle,
	extraActions,
	children,
	catalogue = [],
}: {
	items: StockItemRow[];
	/** The team's latest requests (with the counts of all of them) and today's, from inventory-service. */
	requests?: TeamRequests;
	team: "KITCHEN" | "BAR" | "HOUSEKEEPING" | "LAUNDRY" | "MAINTENANCE";
	/** Items the hotel stocks elsewhere that the team may ask for even when its own shelf has none yet. */
	catalogue?: StockItemRow[];
	storeId?: string;
	title: string;
	subtitle: string;
	extraActions?: React.ReactNode;
	children?: React.ReactNode;
}) {
	const [rows, setRows] = useState(items);
	useEffect(() => setRows(items), [items]);
	const [q, setQ] = useState("");
	const [asking, setAsking] = useState(false);
	const [lines, setLines] = useState<RequestLine[]>([]);
	const [note, setNote] = useState("");
	const [using, setUsing] = useState<StockItemRow | null>(null);
	const [useQty, setUseQty] = useState(1);
	const [useKind, setUseKind] = useState<"USE" | "WASTE">("USE");
	const [wasteReason, setWasteReason] = useState("Expired");
	const { run, pending } = useAction();
	const todays = requests?.today ?? [];
	const waiting = requests?.latest.counts?.REQUESTED ?? 0;

	const low = rows.filter((i) => i.quantity <= i.minLevel);
	const value = rows.reduce((s, i) => s + i.quantity * i.unitCost, 0);
	const addLine = (item: StockItemRow) =>
		setLines((ls) =>
			ls.some((l) => l.item.id === item.id)
				? ls
				: [...ls, { item, qty: Math.max(1, item.minLevel - item.quantity) }],
		);
	const openAsk = (prefill?: StockItemRow[]) => {
		setLines(
			(prefill ?? low).map((item) => ({
				item,
				qty: Math.max(1, item.minLevel * 2 - item.quantity),
			})),
		);
		setAsking(true);
	};

	return (
		<>
			<PageHeader title={title} subtitle={subtitle}>
				<ShiftPill />
				{extraActions}
				<BigButton onClick={() => openAsk()}>
					<SendIcon className="size-5" /> Ask the store
				</BigButton>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Items on the shelf"
					value={rows.length}
					icon={PackageIcon}
				/>
				<KpiCard
					label="Running low"
					value={low.length}
					icon={AlertTriangleIcon}
					hint={
						low.length
							? low
									.map((i) => i.name.split(" ·")[0])
									.slice(0, 2)
									.join(", ")
							: "Everything above minimum"
					}
				/>
				<KpiCard
					label="Stock value"
					value={nairaShort(value)}
					icon={PackageIcon}
				/>
				<KpiCard
					label="Requests today"
					value={todays.length}
					icon={SendIcon}
					hint={
						waiting
							? `${plural(waiting, "request")} waiting for the store`
							: todays.some((r) => r.status === "PART_ISSUED")
								? "Some part-issued by the store"
								: "None waiting"
					}
				/>
			</div>
			{!storeId && (
				<Note tone="warning">
					{team === "KITCHEN" || team === "BAR"
						? "This outlet is not linked to a store yet, so there is no stock to show or draw from. The manager links one in Hotel setup → Restaurants & tables."
						: `There is no ${team.charAt(0) + team.slice(1).toLowerCase()} store yet, so issued stock has nowhere to go. The storekeeper adds one in Inventory → Stores.`}
				</Note>
			)}
			{low.length > 0 && (
				<div className="flex items-center gap-3 rounded-card border border-[#dbab00]/40 bg-warning-soft px-5 py-4">
					<AlertTriangleIcon className="size-5 shrink-0 text-warning" />
					<div className="flex-1 text-[15px]">
						<p className="font-semibold text-ink">Running low</p>
						<p className="text-ink-2">
							{low
								.map(
									(i) =>
										`${i.name} · ${i.quantity} ${i.unit} left (min ${i.minLevel})`,
								)
								.join(" · ")}
						</p>
					</div>
					<BigButton tone="secondary" onClick={() => openAsk(low)}>
						Request these
					</BigButton>
				</div>
			)}
			{requests && <MyRequests requests={requests} />}
			{children}
			<Toolbar
				left={
					<SearchBox value={q} onChange={setQ} placeholder="Search stock…" />
				}
			/>
			<DataTable
				data={rows}
				search={q}
				pageSize={15}
				onRowClick={(i) => {
					setUsing(i);
					setUseQty(1);
					setUseKind("USE");
				}}
				columns={[
					{
						accessorKey: "name",
						header: "Item",
						cell: ({ row }) => (
							<TwoLine
								primary={row.original.name}
								secondary={row.original.category}
							/>
						),
					},
					{
						accessorKey: "quantity",
						header: "On the shelf",
						cell: ({ row }) => (
							<div className="flex min-w-[160px] flex-col gap-1">
								<span className="text-[15px] font-semibold">
									{row.original.quantity} {row.original.unit}
								</span>
								<ProgressBar
									value={row.original.quantity}
									max={Math.max(row.original.minLevel * 2, 1)}
									tone={
										row.original.quantity <= row.original.minLevel * 0.4
											? "danger"
											: row.original.quantity <= row.original.minLevel
												? "warning"
												: undefined
									}
								/>
							</div>
						),
					},
					{
						accessorKey: "minLevel",
						header: "Minimum",
						cell: ({ row }) => `${row.original.minLevel} ${row.original.unit}`,
					},
					{
						accessorKey: "unitCost",
						header: "Unit cost",
						cell: ({ row }) => naira(row.original.unitCost),
					},
					{
						id: "status",
						header: "Status",
						cell: ({ row }) => (
							<StatusPill
								tone={
									row.original.quantity <= row.original.minLevel * 0.4
										? "danger"
										: row.original.quantity <= row.original.minLevel
											? "warning"
											: "success"
								}
							>
								{row.original.quantity <= row.original.minLevel * 0.4
									? "Critical"
									: row.original.quantity <= row.original.minLevel
										? "Low"
										: "OK"}
							</StatusPill>
						),
					},
					{
						id: "ask",
						header: "",
						cell: ({ row }) => (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									openAsk([row.original]);
								}}
								className="text-[13px] font-semibold text-brand hover:underline"
							>
								Ask for more
							</button>
						),
					},
				]}
			/>

			<SidePanel
				open={asking}
				onOpenChange={setAsking}
				title="Ask the store"
				subtitle="A request to the main store · they issue what they have"
				icon={SendIcon}
				footerInfo={`${plural(lines.length, "line")}`}
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setAsking(false)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={lines.length === 0}
							onClick={() =>
								run(
									() =>
										askTheStore({
											fromTeam: team,
											storeId,
											lines: lines.map((l) => ({
												itemId: l.item.id,
												name: l.item.name,
												quantity: l.qty,
											})),
											note,
										}),
									"Request sent to the main store",
									() => {
										setAsking(false);
										setNote("");
									},
								)
							}
						>
							Send request
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-5">
					<PanelSection title="Items">
						{lines.length === 0 ? (
							<Note tone="info">Add items below.</Note>
						) : (
							<ul className="divide-y divide-line rounded-control border border-line">
								{lines.map((l) => (
									<li
										key={l.item.id}
										className="flex items-center gap-3 px-4 py-3"
									>
										<span className="min-w-0 flex-1">
											<span className="block text-[15px] font-semibold text-ink">
												{l.item.name}
											</span>
											<span className="block text-xs text-ink-3">
												{l.item.quantity} {l.item.unit} on the shelf · min{" "}
												{l.item.minLevel}
											</span>
										</span>
										<Stepper
											value={l.qty}
											onChange={(v) =>
												setLines((ls) =>
													v <= 0
														? ls.filter((x) => x.item.id !== l.item.id)
														: ls.map((x) =>
																x.item.id === l.item.id ? { ...x, qty: v } : x,
															),
												)
											}
										/>
										<span className="w-12 text-xs text-ink-3">
											{l.item.unit}
										</span>
									</li>
								))}
							</ul>
						)}
						<SelectField
							label="Add an item"
							value=""
							onChange={(id) => {
								const it =
									rows.find((r) => r.id === id) ??
									catalogue.find((r) => r.id === id);
								if (it)
									addLine(
										rows.some((r) => r.id === it.id)
											? it
											: { ...it, quantity: 0, storeId: storeId ?? it.storeId },
									);
							}}
							options={[
								...rows,
								...catalogue.filter(
									(c, i, all) =>
										!rows.some((r) => r.id === c.id) &&
										all.findIndex((x) => x.id === c.id) === i,
								),
							]
								.filter((r) => !lines.some((l) => l.item.id === r.id))
								.map((r) => ({ value: r.id, label: r.name, hint: r.category }))}
							placeholder="Pick from your stock list"
						/>
					</PanelSection>
					<TextareaField
						label="Note for the store"
						value={note}
						onChange={setNote}
						placeholder="e.g. needed before dinner service"
						rows={2}
					/>
					<WhatHappens
						items={[
							"The main store sees it on their Requests tab",
							"They issue what they have and you get an alert",
							"Anything they can't issue goes on a purchase order",
						]}
					/>
				</div>
			</SidePanel>

			<Modal
				open={!!using}
				onOpenChange={(o) => !o && setUsing(null)}
				title={using?.name ?? ""}
				subtitle={
					using ? `${using.quantity} ${using.unit} on the shelf` : undefined
				}
				icon={useKind === "WASTE" ? TrashIcon : PackageIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setUsing(null)}>
							Cancel
						</BigButton>
						<BigButton
							tone={useKind === "WASTE" ? "danger" : "primary"}
							pending={pending}
							disabled={!storeId}
							onClick={() =>
								using &&
								storeId &&
								run(
									() =>
										useOrWasteStock({
											itemId: using.id,
											storeId,
											quantity: useQty,
											waste: useKind === "WASTE",
											note:
												useKind === "WASTE" ? wasteReason : "Used in service",
										}),
									useKind === "WASTE"
										? `${useQty} ${using.unit} written off · manager told`
										: `${useQty} ${using.unit} used`,
									(r) => {
										setRows((all) =>
											all.map((i) =>
												i.id === using.id
													? {
															...i,
															quantity:
																r.quantity >= 0
																	? r.quantity
																	: Math.max(0, i.quantity - useQty),
														}
													: i,
											),
										);
										setUsing(null);
									},
								)
							}
						>
							{useKind === "WASTE" ? "Write off" : "Record use"}
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<ChoiceCards
						value={useKind}
						onChange={setUseKind}
						columns={2}
						options={[
							{ value: "USE", label: "Used", hint: "Went into service" },
							{
								value: "WASTE",
								label: "Wasted",
								hint: "Expired, spoiled, broken",
							},
						]}
					/>
					<div className="flex items-center justify-between rounded-control border border-line px-4 py-3">
						<span className="text-[15px] font-medium text-ink">
							Quantity ({using?.unit})
						</span>
						<Stepper
							value={useQty}
							onChange={setUseQty}
							min={1}
							max={using?.quantity ?? 1}
						/>
					</div>
					{useKind === "WASTE" && (
						<SelectField
							label="Reason"
							value={wasteReason}
							onChange={setWasteReason}
							options={["Expired", "Spoiled", "Broken", "Spilled", "Other"]}
							setupLink="reasons"
						/>
					)}
					{useKind === "WASTE" && (
						<WhatHappens
							tone="warning"
							items={[
								`${naira((using?.unitCost ?? 0) * useQty)} of stock is written off`,
								"The manager is told and it shows on the stock movement report",
							]}
						/>
					)}
				</div>
			</Modal>
		</>
	);
}

const REQUEST_TONE: Record<
	StockRequestRow["status"],
	{ label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }
> = {
	REQUESTED: { label: "Waiting", tone: "warning" },
	ISSUED: { label: "Issued", tone: "success" },
	PART_ISSUED: { label: "Part issued", tone: "info" },
	DECLINED: { label: "Declined", tone: "danger" },
	CLOSED: { label: "Closed short", tone: "grey" },
};

/** The team's latest requests to the store (the 10 newest) with what was issued, or why the store declined. */
function MyRequests({ requests: { latest } }: { requests: TeamRequests }) {
	const requests = latest.content;
	if (requests.length === 0) return null;
	return (
		<details className="rounded-card border border-line bg-card px-5 py-3">
			<summary className="cursor-pointer text-[15px] font-semibold text-ink">
				Your requests to the store · {latest.total}
				{latest.total > requests.length && (
					<span className="font-normal text-ink-3">
						{" "}
						(the latest {requests.length})
					</span>
				)}
			</summary>
			<ul className="mt-2 divide-y divide-line text-[13px]">
				{requests.slice(0, 10).map((r) => (
					<li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
						<span className="text-ink-3">{fmtWhen(r.createdAt)}</span>
						<span className="flex-1 text-ink">
							{r.lines
								.map(
									(l) =>
										`${l.quantity} ${l.unit} ${l.name}${l.issued ? ` (${l.issued} issued)` : ""}`,
								)
								.join(", ")}
						</span>
						<StatusPill tone={REQUEST_TONE[r.status].tone}>
							{REQUEST_TONE[r.status].label}
						</StatusPill>
						{r.reason && (
							<span className="w-full text-xs text-danger">
								Store said: {r.reason}
							</span>
						)}
					</li>
				))}
			</ul>
		</details>
	);
}
