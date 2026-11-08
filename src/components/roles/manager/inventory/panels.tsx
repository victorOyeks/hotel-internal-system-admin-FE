"use client";

import { ClipboardCheckIcon, HandshakeIcon, PackageIcon, PackageOpenIcon, PlusIcon, ShoppingCartIcon, SlidersHorizontalIcon, Trash2Icon, TruckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DetailList, Note, Timeline, TotalsList } from "@/components/shared/detail-list";
import { ChoiceCards, FieldRow, SelectField, TextField, TextareaField } from "@/components/shared/field";
import { fmtDay, fmtLongDate, fmtWhen, naira, plural } from "@/components/shared/format";
import { ConfirmModal, Modal } from "@/components/shared/modal";
import { ProgressBar } from "@/components/shared/progress-bar";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import { btn, input } from "@/components/shared/ui";
import type { PurchaseOrderRow, StockCountRow, StockItemRow, StockRequestRow, StoreRow, SupplierRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import { cn } from "@/lib/utils";

export const PO_APPROVAL_LIMIT = 200_000;
export const poTone = { DRAFT: "grey", PENDING_APPROVAL: "warning", SENT: "info", RECEIVED: "success", CANCELLED: "danger" } as const;
export const poLabel = { DRAFT: "Draft", PENDING_APPROVAL: "Waiting for OK", SENT: "Sent · on order", RECEIVED: "Received", CANCELLED: "Cancelled" } as const;

export function stockStatus(i: StockItemRow): { label: string; tone: "danger" | "warning" | "success" | "info" } {
	if (i.quantity <= i.minLevel * 0.5) return { label: "Low", tone: "danger" };
	if (i.quantity <= i.minLevel) return { label: "Near minimum", tone: "warning" };
	return { label: "OK", tone: "success" };
}

// ---- item ------------------------------------------------------------------------------------------

export function ItemPanel({ item, onClose, onIssue, onAdjust, onOrder }: { item: StockItemRow | null; onClose: () => void; onIssue: (i: StockItemRow) => void; onAdjust: (i: StockItemRow) => void; onOrder: (i: StockItemRow) => void }) {
	if (!item) return null;
	const s = stockStatus(item);
	return (
		<SidePanel
			open
			onOpenChange={(o) => !o && onClose()}
			width="lg"
			icon={PackageIcon}
			title={item.name}
			subtitle={`${item.category} · ${item.storeName} · ${item.supplierName ?? "no supplier"}`}
			footerInfo={`Stock value ${naira(item.quantity * item.unitCost)}`}
			footer={
				<>
					<Button variant="outline" className={btn.secondary} onClick={() => onAdjust(item)}><SlidersHorizontalIcon className="size-4" /> Correct level</Button>
					<Button variant="outline" className={btn.secondary} onClick={() => onIssue(item)}><PackageOpenIcon className="size-4" /> Issue</Button>
					<Button className={btn.primary} onClick={() => onOrder(item)}><ShoppingCartIcon className="size-4" /> Reorder</Button>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="rounded-xl border border-line p-4">
					<div className="flex items-end justify-between">
						<div><p className="text-[11px] text-ink-3">In stock</p><p className="text-[26px] font-bold leading-none text-ink">{item.quantity} <span className="text-sm font-medium text-ink-2">{item.unit}</span></p></div>
						<StatusPill tone={s.tone}>{s.label}</StatusPill>
					</div>
					<ProgressBar value={item.quantity} max={item.minLevel * 2} tone={s.tone === "success" ? "brand" : s.tone} className="mt-3" />
					<p className="mt-1 text-xs text-ink-3">Minimum {item.minLevel} {item.unit} · reorder when it goes below</p>
				</div>
				<DetailList columns={2} items={[{ label: "Unit cost", value: naira(item.unitCost) }, { label: "Supplier", value: item.supplierName ?? "—" }, { label: "Store", value: item.storeName }, { label: "Last movement", value: fmtWhen(item.lastMovement) }]} />
				<PanelSection title="Recent movements">
					<Timeline
						items={[
							{ at: fmtWhen(item.lastMovement), by: "Grace Okafor", text: `Issued 2 ${item.unit} to Housekeeping` },
							{ at: fmtDay(new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)), by: "Jide Alabi", text: `Received 10 ${item.unit} · ${item.supplierName ?? "delivery"}` },
							{ at: fmtDay(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)), by: "Jide Alabi", text: "Stock count · matched" },
						]}
					/>
				</PanelSection>
			</div>
		</SidePanel>
	);
}

