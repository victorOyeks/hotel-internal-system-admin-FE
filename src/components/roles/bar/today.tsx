"use client";

import { BedDoubleIcon, CheckCircle2Icon, CreditCardIcon, MoonIcon, PackageIcon, PlusIcon, ReceiptIcon, WineIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Note, TotalsList } from "@/components/shared/detail-list";
import { ChoiceCards, SelectField, TextField } from "@/components/shared/field";
import { fmtTime, naira, plural } from "@/components/shared/format";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { PanelSection, SidePanel, WhatHappens } from "@/components/shared/side-panel";
import { StatusPill } from "@/components/shared/status-pill";
import type { BookingRow, MenuItemRow, OrderRow, StockItemRow } from "@/lib/data/types";
import { useDemoAction } from "@/lib/demo/actions";
import type { SeatRow } from "@/lib/demo/fixtures/tablet";
import { cn } from "@/lib/utils";
import { type CartLine, MenuPicker, cartTotal } from "../shared-staff/menu-picker";
import { PaymentFlow, type PosMethod } from "../shared-staff/pos-payment";
import { ActionTile, BigButton, ShiftPill, StatLine } from "../shared-staff/tablet";

type Panel = { kind: "sale"; seat?: string } | { kind: "pay" } | { kind: "done"; method: PosMethod | "ROOM" | "TAB" } | { kind: "close" } | null;

