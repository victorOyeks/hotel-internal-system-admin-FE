"use client";

import { BanIcon, ListIcon, PencilIcon, PlusIcon, ShieldCheckIcon, SunIcon, TagIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { MoneyField, SelectField, TextField, TextareaField, ToggleField } from "@hospio/ui/shared/field";
import { naira } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel, WhatHappens } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import type { MenuItemRow } from "@hospio/api/data/types";
import { useDemoAction } from "@hospio/api/demo/actions";
import { BigButton, ShiftPill } from "./tablet";

type Panel = { kind: "add" } | { kind: "edit"; item: MenuItemRow } | { kind: "price"; item: MenuItemRow } | { kind: "categories" } | { kind: "happy" } | null;

/**
 * Menu & prices for Kitchen (3251:12362…) and Bar (3264:11673…): sold-out toggles, price changes
 * that go to the manager for approval, add/edit items, categories, and (bar) happy hours.
 */
export function MenuScreen({ menu, outlet, happyHours = false }: { menu: MenuItemRow[]; outlet: string; happyHours?: boolean }) {
	const [items, setItems] = useState(menu);
	const [q, setQ] = useState("");
	const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("all"));
	const [panel, setPanel] = useState<Panel>(null);
	const [soldOut, setSoldOut] = useState<MenuItemRow | null>(null);
	const { run, pending } = useDemoAction();

	const categories = useMemo(() => Array.from(new Set(items.map((m) => m.category))), [items]);
	const list = items.filter((m) => (tab === "all" ? true : tab === "soldout" ? !m.available : m.category === tab));
	const [draft, setDraft] = useState({ name: "", category: categories[0] ?? "", price: "" as number | "", description: "", options: "" });
	const [newPrice, setNewPrice] = useState<number | "">("");
	const [reason, setReason] = useState("");
	const [cats, setCats] = useState(categories);
	const [newCat, setNewCat] = useState("");
	const [hh, setHh] = useState({ from: "17:00", to: "19:00", off: 20, days: "Mon – Fri", on: true });

	const close = () => setPanel(null);
	const openEdit = (item: MenuItemRow) => {
		setDraft({ name: item.name, category: item.category, price: item.price, description: item.description ?? "", options: item.options?.join(", ") ?? "" });
		setPanel({ kind: "edit", item });
	};

	return (
		<>
			<PageHeader title="Menu & prices" subtitle={`${outlet} · ${items.length} items · ${items.filter((m) => !m.available).length} sold out`}>
				<ShiftPill />
				<BigButton tone="secondary" onClick={() => setPanel({ kind: "categories" })}>
					<ListIcon className="size-5" /> Categories
				</BigButton>
				{happyHours && (
					<BigButton tone="secondary" onClick={() => setPanel({ kind: "happy" })}>
						<SunIcon className="size-5" /> Happy hours
					</BigButton>
				)}
				<BigButton onClick={() => { setDraft({ name: "", category: categories[0] ?? "", price: "", description: "", options: "" }); setPanel({ kind: "add" }); }}>
					<PlusIcon className="size-5" /> Add {outlet === "Bar" ? "drink" : "item"}
				</BigButton>
			</PageHeader>
			<Note tone="info">Prices are set by the manager. Changing a price here sends it for approval; marking an item sold out takes effect at once.</Note>
			<Toolbar
				left={<PillTabs tabs={[{ key: "all", label: "All", count: items.length }, ...categories.map((c) => ({ key: c, label: c, count: items.filter((m) => m.category === c).length })), { key: "soldout", label: "Sold out", count: items.filter((m) => !m.available).length }]} value={tab} onChange={(k) => void setTab(k === "all" ? null : k)} />}
				right={<SearchBox value={q} onChange={setQ} placeholder="Search items…" />}
			/>
			<DataTable
				data={list}
				search={q}
				pageSize={15}
				onRowClick={openEdit}
				columns={[
					{ accessorKey: "name", header: "Item", cell: ({ row }) => <TwoLine primary={row.original.name} secondary={row.original.description ?? (row.original.options?.length ? `Choices: ${row.original.options.join(", ")}` : undefined)} /> },
					{ accessorKey: "category", header: "Category" },
					{ accessorKey: "price", header: "Price", cell: ({ row }) => <span className="font-semibold">{naira(row.original.price)}</span> },
					{ accessorKey: "available", header: "Status", cell: ({ row }) => <StatusPill tone={row.original.available ? "success" : "danger"}>{row.original.available ? "Available" : "Sold out"}</StatusPill> },
					{
						id: "actions",
						header: "",
						cell: ({ row }) => (
							<RowActions
								actions={[
									{ label: row.original.available ? "Mark sold out" : "Back on the menu", icon: BanIcon, onClick: () => (row.original.available ? setSoldOut(row.original) : run(`${row.original.name} is back on the menu`, () => setItems((it) => it.map((m) => (m.id === row.original.id ? { ...m, available: true } : m))))) },
									{ label: "Change price", icon: TagIcon, onClick: () => { setNewPrice(row.original.price); setReason(""); setPanel({ kind: "price", item: row.original }); }, managerOnly: true },
									{ label: "Edit item", icon: PencilIcon, onClick: () => openEdit(row.original) },
								]}
							/>
						),
					},
				]}
			/>

			<ConfirmModal open={!!soldOut} onOpenChange={(o) => !o && setSoldOut(null)} title={`Mark ${soldOut?.name ?? ""} sold out?`} subtitle="Staff can't add it to new orders until you bring it back" confirmLabel="Mark sold out" pending={pending} onConfirm={() => soldOut && run(`${soldOut.name} marked sold out`, () => { setItems((it) => it.map((m) => (m.id === soldOut.id ? { ...m, available: false } : m))); setSoldOut(null); })}>
				<WhatHappens items={["It disappears from the picker on every tablet right now", "Open orders that already have it are not affected", "Bring it back from the Sold out tab"]} />
			</ConfirmModal>

			<SidePanel open={panel?.kind === "price"} onOpenChange={(o) => !o && close()} title="Change price" subtitle={panel?.kind === "price" ? `${panel.item.name} · now ${naira(panel.item.price)}` : undefined} icon={TagIcon}
				footerInfo={<span className="flex items-center gap-1"><ShieldCheckIcon className="size-3" /> Needs the manager's approval</span>}
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton><BigButton pending={pending} disabled={newPrice === ""} onClick={() => run("Price change sent to the manager", close, { tone: "info" })}>Send for approval</BigButton></>}>
				{panel?.kind === "price" && (
					<div className="flex flex-col gap-4">
						<MoneyField label="New price" value={newPrice} onChange={setNewPrice} required />
						<TextareaField label="Why" value={reason} onChange={setReason} placeholder="e.g. supplier price went up" />
						<TotalsList rows={[{ label: "Now", value: naira(panel.item.price) }, { label: "Proposed", value: naira(newPrice || 0), strong: true }]} />
						<WhatHappens items={["The old price stays until the manager approves", "You'll get an alert when it's decided"]} />
					</div>
				)}
			</SidePanel>

			<SidePanel open={panel?.kind === "add" || panel?.kind === "edit"} onOpenChange={(o) => !o && close()} title={panel?.kind === "edit" ? "Edit item" : `Add ${outlet === "Bar" ? "drink" : "item"}`} subtitle={outlet} icon={PencilIcon}
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton><BigButton pending={pending} disabled={!draft.name || draft.price === ""} onClick={() => run(panel?.kind === "edit" ? "Item updated" : "Item added · price sent for approval", () => {
					const opts = draft.options.split(",").map((s) => s.trim()).filter(Boolean);
					if (panel?.kind === "edit") setItems((it) => it.map((m) => (m.id === panel.item.id ? { ...m, name: draft.name, category: draft.category, description: draft.description || undefined, options: opts.length ? opts : undefined } : m)));
					else setItems((it) => [...it, { id: `mi-new-${Date.now()}`, outletId: outlet === "Bar" ? "bar" : "kitchen", outlet, category: draft.category, name: draft.name, price: Number(draft.price), available: true, description: draft.description || undefined, options: opts.length ? opts : undefined }]);
					close();
				})}>{panel?.kind === "edit" ? "Save" : "Add item"}</BigButton></>}>
				<div className="flex flex-col gap-4">
					<TextField label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} required />
					<SelectField label="Category" value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={cats} />
					<MoneyField label="Price" value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} required disabled={panel?.kind === "edit"} hint={panel?.kind === "edit" ? "Use Change price to propose a new one" : "A new item's price needs the manager's approval"} />
					<TextField label="Choices (comma-separated)" value={draft.options} onChange={(v) => setDraft({ ...draft, options: v })} placeholder="e.g. Grilled, Fried" />
					<TextareaField label="Description" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} rows={2} />
				</div>
			</SidePanel>

			<Modal open={panel?.kind === "categories"} onOpenChange={(o) => !o && close()} title="Categories" subtitle="The pills staff see in the picker" icon={ListIcon} size="confirm"
				footer={<><BigButton tone="secondary" onClick={close}>Close</BigButton><BigButton pending={pending} onClick={() => run("Categories saved", close)}>Save</BigButton></>}>
				<div className="flex flex-col gap-3">
					<ul className="divide-y divide-line rounded-control border border-line">
						{cats.map((c) => (
							<li key={c} className="flex items-center gap-3 px-4 py-3 text-[15px] text-ink">
								<span className="flex-1">{c}</span>
								<span className="text-xs text-ink-3">{items.filter((m) => m.category === c).length} items</span>
								<button type="button" disabled={items.some((m) => m.category === c)} onClick={() => setCats((cs) => cs.filter((x) => x !== c))} className="text-xs font-semibold text-danger disabled:opacity-30">Remove</button>
							</li>
						))}
					</ul>
					<div className="flex gap-2">
						<input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category" className="h-11 flex-1 rounded-control border border-line px-3 text-[15px] outline-none focus:border-brand" />
						<BigButton tone="secondary" className="h-11" disabled={!newCat.trim()} onClick={() => { setCats((cs) => [...cs, newCat.trim()]); setNewCat(""); }}>Add</BigButton>
					</div>
					<p className="text-xs text-ink-3">A category with items can't be removed — move the items first.</p>
				</div>
			</Modal>

			<SidePanel open={panel?.kind === "happy"} onOpenChange={(o) => !o && close()} title="Happy hours" subtitle="A discount on drinks between set times" icon={SunIcon}
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton><BigButton pending={pending} onClick={() => run("Happy hours sent to the manager for approval", close, { tone: "info" })}>Send for approval</BigButton></>}>
				<div className="flex flex-col gap-4">
					<ToggleField label="Happy hours on" checked={hh.on} onChange={(v) => setHh({ ...hh, on: v })} />
					<div className="grid grid-cols-2 gap-3">
						<TextField label="From" type="time" value={hh.from} onChange={(v) => setHh({ ...hh, from: v })} />
						<TextField label="To" type="time" value={hh.to} onChange={(v) => setHh({ ...hh, to: v })} />
					</div>
					<SelectField label="Days" value={hh.days} onChange={(v) => setHh({ ...hh, days: v })} options={["Mon – Fri", "Every day", "Fri – Sun"]} />
					<TextField label="Discount (%)" type="number" value={String(hh.off)} onChange={(v) => setHh({ ...hh, off: Number(v) || 0 })} />
					<PanelSection title="Preview">
						<TotalsList rows={items.filter((m) => m.category === "Beer").slice(0, 3).map((m) => ({ label: m.name, value: `${naira(m.price)} → ${naira(Math.round(m.price * (1 - hh.off / 100)))}` }))} />
					</PanelSection>
				</div>
			</SidePanel>
		</>
	);
}