export function IssueModal({ item, onClose }: { item: StockItemRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [team, setTeam] = useState("");
	const [qty, setQty] = useState("1");
	return (
		<Modal open={!!item} onOpenChange={(o) => !o && onClose()} icon={PackageOpenIcon} title="Issue stock" subtitle={item ? `${item.name} · ${item.quantity} ${item.unit} in ${item.storeName}` : ""} footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !team} onClick={() => run(`${qty} ${item?.unit} issued to ${team}`, onClose)}>Issue</Button></>}>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<SelectField label="To" value={team} onChange={setTeam} options={["Housekeeping", "Kitchen", "Bar", "Laundry", "Maintenance", "Front office"]} setupLink="departments" />
					<TextField label={`Quantity (${item?.unit ?? ""})`} type="number" value={qty} onChange={setQty} />
				</FieldRow>
				{item && Number(qty) > item.quantity && <Note tone="danger">Only {item.quantity} {item.unit} in stock.</Note>}
				{item && item.quantity - Number(qty) <= item.minLevel && Number(qty) <= item.quantity && <Note>This takes it below the minimum of {item.minLevel}. A reorder reminder goes to the storekeeper.</Note>}
			</div>
		</Modal>
	);
}

export function AdjustModal({ item, onClose }: { item: StockItemRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [qty, setQty] = useState(String(item?.quantity ?? ""));
	const [reason, setReason] = useState("");
	const [note, setNote] = useState("");
	const diff = item ? Number(qty || 0) - item.quantity : 0;
	return (
		<Modal open={!!item} onOpenChange={(o) => !o && onClose()} icon={SlidersHorizontalIcon} title="Correct stock level" subtitle={item ? `${item.name} · system says ${item.quantity} ${item.unit}` : ""} footerInfo="Manager-only · logged with the reason" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !reason || diff === 0} onClick={() => run(`Level set to ${qty} ${item?.unit} · ${reason}`, onClose)}>Save correction</Button></>}>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<TextField label={`Actual count (${item?.unit ?? ""})`} type="number" value={qty} onChange={setQty} />
					<SelectField label="Reason" value={reason} onChange={setReason} options={["Count difference", "Damaged", "Expired", "Breakage", "Theft / lost", "Wrong entry"]} setupLink="reasons" />
				</FieldRow>
				{diff !== 0 && <Note tone={diff < 0 ? "danger" : "info"}>{diff < 0 ? `${-diff} ${item?.unit} written off · ${naira(-diff * (item?.unitCost ?? 0))}` : `${diff} ${item?.unit} added · ${naira(diff * (item?.unitCost ?? 0))}`}</Note>}
				<TextareaField label="Note" value={note} onChange={setNote} placeholder="What happened" />
			</div>
		</Modal>
	);
}

// ---- purchase orders -------------------------------------------------------------------------------

type Line = { name: string; quantity: number; unit: string; unitCost: number };

