"use client";

import {
	ArrowLeftToLineIcon,
	ArrowRightToLineIcon,
	BedDoubleIcon,
	CreditCardIcon,
	PlusIcon,
	SearchIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { EmptyState } from "@hospio/ui/shared/empty-state";
import { naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import type { Me } from "@hospio/api/api/schema";
import type { bookingBuckets } from "@hospio/api/data";
import {
	type FolioSummary,
	occupancyLabel,
	pastDeparture,
	type RoomRow,
	type TerminalRow,
	type TillRow,
} from "@hospio/api/data/types";
import { TakePaymentPanel } from "./take-payment";

function greeting() {
	const h = new Date().getHours();
	return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** How many rows each list on Today shows; the rest are a click away on Bookings. */
const SHOW = 10;

/** "See all 23 guests in house →" under a list that was cut to SHOW rows. */
function SeeAll({
	total,
	href,
	label,
}: {
	total: number;
	href: string;
	label: string;
}) {
	if (total <= SHOW) return null;
	return (
		<Link
			href={href}
			className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px] font-semibold text-brand hover:bg-subtle"
		>
			<span>
				Showing {SHOW} of {total} · see all {label}
			</span>
			<span aria-hidden>→</span>
		</Link>
	);
}

/** Front office 1.1 · Today at the desk. */
export function FrontDeskToday({
	user,
	hotelName,
	buckets,
	rooms,
	folios,
	terminals,
	till,
}: {
	user: Me;
	hotelName: string;
	buckets: ReturnType<typeof bookingBuckets>;
	rooms: RoomRow[];
	folios: FolioSummary[];
	terminals: TerminalRow[];
	till: TillRow | null;
}) {
	const [payOpen, setPayOpen] = useState(false);
	const arrivalsLeft = buckets.arrivals.filter((b) => b.status === "BOOKED");
	const arrived = buckets.arrivals.filter(
		(b) => b.status === "CHECKED_IN",
	).length;
	const count = (s: RoomRow["state"]) =>
		rooms.filter((r) => r.state === s).length;
	const balanceOf = (bookingId: string) =>
		folios.find((f) => f.bookingId === bookingId)?.balance ?? 0;
	// To-dos worked out from today's bookings and folios (nothing typed in): they go away as the work is done.
	const noRoom = arrivalsLeft.filter((b) => !b.roomId);
	const toCheckIn = arrivalsLeft.filter((b) => !!b.roomId);
	const owing = buckets.inHouse.filter(
		(b) => balanceOf(b.id) > 0 && !b.organizationName,
	);
	// Guests still in after their departure date keep the room until checked out: listed with today's departures.
	const overstays = buckets.inHouse.filter((b) => pastDeparture(b));
	// Today's departures first, then guests past their date.
	const leaving = [...buckets.departures, ...overstays];
	// In house, newest check-ins first; those leaving are already listed above.
	const staying = buckets.inHouse
		.filter((b) => !leaving.includes(b))
		.sort((a, b) =>
			(b.checkedInAt ?? b.createdAt).localeCompare(
				a.checkedInAt ?? a.createdAt,
			),
		);
	// Arrivals by expected time, ones with no time last.
	const arrivals = [...buckets.arrivals].sort((a, b) =>
		(a.eta ?? "99").localeCompare(b.eta ?? "99"),
	);
	const todos = [
		...noRoom
			.slice(0, 3)
			.map((b) => ({
				key: `room-${b.id}`,
				text: `Assign a room to ${b.guestName} · ${b.roomTypeName}`,
				href: `/dashboard/bookings?open=${b.id}`,
			})),
		...(noRoom.length > 3
			? [
					{
						key: "room-more",
						text: `${plural(noRoom.length - 3, "more arrival")} without a room`,
						href: "/dashboard/bookings?tab=arrivals",
					},
				]
			: []),
		...(toCheckIn.length
			? [
					{
						key: "checkin",
						text: `${plural(toCheckIn.length, "arrival")} to check in`,
						href: "/dashboard/bookings?tab=arrivals",
					},
				]
			: []),
		...(buckets.departures.length
			? [
					{
						key: "checkout",
						text: `${plural(buckets.departures.length, "departure")} to check out`,
						href: "/dashboard/bookings?tab=departures",
					},
				]
			: []),
		...(overstays.length
			? [
					{
						key: "overstay",
						text: `${plural(overstays.length, "guest")} still in past their departure date`,
						href: "/dashboard/bookings?tab=in-house",
					},
				]
			: []),
		...(owing.length
			? [
					{
						key: "owing",
						text: `${plural(owing.length, "guest")} in house with a balance to pay`,
						href: "/dashboard/folios",
					},
				]
			: []),
	];

	const quick = [
		{
			label: "Check in",
			href: "/dashboard/bookings?tab=arrivals",
			icon: ArrowRightToLineIcon,
		},
		{
			label: "Check out",
			href: "/dashboard/bookings?tab=departures",
			icon: ArrowLeftToLineIcon,
		},
		{
			label: "Walk-in booking",
			href: "/dashboard/bookings?new=1",
			icon: PlusIcon,
		},
		{ label: "Find a guest", href: "/dashboard/guests", icon: SearchIcon },
	];

	return (
		<>
			<PageHeader
				title={`${greeting()}, ${user.fullName.split(" ")[0]}`}
				subtitle={`Front desk · ${hotelName} · ${format(new Date(), "EEE d MMM")}`}
			>
				<Link href="/dashboard/payments" className={btn.secondary}>
					My payments
				</Link>
				<Link href="/dashboard/bookings?new=1" className={btn.primary}>
					<PlusIcon className="mr-1 inline size-4" /> New booking
				</Link>
			</PageHeader>

			<div className="grid grid-cols-2 gap-[10px] md:grid-cols-5">
				{quick.map(({ label, href, icon: Icon }) => (
					<Link
						key={label}
						href={href}
						className="flex items-center gap-[10px] rounded-xl border border-line bg-card px-[14px] py-3 text-[13px] font-semibold text-ink hover:bg-brand-soft/40"
					>
						<span className="flex size-[30px] items-center justify-center rounded-[9px] bg-brand-soft text-brand">
							<Icon className="size-[15px]" />
						</span>
						{label}
					</Link>
				))}
				<button
					type="button"
					onClick={() => setPayOpen(true)}
					className="flex items-center gap-[10px] rounded-xl border border-line bg-card px-[14px] py-3 text-left text-[13px] font-semibold text-ink hover:bg-brand-soft/40"
				>
					<span className="flex size-[30px] items-center justify-center rounded-[9px] bg-brand-soft text-brand">
						<CreditCardIcon className="size-[15px]" />
					</span>
					Take payment
				</button>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
				<KpiCard
					label="Arrivals left"
					value={arrivalsLeft.length}
					icon={ArrowRightToLineIcon}
					hint={`${arrived} already here`}
				/>
				<KpiCard
					label="Departures left"
					value={buckets.departures.length}
					icon={ArrowLeftToLineIcon}
					hint="Check-out by 11:00"
				/>
				<KpiCard
					label="In house"
					value={buckets.inHouse.length}
					icon={BedDoubleIcon}
					hint={`${count("occupied")} rooms occupied`}
				/>
				<KpiCard
					label="Rooms ready"
					value={count("ready")}
					icon={BedDoubleIcon}
					hint={`${count("dirty") + count("inspecting")} being cleaned`}
					pill={
						count("ready") < arrivalsLeft.length ? (
							<StatusPill tone="warning">short</StatusPill>
						) : undefined
					}
				/>
				<KpiCard
					label="Cash in till"
					value={till ? naira(till.expected) : "—"}
					icon={WalletIcon}
					hint={
						till
							? `Float ${naira(till.openingFloat)} · opened ${till.openedBy.split(" ")[0]}`
							: "Till not open"
					}
				/>
			</div>

			<div className="grid gap-4 xl:grid-cols-[1fr_360px]">
				<div className="flex flex-col gap-4">
					<SectionCard
						title="Arriving today"
						subtitle={`${arrived} of ${buckets.arrivals.length} here`}
						flush
					>
						{buckets.arrivals.length === 0 ? (
							<EmptyState title="No arrivals today" className="mx-5 mb-5" />
						) : (
							<ul className="divide-y divide-line">
								{arrivals.slice(0, SHOW).map((b) => {
									const room = rooms.find((r) => r.id === b.roomId);
									const due =
										b.paymentPlan === "PAY_AT_CHECKOUT" ||
										b.paymentPlan === "ORGANIZATION"
											? 0
											: b.totalAmount - b.paid;
									const pill =
										b.status === "CHECKED_IN" ? (
											<StatusPill tone="success">Checked in</StatusPill>
										) : b.status === "NO_SHOW" ? (
											<StatusPill tone="danger">No-show</StatusPill>
										) : !room ? (
											<StatusPill tone="warning">No room yet</StatusPill>
										) : room.state === "ready" || room.state === "held" ? (
											due > 0 ? (
												<StatusPill tone="warning">
													Ready · {naira(due)} to pay
												</StatusPill>
											) : (
												<StatusPill tone="grey">Room ready · paid</StatusPill>
											)
										) : room.state === "occupied" ? (
											<StatusPill tone="danger">
												{occupancyLabel(room) === "Due out"
													? `Turnover · ${room.guestName ?? "guest"} not out yet`
													: "Room still occupied"}
											</StatusPill>
										) : (
											<StatusPill tone="warning">Room being cleaned</StatusPill>
										);
									return (
										<li
											key={b.id}
											className="flex items-center gap-4 px-5 py-3"
										>
											<span className="w-16 text-[13px] font-semibold text-ink">
												{b.eta ?? "—"}
											</span>
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-semibold text-ink">
													{b.guestName}
												</p>
												<p className="text-xs text-ink-3">
													{b.roomNumber ?? "No room"} · {b.roomTypeName}
													{b.organizationName ? ` · ${b.organizationName}` : ""}
												</p>
											</div>
											{pill}
											{b.status === "BOOKED" && (
												<Link
													href={`/dashboard/bookings?open=${b.id}&action=check-in`}
													className={btn.primary}
												>
													<ArrowRightToLineIcon className="mr-1 inline size-4" />{" "}
													Check in
												</Link>
											)}
											{b.status === "NO_SHOW" && (
												<Link
													href={`/dashboard/bookings?open=${b.id}`}
													className={btn.secondary}
												>
													Open
												</Link>
											)}
										</li>
									);
								})}
							</ul>
						)}
						<SeeAll
							total={arrivals.length}
							href="/dashboard/bookings?tab=arrivals"
							label="arrivals"
						/>
					</SectionCard>

					<SectionCard
						title="Leaving today"
						subtitle={`${leaving.length} still here${overstays.length ? ` · ${overstays.length} past departure` : ""}`}
						flush
					>
						{leaving.length === 0 ? (
							<EmptyState title="No departures today" className="mx-5 mb-5" />
						) : (
							<ul className="divide-y divide-line">
								{leaving.slice(0, SHOW).map((b) => {
									const bal = balanceOf(b.id);
									const over = pastDeparture(b);
									return (
										<li
											key={b.id}
											className="flex items-center gap-4 px-5 py-3"
										>
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-semibold text-ink">
													{b.guestName}
												</p>
												<p className="text-xs text-ink-3">
													{b.roomNumber} · {b.roomTypeName} ·{" "}
													{over
														? `was due out ${format(new Date(`${b.checkOutDate}T12:00:00`), "EEE d MMM")}`
														: "due 11:00"}
													{b.organizationName
														? ` · ${b.organizationName} pays`
														: ""}
												</p>
											</div>
											{over && (
												<StatusPill tone="danger">Past departure</StatusPill>
											)}
											{bal > 0 ? (
												<StatusPill
													tone={b.organizationName ? "info" : "warning"}
												>
													{b.organizationName
														? "To company account"
														: `${naira(bal)} to pay`}
												</StatusPill>
											) : (
												<StatusPill tone="success">Paid up</StatusPill>
											)}
											<Link
												href={`/dashboard/bookings?open=${b.id}&action=check-out`}
												className={btn.primary}
											>
												<ArrowLeftToLineIcon className="mr-1 inline size-4" />{" "}
												Check out
											</Link>
										</li>
									);
								})}
							</ul>
						)}
						<SeeAll
							total={leaving.length}
							href={
								buckets.departures.length
									? "/dashboard/bookings?tab=departures"
									: "/dashboard/bookings?tab=in-house"
							}
							label="departures"
						/>
					</SectionCard>

					<SectionCard
						title="In house"
						subtitle={`${plural(buckets.inHouse.length, "guest")}${leaving.length ? ` · ${staying.length} staying on` : ""}`}
						action={{ label: "All folios", href: "/dashboard/folios" }}
						flush
					>
						<ul className="divide-y divide-line">
							{staying.slice(0, SHOW).map((b) => {
								const bal = balanceOf(b.id);
								return (
									<li key={b.id} className="flex items-center gap-4 px-5 py-3">
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{b.guestName}
											</p>
											<p className="text-xs text-ink-3">
												{b.roomNumber} · {b.roomTypeName} · leaves{" "}
												{b.checkOutDate === format(new Date(), "yyyy-MM-dd")
													? "today"
													: b.checkOutDate}
											</p>
										</div>
										{bal > 0 ? (
											<StatusPill tone="warning">
												{naira(bal)} balance
											</StatusPill>
										) : bal < 0 ? (
											<StatusPill tone="success">
												{naira(-bal)} in credit
											</StatusPill>
										) : (
											<StatusPill tone="success">Paid up</StatusPill>
										)}
										<Link
											href={`/dashboard/folios?open=${folios.find((f) => f.bookingId === b.id)?.id ?? ""}`}
											className={btn.secondary}
										>
											Open folio
										</Link>
									</li>
								);
							})}
						</ul>
						<SeeAll
							total={staying.length}
							href="/dashboard/bookings?tab=in-house"
							label="guests in house"
						/>
					</SectionCard>
				</div>

				<div className="flex flex-col gap-4">
					<SectionCard title="Rooms right now" bodyClassName="gap-2 pt-2">
						{[
							["Ready to sell", "bg-success", count("ready")],
							[
								"Being cleaned",
								"bg-[#dbab00]",
								count("dirty") + count("inspecting"),
							],
							["Held for arrivals", "bg-info", count("held")],
							["Occupied", "bg-brand", count("occupied")],
							["Out of order", "bg-line-strong", count("out_of_order")],
						].map(([label, cls, n]) => (
							<div
								key={label as string}
								className="flex items-center gap-[10px] text-[13px]"
							>
								<span className={`size-[10px] rounded-[3px] ${cls}`} />
								<span className="flex-1 text-ink-2">{label}</span>
								<span className="font-bold text-ink">{n}</span>
							</div>
						))}
						<Link
							href="/dashboard/rooms"
							className={`${btn.secondary} mt-2 text-center`}
						>
							Open room board
						</Link>
					</SectionCard>

					<SectionCard
						title="Front desk to-dos"
						subtitle="From today's bookings and folios"
						bodyClassName="gap-2 pt-2"
					>
						{todos.length === 0 ? (
							<p className="text-[13px] text-ink-3">
								Nothing waiting: every arrival has a room, nobody is left to
								check in or out, and in-house balances are paid.
							</p>
						) : (
							todos.map((t) => (
								<Link
									key={t.key}
									href={t.href}
									className="flex items-center gap-3 rounded-control px-1 py-1 text-[13px] text-ink hover:bg-subtle"
								>
									<span className="size-2 shrink-0 rounded-full bg-warning" />
									<span className="flex-1">{t.text}</span>
									<span className="text-brand">→</span>
								</Link>
							))
						)}
					</SectionCard>

					<SectionCard
						title="Your till"
						subtitle={
							till
								? `${naira(till.openingFloat)} float · ${naira(till.cashIn)} cash taken`
								: "Not open yet"
						}
						action={{ label: "Till", href: "/dashboard/till" }}
					>
						<p className="text-xs text-ink-3">
							{till
								? "Count at 2pm handover"
								: "Open your till before taking cash."}
						</p>
					</SectionCard>
				</div>
			</div>

			<TakePaymentPanel
				open={payOpen}
				onOpenChange={setPayOpen}
				folios={folios}
				terminals={terminals}
			/>
		</>
	);
}
