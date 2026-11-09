"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PackageCheckIcon, TruckIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	FieldRow,
	SelectField,
	TextareaField,
	TextField,
} from "@hospio/ui/shared/field";
import { fmtDay, fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn, input } from "@hospio/ui/shared/ui";
import { receiveDelivery } from "@hospio/api/actions/inventory";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	DeliveryRow,
	PurchaseOrderRow,
	StockItemRow,
	StoreRow,
	SupplierRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { useInvPerms } from "./nav";

type Row = {
	itemId: string;
	name: string;
	unit: string;
	outstanding?: number;
	got: string;
	damaged: string;
	cost: string;
	note: string;
};
const q = (n: number) => Number(n.toFixed(2)).toLocaleString("en-NG");

/** Inventory 4.x · Deliveries: receive against an order (received, damaged and cost per line) or without one; past deliveries. */
export function DeliveriesScreen({
	deliveries,
	orders,
	items,
	stores,
	suppliers,
}: {
	deliveries: DeliveryRow[];
	orders: PurchaseOrderRow[];
	items: StockItemRow[];
	stores: StoreRow[];
	suppliers: SupplierRow[];
}) {
	const perms = useInvPerms();
	const [isNew, setIsNew] = useQueryState("new");
	const [poParam, setPoParam] = useQueryState("po");
	const [openId, setOpenId] = useQueryState("open");
	const [search, setSearch] = useState("");
	const onTheWay = orders.filter(
		(o) => o.status === "SENT" || o.status === "PARTIAL",
	);
	const shown = deliveries.find((d) => d.id === openId) ?? null;

	const columns = useMemo<ColumnDef<DeliveryRow, unknown>[]>(
		() => [
			{
				accessorKey: "receivedAt",
				header: "Received",
				cell: ({ row }) => (
					<span className="text-ink-2">{fmtWhen(row.original.receivedAt)}</span>
				),
			},
			{
				accessorKey: "supplierName",
				header: "Supplier",
				cell: ({ row }) => (
					<TwoLine
						primary={row.original.supplierName}
						secondary={
							row.original.poNumber
								? `Against ${row.original.poNumber}`
								: "No purchase order"
						}
					/>
				),
			},
			{
				accessorKey: "storeName",
				header: "Into",
				cell: ({ row }) => (
					<span className="text-ink-2">{row.original.storeName ?? "—"}</span>
				),
			},
			{
				accessorKey: "lines",
				header: "Lines",
				cell: ({ row }) => plural(row.original.lines, "line"),
			},
			{
				accessorKey: "total",
				header: "Value",
				cell: ({ row }) => (
					<span className="font-semibold">{naira(row.original.total)}</span>
				),
			},
			{ accessorKey: "receivedBy", header: "By" },
			{
				id: "summary",
				header: "Check",
				enableSorting: false,
				cell: ({ row }) =>
					row.original.summary ? (
						<StatusPill tone="warning">{row.original.summary}</StatusPill>
					) : (
						<StatusPill tone="success">Complete</StatusPill>
					),
			},
		],
		[],
	);

	return (
		<>
			<PageHeader
				title="Deliveries"
				subtitle={`${plural(onTheWay.length, "order")} on the way · stock goes up the moment you receive`}
			>
				{perms.store && (
					<button
						type="button"
						className={btn.primary}
						onClick={() => {
							void setPoParam(null);
							void setIsNew("1");
						}}
					>
						<TruckIcon className="mr-1 inline size-4" /> Receive delivery
					</button>
				)}
			</PageHeader>
			{onTheWay.length > 0 && (
				<div className="grid gap-3 md:grid-cols-3">
					{onTheWay.map((o) => (
						<button
							key={o.id}
							type="button"
							disabled={!perms.store}
							onClick={() => {
								void setPoParam(o.id);
								void setIsNew("1");
							}}
							className="flex flex-col gap-1 rounded-card border border-info/30 bg-info-soft/40 p-4 text-left hover:shadow-md disabled:cursor-default"
						>
							<span className="flex items-center gap-2 text-sm font-bold text-ink">
								{o.number}{" "}
								<StatusPill tone="info">
									{o.status === "PARTIAL" ? "part received" : "on the way"}
								</StatusPill>
							</span>
							<span className="text-xs text-ink-2">
								{o.supplierName} · {plural(o.lines.length, "line")} ·{" "}
								{naira(o.total)}
							</span>
							<span className="text-xs text-ink-3">
								Expected {o.expectedOn ? fmtDay(o.expectedOn) : "soon"} · into{" "}
								{o.storeName ?? "the main store"}
							</span>
						</button>
					))}
				</div>
			)}
			<Toolbar
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Supplier, order…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={deliveries}
				search={search}
				onRowClick={(d) => void setOpenId(d.id)}
				emptyTitle="No deliveries yet"
			/>

			<SidePanel
				open={!!shown}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={
					shown ? `${shown.supplierName} · ${fmtWhen(shown.receivedAt)}` : ""
				}
				subtitle={
					shown
						? `${shown.poNumber ? `Against ${shown.poNumber}` : "No purchase order"} · received by ${shown.receivedBy}`
						: undefined
				}
				icon={PackageCheckIcon}
				width="lg"
			>
				{shown && (
					<div className="flex flex-col gap-5">
						{shown.summary && <Note tone="warning">{shown.summary}</Note>}
						<PanelSection title="Lines">
							<table className="w-full text-left text-[13px]">
								<thead>
									<tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
										<th className="py-2">Item</th>
										<th className="py-2 text-right">Expected</th>
										<th className="py-2 text-right">Received</th>
										<th className="py-2 text-right">Damaged</th>
										<th className="py-2 text-right">Cost</th>
									</tr>
								</thead>
								<tbody>
									{(shown.items ?? []).map((l) => (
										<tr
											key={l.itemId}
											className="border-b border-line last:border-b-0"
										>
											<td className="py-2 font-medium text-ink">
												{l.name}
												{l.note ? (
													<span className="block text-xs text-ink-3">
														{l.note}
													</span>
												) : null}
											</td>
											<td className="py-2 text-right text-ink-2">
												{l.ordered === undefined ? "—" : q(l.ordered)}
											</td>
											<td
												className={cn(
													"py-2 text-right",
													l.short ? "text-warning" : l.over ? "text-info" : "",
												)}
											>
												{q(l.quantity)} {l.unit}
												{l.short
													? ` (${q(l.short)} short)`
													: l.over
														? ` (${q(l.over)} over)`
														: ""}
											</td>
											<td
												className={cn(
													"py-2 text-right",
													l.damaged ? "text-danger" : "text-ink-3",
												)}
											>
												{l.damaged ? q(l.damaged) : "—"}
											</td>
											<td className="py-2 text-right">{naira(l.unitCost)}</td>
										</tr>
									))}
								</tbody>
							</table>
							<TotalsList
								rows={[
									{
										label: "Value received",
										value: naira(shown.total),
										strong: true,
									},
								]}
							/>
						</PanelSection>
						<DetailList
							columns={2}
							items={[
								{ label: "Into", value: shown.storeName ?? "—" },
								{ label: "Invoice", value: shown.invoiceNumber ?? "—" },
							]}
						/>
						{shown.note && <Note tone="info">{shown.note}</Note>}
					</div>
				)}
			</SidePanel>

			<ReceivePanel
				open={isNew === "1"}
				onOpenChange={(o) => {
					if (!o) {
						void setIsNew(null);
						void setPoParam(null);
					}
				}}
				poId={poParam}
				orders={onTheWay}
				items={items}
				stores={stores}
				suppliers={suppliers}
				onDone={() => {
					void setIsNew(null);
					void setPoParam(null);
				}}
			/>
		</>
	);
}

