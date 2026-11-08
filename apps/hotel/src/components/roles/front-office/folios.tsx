"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CreditCardIcon, MailIcon, PercentIcon, PlusIcon, PrinterIcon, ReceiptIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { Note, Timeline, TotalsList } from "@hospio/ui/shared/detail-list";
import { ChoiceCards, MoneyField, SelectField, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { ManagerMark } from "@hospio/ui/shared/row-actions";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import type { FolioLine, FolioRow, TerminalRow } from "@hospio/api/data/types";
import { giveDiscount, postCharge, staySummary, voidLine } from "@hospio/api/actions/folio";
import { useAction } from "@hospio/api/actions/use-action";
import { useDemoAction } from "@hospio/api/demo/actions";
import { cn } from "@hospio/ui/utils";
import { type PaymentTarget, TakePaymentPanel } from "./take-payment";

type Tab = "open" | "balance" | "closed" | "all";

export function folioPill(f: FolioRow) {
	if (f.status === "CLOSED") return <StatusPill tone="grey">Closed</StatusPill>;
	if (f.status === "CLOSED_WITH_BALANCE") return <StatusPill tone="danger">Closed · {naira(f.balance)} owed</StatusPill>;
	if (f.balance > 0) return <StatusPill tone="warning">{naira(f.balance)} due</StatusPill>;
	if (f.balance < 0) return <StatusPill tone="success">{naira(-f.balance)} credit</StatusPill>;
	return <StatusPill tone="success">Paid up</StatusPill>;
}

/** Front office 4.1–4.6 · Guest folios. `isManager` unlocks void/discount; others send them to the manager. */
export function FoliosScreen({ folios: initial, terminals, isManager = false, title = "Folios" }: { folios: FolioRow[]; terminals: TerminalRow[]; isManager?: boolean; title?: string }) {
	const [folios, setFolios] = useState(initial);
	const [openId, setOpenId] = useQueryState("open");
	const [tab, setTab] = useQueryState("tab");
	const [search, setSearch] = useState("");
	const [modal, setModal] = useState<"charge" | "discount" | "send" | null>(null);
	const [payTarget, setPayTarget] = useState<PaymentTarget | null>(null);
	const [payOpen, setPayOpen] = useState(false);
	const active = (tab ?? "open") as Tab;
	const lists: Record<Tab, FolioRow[]> = {
		open: folios.filter((f) => f.status === "OPEN"),
		balance: folios.filter((f) => f.balance > 0),
		closed: folios.filter((f) => f.status !== "OPEN"),
		all: folios,
	};
	const folio = folios.find((f) => f.id === openId) ?? null;
	const patch = (id: string, fn: (f: FolioRow) => FolioRow) => setFolios((xs) => xs.map((f) => (f.id === id ? fn(f) : f)));

	const columns = useMemo<ColumnDef<FolioRow, unknown>[]>(
		() => [
			{ accessorKey: "guestName", header: "Guest", cell: ({ row }) => <TwoLine primary={row.original.guestName} secondary={`${row.original.reference}${row.original.organizationName ? ` · ${row.original.organizationName}` : ""}`} /> },
			{ accessorKey: "roomNumber", header: "Room", cell: ({ row }) => <span className="font-medium">{row.original.roomNumber}</span> },
			{ accessorKey: "charges", header: "Charges", cell: ({ row }) => naira(row.original.charges + row.original.tax) },
			{ accessorKey: "payments", header: "Paid", cell: ({ row }) => <span className="text-success">{naira(row.original.payments)}</span> },
			{ accessorKey: "balance", header: "Balance", cell: ({ row }) => <span className={cn("font-semibold", row.original.balance > 0 ? "text-danger" : "text-ink")}>{naira(row.original.balance)}</span> },
			{ accessorKey: "status", header: "Status", cell: ({ row }) => folioPill(row.original), enableSorting: false },
			{ id: "actions", header: "", enableSorting: false, cell: ({ row }) => <div className="flex justify-end"><button type="button" className={`${btn.secondary} ${btn.small}`} onClick={(e) => { e.stopPropagation(); void setOpenId(row.original.id); }}>Open</button></div> },
		],
		[setOpenId],
	);

	return (
		<>
			<PageHeader title={title} subtitle={`${lists.open.length} open · ${naira(lists.balance.reduce((s, f) => s + f.balance, 0))} outstanding across ${plural(lists.balance.length, "folio")}`} />
			<Toolbar left={<PillTabs value={active} onChange={(k) => void setTab(k === "open" ? null : k)} tabs={[{ key: "open", label: "Open", count: lists.open.length }, { key: "balance", label: "With balance", count: lists.balance.length }, { key: "closed", label: "Closed", count: lists.closed.length }, { key: "all", label: "All", count: folios.length }]} />} right={<SearchBox value={search} onChange={setSearch} placeholder="Guest, room, reference…" />} />
			<DataTable columns={columns} data={lists[active]} search={search} onRowClick={(f) => void setOpenId(f.id)} emptyTitle={active === "closed" ? "No closed folios in this list" : active === "balance" ? "Nobody owes anything" : "No open folios"} emptyHint={active === "closed" ? "This list shows the folios open right now; a closed folio is on its booking under Bookings → Past." : active === "open" ? "A folio opens when a guest checks in." : undefined} />

			<SidePanel
				open={!!folio}
				onOpenChange={(o) => !o && void setOpenId(null)}
				title={folio ? `${folio.guestName} · Folio ${folio.reference}` : ""}
				subtitle={folio ? `Room ${folio.roomNumber} · opened ${fmtWhen(folio.openedAt)}${folio.organizationName ? ` · ${folio.organizationName} account` : ""}` : undefined}
				icon={ReceiptIcon}
				width="lg"
				footer={folio && (
					<>
						<button type="button" className={btn.secondary} onClick={() => setModal("send")}><PrinterIcon className="mr-1 inline size-4" /> Print or email</button>
						{folio.balance > 0 && folio.organizationName == null && <button type="button" className={btn.primary} onClick={() => { setPayTarget({ guestName: folio.guestName, roomNumber: folio.roomNumber, folioId: folio.id, amountDue: folio.balance }); setPayOpen(true); }}><CreditCardIcon className="mr-1 inline size-4" /> Take {naira(folio.balance)}</button>}
					</>
				)}
				footerInfo={folio && folioPill(folio)}
			>
				{folio && (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-3 gap-3">
							{[["Charges so far", naira(folio.charges + folio.tax), "text-ink"], ["Paid", naira(folio.payments), "text-success"], [folio.balance < 0 ? "In credit" : "Balance due now", naira(Math.abs(folio.balance)), folio.balance > 0 ? "text-danger" : "text-success"]].map(([l, v, c]) => (
								<div key={l} className="rounded-xl border border-line px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">{l}</p><p className={`text-lg font-bold ${c}`}>{v}</p></div>
							))}
						</div>
						<div className="flex flex-wrap gap-2">
							<button type="button" className={btn.secondary} onClick={() => setModal("charge")} disabled={folio.status !== "OPEN"}><PlusIcon className="mr-1 inline size-4" /> Post charge</button>
							<button type="button" className={btn.secondary} onClick={() => setModal("discount")} disabled={folio.status !== "OPEN"}><PercentIcon className="mr-1 inline size-4" /> Discount / void {!isManager && <ManagerMark className="ml-1" />}</button>
						</div>
						<PanelSection title="Lines">
							<table className="w-full text-left text-[13px]">
								<thead><tr className="border-b border-line text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3"><th className="py-2">When</th><th className="py-2">What</th><th className="py-2">By</th><th className="py-2 text-right">Amount</th></tr></thead>
								<tbody>
									{folio.lines.map((l) => (
										<tr key={l.id} className={cn("border-b border-line last:border-b-0", l.voided && "opacity-50 line-through")}>
											<td className="py-2 pr-2 text-xs text-ink-3">{fmtWhen(l.postedAt)}</td>
											<td className="py-2 pr-2"><p className="font-medium text-ink">{l.description}</p><p className="text-xs text-ink-3">{l.category}{l.tax ? ` · VAT ${naira(l.tax)}` : ""}{l.voidReason ? ` · voided: ${l.voidReason}` : ""}</p></td>
											<td className="py-2 pr-2 text-xs text-ink-2">{l.postedBy}</td>
											<td className={cn("py-2 text-right font-semibold", l.kind === "PAYMENT" || l.kind === "DISCOUNT" ? "text-success" : "text-ink")}>{l.kind === "PAYMENT" || l.kind === "DISCOUNT" ? "-" : ""}{naira(l.amount + (l.kind === "CHARGE" ? l.tax : 0))}</td>
										</tr>
									))}
								</tbody>
							</table>
							<TotalsList rows={[{ label: "Balance due now", value: naira(folio.balance), strong: true, tone: folio.balance > 0 ? "danger" : "success" }]} />
						</PanelSection>
						{folio.notes.length > 0 && (
							<PanelSection title="Notes">
								<Timeline items={folio.notes.map((n) => ({ at: fmtWhen(n.at), by: n.by, text: n.text }))} />
							</PanelSection>
						)}
					</div>
				)}
			</SidePanel>

			{folio && <PostChargeModal folio={folio} open={modal === "charge"} onOpenChange={(o) => !o && setModal(null)} onPosted={(updated) => patch(folio.id, () => updated)} />}
			{folio && <DiscountVoidModal folio={folio} open={modal === "discount"} onOpenChange={(o) => !o && setModal(null)} isManager={isManager} onApplied={(updated) => patch(folio.id, () => updated)} />}
			{folio && <SendFolioModal folio={folio} open={modal === "send"} onOpenChange={(o) => !o && setModal(null)} />}
			<TakePaymentPanel open={payOpen} onOpenChange={setPayOpen} target={payTarget} folios={folios} terminals={terminals} onDone={(p) => { if (payTarget?.folioId) patch(payTarget.folioId, (f) => ({ ...f, payments: f.payments + p.amount, balance: f.balance - p.amount, lines: [...f.lines, { id: `l-${Date.now()}`, kind: "PAYMENT", description: `Payment by ${p.method.toLowerCase()}`, category: "Payment", amount: p.amount, tax: 0, postedAt: new Date().toISOString(), postedBy: "You", source: "PAYMENT" }] })); }} />
		</>
	);
}

const categories = ["Restaurant", "Bar", "Laundry", "Minibar", "Late check-out", "Extra bed", "Damage", "Other"];

/** 4.3 Post charge. */
function PostChargeModal({ folio, open, onOpenChange, onPosted }: { folio: FolioRow; open: boolean; onOpenChange: (o: boolean) => void; onPosted: (updated: FolioRow) => void }) {
	const [category, setCategory] = useState("");
	const [desc, setDesc] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const { run, pending } = useAction();
	const amt = typeof amount === "number" ? amount : 0;
	const vat = ["Restaurant", "Bar"].includes(category) ? Math.round(amt * 0.075) : 0;
	return (
		<Modal open={open} onOpenChange={onOpenChange} title="Post a charge" subtitle={`${folio.guestName} · Room ${folio.roomNumber}`} icon={PlusIcon} footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!category || amt <= 0 || pending} onClick={() => { const line: FolioLine = { id: `l-${Date.now()}`, kind: "CHARGE", description: desc || category, category, amount: amt, tax: vat, postedAt: new Date().toISOString(), postedBy: "You", source: "FRONT_OFFICE" }; void run(() => postCharge(folio.id, { description: desc || category, amount: amt, tax: vat, category }, { ...folio, lines: [...folio.lines, line], charges: folio.charges + amt, tax: folio.tax + vat, balance: folio.balance + amt + vat }), `${naira(amt + vat)} posted to ${folio.guestName}'s folio`, (updated) => { onPosted(updated); setDesc(""); setAmount(""); onOpenChange(false); }); }}>Post {naira(amt + vat)}</button></>}>
			<div className="flex flex-col gap-4">
				<SelectField label="Category" value={category} onChange={setCategory} options={categories} setupLink="charge categories" />
				<TextField label="Description" value={desc} onChange={setDesc} placeholder="e.g. Late check-out to 3pm" />
				<MoneyField label="Amount" value={amount} onChange={setAmount} required hint={vat ? `VAT 7.5% adds ${naira(vat)}` : undefined} />
			</div>
		</Modal>
	);
}

