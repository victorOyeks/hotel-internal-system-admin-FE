"use client";

import {
	BedDoubleIcon,
	CheckCircle2Icon,
	CreditCardIcon,
	MoonIcon,
	PackageIcon,
	PlusIcon,
	ReceiptIcon,
	WineIcon,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	ChoiceCards,
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { naira, plural } from "@hospio/ui/shared/format";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import {
	chargeOrderToRoom,
	readOrder,
	startOrder,
} from "@hospio/api/actions/fnb";
import { closeTill } from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	BookingRow,
	CategoryRow,
	HappyHourRow,
	MenuItemRow,
	OrderRow,
	OutletRow,
	OutletSalesDayRow,
	OutletSettingsRow,
	StockItemRow,
	TerminalRow,
	TillRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import {
	type CartLine,
	MenuPicker,
	cartTotal,
} from "../shared-staff/menu-picker";
import {
	activeHappyHour,
	estimate,
	liveLines,
	roomLabel,
	sitsAt,
	toLineInputs,
	useOrderRows,
} from "../shared-staff/outlet-shared";
import { OrderPaymentPanel } from "../shared-staff/pos-payment";
import { RecentSales } from "../shared-staff/recent-sales";
import { SalePanel } from "../shared-staff/sale-panel";
import {
	ActionTile,
	BigButton,
	ShiftPill,
	StatLine,
} from "../shared-staff/tablet";

type Panel =
	| { kind: "sale" }
	| { kind: "pay"; id: string }
	| { kind: "done"; id: string; how: string }
	| { kind: "close" }
	| null;

/** Bar · Bar today (3262:11673): seats, tonight's totals, new sale → choices → charge to room / tab / pay → sale done; close shift. */
export function BarTodayScreen({
	outlet,
	orders,
	closed,
	menu,
	categories,
	happyHours,
	inHouse,
	stock,
	settings,
	terminals,
	sales,
	till,
}: {
	outlet: OutletRow | null;
	orders: OrderRow[];
	closed: OrderRow[];
	menu: MenuItemRow[];
	categories: CategoryRow[];
	happyHours: HappyHourRow[];
	inHouse: BookingRow[];
	stock: StockItemRow[];
	settings: OutletSettingsRow;
	terminals: TerminalRow[];
	sales: OutletSalesDayRow | null;
	till: TillRow | null;
}) {
	const { rows, put, apply } = useOrderRows(orders);
	const [closedRows, setClosedRows] = useState(closed);
	useEffect(() => setClosedRows(closed), [closed]);
	const [isNew, setIsNew] = useQueryState("new", parseAsString);
	const [saleId, setSaleId] = useQueryState("sale", parseAsString);
	const [panel, setPanel] = useState<Panel>(null);
	const [lines, setLines] = useState<CartLine[]>([]);
	const [tableId, setTableId] = useState("");
	const [settle, setSettle] = useState<"NOW" | "TAB" | "ROOM">("NOW");
	const [roomId, setRoomId] = useState("");
	const [name, setName] = useState("");
	const [counted, setCounted] = useState<number | "">("");
	const [shiftNote, setShiftNote] = useState("");
	const [roomError, setRoomError] = useState<string | null>(null);
	const { run, pending } = useAction();
	const outletName = outlet?.name ?? "Bar";
	const tables = (outlet?.tables ?? []).filter((t) => t.active);

	useEffect(() => {
		if (isNew && !panel) setPanel({ kind: "sale" });
	}, [isNew, panel]);
	const close = () => {
		setPanel(null);
		setRoomError(null);
		setShiftNote("");
		void setIsNew(null);
	};
	const startSale = (t?: string, how: "NOW" | "TAB" | "ROOM" = "NOW") => {
		setLines([]);
		setTableId(t ?? "");
		setSettle(how);
		setRoomId("");
		setName("");
		setRoomError(null);
		setPanel({ kind: "sale" });
		void setIsNew("1");
	};

	const happy = activeHappyHour(happyHours);
	const discount = happy?.discountPct ?? 0;
	const guest = inHouse.find((b) => b.id === roomId);
	const table = tables.find((t) => t.id === tableId);
	const total = cartTotal(lines, discount);
	const est = estimate(total, settings);
	const tabs = rows.filter(
		(o) =>
			o.kind === "TAB" && o.status !== "CLOSED" && o.status !== "CANCELLED",
	);
	const openTabsTotal = tabs.reduce((s, o) => s + o.total, 0);
	const mine =
		sales?.outlets.find((o) => o.outletId === outlet?.id) ?? sales?.outlets[0];
	const low = stock.filter((i) => i.quantity <= i.minLevel);
	const recent = [
		...rows.filter((o) => o.kind !== "TAB"),
		...closedRows.filter((c) => !rows.some((r) => r.id === c.id)),
	]
		.sort((a, b) => b.openedAt.localeCompare(a.openedAt))
		.slice(0, 8);
	// Opening a sale closes any other panel: only one is open at a time.
	useEffect(() => {
		if (saleId) setPanel(null);
	}, [saleId]);
	const current =
		panel && "id" in panel
			? (rows.find((o) => o.id === panel.id) ?? null)
			: null;
	const tabsOff = !settings.tabs;
	const roomOff = !settings.roomCharge;
	const expected = till?.expected ?? 0;

	const complete = () => {
		run(
			async () => {
				const started = await startOrder({
					outletId: outlet?.id ?? "bar",
					outletName,
					kind: settle === "TAB" ? "TAB" : table ? "DINE_IN" : "TAKEAWAY",
					tableId: table?.id,
					tableNo: table?.number,
					roomId: settle === "ROOM" ? guest?.roomId : undefined,
					roomNumber: settle === "ROOM" ? guest?.roomNumber : undefined,
					guestName:
						settle === "ROOM" ? guest?.guestName : name.trim() || undefined,
					lines: toLineInputs(lines, discount),
					vatPct: settings.vatPct,
					pricesIncludeTax: settings.pricesIncludeTax,
				});
				if (!started.ok || settle !== "ROOM" || !guest?.roomId) return started;
				const charged = await chargeOrderToRoom(
					started.data.id,
					guest.roomId,
					outletName,
				);
				if (!charged.ok) {
					// The sale exists but is not on the room: say why and take payment for it instead.
					put(started.data);
					setLines([]);
					const why = `Can't charge to room ${guest.roomNumber ?? ""}: ${charged.error}. Take payment instead`;
					setRoomError(why);
					setPanel({ kind: "pay", id: started.data.id });
					return { ok: false as const, error: why };
				}
				return {
					ok: true as const,
					data: charged.data ?? { ...started.data, chargedToRoom: true },
				};
			},
			settle === "TAB"
				? `Tab opened${table ? ` on ${table.number}` : ""}`
				: settle === "ROOM"
					? "Sale recorded"
					: "Sale started",
			(order) => {
				put(order);
				setLines([]);
				if (settle === "NOW") setPanel({ kind: "pay", id: order.id });
				else
					setPanel({
						kind: "done",
						id: order.id,
						how:
							settle === "TAB"
								? "Tab opened · add more from Open tabs"
								: `Charged to room ${order.roomNumber ?? guest?.roomNumber ?? ""}`,
					});
			},
		);
	};

	const closeShift = () =>
		till
			? run(
					() =>
						closeTill(
							till.id,
							{
								countedCash: typeof counted === "number" ? counted : expected,
								note: shiftNote.trim() || undefined,
							},
							till,
						),
					"Shift closed · till sent to Finance",
					close,
				)
			: undefined;

	const stats = mine ?? {
		sales: 0,
		chargedToRooms: 0,
		paidAtOutlet: 0,
		cancelled: 0,
		orders: 0,
		byMethod: {} as Record<string, number>,
	};

	return (
		<>
			<PageHeader
				title="Bar today"
				subtitle={`${outletName}${happy ? ` · happy hour now, ${happy.discountPct}% off` : happyHours.find((h) => h.active) ? ` · happy hour ${happyHours.find((h) => h.active)?.from} – ${happyHours.find((h) => h.active)?.to}` : ""}`}
			>
				<Link
					href="/dashboard/payments"
					className="flex h-12 items-center gap-2 rounded-control border border-line bg-card px-5 text-[15px] font-semibold text-ink hover:bg-subtle"
				>
					<CreditCardIcon className="size-5" /> My payments
				</Link>
				<ShiftPill until="1am" />
			</PageHeader>
			{!outlet && (
				<Note tone="warning">
					No bar is set up for this hotel yet. The manager adds one in Hotel
					setup → Restaurants & tables.
				</Note>
			)}
			<div className="flex gap-3">
				<ActionTile
					icon={PlusIcon}
					label="New sale"
					onClick={() => startSale()}
					tone="brand"
				/>
				<ActionTile
					icon={ReceiptIcon}
					label={`Open tabs · ${tabs.length}`}
					href="/dashboard/tabs"
				/>
				<ActionTile
					icon={BedDoubleIcon}
					label="Charge to a room"
					onClick={() => startSale(undefined, "ROOM")}
				/>
				<ActionTile
					icon={PackageIcon}
					label="Count stock"
					href="/dashboard/stock?tab=count"
				/>
				<ActionTile
					icon={MoonIcon}
					label="Close shift"
					onClick={() => {
						setCounted("");
						setPanel({ kind: "close" });
					}}
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-[1fr_340px]">
				<SectionCard
					title={`Seats · ${outletName}`}
					subtitle="Tap a seat to start a sale or open its tab"
					bodyClassName="gap-3 pt-2"
				>
					{tables.length === 0 ? (
						<Note tone="info">
							No seats yet. Add them in Hotel setup → Restaurants & tables.
						</Note>
					) : (
						<div className="grid grid-cols-4 gap-2">
							{tables.map((t) => {
								const tab = tabs.find((o) => sitsAt(o, t));
								return tab ? (
									<Link
										key={t.id}
										href={`/dashboard/tabs?open=${tab.id}`}
										className="flex h-[68px] flex-col items-center justify-center rounded-control border border-brand bg-brand-soft/40 text-center"
									>
										<span className="text-[15px] font-bold text-ink">
											{t.number}
										</span>
										<span className="text-xs text-ink-2">
											{tab.guestName ?? "Tab"} · {naira(tab.total)}
										</span>
									</Link>
								) : (
									<button
										key={t.id}
										type="button"
										onClick={() => startSale(t.id)}
										className={cn(
											"flex h-[68px] flex-col items-center justify-center rounded-control border border-line bg-card text-center hover:bg-subtle",
										)}
									>
										<span className="text-[15px] font-bold text-ink">
											{t.number}
										</span>
										<span className="text-xs text-ink-3">Free</span>
									</button>
								);
							})}
						</div>
					)}
					<p className="text-xs text-ink-3">
						Seats and names come from Hotel setup → Restaurants & tables
					</p>
				</SectionCard>
				<div className="flex flex-col gap-4">
					<SectionCard title="Tonight so far" bodyClassName="pt-1">
						<StatLine label="Sales" value={naira(stats.sales)} />
						<StatLine label="Open tabs" value={naira(openTabsTotal)} />
						<StatLine
							label="Charged to rooms"
							value={naira(stats.chargedToRooms)}
						/>
						<StatLine
							label="Happy hour"
							value={
								happy
									? `Now · ${happy.discountPct}% off`
									: happyHours.find((h) => h.active)
										? `${happyHours.find((h) => h.active)?.from} – ${happyHours.find((h) => h.active)?.to}`
										: "None set"
							}
							tone="warning"
						/>
					</SectionCard>
					{low.length > 0 && (
						<div className="flex flex-col gap-3 rounded-card border border-[#dbab00]/40 bg-warning-soft p-5">
							<p className="text-[15px] font-bold text-ink">Running low</p>
							<ul className="text-[13px] text-ink-2">
								{low.map((i) => (
									<li key={i.id}>
										{i.name} · {i.quantity} {i.unit} left (min {i.minLevel})
									</li>
								))}
							</ul>
							<Link
								href="/dashboard/stock"
								className="flex h-11 items-center justify-center gap-2 rounded-control border border-line bg-card text-[15px] font-semibold text-ink"
							>
								<PackageIcon className="size-4" /> Ask the store
							</Link>
						</div>
					)}
				</div>
			</div>
			<RecentSales orders={recent} bar onOpen={(id) => void setSaleId(id)} />

			<SalePanel
				saleId={panel ? null : saleId}
				onClose={() => void setSaleId(null)}
				desk="BAR"
				terminals={terminals}
				inHouse={inHouse}
			/>

			{/* New sale */}
			<SidePanel
				open={panel?.kind === "sale"}
				onOpenChange={(o) => !o && close()}
				title="New sale"
				subtitle={
					table
						? `${table.number} · pick the drinks`
						: "Pick the drinks, then how they pay"
				}
				icon={WineIcon}
				width="lg"
				footerInfo={
					lines.length
						? `${plural(
								lines.reduce((s, l) => s + l.qty, 0),
								"drink",
							)} · ${naira(est.total)}`
						: "Nothing yet"
				}
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={
								!outlet ||
								lines.length === 0 ||
								(settle === "ROOM" && (!guest || roomOff)) ||
								(settle === "TAB" && tabsOff)
							}
							onClick={complete}
						>
							{settle === "NOW"
								? "Take payment"
								: settle === "TAB"
									? "Open a tab"
									: "Charge to room"}
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-5">
					<div className="grid grid-cols-2 gap-3">
						<SelectField
							label="Seat"
							value={tableId}
							onChange={setTableId}
							options={tables
								.filter(
									(t) => !tabs.some((o) => sitsAt(o, t)) || settle !== "TAB",
								)
								.map((t) => ({ value: t.id, label: t.number }))}
							placeholder="Walk-up"
						/>
						<TextField
							label="Name (optional)"
							value={name}
							onChange={setName}
							placeholder="For the tab"
						/>
					</div>
					<MenuPicker
						menu={menu}
						categories={categories}
						lines={lines}
						onChange={setLines}
						discountPct={discount}
					/>
					<PanelSection title="How they pay">
						<ChoiceCards
							value={settle}
							onChange={setSettle}
							columns={3}
							options={[
								{ value: "NOW", label: "Pay now" },
								{
									value: "TAB",
									label: "Open a tab",
									hint: tabsOff
										? "Switched off"
										: `Limit ${naira(settings.tabLimit)}`,
									disabled: tabsOff,
								},
								{
									value: "ROOM",
									label: "Charge to room",
									hint: roomOff ? "Switched off" : "Hotel guest",
									disabled: roomOff,
								},
							]}
						/>
						{settle === "ROOM" && (
							<SelectField
								label="Hotel guest"
								value={roomId}
								onChange={(v) => {
									setRoomId(v);
									setRoomError(null);
								}}
								options={inHouse.map((b) => ({
									value: b.id,
									label: roomLabel(b),
								}))}
								placeholder="Which room"
								required
							/>
						)}
						{settle === "ROOM" && guest && (
							<WhatHappens
								items={[
									`${naira(est.total)} goes on ${guest.guestName}'s folio`,
									"The bar checks the room has a guest and an open bill",
									"Front office collects it at check-out",
								]}
							/>
						)}
						{settle === "TAB" && (
							<Note tone="info">
								The tab shows on Open tabs. When it reaches{" "}
								{naira(settings.tabLimit)} the guest must pay before adding
								more.
							</Note>
						)}
						{roomError && <Note tone="danger">{roomError}</Note>}
					</PanelSection>
				</div>
			</SidePanel>

			{/* Pay */}
			<OrderPaymentPanel
				open={panel?.kind === "pay" && !!current}
				onOpenChange={(o) => !o && close()}
				desk="BAR"
				terminals={terminals}
				payment={
					current
						? {
								orderId: current.id,
								guestName: current.guestName ?? "Bar guest",
								amount: current.total,
								description: `${current.number} · ${plural(
									liveLines(current).reduce((s, l) => s + l.qty, 0),
									"drink",
								)}`,
							}
						: null
				}
				onDone={(p) => {
					if (!current) return;
					const how =
						p.status === "APPROVED"
							? `Paid by ${p.method.toLowerCase()} · receipt sent`
							: `${naira(p.amount)} by ${p.method.toLowerCase()} is processing`;
					void readOrder(current.id, outletName).then((r) => {
						if (r.ok && r.data) {
							put(r.data);
							if (r.data.status === "CLOSED")
								setClosedRows((c) => [
									r.data as OrderRow,
									...c.filter((x) => x.id !== current.id),
								]);
						} else if (p.status === "APPROVED")
							apply(current.id, null, (x) => ({
								...x,
								paid: true,
								status: "CLOSED",
							}));
					});
					setPanel({ kind: "done", id: current.id, how });
				}}
			/>

			{/* Sale done */}
			<SidePanel
				open={panel?.kind === "done" && !!current}
				onOpenChange={(o) => !o && close()}
				title="Sale done"
				icon={CheckCircle2Icon}
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Back to bar
						</BigButton>
						<BigButton onClick={() => startSale()}>Another sale</BigButton>
					</>
				}
			>
				{current && panel?.kind === "done" && (
					<div className="flex flex-col items-center gap-4 py-6 text-center">
						<CheckCircle2Icon className="size-14 text-success" />
						<p className="text-2xl font-bold text-ink">
							{naira(current.total)}
						</p>
						<p className="text-[15px] text-ink-2">
							{current.number} · {panel.how}
						</p>
						<TotalsList
							className="w-full text-left"
							rows={liveLines(current).map((l) => ({
								label: `${l.qty} × ${l.name}`,
								value: naira(l.price * l.qty),
							}))}
						/>
					</div>
				)}
			</SidePanel>

			{/* Close shift */}
			<SidePanel
				open={panel?.kind === "close"}
				onOpenChange={(o) => !o && close()}
				title="Close shift"
				subtitle="Count the till, hand over, and the night's sales go to Finance"
				icon={MoonIcon}
				footer={
					<>
						<BigButton tone="secondary" onClick={close}>
							Not yet
						</BigButton>
						<BigButton
							pending={pending}
							disabled={
								tabs.length > 0 ||
								!till ||
								counted === "" ||
								(counted !== expected && !shiftNote.trim())
							}
							onClick={closeShift}
						>
							Close shift
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<TotalsList
						rows={[
							{ label: "Card", value: naira(stats.byMethod.CARD ?? 0) },
							{ label: "Transfer", value: naira(stats.byMethod.TRANSFER ?? 0) },
							{ label: "Cash sales", value: naira(stats.byMethod.CASH ?? 0) },
							{ label: "Charged to rooms", value: naira(stats.chargedToRooms) },
							...(stats.cancelled
								? [{ label: "Cancelled", value: String(stats.cancelled) }]
								: []),
							{
								label: "Sales tonight",
								value: naira(stats.sales),
								strong: true,
							},
						]}
					/>
					{till ? (
						<TotalsList
							rows={[
								{ label: "Opening float", value: naira(till.openingFloat) },
								{
									label: "Cash in the till (expected)",
									value: naira(expected),
									strong: true,
								},
							]}
						/>
					) : (
						<Note tone="warning">
							Your till is not open.{" "}
							<Link href="/dashboard/till" className="font-semibold underline">
								Open it on the Till screen
							</Link>{" "}
							to count and close it here.
						</Note>
					)}
					<MoneyField
						label="Cash counted"
						value={counted}
						onChange={setCounted}
						hint="Finance sees any difference from what's expected"
						disabled={!till}
					/>
					{typeof counted === "number" && till && counted !== expected && (
						<Note tone={counted < expected ? "danger" : "warning"}>
							{counted < expected ? "Short" : "Over"} by{" "}
							{naira(Math.abs(counted - expected))}. Finance is told.
						</Note>
					)}
					{typeof counted === "number" && till && counted !== expected && (
						<TextareaField
							label="Why the cash is different"
							value={shiftNote}
							onChange={setShiftNote}
							rows={2}
							placeholder="e.g. change given wrongly on a ₦5,000 note"
							hint="Needed when the count is short or over"
						/>
					)}
					{tabs.length > 0 ? (
						<Note tone="danger">
							{plural(tabs.length, "tab")} still open.{" "}
							<Link href="/dashboard/tabs" className="font-semibold underline">
								Settle or move them first
							</Link>
							.
						</Note>
					) : (
						<WhatHappens
							items={[
								"Your till closes and Finance counts it against the sales",
								"Stock used tonight was taken from the bar store as each sale was settled",
								"The night audit sees no open tabs from the bar",
							]}
						/>
					)}
				</div>
			</SidePanel>
		</>
	);
}
