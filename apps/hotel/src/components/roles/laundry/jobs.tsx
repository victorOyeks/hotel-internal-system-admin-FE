"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BanIcon,
	BedDoubleIcon,
	CheckIcon,
	CreditCardIcon,
	PlusIcon,
	ShirtIcon,
	WalletIcon,
	WashingMachineIcon,
	ZapIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import {
	SelectField,
	TextField,
	TextareaField,
	ToggleField,
} from "@hospio/ui/shared/field";
import { fmtTime, fmtWhen, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import {
	cancelLaundryOrder,
	chargeLaundryToRoom,
	laundryPaid,
	laundryPocketNote,
	moveLaundryOrder,
	takeLaundryOrder,
} from "@hospio/api/actions/laundry";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	BookingRow,
	GuestLaundryRow,
	LaundryPriceRow,
	TerminalRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";
import { OrderPaymentPanel } from "../shared-staff/pos-payment";
import {
	BigButton,
	BoardCard,
	BoardColumn,
	Stepper,
} from "../shared-staff/tablet";

type Status = GuestLaundryRow["status"];
const NEXT: Partial<Record<Status, Status>> = {
	RECEIVED: "IN_PROGRESS",
	IN_PROGRESS: "READY",
	READY: "DELIVERED",
};
const NEXT_LABEL: Partial<Record<Status, string>> = {
	RECEIVED: "Start washing",
	IN_PROGRESS: "Mark ready",
	READY: "Mark delivered",
};
export const LAUNDRY_STATUS: Record<
	Status,
	{ label: string; tone: "warning" | "info" | "success" | "grey" | "danger" }
> = {
	RECEIVED: { label: "Received", tone: "warning" },
	IN_PROGRESS: { label: "In progress", tone: "info" },
	READY: { label: "Ready", tone: "success" },
	DELIVERED: { label: "Delivered", tone: "grey" },
	CANCELLED: { label: "Cancelled", tone: "danger" },
};
const lagosDay = (iso?: string) =>
	iso
		? new Date(new Date(iso).getTime() + 3600_000).toISOString().slice(0, 10)
		: "";
const today = () => lagosDay(new Date().toISOString());

type Sub = "new" | "pocket" | "cancel" | "pay" | null;

/**
 * Laundry · Jobs (3243:13987), also the front desk's Laundry: guest orders from the price list for an in-house guest,
 * moved along the board, charged to the room's open bill or paid at the desk, cancelled with a reason before either.
 */
export function LaundryJobsScreen({
	orders,
	prices,
	inHouse,
	terminals = [],
	desk,
}: {
	orders: GuestLaundryRow[];
	prices: LaundryPriceRow[];
	inHouse: BookingRow[];
	terminals?: TerminalRow[];
	desk: "LAUNDRY" | "FRONT_OFFICE";
}) {
	const [rows, setRows] = useState(orders);
	useEffect(() => setRows(orders), [orders]);
	const [openId, setOpenId] = useQueryState("open");
	const [view, setView] = useQueryState("view");
	const [sub, setSub] = useState<Sub>(null);
	const [search, setSearch] = useState("");
	const [pendingPayment, setPendingPayment] = useState<Record<string, string>>(
		{},
	);
	const { run, pending } = useAction();
	const current = rows.find((o) => o.id === openId) ?? null;
	const patch = (o: GuestLaundryRow) =>
		setRows((rs) =>
			rs.some((r) => r.id === o.id)
				? rs.map((r) => (r.id === o.id ? o : r))
				: [o, ...rs],
		);
	const open = rows.filter(
		(o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
	);
	const d = today();
	const chargedToday = rows
		.filter((o) => o.settlement === "ROOM" && lagosDay(o.chargedAt) === d)
		.reduce((s, o) => s + o.total, 0);
	const paidToday = rows
		.filter((o) => o.settlement === "PAID" && lagosDay(o.paidAt) === d)
		.reduce((s, o) => s + o.total, 0);
	const dueSoon = open.filter(
		(o) =>
			o.promisedAt &&
			new Date(o.promisedAt).getTime() - Date.now() < 2 * 3600_000,
	);
	const columns: Status[] = ["RECEIVED", "IN_PROGRESS", "READY", "DELIVERED"];
	const history = useMemo(() => {
		const q = search.trim().toLowerCase();
		return q
			? rows.filter((o) =>
					`${o.number} ${o.guestName} ${o.roomNumber ?? ""}`
						.toLowerCase()
						.includes(q),
				)
			: rows;
	}, [rows, search]);

	const advance = (o: GuestLaundryRow) => {
		const n = NEXT[o.status];
		if (!n) return;
		run(
			() => moveLaundryOrder(o.id, n),
			`${o.number} · ${LAUNDRY_STATUS[n].label.toLowerCase()}`,
			patch,
		);
	};

	const histCols: ColumnDef<GuestLaundryRow, unknown>[] = [
		{
			id: "o",
			header: "Order",
			cell: ({ row: { original: o } }) => (
				<TwoLine
					primary={o.guestName}
					secondary={`${o.number} · Room ${o.roomNumber ?? "—"}`}
				/>
			),
		},
		{
			id: "items",
			header: "Items",
			cell: ({ row: { original: o } }) =>
				o.lines.map((l) => `${l.quantity} ${l.name}`).join(", "),
		},
		{
			id: "total",
			header: "Total",
			cell: ({ row: { original: o } }) => naira(o.total),
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row: { original: o } }) => (
				<StatusPill tone={LAUNDRY_STATUS[o.status].tone}>
					{LAUNDRY_STATUS[o.status].label}
				</StatusPill>
			),
		},
		{
			id: "settled",
			header: "Settled",
			cell: ({ row: { original: o } }) => <Settled o={o} />,
		},
		{
			id: "at",
			header: "Received",
			cell: ({ row: { original: o } }) => fmtWhen(o.createdAt),
		},
	];

	return (
		<>
			<PageHeader
				title={desk === "LAUNDRY" ? "Laundry jobs" : "Guest laundry"}
				subtitle={`${plural(open.length, "guest order")} in progress · ${dueSoon.length} due in the next 2 hours`}
			>
				<BigButton onClick={() => setSub("new")} disabled={prices.length === 0}>
					<PlusIcon className="size-5" /> New guest order
				</BigButton>
			</PageHeader>
			{prices.length === 0 && (
				<Note tone="warning">
					There is no laundry price list yet. A manager adds prices in Tasks →
					Laundry prices.
				</Note>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard label="In progress" value={open.length} icon={ShirtIcon} />
				<KpiCard
					label="Due in the next 2 hours"
					value={dueSoon.length}
					icon={WashingMachineIcon}
				/>
				<KpiCard
					label="Charged to rooms today"
					value={naira(chargedToday)}
					icon={BedDoubleIcon}
				/>
				<KpiCard
					label="Paid at the desk today"
					value={naira(paidToday)}
					icon={CreditCardIcon}
				/>
			</div>
			<PillTabs
				tabs={[
					{ key: "board", label: "Board", count: open.length },
					{ key: "all", label: "All orders", count: rows.length },
				]}
				value={view === "all" ? "all" : "board"}
				onChange={(k) => void setView(k === "board" ? null : k)}
			/>
			{view === "all" ? (
				<>
					<Toolbar
						left={
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Search order, guest or room"
							/>
						}
					/>
					<DataTable
						columns={histCols}
						data={history}
						onRowClick={(o) => void setOpenId(o.id)}
						emptyTitle="No laundry orders yet"
					/>
				</>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
					{columns.map((st) => {
						const col = rows.filter(
							(o) =>
								o.status === st &&
								(st !== "DELIVERED" || lagosDay(o.deliveredAt) === d),
						);
						return (
							<BoardColumn
								key={st}
								title={
									st === "DELIVERED"
										? "Delivered today"
										: LAUNDRY_STATUS[st].label
								}
								count={col.length}
								tone={
									LAUNDRY_STATUS[st].tone === "grey" ||
									LAUNDRY_STATUS[st].tone === "danger"
										? undefined
										: LAUNDRY_STATUS[st].tone
								}
							>
								{col.map((o) => (
									<BoardCard
										key={o.id}
										label={`Open ${o.number}`}
										onClick={() => void setOpenId(o.id)}
										accent={
											st === "READY"
												? "success"
												: o.express && st !== "DELIVERED"
													? "warning"
													: "none"
										}
									>
										<div className="flex items-center justify-between gap-2">
											<span className="text-[15px] font-bold text-ink">
												{o.roomNumber ? `${o.roomNumber} · ` : ""}
												{o.guestName}
											</span>
											<span className="text-xs text-ink-3">
												{o.promisedAt ? fmtTime(o.promisedAt) : ""}
											</span>
										</div>
										<p className="text-[13px] text-ink-2">
											{o.lines.map((l) => `${l.quantity} ${l.name}`).join(", ")}
										</p>
										<div className="flex items-center justify-between">
											<span className="text-[13px] font-semibold text-ink">
												{naira(o.total)}
												{o.express && (
													<span className="ml-1 text-xs font-semibold text-warning">
														Express
													</span>
												)}
											</span>
											<Settled o={o} />
										</div>
										{o.pocketNote && (
											<span className="text-xs text-warning">
												Found in pocket
											</span>
										)}
									</BoardCard>
								))}
							</BoardColumn>
						);
					})}
				</div>
			)}

			<SidePanel
				open={!!current && sub === null}
				onOpenChange={(o) => {
					if (!o) void setOpenId(null);
				}}
				title={current ? `${current.number} · ${current.guestName}` : ""}
				subtitle={
					current
						? `Room ${current.roomNumber ?? "—"} · received ${fmtWhen(current.createdAt)}${current.receivedByName ? ` by ${current.receivedByName}` : ""}`
						: undefined
				}
				icon={ShirtIcon}
				footer={
					current &&
					(current.status === "DELIVERED" || current.status === "CANCELLED" ? (
						<BigButton tone="secondary" onClick={() => void setOpenId(null)}>
							Close
						</BigButton>
					) : (
						<>
							{!current.settlement && (
								<BigButton tone="ghost" onClick={() => setSub("cancel")}>
									<BanIcon className="size-5" /> Cancel
								</BigButton>
							)}
							{!current.settlement && (
								<BigButton
									tone="secondary"
									pending={pending}
									onClick={() =>
										run(
											() => chargeLaundryToRoom(current.id),
											`${naira(current.total)} charged to room ${current.roomNumber}`,
											patch,
										)
									}
								>
									<BedDoubleIcon className="size-5" /> Charge to room
								</BigButton>
							)}
							{!current.settlement && (
								<BigButton tone="secondary" onClick={() => setSub("pay")}>
									<WalletIcon className="size-5" /> Take payment
								</BigButton>
							)}
							{NEXT[current.status] && (
								<BigButton
									pending={pending}
									disabled={
										NEXT[current.status] === "DELIVERED" && !current.settlement
									}
									onClick={() => advance(current)}
								>
									<CheckIcon className="size-5" /> {NEXT_LABEL[current.status]}
								</BigButton>
							)}
						</>
					))
				}
			>
				{current && (
					<div className="flex flex-col gap-5">
						{current.status === "CANCELLED" && (
							<Note tone="danger">Cancelled: {current.cancelReason}</Note>
						)}
						{current.status === "READY" && !current.settlement && (
							<Note tone="warning">
								Charge it to the room or take payment before it goes back to the
								guest.
							</Note>
						)}
						{pendingPayment[current.id] && !current.settlement && (
							<Note tone="info">
								A card payment is still processing.{" "}
								<button
									type="button"
									className="font-semibold text-brand hover:underline"
									onClick={() =>
										run(
											() => laundryPaid(current.id, pendingPayment[current.id]),
											"Payment recorded on the order",
											patch,
										)
									}
								>
									Check it now
								</button>
							</Note>
						)}
						<DetailList
							columns={2}
							items={[
								{
									label: "Status",
									value: (
										<StatusPill tone={LAUNDRY_STATUS[current.status].tone}>
											{LAUNDRY_STATUS[current.status].label}
										</StatusPill>
									),
								},
								{
									label: "Promised",
									value: current.promisedAt ? fmtWhen(current.promisedAt) : "—",
								},
								{
									label: "Service",
									value: current.express ? "Express" : "Normal",
								},
								{ label: "Settled", value: <Settled o={current} long /> },
							]}
						/>
						<PanelSection title="Items">
							<TotalsList
								rows={[
									...current.lines.map((l) => ({
										label: `${l.quantity} × ${l.name} @ ${naira(l.unitPrice)}`,
										value: naira(l.amount),
									})),
									{ label: "Total", value: naira(current.total), strong: true },
								]}
							/>
						</PanelSection>
						{current.note && (
							<p className="rounded-control bg-subtle px-4 py-3 text-[13px] text-ink">
								{current.note}
							</p>
						)}
						{current.pocketNote ? (
							<Note tone="warning">Found in pocket: {current.pocketNote}</Note>
						) : (
							current.status !== "CANCELLED" &&
							current.status !== "DELIVERED" && (
								<BigButton
									tone="ghost"
									className="self-start"
									onClick={() => setSub("pocket")}
								>
									Found something in a pocket
								</BigButton>
							)
						)}
					</div>
				)}
			</SidePanel>

			<NewOrder
				open={sub === "new"}
				onClose={() => setSub(null)}
				prices={prices}
				inHouse={inHouse}
				onDone={(o) => {
					patch(o);
					setSub(null);
					void setOpenId(o.id);
				}}
			/>
			{current && (
				<>
					<ReasonModal
						open={sub === "cancel"}
						title={`Cancel ${current.number}`}
						label="Why is it cancelled"
						placeholder="e.g. Guest took the clothes back"
						danger
						onClose={() => setSub(null)}
						onSubmit={(reason) =>
							run(
								() => cancelLaundryOrder(current.id, reason),
								`${current.number} cancelled`,
								(o) => {
									patch(o);
									setSub(null);
								},
							)
						}
						pending={pending}
					/>
					<ReasonModal
						open={sub === "pocket"}
						title="Found in a pocket"
						label="What you found"
						placeholder="e.g. ₦2,000 note, car key"
						onClose={() => setSub(null)}
						onSubmit={(note) =>
							run(
								() => laundryPocketNote(current.id, note),
								"Logged on the order · hand it to the front desk",
								(o) => {
									patch(o);
									setSub(null);
								},
							)
						}
						pending={pending}
					/>
				</>
			)}
			<OrderPaymentPanel
				open={sub === "pay" && !!current}
				onOpenChange={(o) => !o && setSub(null)}
				desk={desk}
				terminals={terminals}
				payment={
					current
						? {
								guestName: current.guestName,
								roomNumber: current.roomNumber,
								amount: current.total,
								description: `Laundry ${current.number}`,
							}
						: null
				}
				onDone={(p) => {
					if (!current) return;
					if (p.status === "APPROVED")
						run(
							() => laundryPaid(current.id, p.id),
							`${current.number} paid`,
							patch,
						);
					else setPendingPayment((m) => ({ ...m, [current.id]: p.id }));
				}}
			/>
		</>
	);
}

function Settled({ o, long }: { o: GuestLaundryRow; long?: boolean }) {
	if (o.settlement === "ROOM")
		return (
			<StatusPill tone="info" dot={false}>
				{long ? `On room ${o.roomNumber}'s bill` : "Room"}
			</StatusPill>
		);
	if (o.settlement === "PAID")
		return (
			<StatusPill tone="success" dot={false}>
				{long
					? `Paid${o.paymentMethod ? ` · ${o.paymentMethod.toLowerCase()}` : ""}`
					: "Paid"}
			</StatusPill>
		);
	if (o.status === "CANCELLED")
		return <span className="text-xs text-ink-3">—</span>;
	return (
		<StatusPill tone="warning" dot={false}>
			Not settled
		</StatusPill>
	);
}

function NewOrder({
	open,
	onClose,
	prices,
	inHouse,
	onDone,
}: {
	open: boolean;
	onClose: () => void;
	prices: LaundryPriceRow[];
	inHouse: BookingRow[];
	onDone: (o: GuestLaundryRow) => void;
}) {
	const [roomId, setRoomId] = useState("");
	const [qty, setQty] = useState<Record<string, number>>({});
	const [express, setExpress] = useState(false);
	const [promised, setPromised] = useState("");
	const [note, setNote] = useState("");
	const [charge, setCharge] = useState(true);
	const { run, pending } = useAction();
	useEffect(() => {
		if (open) {
			setRoomId("");
			setQty({});
			setExpress(false);
			setPromised("");
			setNote("");
			setCharge(true);
		}
	}, [open]);
	const active = prices.filter((p) => p.active);
	const rooms = inHouse.filter((b) => b.roomId);
	const total = active.reduce(
		(s, p) => s + (qty[p.id] ?? 0) * (express ? p.expressPrice : p.price),
		0,
	);
	const count = Object.values(qty).reduce((s, q) => s + q, 0);
	const guest = rooms.find((b) => b.roomId === roomId);
	const promisedIso = promised ? new Date(promised).toISOString() : null;
	const pastPromise =
		!!promisedIso && new Date(promisedIso).getTime() < Date.now();
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title="New guest order"
			subtitle="Count the items with the guest · prices come from the laundry price list"
			icon={PlusIcon}
			width="lg"
			footerInfo={`${plural(count, "item")} · ${naira(total)}`}
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Cancel
					</BigButton>
					<BigButton
						pending={pending}
						disabled={!guest || count === 0 || pastPromise}
						onClick={() =>
							run(
								() =>
									takeLaundryOrder({
										roomId,
										lines: Object.entries(qty)
											.filter(([, q]) => q > 0)
											.map(([priceId, quantity]) => ({ priceId, quantity })),
										express,
										promisedAt: promisedIso,
										note,
										chargeToRoom: charge,
									}),
								(o) =>
									charge
										? `${o.number} taken · ${naira(o.total)} charged to room ${o.roomNumber}`
										: `${o.number} taken · take payment before it goes back`,
								onDone,
							)
						}
					>
						{charge ? "Take order & charge room" : "Take order"}
					</BigButton>
				</>
			}
		>
			<div className="flex flex-col gap-5">
				<SelectField
					label="In-house guest"
					value={roomId}
					onChange={setRoomId}
					options={rooms.map((b) => ({
						value: b.roomId as string,
						label: `${b.roomNumber} · ${b.guestName}`,
					}))}
					placeholder={rooms.length ? "Pick the room" : "Nobody is checked in"}
				/>
				<ToggleField
					label="Express"
					hint="Back in about 6 hours, at the express price"
					checked={express}
					onChange={setExpress}
				/>
				<PanelSection title="Items">
					<ul className="divide-y divide-line rounded-control border border-line">
						{active.map((p) => (
							<li key={p.id} className="flex items-center gap-3 px-4 py-2">
								<span className="flex-1 text-[15px] font-medium text-ink">
									{p.name}
								</span>
								<span
									className={cn(
										"w-24 text-right text-[13px]",
										express ? "font-semibold text-warning" : "text-ink-3",
									)}
								>
									{express && <ZapIcon className="mr-1 inline size-3" />}
									{naira(express ? p.expressPrice : p.price)}
								</span>
								<Stepper
									value={qty[p.id] ?? 0}
									onChange={(v) => setQty({ ...qty, [p.id]: v })}
								/>
							</li>
						))}
					</ul>
				</PanelSection>
				<TextField
					label="Promised back (optional)"
					type="datetime-local"
					value={promised}
					onChange={setPromised}
					hint="Blank: 24 hours, express 6 hours"
					error={pastPromise ? "Pick a time from now on" : undefined}
				/>
				<TextareaField
					label="Note (optional)"
					value={note}
					onChange={setNote}
					rows={2}
					placeholder="e.g. No starch on the shirts"
				/>
				<ToggleField
					label="Charge to the room now"
					hint="Off: take payment at the desk before it goes back"
					checked={charge}
					onChange={setCharge}
				/>
				<TotalsList
					rows={[{ label: "Total", value: naira(total), strong: true }]}
				/>
				<WhatHappens
					items={[
						"The order goes on the board as Received",
						charge
							? "The total goes on the guest's bill at once"
							: "Payment is taken before it is delivered",
						"A guest who has checked out can't be charged · take payment instead",
					]}
				/>
			</div>
		</SidePanel>
	);
}

function ReasonModal({
	open,
	title,
	label,
	placeholder,
	danger,
	onClose,
	onSubmit,
	pending,
}: {
	open: boolean;
	title: string;
	label: string;
	placeholder: string;
	danger?: boolean;
	onClose: () => void;
	onSubmit: (text: string) => void;
	pending: boolean;
}) {
	const [text, setText] = useState("");
	useEffect(() => {
		if (open) setText("");
	}, [open]);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={title}
			tone={danger ? "danger" : "default"}
			size="confirm"
			footer={
				<>
					<BigButton tone="secondary" onClick={onClose}>
						Back
					</BigButton>
					<BigButton
						tone={danger ? "danger" : "primary"}
						pending={pending}
						disabled={!text.trim()}
						onClick={() => onSubmit(text)}
					>
						{danger ? "Cancel order" : "Save"}
					</BigButton>
				</>
			}
		>
			<TextareaField
				label={label}
				value={text}
				onChange={setText}
				rows={2}
				placeholder={placeholder}
			/>
		</Modal>
	);
}
