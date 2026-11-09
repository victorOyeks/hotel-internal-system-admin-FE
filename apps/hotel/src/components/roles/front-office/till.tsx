"use client";

import {
	ArrowDownLeftIcon,
	ArrowRightLeftIcon,
	ArrowUpRightIcon,
	LockIcon,
	WalletIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import {
	ChoiceCards,
	MoneyField,
	SelectField,
	TextField,
	TextareaField,
} from "@hospio/ui/shared/field";
import { fmtWhen, naira } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import {
	closeTill,
	handoverTill,
	openTill,
	tillMovement,
} from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	PaymentRow,
	StaffRow,
	TillEntryRow,
	TillRow,
} from "@hospio/api/data/types";
import { cn } from "@hospio/ui/utils";

/** Front office 6.1–6.4 · Till & handover. Open with the hotel's default float, pay in and out, count and close, hand over to a named colleague. */
export function TillScreen({
	till,
	entries: initialEntries,
	pastTills,
	payments,
	staff,
	me,
	defaultFloat,
	demo,
	role = "FRONT_OFFICE",
}: {
	till: TillRow | null;
	entries: TillEntryRow[];
	pastTills: TillRow[];
	payments: PaymentRow[];
	staff: StaffRow[];
	me: string;
	defaultFloat: number;
	demo: boolean;
	role?: string;
}) {
	const [open, setOpen] = useState<TillRow | null>(till);
	const [entries, setEntries] = useState(initialEntries);
	const [past, setPast] = useState(pastTills);
	useEffect(() => setOpen(till), [till]);
	useEffect(() => setEntries(initialEntries), [initialEntries]);
	useEffect(() => setPast(pastTills), [pastTills]);
	const [modal, setModal] = useState<
		"open" | "close" | "handover" | "move" | null
	>(null);
	const [float, setFloat] = useState<number | "">(defaultFloat);
	const [counted, setCounted] = useState<number | "">("");
	const [note, setNote] = useState("");
	const [toStaff, setToStaff] = useState("");
	const [kind, setKind] = useState<"PAY_IN" | "PAY_OUT">("PAY_OUT");
	const [amount, setAmount] = useState<number | "">("");
	const [reason, setReason] = useState("");
	const { run, pending } = useAction();
	const cashToday = payments.filter(
		(p) =>
			p.method === "CASH" &&
			p.status === "APPROVED" &&
			p.role === role &&
			p.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10),
	);
	const paidOut = open?.cashOut ?? 0;
	const variance =
		open && typeof counted === "number" ? counted - open.expected : 0;
	const closeAll = () => {
		setModal(null);
		setCounted("");
		setNote("");
	};

	return (
		<>
			<PageHeader
				title="Till"
				subtitle={
					open
						? `Open since ${fmtWhen(open.openedAt)} by ${open.openedBy}`
						: "Your till is closed · open it before taking cash"
				}
			>
				{open ? (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setModal("move")}
						>
							<ArrowUpRightIcon className="mr-1 inline size-4" /> Pay in / out
						</button>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setModal("handover")}
						>
							<ArrowRightLeftIcon className="mr-1 inline size-4" /> Hand over
						</button>
						<button
							type="button"
							className={btn.primary}
							onClick={() => setModal("close")}
						>
							<LockIcon className="mr-1 inline size-4" /> Count & close
						</button>
					</>
				) : (
					<button
						type="button"
						className={btn.primary}
						onClick={() => {
							setFloat(defaultFloat);
							setModal("open");
						}}
					>
						<WalletIcon className="mr-1 inline size-4" /> Open till
					</button>
				)}
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Opening float"
					value={open ? naira(open.openingFloat) : "—"}
					icon={WalletIcon}
				/>
				<KpiCard
					label="Cash taken"
					value={open ? naira(open.cashIn) : "—"}
					icon={WalletIcon}
					hint={`${demo ? cashToday.length : entries.filter((e) => e.kind === "PAYMENT").length} cash payments`}
				/>
				<KpiCard
					label="Paid out"
					value={naira(paidOut)}
					icon={WalletIcon}
					hint="Pay-outs, cash refunds and expenses paid from this till"
				/>
				<KpiCard
					label="Should be in the drawer"
					value={open ? naira(open.expected) : "—"}
					icon={LockIcon}
					pill={
						open ? (
							<StatusPill tone="success">Open</StatusPill>
						) : (
							<StatusPill tone="grey">Closed</StatusPill>
						)
					}
				/>
			</div>
			<div className="grid gap-4 xl:grid-cols-2">
				<SectionCard
					title="Cash in this till"
					subtitle="Payments, pay-ins and pay-outs since the till opened"
					flush
				>
					<ul className="divide-y divide-line">
						{demo && cashToday.length === 0 && (
							<li className="px-5 py-6 text-center text-sm text-ink-3">
								No cash yet.
							</li>
						)}
						{!demo && entries.length === 0 && (
							<li className="px-5 py-6 text-center text-sm text-ink-3">
								{open ? "No cash yet." : "Open the till to take cash."}
							</li>
						)}
						{demo &&
							cashToday.map((p) => (
								<li
									key={p.id}
									className="flex items-center gap-3 px-5 py-3 text-[13px]"
								>
									<span className="w-20 text-ink-3">
										{fmtWhen(p.createdAt).replace("Today ", "")}
									</span>
									<span className="flex-1 font-medium text-ink">
										{p.guestName}{" "}
										<span className="text-ink-3">· {p.description}</span>
									</span>
									<span className="font-semibold">{naira(p.amount)}</span>
								</li>
							))}
						{!demo &&
							entries.map((e) => (
								<li
									key={e.id}
									className="flex items-center gap-3 px-5 py-3 text-[13px]"
								>
									<span className="w-20 text-ink-3">
										{fmtWhen(e.at).replace("Today ", "")}
									</span>
									<span
										className={cn(
											"flex size-6 items-center justify-center rounded-full",
											e.amount < 0
												? "bg-danger-soft text-danger"
												: "bg-success-soft text-success",
										)}
									>
										{e.amount < 0 ? (
											<ArrowUpRightIcon className="size-3" />
										) : (
											<ArrowDownLeftIcon className="size-3" />
										)}
									</span>
									<span className="flex-1 font-medium text-ink">
										{e.description ||
											(e.kind === "PAYMENT"
												? "Cash payment"
												: e.kind === "PAY_IN"
													? "Pay in"
													: "Pay out")}
									</span>
									<span
										className={cn(
											"font-semibold",
											e.amount < 0 && "text-danger",
										)}
									>
										{e.amount < 0 ? "−" : ""}
										{naira(Math.abs(e.amount))}
									</span>
								</li>
							))}
					</ul>
				</SectionCard>
				<SectionCard
					title="Past tills"
					subtitle="Closed in the last 7 days"
					flush
				>
					<ul className="divide-y divide-line">
						{past.length === 0 && (
							<li className="px-5 py-6 text-center text-sm text-ink-3">
								Nothing closed yet.
							</li>
						)}
						{past.map((t) => (
							<li
								key={t.id}
								className="flex items-center gap-3 px-5 py-3 text-[13px]"
							>
								<div className="flex-1">
									<p className="font-medium text-ink">{t.openedBy}</p>
									<p className="text-xs text-ink-3">
										{fmtWhen(t.openedAt)} → {fmtWhen(t.closedAt)}
										{t.note ? ` · ${t.note}` : ""}
									</p>
								</div>
								<span className="text-ink-2">expected {naira(t.expected)}</span>
								<span
									className={cn(
										"font-semibold",
										(t.variance ?? 0) < 0
											? "text-danger"
											: (t.variance ?? 0) > 0
												? "text-warning"
												: "text-success",
									)}
								>
									{!t.variance
										? "matches"
										: `${t.variance > 0 ? "over" : "short"} ${naira(Math.abs(t.variance))}`}
								</span>
							</li>
						))}
					</ul>
				</SectionCard>
			</div>

			<Modal
				open={modal === "open"}
				onOpenChange={(o) => !o && setModal(null)}
				title="Open your till"
				subtitle="Count the float the manager gave you"
				icon={WalletIcon}
				size="confirm"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setModal(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={typeof float !== "number" || pending}
							onClick={() =>
								typeof float === "number" &&
								void run(
									() => openTill({ role, openingFloat: float }),
									"Till open · you can take cash",
									(row) => {
										setOpen({
											...row,
											openedBy: row.openedBy === "You" ? me : row.openedBy,
										});
										setEntries([]);
										setModal(null);
									},
								)
							}
						>
							Open with {naira(typeof float === "number" ? float : 0)}
						</button>
					</>
				}
			>
				<MoneyField
					label="Opening float"
					value={float}
					onChange={setFloat}
					hint={
						defaultFloat > 0
							? `Default float is ${naira(defaultFloat)} · set in Hotel setup → Money`
							: "No default float is set in Hotel setup → Money"
					}
				/>
			</Modal>

			<Modal
				open={modal === "move"}
				onOpenChange={(o) => !o && setModal(null)}
				title="Pay in or pay out"
				subtitle="Cash that goes in or out of the drawer outside a guest payment"
				icon={WalletIcon}
				size="confirm"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setModal(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={
								!open ||
								typeof amount !== "number" ||
								amount <= 0 ||
								reason.trim().length < 3 ||
								pending
							}
							onClick={() =>
								open &&
								typeof amount === "number" &&
								void run(
									() =>
										tillMovement(open.id, {
											kind,
											amount,
											reason: reason.trim(),
										}),
									kind === "PAY_IN"
										? `${naira(amount)} paid in`
										: `${naira(amount)} paid out`,
									(entry) => {
										setEntries((xs) => [entry, ...xs]);
										setOpen((t) =>
											t ? { ...t, expected: t.expected + entry.amount } : t,
										);
										setAmount("");
										setReason("");
										setModal(null);
									},
								)
							}
						>
							{kind === "PAY_IN" ? "Pay in" : "Pay out"}
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<ChoiceCards
						value={kind}
						onChange={setKind}
						columns={2}
						options={[
							{
								value: "PAY_OUT",
								label: "Pay out",
								hint: "Petty cash, a taxi, a refund in cash",
							},
							{
								value: "PAY_IN",
								label: "Pay in",
								hint: "Extra float or change from the manager",
							},
						]}
					/>
					<MoneyField
						label="Amount"
						value={amount}
						onChange={setAmount}
						required
					/>
					<TextField
						label="Reason"
						value={reason}
						onChange={setReason}
						placeholder="e.g. Taxi for guest in A204"
						required
					/>
					{open && (
						<Note tone="info">
							The drawer should hold{" "}
							{naira(
								open.expected +
									(typeof amount === "number"
										? kind === "PAY_IN"
											? amount
											: -amount
										: 0),
							)}{" "}
							after this.
						</Note>
					)}
				</div>
			</Modal>

			<Modal
				open={modal === "close"}
				onOpenChange={(o) => !o && setModal(null)}
				title="Count & close the till"
				subtitle={
					open ? `Should be ${naira(open.expected)} in the drawer` : undefined
				}
				icon={LockIcon}
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setModal(null)}
						>
							Not yet
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={
								!open ||
								typeof counted !== "number" ||
								(variance !== 0 && note.trim().length < 3) ||
								pending
							}
							onClick={() =>
								open &&
								typeof counted === "number" &&
								void run(
									() =>
										withDeliveries(
											closeTill(open.id, { countedCash: counted, note }, open),
											"Till variance",
										),
									variance === 0
										? "Till closed · counts match"
										: `Till closed · ${variance > 0 ? "over" : "short"} ${naira(Math.abs(variance))} · manager told`,
									(row) => {
										setPast((xs) => [{ ...open, ...row }, ...xs]);
										setOpen(null);
										closeAll();
									},
								)
							}
						>
							Close till
						</button>
					</>
				}
				footerInfo={
					variance !== 0 && typeof counted === "number"
						? "A variance needs a note · the manager is told"
						: undefined
				}
			>
				<div className="flex flex-col gap-4">
					{open && (
						<TotalsList
							rows={[
								{ label: "Opening float", value: naira(open.openingFloat) },
								{ label: "Cash in", value: naira(open.cashIn) },
								{ label: "Paid out", value: `− ${naira(open.cashOut ?? 0)}` },
								{
									label: "Expected",
									value: naira(open.expected),
									strong: true,
								},
							]}
						/>
					)}
					<MoneyField
						label="Cash counted"
						value={counted}
						onChange={setCounted}
						required
					/>
					{typeof counted === "number" &&
						(variance === 0 ? (
							<Note tone="success">Counts match.</Note>
						) : (
							<Note tone={variance < 0 ? "danger" : "warning"}>
								{variance < 0 ? "Short" : "Over"} by {naira(Math.abs(variance))}
								.
							</Note>
						))}
					{typeof counted === "number" && variance !== 0 && (
						<TextareaField
							label="What happened"
							value={note}
							onChange={setNote}
							rows={2}
						/>
					)}
				</div>
			</Modal>

			<Modal
				open={modal === "handover"}
				onOpenChange={(o) => !o && setModal(null)}
				title="Hand over to the next shift"
				subtitle="They count the drawer with you and take it on"
				icon={ArrowRightLeftIcon}
				size="confirm"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setModal(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={
								!open ||
								!toStaff ||
								typeof counted !== "number" ||
								(variance !== 0 && note.trim().length < 3) ||
								pending
							}
							onClick={() => {
								const next = staff.find((s) => s.id === toStaff);
								if (!open || !next || typeof counted !== "number") return;
								void run(
									() =>
										withDeliveries(
											handoverTill(
												open.id,
												{
													countedCash: counted,
													note,
													toUserId: next.userId ?? next.id,
													toUserName: next.fullName,
												},
												open,
											),
											"Till handover",
										),
									`Till handed to ${next.fullName}`,
									(r) => {
										setPast((xs) => (r.closed ? [r.closed, ...xs] : xs));
										setOpen(r.opened);
										setEntries([]);
										closeAll();
										setToStaff("");
									},
								);
							}}
						>
							Hand over
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<SelectField
						label="Handing over to"
						value={toStaff}
						onChange={setToStaff}
						options={staff
							.filter(
								(s) =>
									s.role === role && s.fullName !== me && s.status === "ACTIVE",
							)
							.map((s) => ({
								value: s.id,
								label: s.fullName,
								hint: s.shift !== "—" ? `${s.shift} shift` : s.jobTitle,
							}))}
						placeholder="Choose a colleague"
					/>
					<MoneyField
						label="Cash counted together"
						value={counted}
						onChange={setCounted}
						required
						hint="This becomes their opening float"
					/>
					{open && (
						<DetailList
							columns={2}
							items={[
								{ label: "Expected", value: naira(open.expected) },
								{
									label: "Difference",
									value:
										typeof counted === "number"
											? naira(counted - open.expected)
											: "—",
								},
							]}
						/>
					)}
					{typeof counted === "number" && variance !== 0 && (
						<TextareaField
							label="What happened"
							value={note}
							onChange={setNote}
							rows={2}
						/>
					)}
				</div>
			</Modal>
		</>
	);
}
