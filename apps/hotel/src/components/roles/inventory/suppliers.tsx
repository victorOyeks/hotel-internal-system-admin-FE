"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	HandshakeIcon,
	PencilIcon,
	PlusIcon,
	ShoppingCartIcon,
} from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import {
	FieldRow,
	SelectField,
	TextareaField,
	TextField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtDay, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { saveSupplier } from "@hospio/api/actions/inventory";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	PurchaseOrderRow,
	StockItemRow,
	SupplierRow,
} from "@hospio/api/data/types";
import { useInvHref, useInvPerms } from "./nav";
import { poTone } from "./orders";

const EMPTY = {
	name: "",
	contact: "",
	phone: "",
	email: "",
	terms: "Pay on delivery",
	address: "",
	notes: "",
	active: true,
	itemIds: [] as string[],
};

/** Inventory 6.x · Suppliers: list, details with the items they supply and their orders, add, edit, stop using. */
export function SuppliersScreen({
	suppliers,
	items,
	orders,
}: {
	suppliers: SupplierRow[];
	items: StockItemRow[];
	orders: PurchaseOrderRow[];
}) {
	const perms = useInvPerms();
	const href = useInvHref();
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [editing, setEditing] = useState<SupplierRow | null>(null);
	const catalogue = useMemo(
		() => [...new Map(items.map((i) => [i.id, i])).values()],
		[items],
	);
	const active = tab ?? "active";
	const shown = suppliers.filter((s) =>
		active === "active" ? s.active !== false : s.active === false,
	);
	const sup = suppliers.find((s) => s.id === openId) ?? null;
	const supItems = sup
		? catalogue.filter((i) => sup.itemIds?.includes(i.id))
		: [];
	const supOrders = sup ? orders.filter((o) => o.supplierId === sup.id) : [];

	const columns = useMemo<ColumnDef<SupplierRow, unknown>[]>(
		() => [
			{
				accessorKey: "name",
				header: "Supplier",
				cell: ({ row }) => (
					<TwoLine
						primary={row.original.name}
						secondary={
							[row.original.contactName, row.original.phone]
								.filter(Boolean)
								.join(" · ") || "No contact yet"
						}
					/>
				),
			},
			{
				accessorKey: "terms",
				header: "Terms",
				cell: ({ row }) =>
					row.original.terms ? (
						<StatusPill
							dot={false}
							tone={row.original.terms === "Pay on delivery" ? "grey" : "info"}
						>
							{row.original.terms}
						</StatusPill>
					) : (
						<span className="text-ink-3">—</span>
					),
			},
			{
				accessorKey: "items",
				header: "Items",
				cell: ({ row }) => plural(row.original.items, "item"),
			},
			{
				accessorKey: "openOrders",
				header: "Open orders",
				cell: ({ row }) => row.original.openOrders ?? 0,
			},
			{
				accessorKey: "spent",
				header: "Received (30 days)",
				cell: ({ row }) => naira(row.original.spent ?? 0),
			},
			{
				accessorKey: "lastOrder",
				header: "Last order",
				cell: ({ row }) => (
					<span className="text-ink-2">
						{row.original.lastOrder ? fmtDay(row.original.lastOrder) : "—"}
					</span>
				),
			},
		],
		[],
	);

	return (
		<>
			<PageHeader
				title="Suppliers"
				subtitle={`${plural(suppliers.filter((s) => s.active !== false).length, "supplier")} · who you buy from and on what terms`}
			>
				{perms.store && (
					<button
						type="button"
						className={btn.primary}
						onClick={() => void setIsNew("1")}
					>
						<PlusIcon className="mr-1 inline size-4" /> Add supplier
					</button>
				)}
			</PageHeader>
			<Toolbar
				left={
					<PillTabs
						value={active}
						onChange={(k) => void setTab(k === "active" ? null : k)}
						tabs={[
							{
								key: "active",
								label: "In use",
								count: suppliers.filter((s) => s.active !== false).length,
							},
							{
								key: "stopped",
								label: "Stopped",
								count: suppliers.filter((s) => s.active === false).length,
							},
						]}
					/>
				}
				right={
					<SearchBox
						value={search}
						onChange={setSearch}
						placeholder="Supplier, contact…"
					/>
				}
			/>
			<DataTable
				columns={columns}
				data={shown}
				search={search}
				onRowClick={(s) => void setOpenId(s.id)}
				emptyTitle="No suppliers here"
			/>

			<SidePanel
				open={!!sup}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={sup?.name ?? ""}
				subtitle={
					sup
						? [sup.contactName, sup.phone, sup.email]
								.filter(Boolean)
								.join(" · ")
						: undefined
				}
				icon={HandshakeIcon}
				width="lg"
				footer={
					sup &&
					perms.store && (
						<>
							<button
								type="button"
								className={btn.secondary}
								onClick={() => setEditing(sup)}
							>
								<PencilIcon className="mr-1 inline size-4" /> Edit
							</button>
							{sup.active !== false && (
								<Link href={href("orders", { new: 1 })} className={btn.primary}>
									<ShoppingCartIcon className="mr-1 inline size-4" /> New order
								</Link>
							)}
						</>
					)
				}
			>
				{sup && (
					<div className="flex flex-col gap-6">
						{sup.active === false && (
							<Note tone="warning">
								No longer in use · it can't be picked for new orders.
							</Note>
						)}
						<PanelSection title="Terms">
							<DetailList
								columns={2}
								items={[
									{ label: "Payment terms", value: sup.terms || "—" },
									{ label: "Items supplied", value: sup.items },
									{ label: "Open orders", value: sup.openOrders ?? 0 },
									{ label: "Received (30 days)", value: naira(sup.spent ?? 0) },
									{ label: "Address", value: sup.address ?? "—" },
									{
										label: "Last order",
										value: sup.lastOrder ? fmtDay(sup.lastOrder) : "—",
									},
								]}
							/>
						</PanelSection>
						{sup.notes && <Note tone="info">{sup.notes}</Note>}
						<PanelSection title="Items they supply">
							<ul className="divide-y divide-line text-[13px]">
								{supItems.map((i) => (
									<li key={i.id} className="flex justify-between py-2">
										<span className="text-ink">{i.name}</span>
										<span className="text-ink-2">
											{naira(i.unitCost)} / {i.unit}
										</span>
									</li>
								))}
								{supItems.length === 0 && (
									<li className="py-2 text-ink-3">
										No items linked yet · Edit to pick them.
									</li>
								)}
							</ul>
						</PanelSection>
						<PanelSection title="Open orders">
							<ul className="divide-y divide-line text-[13px]">
								{supOrders.map((o) => (
									<li
										key={o.id}
										className="flex items-center justify-between py-2"
									>
										<Link
											href={href("orders", { open: o.id })}
											className="font-medium text-brand"
										>
											{o.number}
										</Link>
										<span className="text-ink-2">{naira(o.total)}</span>
										<StatusPill tone={poTone[o.status].tone}>
											{poTone[o.status].label}
										</StatusPill>
									</li>
								))}
								{supOrders.length === 0 && (
									<li className="py-2 text-ink-3">Nothing open.</li>
								)}
							</ul>
							<Link
								href={href("orders", { supplier: sup.id })}
								className="text-[13px] font-semibold text-brand"
							>
								Every order from {sup.name}
							</Link>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<SupplierPanel
				open={isNew === "1" || !!editing}
				supplier={editing}
				catalogue={catalogue}
				onOpenChange={(o) => {
					if (!o) {
						void setIsNew(null);
						setEditing(null);
					}
				}}
				onSaved={(id) => {
					void setIsNew(null);
					setEditing(null);
					void setOpenId(id);
				}}
			/>
		</>
	);
}

function SupplierPanel({
	open,
	supplier,
	catalogue,
	onOpenChange,
	onSaved,
}: {
	open: boolean;
	supplier: SupplierRow | null;
	catalogue: StockItemRow[];
	onOpenChange: (o: boolean) => void;
	onSaved: (id: string) => void;
}) {
	const [form, setForm] = useState(EMPTY);
	const [pick, setPick] = useState("");
	const { run, pending } = useAction();
	useEffect(() => {
		if (!open) return;
		setForm(
			supplier
				? {
						name: supplier.name,
						contact: supplier.contactName,
						phone: supplier.phone,
						email: supplier.email ?? "",
						terms: supplier.terms || "Pay on delivery",
						address: supplier.address ?? "",
						notes: supplier.notes ?? "",
						active: supplier.active !== false,
						itemIds: supplier.itemIds ?? [],
					}
				: EMPTY,
		);
	}, [open, supplier]);
	const set = (k: keyof typeof EMPTY) => (v: string) =>
		setForm((f) => ({ ...f, [k]: v }));
	return (
		<SidePanel
			open={open}
			onOpenChange={onOpenChange}
			title={supplier ? `Edit ${supplier.name}` : "Add a supplier"}
			icon={supplier ? PencilIcon : PlusIcon}
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
						disabled={!form.name.trim() || pending}
						onClick={() =>
							void run(
								() =>
									saveSupplier({
										id: supplier?.id,
										name: form.name,
										contactName: form.contact,
										phone: form.phone,
										email: form.email,
										paymentTerms: form.terms,
										address: form.address,
										notes: form.notes,
										active: supplier ? form.active : undefined,
										itemIds: form.itemIds,
									}),
								supplier
									? form.active
										? `${form.name} saved`
										: `${form.name} stopped`
									: `${form.name} added`,
								(s) => onSaved(s.id),
							)
						}
					>
						Save supplier
					</button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<TextField
					label="Company"
					value={form.name}
					onChange={set("name")}
					required
				/>
				<FieldRow>
					<TextField
						label="Contact person"
						value={form.contact}
						onChange={set("contact")}
					/>
					<TextField
						label="Phone"
						value={form.phone}
						onChange={set("phone")}
						placeholder="0803 123 4567"
					/>
				</FieldRow>
				<FieldRow>
					<TextField
						label="Email"
						value={form.email}
						onChange={set("email")}
						hint="Orders are emailed here (SMS is coming soon)"
					/>
					<SelectField
						label="Payment terms"
						value={form.terms}
						onChange={set("terms")}
						options={["Pay on delivery", "7 days", "14 days", "30 days"]}
					/>
				</FieldRow>
				<TextField
					label="Address"
					value={form.address}
					onChange={set("address")}
				/>
				<PanelSection title={`Items they supply · ${form.itemIds.length}`}>
					<div className="flex flex-wrap gap-1">
						{form.itemIds.map((id) => {
							const i = catalogue.find((x) => x.id === id);
							return (
								<button
									key={id}
									type="button"
									onClick={() =>
										setForm((f) => ({
											...f,
											itemIds: f.itemIds.filter((x) => x !== id),
										}))
									}
									className="rounded-pill border border-line bg-subtle px-2 py-[3px] text-[11px] font-medium text-ink-2 hover:border-danger hover:text-danger"
									aria-label={`Remove ${i?.name}`}
								>
									{i?.name ?? "Item"} ×
								</button>
							);
						})}
					</div>
					<SelectField
						label="Add an item"
						value={pick}
						onChange={(v) => {
							if (v) setForm((f) => ({ ...f, itemIds: [...f.itemIds, v] }));
							setPick("");
						}}
						options={catalogue
							.filter((i) => !form.itemIds.includes(i.id))
							.map((i) => ({
								value: i.id,
								label: i.name,
								hint: i.supplierName ? `now from ${i.supplierName}` : undefined,
							}))}
						placeholder="Item they supply…"
					/>
				</PanelSection>
				<TextareaField
					label="Notes"
					value={form.notes}
					onChange={set("notes")}
					rows={2}
				/>
				{supplier && (
					<ToggleField
						label="In use"
						hint="Stop using a supplier only once their orders are closed"
						checked={form.active}
						onChange={(v) => setForm((f) => ({ ...f, active: v }))}
					/>
				)}
			</div>
		</SidePanel>
	);
}