export function NewOrderPanel({ open, prefill, items, suppliers, onClose }: { open: boolean; prefill?: StockItemRow | null; items: StockItemRow[]; suppliers: SupplierRow[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [supplier, setSupplier] = useState(prefill?.supplierName ?? "");
	const [expected, setExpected] = useState(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
	const [lines, setLines] = useState<Line[]>(prefill ? [{ name: prefill.name, quantity: Math.max(1, prefill.minLevel * 2 - prefill.quantity), unit: prefill.unit, unitCost: prefill.unitCost }] : []);
	const [pick, setPick] = useState("");
	const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
	const addLine = (id: string) => {
		const it = items.find((i) => i.id === id);
		if (!it || lines.some((l) => l.name === it.name)) return;
		setLines((ls) => [...ls, { name: it.name, quantity: Math.max(1, it.minLevel * 2 - it.quantity), unit: it.unit, unitCost: it.unitCost }]);
		if (!supplier && it.supplierName) setSupplier(it.supplierName);
		setPick("");
	};
	const needsApproval = total > PO_APPROVAL_LIMIT;
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			width="lg"
			icon={ShoppingCartIcon}
			title="Order stock"
			subtitle="A purchase order goes to the supplier on WhatsApp or email"
			footerInfo={needsApproval ? `Over ${naira(PO_APPROVAL_LIMIT)} · you approve it, over ${naira(500_000)} the owner does` : "Under the limit · sends straight away"}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button variant="outline" className={btn.secondary} disabled={pending || lines.length === 0} onClick={() => run("Saved as draft", onClose, { tone: "info" })}>Save draft</Button><Button className={btn.primary} disabled={pending || !supplier || lines.length === 0} onClick={() => run(needsApproval ? `PO raised · ${naira(total)} waiting for approval` : `PO sent to ${supplier}`, onClose)}>{needsApproval ? "Raise for approval" : "Send order"}</Button></>}
		>
			<div className="flex flex-col gap-4">
				<FieldRow>
					<SelectField label="Supplier" value={supplier} onChange={setSupplier} options={suppliers.map((s) => ({ value: s.name, label: s.name, hint: s.terms }))} setupLink="suppliers" required />
					<TextField label="Expected on" type="date" value={expected} onChange={setExpected} />
				</FieldRow>
				<PanelSection title="Items">
					<SelectField label="Add item" value={pick} onChange={addLine} options={items.filter((i) => !supplier || i.supplierName === supplier || !i.supplierName).map((i) => ({ value: i.id, label: i.name, hint: `${i.quantity} ${i.unit} · min ${i.minLevel}` }))} placeholder="Pick from the stock list" />
					{lines.length === 0 ? (
						<Note tone="info">No items yet. Low items from this supplier are a good start.</Note>
					) : (
						<ul className="divide-y divide-line rounded-xl border border-line">
							{lines.map((l, idx) => (
								<li key={l.name} className="flex items-center gap-2 px-3 py-2 text-[13px]">
									<span className="min-w-0 flex-1 truncate font-medium text-ink">{l.name}</span>
									<input type="number" value={l.quantity} onChange={(e) => setLines((ls) => ls.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))} className={cn(input, "w-20 px-2 py-1 text-center")} />
									<span className="w-12 text-xs text-ink-3">{l.unit}</span>
									<span className="w-24 text-right text-ink-2">{naira(l.unitCost)}</span>
									<span className="w-24 text-right font-semibold text-ink">{naira(l.quantity * l.unitCost)}</span>
									<button type="button" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} className="text-ink-3 hover:text-danger" aria-label="Remove"><Trash2Icon className="size-4" /></button>
								</li>
							))}
						</ul>
					)}
				</PanelSection>
				<TotalsList rows={[{ label: plural(lines.length, "line"), value: naira(total) }, { label: "Delivery", value: "By supplier" }, { label: "Total", value: naira(total), strong: true }]} />
				{needsApproval && <Note>Over {naira(PO_APPROVAL_LIMIT)}: this order waits in Approvals before it is sent.</Note>}
			</div>
		</SidePanel>
	);
}