/** Bar · Bar today (3262:11673): seats, tonight's totals, new sale → choices → charge to room / tab / pay → sale done; close shift. */
export function BarTodayScreen({ orders, menu, inHouse, seats, stock }: { orders: OrderRow[]; menu: MenuItemRow[]; inHouse: BookingRow[]; seats: SeatRow[]; stock: StockItemRow[] }) {
	const [sales, setSales] = useState(orders);
	const [isNew, setIsNew] = useQueryState("new", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const [lines, setLines] = useState<CartLine[]>([]);
	const [seat, setSeat] = useState("");
	const [settle, setSettle] = useState<"NOW" | "TAB" | "ROOM">("NOW");
	const [roomId, setRoomId] = useState("");
	const [name, setName] = useState("");
	const { run, pending } = useDemoAction();

	useEffect(() => { if (isNew && !panel) setPanel({ kind: "sale" }); }, [isNew, panel]);
	const close = () => { setPanel(null); void setIsNew(null); };
	const startSale = (s?: string) => { setLines([]); setSeat(s ?? ""); setSettle("NOW"); setRoomId(""); setName(""); setPanel({ kind: "sale", seat: s }); void setIsNew("1"); };

	const guest = inHouse.find((b) => b.id === roomId);
	const total = cartTotal(lines);
	const closed = sales.filter((o) => o.status === "CLOSED" || o.paid);
	const tabs = sales.filter((o) => o.kind === "TAB" && o.status === "OPEN");
	const totalSales = closed.reduce((s, o) => s + o.total, 0) + 184500;
	const low = stock.filter((i) => i.quantity <= i.minLevel);

	const finish = (method: PosMethod | "ROOM" | "TAB") => {
		const o: OrderRow = { id: `or-${Date.now()}`, number: `B-0${236 + sales.length}`, outlet: "Bar", kind: method === "TAB" ? "TAB" : "DINE_IN", tableNo: seat || undefined, roomNumber: method === "ROOM" ? guest?.roomNumber : undefined, guestName: guest?.guestName ?? (name || undefined), status: method === "TAB" ? "OPEN" : "CLOSED", lines: lines.map((l) => ({ name: l.item.name, qty: l.qty, price: l.item.price, options: l.option, status: "SERVED" })), subtotal: total, tax: 0, total, paid: method !== "TAB" && method !== "ROOM", chargedToRoom: method === "ROOM", openedBy: "Segun Ajayi", openedAt: new Date().toISOString() };
		setSales((s) => [o, ...s]);
		setPanel({ kind: "done", method });
	};

	return (
		<>
			<PageHeader title="Bar today" subtitle="Lobby bar · Simpas Ikeja · happy hour 5pm – 7pm">
				<Link href="/dashboard/payments" className="flex h-12 items-center gap-2 rounded-control border border-line bg-card px-5 text-[15px] font-semibold text-ink hover:bg-subtle"><CreditCardIcon className="size-5" /> My payments</Link>
				<ShiftPill until="1am" />
			</PageHeader>
			<div className="flex gap-3">
				<ActionTile icon={PlusIcon} label="New sale" onClick={() => startSale()} tone="brand" />
				<ActionTile icon={ReceiptIcon} label={`Open tabs · ${tabs.length}`} href="/dashboard/tabs" />
				<ActionTile icon={BedDoubleIcon} label="Charge to a room" onClick={() => { startSale(); setSettle("ROOM"); }} />
				<ActionTile icon={PackageIcon} label="Count stock" href="/dashboard/stock?tab=count" />
				<ActionTile icon={MoonIcon} label="Close shift" onClick={() => setPanel({ kind: "close" })} />
			</div>
			<div className="grid gap-4 xl:grid-cols-[1fr_340px]">
				<SectionCard title="Seats · Lobby bar" subtitle="Tap a seat to start a sale or open its tab" bodyClassName="gap-3 pt-2">
					<div className="grid grid-cols-4 gap-2">
						{seats.map((s) => {
							const tab = s.orderId ? sales.find((o) => o.id === s.orderId) : undefined;
							return s.state === "TAB" && tab ? (
								<Link key={s.id} href={`/dashboard/tabs?open=${tab.id}`} className="flex h-[68px] flex-col items-center justify-center rounded-control border border-brand bg-brand-soft/40 text-center"><span className="text-[15px] font-bold text-ink">{s.name}</span><span className="text-xs text-ink-2">{s.who} · {naira(tab.total)}</span></Link>
							) : (
								<button key={s.id} type="button" disabled={s.state === "RESERVED"} onClick={() => startSale(s.name)} className={cn("flex h-[68px] flex-col items-center justify-center rounded-control border text-center", s.state === "RESERVED" ? "border-[#dbab00]/50 bg-warning-soft" : "border-line bg-card hover:bg-subtle")}><span className="text-[15px] font-bold text-ink">{s.name}</span><span className="text-xs text-ink-3">{s.state === "RESERVED" ? s.who : "Free"}</span></button>
							);
						})}
					</div>
					<p className="text-xs text-ink-3">Seats and names come from Hotel setup → Restaurants & tables</p>
				</SectionCard>
				<div className="flex flex-col gap-4">
					<SectionCard title="Tonight so far" bodyClassName="pt-1">
						<StatLine label="Sales" value={naira(totalSales)} />
						<StatLine label="Open tabs" value={naira(tabs.reduce((s, o) => s + o.total, 0))} />
						<StatLine label="Charged to rooms" value={naira(sales.filter((o) => o.chargedToRoom).reduce((s, o) => s + o.total, 0) + 25350)} />
						<StatLine label="Happy hour" value="5pm – 7pm" tone="warning" />
					</SectionCard>
					{low.length > 0 && (
						<div className="flex flex-col gap-3 rounded-card border border-[#dbab00]/40 bg-warning-soft p-5">
							<p className="text-[15px] font-bold text-ink">Running low</p>
							<ul className="text-[13px] text-ink-2">{low.map((i) => <li key={i.id}>{i.name} · {i.quantity} {i.unit} left (min {i.minLevel})</li>)}</ul>
							<Link href="/dashboard/stock" className="flex h-11 items-center justify-center gap-2 rounded-control border border-line bg-card text-[15px] font-semibold text-ink"><PackageIcon className="size-4" /> Ask the store</Link>
						</div>
					)}
				</div>
			</div>
			<SectionCard title="Recent sales" flush>
				<ul className="divide-y divide-line">
					{sales.filter((o) => o.outlet === "Bar").slice(0, 8).map((o) => (
						<li key={o.id} className="flex items-center gap-3 px-5 py-3">
							<span className="w-16 text-[15px] font-bold text-ink">{o.number}</span>
							<span className="min-w-0 flex-1 text-[15px] text-ink">{o.lines.map((l) => `${l.qty} ${l.name}`).join(", ")}<span className="block text-xs text-ink-3">{o.tableNo ?? "—"}{o.guestName ? ` · ${o.guestName}` : ""} · {fmtTime(o.openedAt)}</span></span>
							<span className="text-[15px] font-semibold text-ink">{naira(o.total)}</span>
							{o.kind === "TAB" && o.status === "OPEN" ? <StatusPill tone="brand">Tab open</StatusPill> : o.chargedToRoom ? <StatusPill tone="info">Room {o.roomNumber}</StatusPill> : <StatusPill tone="success">Paid</StatusPill>}
						</li>
					))}
				</ul>
			</SectionCard>

			{/* New sale */}
			<SidePanel open={panel?.kind === "sale"} onOpenChange={(o) => !o && close()} title="New sale" subtitle={seat ? `${seat} · pick the drinks` : "Pick the drinks, then how they pay"} icon={WineIcon} width="lg"
				footerInfo={lines.length ? `${plural(lines.reduce((s, l) => s + l.qty, 0), "drink")} · ${naira(total)}` : "Nothing yet"}
				footer={<><BigButton tone="secondary" onClick={close}>Cancel</BigButton><BigButton pending={pending} disabled={lines.length === 0 || (settle === "ROOM" && !guest)} onClick={() => (settle === "NOW" ? setPanel({ kind: "pay" }) : settle === "TAB" ? run(`Tab opened${seat ? ` on ${seat}` : ""}`, () => finish("TAB")) : run(`${naira(total)} charged to room ${guest?.roomNumber}`, () => finish("ROOM")))}>{settle === "NOW" ? "Take payment" : settle === "TAB" ? "Open a tab" : "Charge to room"}</BigButton></>}>
				<div className="flex flex-col gap-5">
					<div className="grid grid-cols-2 gap-3">
						<SelectField label="Seat" value={seat} onChange={setSeat} options={seats.filter((s) => s.state === "FREE").map((s) => s.name)} placeholder="Walk-up" />
						<TextField label="Name (optional)" value={name} onChange={setName} placeholder="For the tab" />
					</div>
					<MenuPicker menu={menu} lines={lines} onChange={setLines} />
					<PanelSection title="How they pay">
						<ChoiceCards value={settle} onChange={setSettle} columns={3} options={[{ value: "NOW", label: "Pay now" }, { value: "TAB", label: "Open a tab", hint: "Limit ₦50,000" }, { value: "ROOM", label: "Charge to room", hint: "Hotel guest" }]} />
						{settle === "ROOM" && <SelectField label="Hotel guest" value={roomId} onChange={setRoomId} options={inHouse.map((b) => ({ value: b.id, label: `${b.roomNumber} · ${b.guestName}` }))} placeholder="Which room" required />}
						{settle === "ROOM" && guest && <WhatHappens items={[`${naira(total)} goes on ${guest.guestName}'s folio`, "The guest signs on this tablet", "Front office collects it at check-out"]} />}
						{settle === "TAB" && <Note tone="info">The tab shows on Open tabs. When it passes ₦50,000 the guest must pay before adding more.</Note>}
					</PanelSection>
				</div>
			</SidePanel>

			{/* Pay */}
			<SidePanel open={panel?.kind === "pay"} onOpenChange={(o) => !o && setPanel({ kind: "sale" })} title="Take payment" subtitle={lines.map((l) => `${l.qty} ${l.item.name}`).join(", ")} icon={CreditCardIcon}>
				<PaymentFlow amount={total} description={`Bar · ${plural(lines.reduce((s, l) => s + l.qty, 0), "drink")}`} terminal="Bar POS" onDone={(m) => finish(m)} />
			</SidePanel>

			{/* Sale done */}
			<SidePanel open={panel?.kind === "done"} onOpenChange={(o) => !o && close()} title="Sale done" icon={CheckCircle2Icon}
				footer={<><BigButton tone="secondary" onClick={close}>Back to bar</BigButton><BigButton onClick={() => startSale()}>Another sale</BigButton></>}>
				{panel?.kind === "done" && (
					<div className="flex flex-col items-center gap-4 py-6 text-center">
						<CheckCircle2Icon className="size-14 text-success" />
						<p className="text-2xl font-bold text-ink">{naira(total)}</p>
						<p className="text-[15px] text-ink-2">{panel.method === "TAB" ? "Tab opened · add more from Open tabs" : panel.method === "ROOM" ? `Charged to room ${guest?.roomNumber} · signed` : `Paid by ${panel.method.toLowerCase()} · receipt sent`}</p>
						<TotalsList className="w-full text-left" rows={lines.map((l) => ({ label: `${l.qty} × ${l.item.name}`, value: naira(l.item.price * l.qty) }))} />
					</div>
				)}
			</SidePanel>

			{/* Close shift */}
			<SidePanel open={panel?.kind === "close"} onOpenChange={(o) => !o && close()} title="Close shift" subtitle="Count the till, hand over, and the night's sales go to Finance" icon={MoonIcon}
				footer={<><BigButton tone="secondary" onClick={close}>Not yet</BigButton><BigButton pending={pending} disabled={tabs.length > 0} onClick={() => run("Shift closed · till sent to Finance", close)}>Close shift</BigButton></>}>
				<div className="flex flex-col gap-4">
					<TotalsList rows={[{ label: "Card", value: naira(98500) }, { label: "Transfer", value: naira(39650) }, { label: "Cash expected", value: naira(46500) }, { label: "Charged to rooms", value: naira(25350) }, { label: "Sales tonight", value: naira(totalSales), strong: true }]} />
					<TextField label="Cash counted" value="" onChange={() => undefined} placeholder="₦" hint="Finance sees any difference from what's expected" />
					{tabs.length > 0 ? <Note tone="danger">{plural(tabs.length, "tab")} still open. Close or move them first.</Note> : <WhatHappens items={["Your till closes and Finance counts it against the sales", "Stock used tonight is deducted from the bar store", "You are clocked out"]} />}
				</div>
			</SidePanel>
		</>
	);
}
