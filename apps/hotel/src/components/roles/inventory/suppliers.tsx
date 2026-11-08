"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { HandshakeIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList } from "@hospio/ui/shared/detail-list";
import { FieldRow, SelectField, TextField } from "@hospio/ui/shared/field";
import { fmtDay, naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { PurchaseOrderRow, StockItemRow, SupplierRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { poTone } from "./orders";

/** Inventory 6.x · Suppliers list, details, add. */
export function SuppliersScreen({ suppliers: initial, items, orders }: { suppliers: SupplierRow[]; items: StockItemRow[]; orders: PurchaseOrderRow[] }) {
	const [suppliers, setSuppliers] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [isNew, setIsNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", terms: "Pay on delivery" });
	const { run, pending } = useDemoAction();
	const sup = suppliers.find((s) => s.id === openId) ?? null;
	const supItems = sup ? items.filter((i) => i.supplierName === sup.name) : [];
	const supOrders = sup ? orders.filter((o) => o.supplierName === sup.name) : [];

	const columns = useMemo<ColumnDef<SupplierRow, unknown>[]>(
		() => [
			{ accessorKey: "name", header: "Supplier", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={`${row.original.contactName} · ${row.original.phone}`} /> },
			{ accessorKey: "terms", header: "Terms", cell: ({ row }) => <StatusPill dot={false} tone={row.original.terms === "Pay on delivery" ? "grey" : "info"}>{row.original.terms}</StatusPill> },
			{ accessorKey: "items", header: "Items", cell: ({ row }) => plural(row.original.items, "item") },
			{ accessorKey: "lastOrder", header: "Last order", cell: ({ row }) => <span className="text-ink-2">{row.original.lastOrder ? fmtDay(row.original.lastOrder) : "—"}</span> },
			{ id: "act", header: "", enableSorting: false, cell: () => <div className="flex justify-end"><Link href="/dashboard/orders?new=1" className={`${btn.secondary} ${btn.small}`} onClick={(e) => e.stopPropagation()}>Order</Link></div> },
		],
		[],
	);

	return (
		<>
			<PageHeader title="Suppliers" subtitle={`${suppliers.length} suppliers · who you buy from and on what terms`}>
				<button type="button" className={btn.primary} onClick={() => void setIsNew("1")}><PlusIcon className="mr-1 inline size-4" /> Add supplier</button>
			</PageHeader>
			<Toolbar right={<SearchBox value={search} onChange={setSearch} placeholder="Supplier, contact…" />} />
			<DataTable columns={columns} data={suppliers} search={search} onRowClick={(s) => void setOpenId(s.id)} />

			<SidePanel open={!!sup} onOpenChange={(o) => !o && void setOpenId(null)} title={sup?.name ?? ""} subtitle={sup ? `${sup.contactName} · ${sup.phone}${sup.email ? ` · ${sup.email}` : ""}` : undefined} icon={HandshakeIcon} footer={sup && <Link href="/dashboard/orders?new=1" className={btn.primary}><ShoppingCartIcon className="mr-1 inline size-4" /> New order</Link>}>
				{sup && (
					<div className="flex flex-col gap-6">
						<PanelSection title="Terms"><DetailList columns={2} items={[{ label: "Payment terms", value: sup.terms }, { label: "Items supplied", value: sup.items }, { label: "Last order", value: sup.lastOrder ? fmtDay(sup.lastOrder) : "—" }, { label: "Spent this month", value: naira(supOrders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0)) }]} /></PanelSection>
						<PanelSection title="Items they supply">
							<ul className="divide-y divide-line text-[13px]">{supItems.map((i) => <li key={i.id} className="flex justify-between py-2"><span className="text-ink">{i.name}</span><span className="text-ink-2">{naira(i.unitCost)} / {i.unit}</span></li>)}{supItems.length === 0 && <li className="py-2 text-ink-3">No items linked yet.</li>}</ul>
						</PanelSection>
						<PanelSection title="Recent orders">
							<ul className="divide-y divide-line text-[13px]">{supOrders.map((o) => <li key={o.id} className="flex items-center justify-between py-2"><Link href={`/dashboard/orders?open=${o.id}`} className="font-medium text-brand">{o.number}</Link><span className="text-ink-2">{naira(o.total)}</span><StatusPill tone={poTone[o.status].tone}>{poTone[o.status].label}</StatusPill></li>)}{supOrders.length === 0 && <li className="py-2 text-ink-3">No orders yet.</li>}</ul>
						</PanelSection>
					</div>
				)}
			</SidePanel>

			<SidePanel open={isNew === "1"} onOpenChange={(o) => !o && void setIsNew(null)} title="Add a supplier" icon={PlusIcon} footer={<><button type="button" className={btn.secondary} onClick={() => void setIsNew(null)}>Cancel</button><button type="button" className={btn.primary} disabled={!form.name || !form.phone || pending} onClick={() => void run(`${form.name} added`, () => { setSuppliers((xs) => [{ id: `sp-${Date.now()}`, name: form.name, contactName: form.contact, phone: form.phone, email: form.email || undefined, terms: form.terms, items: 0 }, ...xs]); setForm({ name: "", contact: "", phone: "", email: "", terms: "Pay on delivery" }); void setIsNew(null); })}>Save supplier</button></>}>
				<div className="flex flex-col gap-4">
					<TextField label="Company" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
					<FieldRow><TextField label="Contact person" value={form.contact} onChange={(v) => setForm((f) => ({ ...f, contact: v }))} /><TextField label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} required /></FieldRow>
					<TextField label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
					<SelectField label="Payment terms" value={form.terms} onChange={(v) => setForm((f) => ({ ...f, terms: v }))} options={["Pay on delivery", "7 days", "14 days", "30 days"]} setupLink="terms" />
				</div>
			</SidePanel>
		</>
	);
}