/** 4.4 Discount / void — manager-only; others send a request. */
function DiscountVoidModal({ folio, open, onOpenChange, isManager, onApplied }: { folio: FolioRow; open: boolean; onOpenChange: (o: boolean) => void; isManager: boolean; onApplied: (updated: FolioRow) => void }) {
	const [kind, setKind] = useState<"DISCOUNT" | "VOID">("DISCOUNT");
	const [lineId, setLineId] = useState("");
	const [amount, setAmount] = useState<number | "">("");
	const [reason, setReason] = useState("");
	const demo = useDemoAction();
	const act = useAction();
	const pending = demo.pending || act.pending;
	const amt = typeof amount === "number" ? amount : 0;
	const line = folio.lines.find((l) => l.id === lineId);
	const needsOwner = amt > 50000;
	return (
		<Modal open={open} onOpenChange={onOpenChange} title={kind === "DISCOUNT" ? "Give a discount" : "Void a line"} subtitle={`${folio.guestName} · Folio ${folio.reference}`} icon={PercentIcon} footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!reason || (kind === "DISCOUNT" ? amt <= 0 : !lineId) || pending} onClick={() => {
					const done = () => { setReason(""); setAmount(""); onOpenChange(false); };
					if (!isManager) { void demo.run(`Sent to the ${needsOwner ? "owner" : "manager"} to approve`, done, { tone: "info" }); return; }
					if (kind === "VOID" && line) {
						void act.run(() => voidLine(folio.id, line.id, reason, { ...folio, charges: folio.charges - line.amount, tax: folio.tax - line.tax, balance: folio.balance - (line.amount + line.tax), lines: folio.lines.map((l) => (l.id === line.id ? { ...l, voided: true, voidReason: reason } : l)) }), "Line voided", (updated) => { onApplied(updated); done(); });
						return;
					}
					const discountLine: FolioLine = { id: `l-${Date.now()}`, kind: "DISCOUNT", description: `Discount · ${reason}`, category: "Adjustment", amount: amt, tax: 0, postedAt: new Date().toISOString(), postedBy: "Manager", source: "MANAGER" };
					void act.run(() => giveDiscount(folio.id, amt, reason, needsOwner ? folio : { ...folio, lines: [...folio.lines, discountLine], discounts: folio.discounts + amt, balance: folio.balance - amt }), needsOwner ? "Discount sent to the owner for approval" : `${naira(amt)} discount applied`, (updated) => { onApplied(updated); done(); });
				}}>{isManager && !needsOwner ? (kind === "DISCOUNT" ? "Apply discount" : "Void line") : "Send for approval"}</button></>} footerInfo={<span className="flex items-center gap-2"><ManagerMark /> {needsOwner ? "Over ₦50,000 goes to the owner" : "Logged in the activity log"}</span>}>
			<div className="flex flex-col gap-4">
				<ChoiceCards value={kind} onChange={setKind} columns={2} options={[{ value: "DISCOUNT", label: "Discount", hint: "Take an amount off the bill" }, { value: "VOID", label: "Void a line", hint: "Posted by mistake" }]} />
				{kind === "VOID" ? <SelectField label="Line" value={lineId} onChange={setLineId} options={folio.lines.filter((l) => l.kind === "CHARGE" && !l.voided).map((l) => ({ value: l.id, label: `${l.description} · ${naira(l.amount + l.tax)}` }))} /> : <MoneyField label="Discount amount" value={amount} onChange={setAmount} required />}
				<SelectField label="Reason" value={reason} onChange={setReason} options={["Guest complaint", "Posted by mistake", "Loyal guest", "Owner's guest", "Service issue", "Other"]} setupLink="reasons" />
				{!isManager && <Note tone="info">Only a manager can change a bill. Your request is sent with the reason and they're told right away.</Note>}
			</div>
		</Modal>
	);
}