function ReceivePanel({
	open,
	onOpenChange,
	poId,
	orders,
	items,
	stores,
	suppliers,
	onDone,
}: {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	poId: string | null;
	orders: PurchaseOrderRow[];
	items: StockItemRow[];
	stores: StoreRow[];
	suppliers: SupplierRow[];
	onDone: () => void;
}) {
	const catalogue = useMemo(
		() => [...new Map(items.map((i) => [i.id, i])).values()],
		[items],
	);
	const main = stores.find((s) => s.kind === "MAIN") ?? stores[0];
	const [orderId, setOrderId] = useState("");
	const [rows, setRows] = useState<Row[]>([]);
	const [supplierName, setSupplierName] = useState("");
	const [storeId, setStoreId] = useState("");
	const [invoice, setInvoice] = useState("");
	const [note, setNote] = useState("");
	const [pick, setPick] = useState("");
	const { run, pending } = useAction();
	const po = orders.find((o) => o.id === orderId) ?? null;
	useEffect(() => {
		if (open) {
			setOrderId(poId && orders.some((o) => o.id === poId) ? poId : "");
			setInvoice("");
			setNote("");
			setSupplierName("");
			setStoreId(main?.id ?? "");
			setRows([]);
		}
	}, [open, poId, orders, main?.id]);
	useEffect(() => {
		if (!po) {
			setRows([]);
			return;
		}
		setStoreId(po.storeId ?? main?.id ?? "");
		setRows(
			po.lines
				.filter((l) => l.itemId)
				.map((l) => {
					const out = Math.max(0, l.quantity - (l.received ?? 0));
					return {
						itemId: l.itemId ?? "",
						name: l.name,
						unit: l.unit,
						outstanding: out,
						got: String(out),
						damaged: "",
						cost: String(l.unitCost),
						note: "",
					};
				}),
		);
	}, [po, main?.id]);
	const set = (idx: number, k: keyof Row, v: string) =>
		setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, [k]: v } : r)));
	const total = rows.reduce(
		(s, r) => s + Number(r.got || 0) * Number(r.cost || 0),
		0,
	);
	const short = rows.filter(
		(r) => r.outstanding !== undefined && Number(r.got || 0) < r.outstanding,
	);
	const over = rows.filter(
		(r) => r.outstanding !== undefined && Number(r.got || 0) > r.outstanding,
	);
	const damaged = rows.filter((r) => Number(r.damaged || 0) > 0);
	const anything = rows.some(
		(r) => Number(r.got || 0) > 0 || Number(r.damaged || 0) > 0,
	);
	const ready = anything && (po || (supplierName.trim() && storeId));

	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title="Receive a delivery"
			subtitle="Enter what arrived · short, over and damaged are noted for the supplier"
			icon={PackageCheckIcon}
			width="lg"
			footer={
				<>
					<button
						type="button"
						className={btn.secondary}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!ready || pending}
						onClick={() =>
							void run(
								() =>
									receiveDelivery({
										purchaseOrderId: po?.id,
										supplierName: po ? undefined : supplierName,
										storeId,
										invoiceNumber: invoice,
										note,
										lines: rows
											.filter(
												(r) =>
													Number(r.got || 0) > 0 || Number(r.damaged || 0) > 0,
											)
											.map((r) => ({
												itemId: r.itemId,
												quantity: Number(r.got || 0),
												damaged: Number(r.damaged || 0),
												unitCost: Number(r.cost || 0),
												note: r.note || null,
											})),
									}),
								(d) =>
									d.summary
										? `Delivery received · ${d.summary}`
										: "Delivery received · stock updated",
								onDone,
							)
						}
					>
						Receive {naira(total)}
					</button>
				</>
			}
			footerInfo={
				po
					? `${plural(po.lines.length, "line")} · ${naira(po.total)} ordered`
					: undefined
			}
		>
			<div className="flex flex-col gap-5">
				<SelectField
					label="Purchase order"
					value={orderId}
					onChange={setOrderId}
					options={[
						{ value: "", label: "No order (walk-in delivery)" },
						...orders.map((o) => ({
							value: o.id,
							label: `${o.number} · ${o.supplierName}`,
							hint: `${plural(o.lines.length, "line")} · ${naira(o.total)}`,
						})),
					]}
				/>
				{!po && (
					<FieldRow>
						<SelectField
							label="Supplier"
							value={supplierName}
							onChange={setSupplierName}
							options={suppliers
								.filter((s) => s.active !== false)
								.map((s) => ({ value: s.name, label: s.name }))}
						/>
						<SelectField
							label="Into store"
							value={storeId}
							onChange={setStoreId}
							options={stores.map((s) => ({ value: s.id, label: s.name }))}
						/>
					</FieldRow>
				)}
				{po && (
					<SelectField
						label="Into store"
						value={storeId}
						onChange={setStoreId}
						options={stores.map((s) => ({ value: s.id, label: s.name }))}
					/>
				)}
				<PanelSection title="What arrived">
					{rows.length === 0 && (
						<p className="text-[13px] text-ink-3">
							{po
								? "Nothing left to receive on this order."
								: "Add the items that came."}
						</p>
					)}
					{rows.length > 0 && (
						<table className="w-full text-left text-[13px]">
							<thead>
								<tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
									<th className="py-2">Item</th>
									{po && <th className="py-2 text-right">Expected</th>}
									<th className="py-2 text-right">Received</th>
									<th className="py-2 text-right">Damaged</th>
									<th className="py-2 text-right">Unit cost</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((r, idx) => (
									<tr
										key={r.itemId}
										className="border-b border-line last:border-b-0"
									>
										<td className="py-2 font-medium text-ink">
											{r.name}
											<span className="block text-xs text-ink-3">{r.unit}</span>
										</td>
										{po && (
											<td className="py-2 text-right text-ink-2">
												{q(r.outstanding ?? 0)}
											</td>
										)}
										<td className="py-2 text-right">
											<input
												type="number"
												min={0}
												aria-label={`Received ${r.name}`}
												value={r.got}
												onChange={(e) => set(idx, "got", e.target.value)}
												className={cn(
													input,
													"w-20 py-1 text-right",
													r.outstanding !== undefined &&
														Number(r.got || 0) < r.outstanding &&
														"border-warning",
												)}
											/>
										</td>
										<td className="py-2 text-right">
											<input
												type="number"
												min={0}
												aria-label={`Damaged ${r.name}`}
												value={r.damaged}
												onChange={(e) => set(idx, "damaged", e.target.value)}
												className={cn(input, "w-16 py-1 text-right")}
											/>
										</td>
										<td className="py-2 text-right">
											<input
												type="number"
												min={0}
												aria-label={`Unit cost ${r.name}`}
												value={r.cost}
												onChange={(e) => set(idx, "cost", e.target.value)}
												className={cn(input, "w-24 py-1 text-right")}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
					{!po && (
						<SelectField
							label="Add an item"
							value={pick}
							onChange={(v) => {
								const i = catalogue.find((x) => x.id === v);
								if (i)
									setRows((rs) => [
										...rs,
										{
											itemId: i.id,
											name: i.name,
											unit: i.unit,
											got: "",
											damaged: "",
											cost: String(i.unitCost),
											note: "",
										},
									]);
								setPick("");
							}}
							options={catalogue
								.filter((i) => !rows.some((r) => r.itemId === i.id))
								.map((i) => ({ value: i.id, label: i.name }))}
							placeholder="Item that arrived…"
						/>
					)}
				</PanelSection>
				{(short.length > 0 || over.length > 0 || damaged.length > 0) && (
					<Note tone="warning">
						{[
							short.length
								? `${short.map((r) => `${q((r.outstanding ?? 0) - Number(r.got || 0))} ${r.unit} ${r.name}`).join(", ")} short`
								: "",
							over.length ? `${over.map((r) => r.name).join(", ")} over` : "",
							damaged.length
								? `${damaged.map((r) => `${r.damaged} ${r.unit} ${r.name}`).join(", ")} damaged (not stocked)`
								: "",
						]
							.filter(Boolean)
							.join(" · ")}
						. {short.length ? "The order stays open for the rest." : ""}
					</Note>
				)}
				<TotalsList
					rows={[
						...(po ? [{ label: "Ordered", value: naira(po.total) }] : []),
						{ label: "Received now", value: naira(total), strong: true },
					]}
				/>
				<FieldRow>
					<TextField
						label="Invoice number"
						value={invoice}
						onChange={setInvoice}
					/>
					<span />
				</FieldRow>
				<TextareaField
					label="Note"
					value={note}
					onChange={setNote}
					rows={2}
					placeholder="Driver, what was damaged…"
				/>
			</div>
		</SidePanel>
	);
}
