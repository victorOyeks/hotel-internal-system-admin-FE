"use client";

import { BanknoteIcon, DownloadIcon, LandmarkIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import {
	loadCommissionStatement,
	saveMarketerBank,
} from "@hospio/api/actions/marketer";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	CommissionLine,
	MarketerMeData,
} from "@hospio/api/data/admin-types";
import { DetailList, Note } from "@hospio/ui/shared/detail-list";
import { SelectField, TextField } from "@hospio/ui/shared/field";
import { naira, nairaShort } from "@hospio/ui/shared/format";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { SectionCard } from "@hospio/ui/shared/section-card";
import { PanelSection, SidePanel } from "@hospio/ui/shared/side-panel";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { CommissionTable } from "../admin/marketers";
import { monthOptions } from "../admin/live";

const BANKS = [
	"GTBank",
	"Access",
	"Zenith",
	"UBA",
	"First Bank",
	"Kuda",
	"Moniepoint",
	"OPay",
	"Stanbic IBTC",
	"Fidelity",
	"Sterling",
	"Wema",
];

/** Marketer — Commissions: GET /platform/marketer/commissions, the text statement, and PUT /marketer/me/bank. */
export function MarketerCommissions({
	me: initialMe,
	ledger,
}: {
	me: MarketerMeData;
	ledger: CommissionLine[];
}) {
	const [me, setMe] = useState(initialMe);
	const [tab, setTab] = useQueryState("tab");
	const [statement, setStatement] = useState(false);
	const [bank, setBank] = useState(false);
	const months = [...new Set(ledger.map((c) => c.month))].sort().reverse();
	const [month, setMonth] = useState(months[0] ?? monthOptions(1)[0].value);
	const [bankName, setBankName] = useState(me.profile.bankName ?? "");
	const [account, setAccount] = useState(me.profile.bankAccount ?? "");
	const [accountName, setAccountName] = useState(
		me.profile.bankAccountName ?? me.profile.fullName,
	);
	const { run, pending } = useAction();
	const active = tab ?? "ALL";
	const rows = ledger.filter((c) =>
		active === "ALL" ? true : c.status === active,
	);
	const sum = (s?: string) =>
		ledger.filter((c) => !s || c.status === s).reduce((a, c) => a + c.net, 0);
	const p = me.profile;

	const download = (text: string, name: string) => {
		const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<>
			<PageHeader
				title="Commissions"
				subtitle={`${p.sharePct}% of the H.M.S share on each business, for ${p.months} months · 5% withholding tax deducted · paid once the hotel has paid`}
			>
				<button
					type="button"
					onClick={() => setBank(true)}
					className={cn(btn.secondary, "flex items-center gap-2")}
				>
					<LandmarkIcon className="size-4" /> Bank details
				</button>
				<button
					type="button"
					onClick={() => setStatement(true)}
					className={cn(btn.primary, "flex items-center gap-2")}
				>
					<DownloadIcon className="size-4" /> Download statement
				</button>
			</PageHeader>
			{!p.bankName && (
				<Note tone="warning">
					Add your bank details so H.M.S can pay you. Nothing is paid until they
					are in.
				</Note>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Paid all time"
					value={nairaShort(me.totals.paid)}
					icon={BanknoteIcon}
				/>
				<KpiCard
					label="Due now"
					value={nairaShort(sum("DUE"))}
					icon={BanknoteIcon}
					hint="Paid on the 5th"
				/>
				<KpiCard
					label="Waiting on hotels"
					value={nairaShort(sum("WAITING"))}
					icon={BanknoteIcon}
					hint="They haven't paid H.M.S yet"
				/>
				<KpiCard
					label="Gross before WHT"
					value={nairaShort(ledger.reduce((a, c) => a + c.gross, 0))}
					icon={BanknoteIcon}
					hint={`WHT ${naira(ledger.reduce((a, c) => a + c.wht, 0))}`}
				/>
			</div>
			<PillTabs
				tabs={[
					{ key: "ALL", label: "All", count: ledger.length },
					{
						key: "DUE",
						label: "Due",
						count: ledger.filter((c) => c.status === "DUE").length,
					},
					{
						key: "WAITING",
						label: "Waiting",
						count: ledger.filter((c) => c.status === "WAITING").length,
					},
					{
						key: "PAID",
						label: "Paid",
						count: ledger.filter((c) => c.status === "PAID").length,
					},
				]}
				value={active}
				onChange={(k) => void setTab(k === "ALL" ? null : k)}
			/>
			<SectionCard title="Ledger" subtitle="One line per business per month">
				<CommissionTable rows={rows} sharePct={p.sharePct} />
			</SectionCard>
			<Note tone="info">
				How it's worked out: the hotel pays H.M.S its monthly fee → you get{" "}
				{p.sharePct}% of that → 5% withholding tax comes off → the rest is
				transferred to your bank.
			</Note>

			<Modal
				open={statement}
				onOpenChange={setStatement}
				title="Download statement"
				subtitle="A text statement of every line in the month, with the WHT deducted"
				icon={DownloadIcon}
				size="confirm"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setStatement(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={pending || !month}
							onClick={() =>
								run(
									() => loadCommissionStatement(month),
									`Statement for ${month} downloaded`,
									(s) => {
										download(s.text, `hms-commissions-${s.month}.txt`);
										setStatement(false);
									},
								)
							}
						>
							Download .txt
						</button>
					</>
				}
			>
				<SelectField
					label="Month"
					value={month}
					onChange={setMonth}
					options={
						months.length
							? months.map((m) => ({ value: m, label: m }))
							: monthOptions(6)
					}
				/>
			</Modal>

			<SidePanel
				open={bank}
				onOpenChange={setBank}
				title="Bank details"
				subtitle="Where your commissions are paid"
				icon={LandmarkIcon}
				width="md"
				footer={
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => setBank(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={pending || !bankName || !account || !accountName}
							onClick={() =>
								run(
									() =>
										saveMarketerBank(
											{
												bankName,
												bankAccount: account,
												bankAccountName: accountName,
											},
											p,
										),
									"Bank details saved",
									(profile) => {
										setMe({ ...me, profile });
										setBank(false);
									},
								)
							}
						>
							Save
						</button>
					</>
				}
			>
				<div className="flex flex-col gap-5">
					<DetailList
						columns={2}
						items={[
							{ label: "Marketer", value: p.fullName },
							{ label: "Email", value: p.email },
						]}
					/>
					<PanelSection title="Account">
						<SelectField
							label="Bank"
							value={bankName}
							onChange={setBankName}
							options={
								BANKS.includes(bankName) || !bankName
									? BANKS
									: [bankName, ...BANKS]
							}
						/>
						<TextField
							label="Account number"
							value={account}
							onChange={setAccount}
							placeholder="0123456789"
						/>
						<TextField
							label="Name on the account"
							value={accountName}
							onChange={setAccountName}
						/>
					</PanelSection>
				</div>
			</SidePanel>
		</>
	);
}