export function OrderPanel({ po, onClose, onReceive }: { po: PurchaseOrderRow | null; onClose: () => void; onReceive: (po: PurchaseOrderRow) => void }) {
	const { run, pending } = useDemoAction();
	const [cancel, setCancel] = useState(false);
	if (!po) return null;
	return (
		<>
			<SidePanel
				open
				onOpenChange={(o) => !o && onClose()}
				width="lg"
				icon={ShoppingCartIcon}
				title={`${po.number} · ${po.supplierName}`}
				subtitle={`Raised by ${po.createdBy} · ${fmtWhen(po.createdAt)}${po.expectedOn ? ` · expected ${fmtDay(po.expectedOn)}` : ""}`}
				footerInfo={<StatusPill tone={poTone[po.status]}>{poLabel[po.status]}</StatusPill>}
				footer={
					<>
						{po.status !== "RECEIVED" && po.status !== "CANCELLED" && <Button variant="outline" className={btn.dangerSoft} onClick={() => setCancel(true)}>Cancel order</Button>}
						{po.status === "PENDING_APPROVAL" && <Button className={btn.primary} disabled={pending} onClick={() => run(`${po.number} approved and sent to ${po.supplierName}`, onClose)}>Approve & send</Button>}
						{po.status === "DRAFT" && <Button className={btn.primary} disabled={pending} onClick={() => run(`${po.number} sent to ${po.supplierName}`, onClose)}>Send order</Button>}
						{po.status === "SENT" && <Button className={btn.primary} onClick={() => onReceive(po)}><TruckIcon className="size-4" /> Receive delivery</Button>}
						{po.status === "RECEIVED" && <Button variant="outline" className={btn.secondary} onClick={() => run("Printing…", undefined, { tone: "info" })}>Print</Button>}
					</>
				}
			>
				<div className="flex flex-col gap-5">
					<ul className="divide-y divide-line rounded-xl border border-line">
						{po.lines.map((l) => (
							<li key={l.name} className="flex items-center gap-3 px-3 py-[10px] text-[13px]"><span className="flex-1 font-medium text-ink">{l.name}</span><span className="text-ink-2">{l.quantity} {l.unit} × {naira(l.unitCost)}</span><span className="w-24 text-right font-semibold text-ink">{naira(l.quantity * l.unitCost)}</span></li>
						))}
					</ul>
					<TotalsList rows={[{ label: "Lines", value: String(po.lines.length) }, { label: "Total", value: naira(po.total), strong: true }]} />
					{po.status === "PENDING_APPROVAL" && <WhatHappens items={[`Over ${naira(PO_APPROVAL_LIMIT)} needs your OK${po.total > 500_000 ? ` · over ${naira(500_000)} goes to the owner` : ""}`, "Approving sends it to the supplier on WhatsApp", "Stock updates when the delivery is received"]} />}
				</div>
			</SidePanel>
			<ConfirmModal open={cancel} onOpenChange={setCancel} tone="danger" title={`Cancel ${po.number}?`} subtitle={po.supplierName} confirmLabel="Cancel order" pending={pending} onConfirm={() => run(`${po.number} cancelled · supplier told`, () => { setCancel(false); onClose(); }, { tone: "warning" })}>
				<WhatHappens tone="danger" items={["The supplier is told on WhatsApp", "Items stay below minimum until you order again"]} />
			</ConfirmModal>
		</>
	);
}