/** 4.6 Print or email: the stay summary comes from folio-service; sending stays a demo until messaging is live. */
function SendFolioModal({ folio, open, onOpenChange }: { folio: FolioRow; open: boolean; onOpenChange: (o: boolean) => void }) {
	const [how, setHow] = useState<"PRINT" | "EMAIL" | "WHATSAPP">("PRINT");
	const [to, setTo] = useState(folio.guestEmail ?? folio.guestPhone ?? "");
	const [summary, setSummary] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const demo = useDemoAction();
	const act = useAction();
	useEffect(() => {
		if (!open) return;
		setCopied(false);
		void act.run(() => staySummary(folio.id), "Stay summary ready", (text) => setSummary(text));
	}, [open, folio.id, act.run]);
	const pending = demo.pending || act.pending;
	return (
		<Modal open={open} onOpenChange={onOpenChange} title="Print or send the folio" subtitle={`${folio.guestName} · ${naira(folio.charges + folio.tax)} charges`} icon={MailIcon} size="form" footer={<><button type="button" className={btn.secondary} onClick={() => onOpenChange(false)}>Close</button>{how === "PRINT" ? <button type="button" className={btn.primary} disabled={pending || !summary} onClick={() => { navigator.clipboard?.writeText(summary ?? "").then(() => setCopied(true)).catch(() => undefined); }}>{copied ? "Copied" : "Copy summary"}</button> : <button type="button" className={btn.primary} disabled={pending} onClick={() => void demo.run(`Folio sent by ${how === "EMAIL" ? "email" : "WhatsApp"}`, () => onOpenChange(false), { tone: "info" })}>Send</button>}</>}>
			<div className="flex flex-col gap-4">
				<ChoiceCards value={how} onChange={setHow} columns={3} options={[{ value: "PRINT", label: "Print / copy" }, { value: "WHATSAPP", label: "WhatsApp" }, { value: "EMAIL", label: "Email" }]} />
				{how !== "PRINT" && <TextField label={how === "EMAIL" ? "Email" : "WhatsApp number"} value={to} onChange={setTo} />}
				<TextareaField label="Stay summary" value={summary ?? (act.pending ? "Preparing the summary…" : "")} onChange={() => undefined} rows={10} hint={how === "PRINT" ? "Copy it to the desk printer or a document" : "Messaging is not connected yet · sending is a demo"} />
			</div>
		</Modal>
	);
}
