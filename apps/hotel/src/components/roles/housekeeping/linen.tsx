"use client";

import { ShirtIcon, TrashIcon, TruckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { DataTable } from "@hospio/ui/shared/data-table";
import { Note } from "@hospio/ui/shared/detail-list";
import { TextareaField } from "@hospio/ui/shared/field";
import { naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { useListParams } from "@hospio/ui/shared/list-params";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ProgressBar } from "@hospio/ui/shared/progress-bar";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { sendLinen } from "@hospio/api/actions/laundry";
import { useAction } from "@hospio/api/actions/use-action";
import type { PageResult } from "@hospio/api/data/paging";
import type { LinenBatchRow, StockItemRow } from "@hospio/api/data/types";
import { BATCH_STATUS, BatchDetail, batchColumns } from "../laundry/linen";
import { BigButton, Stepper } from "../shared-staff/tablet";

type Linen = {
	id: string;
	name: string;
	unit: string;
	clean: number;
	atLaundry: number;
	par: number;
};

/**
 * Housekeeping · Linen: clean linen in the Housekeeping store, what is at the laundry, soiled batches sent with what
 * came back and what went missing or was condemned.
 */
export function LinenScreen({
	clean,
	atLaundry,
	batches: b0,
	all,
	hasStore,
}: {
	/** Linen items in the Housekeeping store. */
	clean: StockItemRow[];
	/** Linen items in the Laundry store. */
	atLaundry: StockItemRow[];
	/** The open batches (sent, received, part returned): bounded. */
	batches: LinenBatchRow[];
	/** "All batches": one page from housekeeping-service, with what was written off over every batch. */
	all: PageResult<LinenBatchRow>;
	hasStore: boolean;
}) {
	const [batches, setBatches] = useState(b0);
	useEffect(() => setBatches(b0), [b0]);
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [sending, setSending] = useState(false);
	const router = useRouter();
	const list$ = useListParams();
	const allPage = all.data;
	const byId = new Map<string, Linen>();
	for (const i of clean)
		byId.set(i.id, {
			id: i.id,
			name: i.name,
			unit: i.unit,
			clean: i.quantity,
			atLaundry: 0,
			par: i.parLevel || i.minLevel * 3,
		});
	for (const i of atLaundry) {
		const l = byId.get(i.id) ?? {
			id: i.id,
			name: i.name,
			unit: i.unit,
			clean: 0,
			atLaundry: 0,
			par: i.parLevel || i.minLevel * 3,
		};
		l.atLaundry += i.quantity;
		byId.set(i.id, l);
	}
	const linen = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
	const current =
		batches.find((b) => b.id === openId) ??
		allPage.content.find((b) => b.id === openId) ??
		null;
	const open = batches.filter(
		(b) =>
			b.status === "SENT" ||
			b.status === "RECEIVED" ||
			b.status === "PART_RETURNED",
	);
	const short = linen.filter((l) => l.par > 0 && l.clean < l.par * 0.5);
	// Over every batch, from the service (not only the open ones here).
	const lostValue = allPage.totals?.writtenOff ?? 0;

	return (
		<>
			<PageHeader
				title="Linen"
				subtitle="Clean linen on hand, soiled linen at the laundry, and what came back"
			>
				<BigButton
					onClick={() => setSending(true)}
					disabled={!hasStore || linen.length === 0}
				>
					<TruckIcon className="size-5" /> Send soiled linen
				</BigButton>
			</PageHeader>
			{!hasStore && (
				<Note tone="warning">
					There is no Housekeeping store yet, so clean linen can't be counted.
					The storekeeper adds one in Inventory → Stores.
				</Note>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Clean on hand"
					value={linen.reduce((s, l) => s + l.clean, 0)}
					icon={ShirtIcon}
				/>
				<KpiCard
					label="At the laundry"
					value={linen.reduce((s, l) => s + l.atLaundry, 0)}
					icon={TruckIcon}
					hint={plural(open.length, "open batch", "open batches")}
				/>
				<KpiCard
					label="Below half par"
					value={short.length}
					icon={ShirtIcon}
					hint={short.map((l) => l.name).join(", ") || "All fine"}
				/>
				<KpiCard
					label="Written off"
					value={naira(lostValue)}
					icon={TrashIcon}
					hint="Missing, lost and condemned"
				/>
			</div>
			<SectionCard
				title="By type"
				subtitle="Clean is the Housekeeping store; at the laundry is the Laundry store"
				flush
			>
				<table className="w-full text-left">
					<thead>
						<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="px-5 py-3">Type</th>
							<th className="py-3">Clean</th>
							<th className="py-3">At the laundry</th>
							<th className="py-3 pr-5">Of par</th>
						</tr>
					</thead>
					<tbody>
						{linen.map((l) => (
							<tr key={l.id} className="border-b border-line last:border-b-0">
								<td className="px-5 py-3 text-[15px] font-semibold text-ink">
									{l.name}
								</td>
								<td className="py-3 text-[15px] text-ink">{l.clean}</td>
								<td className="py-3 text-[15px] text-ink-2">{l.atLaundry}</td>
								<td className="py-3 pr-5">
									<div className="flex w-40 flex-col gap-1">
										<span className="text-xs text-ink-3">
											{l.clean} of {l.par}
										</span>
										<ProgressBar
											value={l.clean}
											max={Math.max(l.par, 1)}
											tone={l.clean < l.par * 0.5 ? "warning" : undefined}
										/>
									</div>
								</td>
							</tr>
						))}
						{linen.length === 0 && (
							<tr>
								<td
									colSpan={4}
									className="px-5 py-6 text-center text-[13px] text-ink-3"
								>
									No linen in stock yet · the storekeeper adds linen items
									(category Linen) in Inventory.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</SectionCard>
			<PillTabs
				tabs={[
					{ key: "open", label: "Open batches", count: open.length },
					{
						key: "all",
						label: "All batches",
						count: allPage.counts?.all ?? allPage.total,
					},
				]}
				value={tab === "all" ? "all" : "open"}
				onChange={(k) => void setTab(k === "open" ? null : k)}
			/>
			<DataTable
				columns={batchColumns()}
				data={
					tab === "all"
						? allPage.content.map(
								(b) => batches.find((x) => x.id === b.id) ?? b,
							)
						: open
				}
				{...(tab === "all"
					? {
							server: { page: allPage, onPage: list$.goTo },
							error: all.ok ? null : all.error,
							onRetry: () => router.refresh(),
						}
					: {})}
				onRowClick={(b) => void setOpenId(b.id)}
				emptyTitle="Nothing at the laundry"
			/>

			<SidePanel
				open={!!current}
				onOpenChange={(o) => {
					if (!o) void setOpenId(null);
				}}
				title={current ? `${current.number} · ${current.sent} pieces` : ""}
				subtitle={current ? BATCH_STATUS[current.status].label : undefined}
				icon={ShirtIcon}
				width="lg"
				footer={
					<BigButton tone="secondary" onClick={() => void setOpenId(null)}>
						Close
					</BigButton>
				}
			>
				{current ? <BatchDetail b={current} /> : null}
			</SidePanel>

			<SendModal
				open={sending}
				linen={linen}
				onClose={() => setSending(false)}
				onDone={(b) => {
					setBatches((bs) => [b, ...bs]);
					setSending(false);
				}}
			/>
		</>
	);
}

function SendModal({
	open,
	linen,
	onClose,
	onDone,
}: {
	open: boolean;
	linen: Linen[];
	onClose: () => void;
	onDone: (b: LinenBatchRow) => void;
}) {
	const [qty, setQty] = useState<Record<string, number>>({});
	const [note, setNote] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) {
			setQty({});
			setNote("");
		}
	}, [open]);
	const lines = Object.entries(qty).filter(([, q]) => q > 0);
	const over = lines.filter(
		([id, q]) => q > (linen.find((l) => l.id === id)?.clean ?? 0),
	);
	const total = lines.reduce((s, [, q]) => s + q, 0);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="Send soiled linen"
			subtitle="Count the trolley before it goes down"
			icon={TruckIcon}
			footerInfo={plural(total, "piece")}
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Cancel
					</BigButton>
					<BigButton
						pending={pending}
						disabled={total === 0 || over.length > 0}
						onClick={() =>
							run(
								() =>
									sendLinen({
										lines: lines.map(([itemId, quantity]) => ({
											itemId,
											quantity,
										})),
										note,
									}),
								(b) => `${b.number} sent · laundry told`,
								onDone,
							)
						}
					>
						Send to laundry
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<ul className="divide-y divide-line rounded-control border border-line">
					{linen.map((l) => (
						<li key={l.id} className="flex items-center gap-3 px-4 py-2">
							<span className="min-w-0 flex-1">
								<span className="block text-[15px] font-medium text-ink">
									{l.name}
								</span>
								<span className="block text-xs text-ink-3">
									{l.clean} in the Housekeeping store
								</span>
							</span>
							<Stepper
								value={qty[l.id] ?? 0}
								max={999}
								onChange={(v) => setQty({ ...qty, [l.id]: v })}
							/>
						</li>
					))}
				</ul>
				{over.length > 0 && (
					<Note tone="danger">
						More than the Housekeeping store shows for{" "}
						{over
							.map(([id]) => linen.find((l) => l.id === id)?.name)
							.join(", ")}{" "}
						· count again.
					</Note>
				)}
				<TextareaField
					label="Note (optional)"
					value={note}
					onChange={setNote}
					rows={2}
					placeholder="e.g. Floor A2 trolley, two sheets badly stained"
				/>
				<WhatHappens
					items={[
						"Laundry sees the batch and counts it in",
						"Anything that doesn't arrive is written off as missing and you're told",
						"Clean linen comes back into your store",
					]}
				/>
			</div>
		</Modal>
	);
}