export function ReceivePanel({ po, onClose }: { po: PurchaseOrderRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [got, setGot] = useState<Record<string, number>>({});
	const [note, setNote] = useState("");
	if (!po) return null;
	const short = po.lines.filter((l) => (got[l.name] ?? l.quantity) < l.quantity);
	return (
		<SidePanel
			open
			onOpenChange={(o) => !o && onClose()}
			icon={TruckIcon}
			title="Receive delivery"
			subtitle={`${po.number} · ${po.supplierName}`}
			footerInfo={short.length ? `${plural(short.length, "line")} short · supplier credited` : "Everything as ordered"}
			footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending} onClick={() => run(`Delivery received · stock updated${short.length ? ` · ${plural(short.length, "short line")} noted` : ""}`, onClose)}>Receive into stock</Button></>}
		>
			<div className="flex flex-col gap-4">
				<ul className="divide-y divide-line rounded-xl border border-line">
					{po.lines.map((l) => (
						<li key={l.name} className="flex items-center gap-3 px-3 py-2 text-[13px]">
							<div className="min-w-0 flex-1"><p className="truncate font-medium text-ink">{l.name}</p><p className="text-xs text-ink-3">Ordered {l.quantity} {l.unit}</p></div>
							<input type="number" value={got[l.name] ?? l.quantity} onChange={(e) => setGot((g) => ({ ...g, [l.name]: Number(e.target.value) }))} className={cn(input, "w-24 px-2 py-1 text-center")} />
							<span className="w-10 text-xs text-ink-3">{l.unit}</span>
						</li>
					))}
				</ul>
				<TextareaField label="Note" value={note} onChange={setNote} placeholder="4 kg chicken short · credited" />
				<WhatHappens items={["Stock levels go up by what you received", "Short lines are credited against the supplier's next invoice", "The storekeeper and the finance team are told"]} />
			</div>
		</SidePanel>
	);
}

// ---- requests --------------------------------------------------------------------------------------

export function RequestPanel({ request, onClose }: { request: StockRequestRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	if (!request) return null;
	const openReq = request.status === "REQUESTED" || request.status === "PART_ISSUED";
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} icon={PackageOpenIcon} title={`Request from ${request.fromTeam}`} subtitle={`${request.requestedBy} · ${fmtWhen(request.createdAt)}`} footerInfo={<StatusPill tone={request.status === "ISSUED" ? "success" : request.status === "DECLINED" ? "danger" : request.status === "PART_ISSUED" ? "info" : "warning"}>{request.status === "REQUESTED" ? "Waiting" : request.status === "PART_ISSUED" ? "Part issued" : request.status === "ISSUED" ? "Issued" : "Declined"}</StatusPill>} footer={openReq && <><Button variant="outline" className={btn.dangerSoft} disabled={pending} onClick={() => run("Request declined · team told", onClose, { tone: "warning" })}>Decline</Button><Button className={btn.primary} disabled={pending} onClick={() => run(`Issued to ${request.fromTeam}`, onClose)}>Issue everything</Button></>}>
			<div className="flex flex-col gap-4">
				<ul className="divide-y divide-line rounded-xl border border-line">
					{request.lines.map((l) => (
						<li key={l.name} className="flex items-center gap-3 px-3 py-[10px] text-[13px]"><span className="flex-1 font-medium text-ink">{l.name}</span><span className="font-semibold text-ink">{l.quantity} {l.unit}</span></li>
					))}
				</ul>
				{request.note && <Note tone="info">{request.note}</Note>}
			</div>
		</SidePanel>
	);
}

// ---- counts ----------------------------------------------------------------------------------------

export function StartCountModal({ open, stores, onClose }: { open: boolean; stores: StoreRow[]; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [store, setStore] = useState("");
	const [who, setWho] = useState("");
	return (
		<Modal open={open} onOpenChange={(o) => !o && onClose()} icon={ClipboardCheckIcon} title="Start a stock count" subtitle="Counting freezes issues from that store until it is done" footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !store} onClick={() => run(`Count started · ${store} · sheet sent to the tablet`, onClose)}>Start count</Button></>}>
			<div className="flex flex-col gap-4">
				<ChoiceCards value={store} onChange={setStore} columns={2} options={stores.map((s) => ({ value: s.name, label: s.name, hint: `${s.items} items · ${s.keeper}` }))} />
				<SelectField label="Counted by" value={who} onChange={setWho} options={["Jide Alabi", "Segun Ajayi", "Grace Okafor", "Mariam Bello"]} placeholder="Storekeeper" />
				<WhatHappens items={["A count sheet opens on the store tablet", "Nothing can be issued from the store until the count is approved", "You see the variance before approving"]} />
			</div>
		</Modal>
	);
}

