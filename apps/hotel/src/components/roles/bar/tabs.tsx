"use client";

import {
	ArrowRightLeftIcon,
	CreditCardIcon,
	PlusIcon,
	ReceiptIcon,
	XIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { SelectField } from "@hospio/ui/shared/field";
import { fmtTime, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import {
	addOrderLines,
	cancelOrderLine,
	chargeOrderToRoom,
	moveTab,
	readOrder,
} from "@hospio/api/actions/fnb";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	BookingRow,
	CategoryRow,
	HappyHourRow,
	MenuItemRow,
	OrderRow,
	OutletRow,
	OutletSettingsRow,
	TerminalRow,
} from "@hospio/api/data/types";
import {
	type CartLine,
	MenuPicker,
	cartTotal,
} from "../shared-staff/menu-picker";
import {
	ReasonModal,
	activeHappyHour,
	liveLines,
	roomLabel,
	sitsAt,
	toLineInputs,
	useOrderRows,
} from "../shared-staff/outlet-shared";
import { OrderPaymentPanel } from "../shared-staff/pos-payment";
import {
	BigButton,
	BoardCard,
	ShiftPill,
	minutesSince,
} from "../shared-staff/tablet";

type Sub = "add" | "move" | "pay" | "room" | null;

/** Bar · Open tabs (3262:12915), tab details (3262:13019), move tab (3262:13168), settle by payment or by room. */
export function BarTabsScreen({
	outlet,
	orders,
	closedTabs,
	menu,
	categories,
	happyHours,
	inHouse,
	settings,
	terminals,
}: {
	outlet: OutletRow | null;
	orders: OrderRow[];
	closedTabs: number;
	menu: MenuItemRow[];
	categories: CategoryRow[];
	happyHours: HappyHourRow[];
	inHouse: BookingRow[];
	settings: OutletSettingsRow;
	terminals: TerminalRow[];
}) {
	const { rows, put, apply } = useOrderRows(orders);
	const [open, setOpen] = useQueryState("open", parseAsString);
	const [orderParam, setOrderParam] = useQueryState("order", parseAsString);
	const [sub, setSub] = useState<Sub>(null);
	const [lines, setLines] = useState<CartLine[]>([]);
	const [to, setTo] = useState("");
	const [roomId, setRoomId] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [cancel, setCancel] = useState<{ lineId: string; name: string } | null>(
		null,
	);
	const { run, pending } = useAction();
	const outletName = outlet?.name ?? "Bar";
	const LIMIT = settings.tabLimit;

	const tabs = rows.filter(
		(o) =>
			o.kind === "TAB" && o.status !== "CLOSED" && o.status !== "CANCELLED",
	);
	const openId = open ?? orderParam;
	const current = rows.find((o) => o.id === openId) ?? null;
	const close = () => {
		void setOpen(null);
		void setOrderParam(null);
		setSub(null);
		setMessage(null);
	};
	const guest = inHouse.find((b) => b.id === roomId);
	const tables = (outlet?.tables ?? []).filter((t) => t.active);
	const free = tables.filter((t) => !tabs.some((o) => sitsAt(o, t)));
	const discount = activeHappyHour(happyHours)?.discountPct ?? 0;
	const atLimit = (o: OrderRow) => o.total >= LIMIT;

	return (
		<>
			<PageHeader
				title="Open tabs"
				subtitle={`${plural(tabs.length, "tab")} open · ${naira(tabs.reduce((s, o) => s + o.total, 0))} unpaid · limit ${naira(LIMIT)} per tab`}
			>
				<ShiftPill until="1am" />
			</PageHeader>
			{!settings.tabs && (
				<Note tone="warning">
					Tabs are switched off in Hotel setup → Restaurant & bar. Existing tabs
					can still be settled.
				</Note>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="Open tabs" value={tabs.length} icon={ReceiptIcon} />
				<KpiCard
					label="Unpaid"
					value={naira(tabs.reduce((s, o) => s + o.total, 0))}
					icon={ReceiptIcon}
				/>
				<KpiCard
					label="At the limit"
					value={tabs.filter(atLimit).length}
					icon={ReceiptIcon}
					hint="Must pay before adding"
				/>
				<KpiCard label="Closed tonight" value={closedTabs} icon={ReceiptIcon} />
			</div>
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
				{tabs.length === 0 && (
					<Note tone="success" className="col-span-full">
						No open tabs.
					</Note>
				)}
				{tabs.map((o) => (
					<BoardCard
						key={o.id}
						label={`Open the tab at ${o.tableNo ?? "the bar"}`}
						onClick={() => void setOpen(o.id)}
						accent={atLimit(o) ? "warning" : "brand"}
					>
						<div className="flex items-center justify-between">
							<span className="text-[15px] font-bold text-ink">
								{o.tableNo ?? "Walk-up"}
							</span>
							<span className="text-xs text-ink-3">
								{minutesSince(o.openedAt)} min
							</span>
						</div>
						<p className="text-[13px] text-ink-2">
							{o.guestName ?? "No name"}
							{o.roomNumber ? ` · room ${o.roomNumber}` : ""}
						</p>
						<ul className="text-[15px] text-ink">
							{liveLines(o).map((l, i) => (
								<li key={l.id ?? i}>
									{l.qty} {l.name}
								</li>
							))}
						</ul>
						<div className="flex items-center justify-between">
							<span className="text-[17px] font-bold text-ink">
								{naira(o.total)}
							</span>
							{atLimit(o) ? (
								<StatusPill tone="danger">At limit</StatusPill>
							) : (
								<StatusPill tone="brand">Open</StatusPill>
							)}
						</div>
					</BoardCard>
				))}
			</div>

			<SidePanel
				open={!!current && !sub}
				onOpenChange={(o) => !o && close()}
				title={
					current
						? `${current.tableNo ?? "Walk-up"} · ${current.guestName ?? "tab"}`
						: ""
				}
				subtitle={
					current
						? `${current.number} · opened ${fmtTime(current.openedAt)} by ${current.openedBy}`
						: undefined
				}
				icon={ReceiptIcon}
				footer={
					current &&
					current.status !== "CLOSED" &&
					current.status !== "CANCELLED" ? (
						<>
							<BigButton
								tone="ghost"
								onClick={() => {
									setTo("");
									setSub("move");
								}}
							>
								<ArrowRightLeftIcon className="size-5" /> Move
							</BigButton>
							<BigButton
								tone="secondary"
								onClick={() => {
									setLines([]);
									setMessage(null);
									setSub("add");
								}}
							>
								<PlusIcon className="size-5" /> Add drinks
							</BigButton>
							<BigButton onClick={() => setSub("pay")}>
								<CreditCardIcon className="size-5" /> Close & pay
							</BigButton>
						</>
					) : (
						<BigButton tone="secondary" onClick={close}>
							Close
						</BigButton>
					)
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						{message && <Note tone="danger">{message}</Note>}
						{atLimit(current) && (
							<Note tone="danger">
								This tab has reached the {naira(LIMIT)} limit. Take a payment or
								settle it before adding more; a manager can allow more.
							</Note>
						)}
						<DetailList
							columns={2}
							items={[
								{ label: "Seat", value: current.tableNo ?? "Walk-up" },
								{ label: "Guest", value: current.guestName ?? "—" },
								{ label: "Opened", value: fmtTime(current.openedAt) },
								{
									label: "Status",
									value: (
										<StatusPill
											tone={
												current.status === "CLOSED"
													? "success"
													: current.status === "CANCELLED"
														? "danger"
														: "brand"
											}
										>
											{current.status === "CLOSED"
												? "Closed"
												: current.status === "CANCELLED"
													? "Cancelled"
													: "Open"}
										</StatusPill>
									),
								},
							]}
						/>
						<PanelSection title="Drinks">
							<ul className="divide-y divide-line rounded-control border border-line">
								{current.lines.map((l, i) => (
									<li
										key={l.id ?? i}
										className="flex items-center gap-3 px-4 py-2"
									>
										<span
											className={`min-w-0 flex-1 text-[15px] text-ink ${l.status === "CANCELLED" ? "line-through opacity-60" : ""}`}
										>
											{l.qty} × {l.name}
											{l.options ? (
												<span className="block text-xs text-ink-3">
													{l.options}
												</span>
											) : null}
											{(l.discount ?? 0) > 0 ? (
												<span className="block text-xs text-success">
													Happy hour −{naira(l.discount ?? 0)}
												</span>
											) : null}
										</span>
										<span className="text-[13px] text-ink-2">
											{naira(l.price * l.qty)}
										</span>
										{l.status !== "CANCELLED" &&
											l.id &&
											!current.paid &&
											!current.chargedToRoom && (
												<button
													type="button"
													aria-label={`Remove ${l.name}`}
													onClick={() =>
														setCancel({ lineId: l.id ?? "", name: l.name })
													}
													className="rounded-control p-2 text-ink-3 hover:bg-subtle hover:text-danger"
												>
													<XIcon className="size-4" />
												</button>
											)}
									</li>
								))}
							</ul>
							<TotalsList
								rows={[
									{ label: "Subtotal", value: naira(current.subtotal) },
									...((current.discount ?? 0) > 0
										? [
												{
													label: "Happy hour discount",
													value: `−${naira(current.discount ?? 0)}`,
												},
											]
										: []),
									{
										label: `VAT ${settings.vatPct}%${settings.pricesIncludeTax ? " (included)" : ""}`,
										value: naira(current.tax),
									},
									{ label: "Total", value: naira(current.total), strong: true },
								]}
							/>
						</PanelSection>
						{inHouse.length > 0 &&
							settings.roomCharge &&
							current.status !== "CLOSED" &&
							current.status !== "CANCELLED" && (
								<BigButton
									tone="secondary"
									onClick={() => {
										setRoomId("");
										setMessage(null);
										setSub("room");
									}}
								>
									Charge the tab to a room instead
								</BigButton>
							)}
					</div>
				)}
			</SidePanel>

			<SidePanel
				open={sub === "add" && !!current}
				onOpenChange={(o) => !o && setSub(null)}
				title="Add drinks"
				subtitle={
					current
						? `${current.tableNo ?? "Walk-up"} · ${naira(current.total)} so far`
						: undefined
				}
				icon={PlusIcon}
				width="lg"
				footerInfo={
					lines.length ? `+${naira(cartTotal(lines, discount))}` : undefined
				}
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setSub(null)}>
							Back
						</BigButton>
						<BigButton
							pending={pending}
							disabled={lines.length === 0}
							onClick={() =>
								current &&
								run(
									async () => {
										const r = await addOrderLines(
											current.id,
											toLineInputs(lines, discount),
											outletName,
										);
										// A tab over its limit is refused with the service's own sentence; keep it on the details panel.
										if (!r.ok) setMessage(r.error);
										return r;
									},
									"Added to the tab",
									(a) => {
										apply(current.id, a, (x) => {
											const add = cartTotal(lines, discount);
											return {
												...x,
												lines: [
													...x.lines,
													...lines.map((l) => ({
														name: l.item.name,
														qty: l.qty,
														price: l.item.price,
														options: l.option,
														status: "NEW",
													})),
												],
												subtotal: x.subtotal + add,
												total: x.total + add,
											};
										});
										setSub(null);
									},
								)
							}
						>
							Add to tab
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					{message && <Note tone="danger">{message}</Note>}
					<MenuPicker
						menu={menu}
						categories={categories}
						lines={lines}
						onChange={setLines}
						discountPct={discount}
					/>
				</div>
			</SidePanel>

			<Modal
				open={sub === "move"}
				onOpenChange={(o) => !o && setSub(null)}
				title="Move tab"
				subtitle="To another seat or table"
				icon={ArrowRightLeftIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setSub(null)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!to}
							onClick={() =>
								current &&
								run(
									() => moveTab(current.id, to, outletName),
									`Tab moved to ${free.find((t) => t.id === to)?.number ?? "the new seat"}`,
									(a) => {
										apply(current.id, a, (x) => ({
											...x,
											tableId: to,
											tableNo: free.find((t) => t.id === to)?.number,
										}));
										setSub(null);
									},
								)
							}
						>
							Move
						</BigButton>
					</>
				}
			>
				<SelectField
					label="New seat"
					value={to}
					onChange={setTo}
					options={free
						.filter((t) => t.id !== current?.tableId)
						.map((t) => ({ value: t.id, label: t.number }))}
					placeholder="Pick a free seat"
				/>
			</Modal>

			<Modal
				open={sub === "room"}
				onOpenChange={(o) => !o && setSub(null)}
				title="Charge to a room"
				subtitle={current ? naira(current.total) : undefined}
				icon={ReceiptIcon}
				size="confirm"
				footer={
					<>
						<BigButton tone="secondary" onClick={() => setSub(null)}>
							Cancel
						</BigButton>
						<BigButton
							pending={pending}
							disabled={!guest}
							onClick={() =>
								current &&
								guest &&
								run(
									async () => {
										const r = await chargeOrderToRoom(
											current.id,
											guest.roomId,
											outletName,
										);
										if (!r.ok)
											setMessage(
												`Can't charge to room ${guest.roomNumber ?? ""}: ${r.error}`,
											);
										return r;
									},
									`${naira(current.total)} charged to room ${guest.roomNumber}`,
									(a) => {
										apply(current.id, a, (x) => ({
											...x,
											status: "CLOSED",
											chargedToRoom: true,
											roomNumber: guest.roomNumber,
											guestName: guest.guestName,
										}));
										close();
									},
								)
							}
						>
							Charge to room
						</BigButton>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					{message && <Note tone="danger">{message}</Note>}
					<SelectField
						label="Hotel guest"
						value={roomId}
						onChange={(v) => {
							setRoomId(v);
							setMessage(null);
						}}
						options={inHouse.map((b) => ({ value: b.id, label: roomLabel(b) }))}
						placeholder="Which room"
					/>
					{guest && (
						<WhatHappens
							items={[
								`The tab goes on ${guest.guestName}'s folio`,
								"It is refused if nobody is checked in to the room or its bill is closed",
								"The tab closes here",
							]}
						/>
					)}
				</div>
			</Modal>

			<OrderPaymentPanel
				open={sub === "pay" && !!current}
				onOpenChange={(o) => !o && setSub(null)}
				desk="BAR"
				terminals={terminals}
				payment={
					current
						? {
								orderId: current.id,
								guestName: current.guestName ?? "Bar guest",
								amount: current.total,
								description: `Tab ${current.number}`,
								roomNumber: current.roomNumber,
							}
						: null
				}
				onDone={(p) => {
					if (!current) return;
					void readOrder(current.id, outletName).then((r) => {
						if (r.ok && r.data) put(r.data);
						else if (p.status === "APPROVED")
							apply(current.id, null, (x) => ({
								...x,
								status: "CLOSED",
								paid: true,
							}));
					});
				}}
				onFinish={close}
			/>

			<ReasonModal
				open={!!cancel}
				onOpenChange={(o) => !o && setCancel(null)}
				title={`Remove ${cancel?.name ?? "the drink"}?`}
				subtitle="It comes off the tab and the total is worked out again"
				confirmLabel="Remove"
				pending={pending}
				onConfirm={(reason) =>
					current &&
					cancel &&
					run(
						() =>
							cancelOrderLine(current.id, cancel.lineId, reason, outletName),
						"Removed from the tab",
						(a) => {
							apply(current.id, a, (x) => ({
								...x,
								lines: x.lines.map((l) =>
									l.id === cancel.lineId ? { ...l, status: "CANCELLED" } : l,
								),
							}));
							setCancel(null);
						},
					)
				}
			/>
		</>
	);
}
