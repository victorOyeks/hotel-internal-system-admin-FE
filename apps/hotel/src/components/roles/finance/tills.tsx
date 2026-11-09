"use client";

import { LandmarkIcon, LockIcon, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { MoneyField, TextareaField, TextField } from "@hospio/ui/shared/field";
import { fmtWhen, humanize, naira, plural } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { bankCash, closeTill } from "@hospio/api/actions/finance";
import { useAction } from "@hospio/api/actions/use-action";
import type { TillRow } from "@hospio/api/data/types";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { cn } from "@hospio/ui/utils";

/** Finance 4.x · Tills: who has cash, close a till with them, bank the cash. */
export function TillsScreen({ tills: initial }: { tills: TillRow[] }) {
	const [tills, setTills] = useState(initial);
	useEffect(() => setTills(initial), [initial]);
	const [tab, setTab] = useState<"open" | "closed">("open");
	const [closing, setClosing] = useState<TillRow | null>(null);
	const [banking, setBanking] = useState(false);
	const [counted, setCounted] = useState<number | "">("");
	const [note, setNote] = useState("");
	const [bankAmt, setBankAmt] = useState<number | "">("");
	const [bank, setBank] = useState("");
	const [ref, setRef] = useState("");
	const { run, pending } = useAction();
	const open = tills.filter((t) => t.status === "OPEN");
	const closed = tills.filter((t) => t.status === "CLOSED");
	const cashOut = open.reduce((s, t) => s + t.expected, 0);
	const inSafe = closed.reduce((s, t) => s + (t.counted ?? 0), 0);
	const variance =
		closing && typeof counted === "number" ? counted - closing.expected : 0;

	return (
		<>
			<PageHeader
				title="Tills"
				subtitle={`${plural(open.length, "till")} open · ${naira(cashOut)} in drawers · ${naira(inSafe)} in the safe from closed tills`}
			>
				<button
					type="button"
					className={btn.primary}
					onClick={() => setBanking(true)}
				>
					<LandmarkIcon className="mr-1 inline size-4" /> Bank cash
				</button>
			</PageHeader>
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Open tills"
					value={open.length}
					icon={WalletIcon}
					hint={open.map((t) => humanize(t.role)).join(", ") || "None"}
				/>
				<KpiCard
					label="Cash in drawers"
					value={naira(cashOut)}
					icon={WalletIcon}
					hint="Expected from sales"
				/>
				<KpiCard
					label="In the safe"
					value={naira(inSafe)}
					icon={LockIcon}
					hint="From closed tills · not yet banked"
				/>
				<KpiCard
					label="Variance today"
					value={naira(closed.reduce((s, t) => s + (t.variance ?? 0), 0))}
					icon={LockIcon}
					pill={
						closed.some((t) => (t.variance ?? 0) !== 0) ? (
							<StatusPill tone="warning">check</StatusPill>
						) : (
							<StatusPill tone="success">ok</StatusPill>
						)
					}
				/>
			</div>
			<PillTabs
				value={tab}
				onChange={setTab}
				tabs={[
					{ key: "open", label: "Open", count: open.length },
					{ key: "closed", label: "Closed today", count: closed.length },
				]}
			/>
			<SectionCard title={tab === "open" ? "Open tills" : "Closed tills"} flush>
				<table className="w-full text-left text-[13px]">
					<thead>
						<tr className="border-y border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
							<th className="px-5 py-2">Till</th>
							<th className="py-2">Opened</th>
							<th className="py-2 text-right">Float</th>
							<th className="py-2 text-right">Cash in</th>
							<th className="py-2 text-right">Expected</th>
							<th className="py-2 text-right">
								{tab === "open" ? "" : "Counted"}
							</th>
							<th className="px-5 py-2 text-right" />
						</tr>
					</thead>
					<tbody>
						{(tab === "open" ? open : closed).map((t) => (
							<tr key={t.id} className="border-b border-line last:border-b-0">
								<td className="px-5 py-3">
									<p className="font-semibold text-ink">{humanize(t.role)}</p>
									<p className="text-xs text-ink-3">{t.openedBy}</p>
								</td>
								<td className="py-3 text-ink-2">{fmtWhen(t.openedAt)}</td>
								<td className="py-3 text-right">{naira(t.openingFloat)}</td>
								<td className="py-3 text-right">{naira(t.cashIn)}</td>
								<td className="py-3 text-right font-semibold">
									{naira(t.expected)}
								</td>
								<td className="py-3 text-right">
									{t.status === "CLOSED" && (
										<span
											className={cn(
												"font-semibold",
												t.variance === 0
													? "text-success"
													: (t.variance ?? 0) < 0
														? "text-danger"
														: "text-warning",
											)}
										>
											{naira(t.counted ?? 0)}{" "}
											{t.variance === 0
												? "· matches"
												: `· ${(t.variance ?? 0) < 0 ? "short" : "over"} ${naira(Math.abs(t.variance ?? 0))}`}
										</span>
									)}
								</td>
								<td className="px-5 py-3 text-right">
									{t.status === "OPEN" ? (
										<button
											type="button"
											className={`${btn.secondary} ${btn.small}`}
											onClick={() => {
												setClosing(t);
												setCounted("");
												setNote("");
											}}
										>
											Count & close
										</button>
									) : (
										<StatusPill tone="grey">
											Closed {fmtWhen(t.closedAt).replace("Today ", "")}
										</StatusPill>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</SectionCard>

			<Modal
				open={!!closing}
				onOpenChange={(o) => !o && setClosing(null)}
				title={
					closing
						? `Close the ${humanize(closing.role).toLowerCase()} till`
						: ""
				}
				subtitle={
					closing
						? `${closing.openedBy} counts with you · expected ${naira(closing.expected)}`
						: undefined
				}
				icon={LockIcon}
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setClosing(null)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={
								typeof counted !== "number" ||
								(variance !== 0 && !note) ||
								pending
							}
							onClick={() =>
								closing &&
								typeof counted === "number" &&
								void run(
									() =>
										withDeliveries(
											closeTill(
												closing.id,
												{ countedCash: counted, note },
												closing,
											),
											"Till variance",
										),
									variance === 0
										? "Till closed · counts match"
										: `Till closed · ${variance < 0 ? "short" : "over"} ${naira(Math.abs(variance))} · manager told`,
									(row) => {
										setTills((xs) =>
											xs.map((t) =>
												t.id === closing.id ? { ...t, ...row } : t,
											),
										);
										setClosing(null);
									},
								)
							}
						>
							Close till
						</button>
					</>
				}
			>
				{closing && (
					<div className="flex flex-col gap-4">
						<TotalsList
							rows={[
								{ label: "Opening float", value: naira(closing.openingFloat) },
								{ label: "Cash taken", value: naira(closing.cashIn) },
								{
									label: "Expected",
									value: naira(closing.expected),
									strong: true,
								},
							]}
						/>
						<MoneyField
							label="Cash counted"
							value={counted}
							onChange={setCounted}
							required
						/>
						{typeof counted === "number" &&
							(variance === 0 ? (
								<Note tone="success">Counts match. Cash goes to the safe.</Note>
							) : (
								<Note tone={variance < 0 ? "danger" : "warning"}>
									{variance < 0 ? "Short" : "Over"} by{" "}
									{naira(Math.abs(variance))} · needs a note; the manager is
									told.
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
				)}
			</Modal>

			<Modal
				open={banking}
				onOpenChange={setBanking}
				title="Bank cash"
				subtitle={`${naira(inSafe)} in the safe from closed tills`}
				icon={LandmarkIcon}
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setBanking(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={typeof bankAmt !== "number" || !bank || pending}
							onClick={() =>
								typeof bankAmt === "number" &&
								void run(
									() =>
										bankCash({
											amount: bankAmt,
											bankAccount: bank,
											reference: ref,
										}),
									`${naira(bankAmt)} banked · deposit recorded`,
									() => {
										setBanking(false);
										setBankAmt("");
										setRef("");
									},
								)
							}
						>
							Record deposit
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<MoneyField
						label="Amount deposited"
						value={bankAmt}
						onChange={setBankAmt}
						required
						hint={`Up to ${naira(inSafe)}`}
					/>
					<TextField
						label="Bank account"
						value={bank}
						onChange={setBank}
						placeholder="e.g. GTBank · 0123456789"
						required
					/>
					<TextField
						label="Teller / deposit reference"
						value={ref}
						onChange={setRef}
						placeholder="From the deposit slip"
					/>
				</div>
			</Modal>
		</>
	);
}