export function CountPanel({ count, onClose }: { count: StockCountRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	if (!count) return null;
	const lines = count.lines ?? [];
	return (
		<SidePanel open onOpenChange={(o) => !o && onClose()} width="lg" icon={ClipboardCheckIcon} title={`Stock count · ${count.storeName}`} subtitle={`Started by ${count.startedBy} · ${fmtWhen(count.startedAt)}`} footerInfo={count.variance != null ? `Variance ${count.variance} units` : "Counting in progress"} footer={count.status === "COUNTED" ? <><Button variant="outline" className={btn.secondary} disabled={pending} onClick={() => run("Recount requested", onClose, { tone: "info" })}>Ask for a recount</Button><Button className={btn.primary} disabled={pending} onClick={() => run("Count approved · levels corrected", onClose)}>Approve & correct levels</Button></> : count.status === "OPEN" ? <Button variant="outline" className={btn.secondary} disabled={pending} onClick={() => run("Reminder sent to the counter", onClose, { tone: "info" })}>Remind counter</Button> : undefined}>
			{lines.length === 0 ? (
				<Note tone="info">{count.status === "OPEN" ? "Counting on the tablet · results show here when it is done." : "Approved · levels were corrected."}</Note>
			) : (
				<table className="w-full text-left text-[13px]">
					<thead><tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="py-2">Item</th><th className="py-2 text-right">Expected</th><th className="py-2 text-right">Counted</th><th className="py-2 text-right">Diff</th></tr></thead>
					<tbody>
						{lines.map((l) => {
							const d = l.counted - l.expected;
							return <tr key={l.name} className="border-b border-line last:border-b-0"><td className="py-2 font-medium text-ink">{l.name}</td><td className="py-2 text-right text-ink-2">{l.expected}</td><td className="py-2 text-right text-ink">{l.counted}</td><td className={cn("py-2 text-right font-semibold", d < 0 ? "text-danger" : d > 0 ? "text-success" : "text-ink-3")}>{d === 0 ? "—" : d > 0 ? `+${d}` : d}</td></tr>;
						})}
					</tbody>
				</table>
			)}
		</SidePanel>
	);
}

// ---- suppliers -------------------------------------------------------------------------------------

export function SupplierPanel({ open, supplier, onClose }: { open: boolean; supplier?: SupplierRow | null; onClose: () => void }) {
	const { run, pending } = useDemoAction();
	const [form, setForm] = useState({ name: supplier?.name ?? "", contact: supplier?.contactName ?? "", phone: supplier?.phone ?? "", email: supplier?.email ?? "", terms: supplier?.terms ?? "Pay on delivery" });
	const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));
	return (
		<SidePanel open={open} onOpenChange={(o) => !o && onClose()} icon={supplier ? HandshakeIcon : PlusIcon} title={supplier ? supplier.name : "Add supplier"} subtitle={supplier ? `${supplier.items} items · last order ${fmtLongDate(supplier.lastOrder)}` : "Who you buy from"} footer={<><Button variant="outline" className={btn.secondary} onClick={onClose}>Cancel</Button><Button className={btn.primary} disabled={pending || !form.name} onClick={() => run(supplier ? "Supplier updated" : `${form.name} added`, onClose)}>{supplier ? "Save" : "Add supplier"}</Button></>}>
			<div className="flex flex-col gap-4">
				<TextField label="Supplier name" value={form.name} onChange={(v) => set("name", v)} required />
				<FieldRow>
					<TextField label="Contact person" value={form.contact} onChange={(v) => set("contact", v)} />
					<TextField label="Phone (WhatsApp)" value={form.phone} onChange={(v) => set("phone", v)} />
				</FieldRow>
				<TextField label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
				<SelectField label="Payment terms" value={form.terms} onChange={(v) => set("terms", v)} options={["Pay on delivery", "7 days", "14 days", "30 days"]} />
				{supplier && (
					<PanelSection title="Recent orders">
						<Note tone="info">Orders to this supplier show in Purchase orders. Items they supply are tagged in the stock list.</Note>
					</PanelSection>
				)}
			</div>
		</SidePanel>
	);
}

