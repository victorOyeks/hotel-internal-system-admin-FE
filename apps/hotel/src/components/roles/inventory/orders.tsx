"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { addDays, format } from "date-fns";
import {
	PlusIcon,
	SendIcon,
	ShoppingCartIcon,
	Trash2Icon,
	TruckIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { SelectField, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtDay, fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { ConfirmModal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { useListParams } from "@hospio/ui/shared/list-params";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn, input } from "@hospio/ui/shared/ui";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import {
	cancelOrder,
	closeOrder,
	loadPurchaseOrder,
	saveOrder,
	submitOrder,
} from "@hospio/api/actions/inventory";
import { useAction } from "@hospio/api/actions/use-action";
import type { PageResult } from "@hospio/api/data/paging";
import type {
	DeliveryRow,
	PurchaseOrderRow,
	StockItemRow,
	StoreRow,
	SupplierRow,
} from "@hospio/api/data/types";
import { useInvHref, useInvPerms } from "./nav";

export const poTone: Record<
	PurchaseOrderRow["status"],
	{ label: string; tone: "success" | "warning" | "danger" | "info" | "grey" }
> = {
	DRAFT: { label: "Draft", tone: "grey" },
	PENDING_APPROVAL: { label: "Needs approval", tone: "warning" },
	SENT: { label: "Sent", tone: "info" },
	PARTIAL: { label: "Part received", tone: "info" },
	RECEIVED: { label: "Received", tone: "success" },
	CLOSED: { label: "Closed short", tone: "grey" },
	CANCELLED: { label: "Cancelled", tone: "danger" },
};
type Line = {
	itemId: string;
	name: string;
	unit: string;
	quantity: string;
	unitCost: string;
};
const q = (n: number) => Number(n.toFixed(2)).toLocaleString("en-NG");

/**
 * Inventory 3.x · Purchase orders: list, new / draft, send (or to approval), cancel, close short, receive. Paged by
 * inventory-service: the tab is the status, search, supplier and page are in the URL, the tab counts are the service's.
 * The open order (and what was delivered against it) is read on its own, so a link to any order opens it.
 */
export function OrdersScreen({
	orders: result,
	items,
	suppliers,
	stores,
}: {
	orders: PageResult<PurchaseOrderRow>;
	items: StockItemRow[];
	suppliers: SupplierRow[];
	stores: StoreRow[];
}) {
	const router = useRouter();
	const list$ = useListParams({ extra: ["tab", "supplier"] });
	const page = result.data;
	const orders = page.content;
	const count = (...keys: string[]) =>
		keys.reduce((n, k) => n + (page.counts?.[k] ?? 0), 0);
	const perms = useInvPerms();
	const href = useInvHref();
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [seedItem, setSeedItem] = useQueryState("item");
	const [seedQty, setSeedQty] = useQueryState("qty");
	const tab = list$.params.tab;
	const setTab = (k: string | null) => list$.set({ tab: k });
	const [editing, setEditing] = useState<PurchaseOrderRow | null>(null);
	const [ending, setEnding] = useState<"cancel" | "close" | null>(null);
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	const active = tab ?? "all";
	// The open order as the service has it now, with its deliveries (again after the page is read again).
	const [loaded, setLoaded] = useState<
		(PurchaseOrderRow & { deliveries: DeliveryRow[] }) | null
	>(null);
	useEffect(() => {
		if (!openId) {
			setLoaded(null);
			return;
		}
		let alive = true;
		void loadPurchaseOrder(openId).then((r) => {
			if (alive) setLoaded(r.ok ? r.data : null);
		});
		return () => {
			alive = false;
		};
	}, [openId, result]);
	const po =
		(loaded?.id === openId ? loaded : null) ??
		orders.find((o) => o.id === openId) ??
		null;
	const poDeliveries = loaded?.id === openId ? loaded.deliveries : [];
	const supplierName = suppliers.find(
		(x) => x.id === list$.params.supplier,
	)?.name;

	const columns = useMemo<ColumnDef<PurchaseOrderRow, unknown>[]>(
		() => [
			{
				accessorKey: "number",
				header: "Order",
				cell: ({ row }) => (
					<TwoLine
						primary={row.original.number}
						secondary={`${row.original.createdBy} · ${fmtWhen(row.original.createdAt)}`}
					/>
				),
			},
			{ accessorKey: "supplierName", header: "Supplier" },
			{
				id: "lines",
				header: "Items",
				enableSorting: false,
				accessorFn: (o) => o.lines.map((l) => l.name).join(" "),
				cell: ({ row }) => (
					<span className="text-ink-2">
						{row.original.lines
							.map((l) => `${q(l.quantity)} ${l.unit} ${l.name}`)
							.join(", ")}
					</span>
				),
			},
			{
				accessorKey: "total",
				header: "Total",
				cell: ({ row }) => (
					<span className="font-semibold">{naira(row.original.total)}</span>
				),
			},
			{
				accessorKey: "expectedOn",
				header: "Expected",
				cell: ({ row }) => (
					<span className="text-ink-2">
						{row.original.expectedOn ? fmtDay(row.original.expectedOn) : "—"}
					</span>
				),
			},
			{
				accessorKey: "status",
				header: "Status",
				enableSorting: false,
				cell: ({ row }) => (
					<StatusPill tone={poTone[row.original.status].tone}>
						{poTone[row.original.status].label}
					</StatusPill>
				),
			},
		],
		[],
	);

	const after = () => void setOpenId(null);
	const sentMessage = (o: PurchaseOrderRow) =>
		o.status === "PENDING_APPROVAL"
			? `Sent to the ${o.approverLevel === "OWNER" ? "owner" : "manager"} for approval`
			: o.status === "SENT"
				? `${o.number} sent to ${o.supplierName}`
				: "Saved as a draft";

	return (
		<>
			<PageHeader
				title="Purchase orders"
				subtitle={`${plural(count("SENT", "PARTIAL"), "order")} on the way · ${plural(count("PENDING_APPROVAL"), "order")} waiting for approval · over the hotel's approval limit an order needs the manager (or the owner when a manager raises it)`}
			>
				{perms.store && (
					<button
						type="button"
						className={btn.primary}
						onClick={() => void setIsNew("1")}
					>
						<PlusIcon className="mr-1 inline size-4" /> New order
					</button>
				)}
			</PageHeader>
			<Toolbar
				left={
					<PillTabs
						value={active}
						onChange={(k) => setTab(k === "all" ? null : k)}
						tabs={[
							{ key: "all", label: "All", count: count("all") },
							{ key: "draft", label: "Draft", count: count("DRAFT") },
							{
								key: "approval",
								label: "Needs approval",
								count: count("PENDING_APPROVAL"),
							},
							{
								key: "sent",
								label: "On the way",
								count: count("SENT", "PARTIAL"),
							},
							{
								key: "done",
								label: "Done",
								count: count("RECEIVED", "CLOSED", "CANCELLED"),
							},
						]}
					/>
				}
				right={
					<div className="flex items-center gap-2">
						{supplierName && (
							<button
								type="button"
								className={`${btn.secondary} ${btn.small}`}
								onClick={() => list$.set({ supplier: null })}
								aria-label="Show every supplier"
							>
								{supplierName} ×
							</button>
						)}
						<SearchBox
							value={list$.search}
							onChange={list$.setSearch}
							placeholder="Order, supplier, item…"
						/>
					</div>
				}
			/>
			<DataTable
				columns={columns}
				data={orders}
				server={{ page, onPage: list$.goTo }}
				filtered={!!list$.params.q || !!list$.params.supplier}
				onClearFilters={list$.clear}
				error={result.ok ? null : result.error}
				onRetry={() => router.refresh()}
				onRowClick={(o) => void setOpenId(o.id)}
				emptyTitle="No orders here"
			/>

			<SidePanel
				open={!!po}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={po ? `${po.number} · ${po.supplierName}` : ""}
				subtitle={
					po
						? `${po.createdBy} · ${fmtWhen(po.createdAt)}${po.expectedOn ? ` · expected ${fmtDay(po.expectedOn)}` : ""}`
						: undefined
				}
				icon={ShoppingCartIcon}
				width="lg"
				footer={
					po &&
					perms.store && (
						<>
							{po.status === "DRAFT" && (
								<button
									type="button"
									className={btn.secondary}
									onClick={() => setEditing(po)}
								>
									Edit
								</button>
							)}
							{po.status === "DRAFT" && (
								<button
									type="button"
									className={btn.primary}
									disabled={pending}
									onClick={() =>
										void run(
											() =>
												withDeliveries(
													submitOrder(po.id),
													`Order ${po.number}`,
												),
											sentMessage,
											after,
										)
									}
								>
									<SendIcon className="mr-1 inline size-4" /> Send
								</button>
							)}
							{(po.status === "SENT" || po.status === "PARTIAL") && (
								<Link
									href={href("deliveries", { new: 1, po: po.id })}
									className={btn.primary}
								>
									<TruckIcon className="mr-1 inline size-4" /> Receive delivery
								</Link>
							)}
							{po.status === "PARTIAL" && (
								<button
									type="button"
									className={btn.secondary}
									onClick={() => {
										setReason("");
										setEnding("close");
									}}
								>
									Close short
								</button>
							)}
							{["DRAFT", "PENDING_APPROVAL", "SENT"].includes(po.status) && (
								<button
									type="button"
									className={btn.dangerSoft}
									onClick={() => {
										setReason("");
										setEnding("cancel");
									}}
								>
									Cancel order
								</button>
							)}
						</>
					)
				}
				footerInfo={
					po && (
						<StatusPill tone={poTone[po.status].tone}>
							{poTone[po.status].label}
						</StatusPill>
					)
				}
			>
				{po && (
					<div className="flex flex-col gap-5">
						{po.status === "PENDING_APPROVAL" && (
							<Note tone="warning">
								Over the approval limit · waiting on the{" "}
								{po.approverLevel === "OWNER" ? "owner" : "manager"}{" "}
								(Approvals). Nothing is sent to the supplier until it is
								approved.
							</Note>
						)}
						{po.decisionNote && (
							<Note tone={po.status === "CANCELLED" ? "danger" : "info"}>
								{po.decisionNote}
							</Note>
						)}
						{po.cancelReason && po.cancelReason !== po.decisionNote && (
							<Note tone="danger">
								{po.status === "CLOSED" ? "Closed short" : "Cancelled"}:{" "}
								{po.cancelReason}
							</Note>
						)}
						{po.sentAt && (
							<Note tone="info">
								Sent {fmtWhen(po.sentAt)}
								{po.sentTo
									? ` to ${po.sentTo}`
									: " · the supplier has no email or phone on file, send it yourself"}
								.
							</Note>
						)}
						<PanelSection title="Lines">
							<table className="w-full text-left text-[13px]">
								<thead>
									<tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
										<th className="py-2">Item</th>
										<th className="py-2 text-right">Ordered</th>
										<th className="py-2 text-right">Received</th>
										<th className="py-2 text-right">Unit cost</th>
										<th className="py-2 text-right">Total</th>
									</tr>
								</thead>
								<tbody>
									{po.lines.map((l) => (
										<tr
											key={l.itemId ?? l.name}
											className="border-b border-line last:border-b-0"
										>
											<td className="py-2 font-medium text-ink">{l.name}</td>
											<td className="py-2 text-right">
												{q(l.quantity)} {l.unit}
											</td>
											<td className="py-2 text-right text-ink-2">
												{q(l.received ?? 0)}
												{l.damaged ? ` (+${q(l.damaged)} damaged)` : ""}
											</td>
											<td className="py-2 text-right text-ink-2">
												{naira(l.unitCost)}
											</td>
											<td className="py-2 text-right font-semibold">
												{naira(l.quantity * l.unitCost)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<TotalsList
								rows={[
									{
										label: "Order total",
										value: naira(po.total),
										strong: true,
									},
									...(po.receivedValue
										? [
												{
													label: "Received so far",
													value: naira(po.receivedValue),
												},
											]
										: []),
								]}
							/>
						</PanelSection>
						<PanelSection title="Supplier and store">
							<DetailList
								columns={2}
								items={[
									{ label: "Supplier", value: po.supplierName },
									{
										label: "Terms",
										value:
											suppliers.find((s) => s.id === po.supplierId)?.terms ||
											"—",
									},
									{ label: "Deliver to", value: po.storeName ?? "Main store" },
									{
										label: "Expected",
										value: po.expectedOn ? fmtDay(po.expectedOn) : "—",
									},
								]}
							/>
						</PanelSection>
						{po.note && <Note tone="info">Note to supplier: {po.note}</Note>}
						{poDeliveries.length > 0 && (
							<PanelSection title="Deliveries">
								<ul className="divide-y divide-line text-[13px]">
									{poDeliveries.map((d) => (
										<li key={d.id} className="flex justify-between py-2">
											<span>
												{fmtWhen(d.receivedAt)} · {d.receivedBy}
												{d.summary ? ` · ${d.summary}` : ""}
											</span>
											<span className="font-semibold">{naira(d.total)}</span>
										</li>
									))}
								</ul>
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>

			<ConfirmModal
				open={!!ending}
				onOpenChange={(o) => !o && setEnding(null)}
				title={
					ending === "close" ? "Close this order short?" : "Cancel this order?"
				}
				subtitle={
					ending === "close"
						? "What hasn't arrived won't be expected any more"
						: "Nothing more is expected from the supplier"
				}
				tone="danger"
				confirmLabel={ending === "close" ? "Close short" : "Cancel order"}
				pending={pending}
				confirmDisabled={!reason.trim()}
				onConfirm={() =>
					po &&
					void run(
						() =>
							ending === "close"
								? closeOrder({ id: po.id, reason })
								: cancelOrder({ id: po.id, reason }),
						ending === "close"
							? `${po.number} closed short`
							: `${po.number} cancelled`,
						() => {
							setEnding(null);
							after();
						},
					)
				}
			>
				<TextareaField
					label="Reason"
					value={reason}
					onChange={setReason}
					rows={2}
					placeholder={
						ending === "close"
							? "e.g. Supplier is out of catfish this month"
							: "e.g. Ordered by mistake"
					}
				/>
			</ConfirmModal>

			<OrderPanel
				open={isNew === "1" || !!editing}
				draft={editing}
				onOpenChange={(o) => {
					if (!o) {
						void setIsNew(null);
						void setSeedItem(null);
						void setSeedQty(null);
						setEditing(null);
					}
				}}
				items={items}
				suppliers={suppliers}
				stores={stores}
				seedItemId={seedItem}
				seedQty={seedQty}
				onSaved={(id) => {
					void setIsNew(null);
					void setSeedItem(null);
					void setSeedQty(null);
					setEditing(null);
					void setOpenId(id);
				}}
				sentMessage={sentMessage}
			/>
		</>
	);
}

function OrderPanel({
	open,
	draft,
	onOpenChange,
	items,
	suppliers,
	stores,
	seedItemId,
	seedQty,
	onSaved,
	sentMessage,
}: {
	open: boolean;
	draft: PurchaseOrderRow | null;
	onOpenChange: (o: boolean) => void;
	items: StockItemRow[];
	suppliers: SupplierRow[];
	stores: StoreRow[];
	seedItemId: string | null;
	seedQty: string | null;
	onSaved: (id: string) => void;
	sentMessage: (o: PurchaseOrderRow) => string;
}) {
	const catalogue = useMemo(() => {
		const m = new Map<string, StockItemRow & { held: number }>();
		for (const i of items) {
			const x = m.get(i.id);
			m.set(i.id, { ...i, held: (x?.held ?? 0) + i.quantity });
		}
		return [...m.values()];
	}, [items]);
	const main = stores.find((s) => s.kind === "MAIN") ?? stores[0];
	const [supplierId, setSupplierId] = useState("");
	const [storeId, setStoreId] = useState("");
	const [lines, setLines] = useState<Line[]>([]);
	const [pick, setPick] = useState("");
	const [expected, setExpected] = useState("");
	const [note, setNote] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (!open) return;
		if (draft) {
			setSupplierId(draft.supplierId ?? "");
			setStoreId(draft.storeId ?? main?.id ?? "");
			setLines(
				draft.lines.map((l) => ({
					itemId: l.itemId ?? "",
					name: l.name,
					unit: l.unit,
					quantity: String(l.quantity),
					unitCost: String(l.unitCost),
				})),
			);
			setExpected(draft.expectedOn ?? "");
			setNote(draft.note ?? "");
			return;
		}
		const seed = catalogue.find((i) => i.id === seedItemId);
		setSupplierId(seed?.supplierId ?? "");
		setStoreId(main?.id ?? "");
		setLines(
			seed
				? [
						{
							itemId: seed.id,
							name: seed.name,
							unit: seed.unit,
							quantity:
								seedQty ??
								String(Math.max(Math.ceil(seed.minLevel * 2 - seed.held), 1)),
							unitCost: String(seed.unitCost),
						},
					]
				: [],
		);
		setExpected(format(addDays(new Date(), 2), "yyyy-MM-dd"));
		setNote("");
	}, [open, draft, seedItemId, seedQty, catalogue, main?.id]);
	const supplier = suppliers.find((s) => s.id === supplierId);
	const candidates = catalogue.filter(
		(i) =>
			!supplier || !supplier.itemIds?.length || supplier.itemIds.includes(i.id),
	);
	const total = lines.reduce(
		(s, l) => s + Number(l.quantity || 0) * Number(l.unitCost || 0),
		0,
	);
	const lowSuggestions = candidates.filter(
		(i) => i.held <= i.minLevel && !lines.some((l) => l.itemId === i.id),
	);
	const add = (i: StockItemRow & { held: number }) =>
		setLines((ls) => [
			...ls,
			{
				itemId: i.id,
				name: i.name,
				unit: i.unit,
				quantity: String(Math.max(Math.ceil(i.minLevel * 2 - i.held), 1)),
				unitCost: String(i.unitCost),
			},
		]);
	const valid =
		!!supplier &&
		lines.length > 0 &&
		lines.every((l) => Number(l.quantity) > 0 && Number(l.unitCost) >= 0);
	const save = (submit: boolean) =>
		run(
			() =>
				withDeliveries(
					saveOrder({
						id: draft?.id,
						supplierId,
						storeId,
						lines: lines.map((l) => ({
							itemId: l.itemId,
							quantity: Number(l.quantity),
							unitCost: Number(l.unitCost),
						})),
						expectedOn: expected,
						note,
						submit,
					}),
					"Purchase order",
				),
			sentMessage,
			(o) => onSaved(o.id),
		);

	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title={draft ? `Edit ${draft.number}` : "New purchase order"}
			subtitle="Pick a supplier, add lines, send or keep as a draft"
			icon={ShoppingCartIcon}
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
						className={btn.secondary}
						disabled={!valid || pending}
						onClick={() => void save(false)}
					>
						Save draft
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={!valid || pending}
						onClick={() => void save(true)}
					>
						<SendIcon className="mr-1 inline size-4" /> Send
					</button>
				</>
			}
			footerInfo={`${plural(lines.length, "line")} · ${naira(total)}`}
		>
			<div className="flex flex-col gap-5">
				<SelectField
					label="Supplier"
					value={supplierId}
					onChange={setSupplierId}
					options={suppliers
						.filter((s) => s.active !== false)
						.map((s) => ({
							value: s.id,
							label: s.name,
							hint: `${s.terms || "no terms"} · ${plural(s.items, "item")}`,
						}))}
					required
				/>
				<PanelSection title="Lines">
					{lines.length === 0 && (
						<p className="text-[13px] text-ink-3">
							No lines yet · pick items below.
						</p>
					)}
					{lines.map((l, idx) => (
						<div
							key={l.itemId}
							className="flex items-center gap-2 rounded-control border border-line px-3 py-2"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-medium text-ink">
									{l.name}
								</p>
								<p className="text-xs text-ink-3">per {l.unit}</p>
							</div>
							<input
								type="number"
								min={0}
								aria-label={`Quantity of ${l.name}`}
								value={l.quantity}
								onChange={(e) =>
									setLines((ls) =>
										ls.map((x, i) =>
											i === idx ? { ...x, quantity: e.target.value } : x,
										),
									)
								}
								className={`${input} w-20 py-1 text-right`}
							/>
							<input
								type="number"
								min={0}
								aria-label={`Unit cost of ${l.name}`}
								value={l.unitCost}
								onChange={(e) =>
									setLines((ls) =>
										ls.map((x, i) =>
											i === idx ? { ...x, unitCost: e.target.value } : x,
										),
									)
								}
								className={`${input} w-24 py-1 text-right`}
							/>
							<span className="w-24 text-right text-[13px] font-semibold">
								{naira(Number(l.quantity || 0) * Number(l.unitCost || 0))}
							</span>
							<button
								type="button"
								onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
								className="text-ink-3 hover:text-danger"
								aria-label={`Remove ${l.name}`}
							>
								<Trash2Icon className="size-4" />
							</button>
						</div>
					))}
					<SelectField
						label="Add an item"
						value={pick}
						onChange={(v) => {
							const i = catalogue.find((x) => x.id === v);
							if (i) add(i);
							setPick("");
						}}
						options={candidates
							.filter((i) => !lines.some((l) => l.itemId === i.id))
							.map((i) => ({
								value: i.id,
								label: i.name,
								hint: `${q(i.held)} ${i.unit} held · min ${q(i.minLevel)}`,
							}))}
						placeholder={
							supplier?.itemIds?.length
								? "Items this supplier supplies…"
								: "Any item…"
						}
					/>
					{lowSuggestions.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{lowSuggestions.slice(0, 10).map((i) => (
								<button
									key={i.id}
									type="button"
									onClick={() => add(i)}
									className="rounded-pill border border-warning/40 bg-warning-soft px-2 py-[3px] text-[11px] font-medium text-warning"
								>
									+ {i.name} (low)
								</button>
							))}
						</div>
					)}
				</PanelSection>
				<TotalsList
					rows={[{ label: "Order total", value: naira(total), strong: true }]}
				/>
				<SelectField
					label="Deliver to"
					value={storeId}
					onChange={setStoreId}
					options={stores.map((s) => ({ value: s.id, label: s.name }))}
				/>
				<TextField
					label="Expected on"
					type="date"
					value={expected}
					onChange={setExpected}
				/>
				<TextareaField
					label="Note to supplier"
					value={note}
					onChange={setNote}
					rows={2}
				/>
			</div>
		</SidePanel>
	);
}
