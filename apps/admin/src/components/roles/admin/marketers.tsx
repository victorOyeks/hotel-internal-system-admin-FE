"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
	BanIcon,
	CheckIcon,
	CoinsIcon,
	KeyRoundIcon,
	MegaphoneIcon,
	PercentIcon,
	UserPlusIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import {
	inviteMarketer,
	loadMarketer,
	payCommission,
	setReferralStage,
	updateMarketer,
} from "@hospio/api/actions/platform-admin";
import { useAction } from "@hospio/api/actions/use-action";
import type {
	CommissionLine,
	MarketerInvitedData,
	MarketerProfileRow,
	Paged,
	ReferralItem,
	ReferralStage,
} from "@hospio/api/data/admin-types";
import type { AdminRole } from "@hospio/api/demo/fixtures/platform-extra";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { DetailList, Note, TotalsList } from "@hospio/ui/shared/detail-list";
import { FieldRow, SelectField, TextField } from "@hospio/ui/shared/field";
import {
	fmtLongDate,
	naira,
	nairaShort,
	plural,
} from "@hospio/ui/shared/format";
import { InviteCard } from "@hospio/ui/shared/invite-card";
import { KpiCard } from "@hospio/ui/shared/kpi-card";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { PageHeader } from "@hospio/ui/shared/page-header";
import { PillTabs } from "@hospio/ui/shared/pill-tabs";
import { RowActions } from "@hospio/ui/shared/row-actions";
import {
	PanelSection,
	SidePanel,
	WhatHappens,
} from "@hospio/ui/shared/side-panel";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { FilterSelect, SearchBox, Toolbar } from "@hospio/ui/shared/toolbar";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import {
	Loading,
	monthOptions,
	ServerPager,
	useFilterParam,
	useLoaded,
	usePageParam,
	useRefresh,
} from "./live";
import { can, ReadOnlyNote, StagePill } from "./shared";

const statusTone = {
	PENDING: "warning",
	ACTIVE: "success",
	ENDED: "grey",
} as const;
export const REFERRAL_STAGES: { value: ReferralStage; label: string }[] = [
	{ value: "LEAD", label: "Lead" },
	{ value: "CONTACTED", label: "Contacted" },
	{ value: "ONBOARDING", label: "Onboarding" },
	{ value: "LIVE", label: "Live" },
	{ value: "LOST", label: "Didn't sign up" },
];
const stageForPill = (s: ReferralStage) =>
	s === "CONTACTED" ? "LEAD" : s === "LOST" ? "SUSPENDED" : s;

/**
 * Admin — E1–E7 · Marketers (Figma 3305:3841): profiles from GET /platform/admin/marketers, a detail
 * panel with agreements, referrals and commissions, invite (E5), approve (E3), change share (E6), end
 * (E7), pay commissions (E4) and a referrals board; everything writes to platform-service.
 */
export function MarketersScreen({
	role,
	marketers: initial,
	commissions,
	referrals,
	inviterName,
}: {
	role: AdminRole;
	marketers: MarketerProfileRow[];
	commissions: Paged<CommissionLine>;
	referrals: Paged<ReferralItem>;
	inviterName: string;
}) {
	const [marketers, setMarketers] = useState(initial);
	const [tab, setTab] = useFilterParam("tab");
	const [status, setStatus] = useFilterParam("status");
	const [month, setMonth] = useFilterParam("month");
	const [cstatus, setCstatus] = useFilterParam("cstatus");
	const [, setPage] = usePageParam();
	const [open, setOpen] = useQueryState("open");
	const [isNew, setNew] = useQueryState("new");
	const [search, setSearch] = useState("");
	const [confirm, setConfirm] = useState<{
		kind: "approve" | "end" | "reactivate";
		m: MarketerProfileRow;
	} | null>(null);
	const [share, setShare] = useState<MarketerProfileRow | null>(null);
	const [pay, setPay] = useState<CommissionLine | null>(null);
	const { run, pending } = useAction();
	const { refresh } = useRefresh();
	const money = can.money(role);
	const editable = can.editBusiness(role);
	const active = tab || "marketers";
	const rows = marketers.filter((m) => !status || m.status === status);
	const update = (m: MarketerProfileRow) =>
		setMarketers((all) => all.map((x) => (x.id === m.id ? m : x)));

	const columns: ColumnDef<MarketerProfileRow, unknown>[] = [
		{
			accessorKey: "fullName",
			header: "Marketer",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.fullName}
					secondary={[row.original.email, row.original.phone]
						.filter(Boolean)
						.join(" · ")}
				/>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={statusTone[row.original.status]}>
					{row.original.status.toLowerCase()}
				</StatusPill>
			),
		},
		{
			accessorKey: "sharePct",
			header: "Share",
			cell: ({ row }) =>
				`${row.original.sharePct}% · ${row.original.months} months`,
		},
		{ accessorKey: "businesses", header: "Businesses" },
		{
			accessorKey: "earnedTotal",
			header: "Earned so far",
			cell: ({ row }) => naira(row.original.earnedTotal),
		},
		{
			accessorKey: "due",
			header: "Due",
			cell: ({ row }) => (
				<span
					className={cn(row.original.due > 0 && "font-semibold text-warning")}
				>
					{row.original.due ? naira(row.original.due) : "—"}
				</span>
			),
		},
		{
			accessorKey: "joined",
			header: "Joined",
			cell: ({ row }) => fmtLongDate(row.original.joined),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => (
				<RowActions
					actions={[
						{ label: "Open", onClick: () => void setOpen(row.original.id) },
						...(row.original.status === "PENDING" && editable
							? [
									{
										label: "Approve marketer",
										icon: CheckIcon,
										onClick: () =>
											setConfirm({ kind: "approve", m: row.original }),
									},
								]
							: []),
						...(editable
							? [
									{
										label: "Change share",
										icon: PercentIcon,
										onClick: () => setShare(row.original),
									},
								]
							: []),
						...(row.original.status === "ACTIVE" && editable
							? [
									{
										label: "End agreement",
										icon: BanIcon,
										tone: "danger" as const,
										separatorBefore: true,
										onClick: () => setConfirm({ kind: "end", m: row.original }),
									},
								]
							: []),
						...(row.original.status === "ENDED" && editable
							? [
									{
										label: "Reactivate",
										icon: CheckIcon,
										separatorBefore: true,
										onClick: () =>
											setConfirm({ kind: "reactivate", m: row.original }),
									},
								]
							: []),
					]}
				/>
			),
		},
	];
	const commissionCols: ColumnDef<CommissionLine, unknown>[] = [
		{
			accessorKey: "marketerName",
			header: "Marketer",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.marketerName}
					secondary={row.original.businessName}
				/>
			),
		},
		{ accessorKey: "month", header: "Month" },
		{
			accessorKey: "baseAmount",
			header: "Hospio360 share",
			cell: ({ row }) => (
				<span className="text-ink-2">{naira(row.original.baseAmount)}</span>
			),
		},
		{
			accessorKey: "gross",
			header: "Commission",
			cell: ({ row }) => naira(row.original.gross),
		},
		{
			accessorKey: "wht",
			header: "WHT",
			cell: ({ row }) => (
				<span className="text-ink-3">-{naira(row.original.wht)}</span>
			),
		},
		{
			accessorKey: "net",
			header: "Net",
			cell: ({ row }) => (
				<span className="font-semibold">{naira(row.original.net)}</span>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => <CommissionStatusPill status={row.original.status} />,
		},
		{
			id: "pay",
			header: "",
			cell: ({ row }) =>
				money && row.original.status === "DUE" ? (
					<button
						type="button"
						className={cn(btn.secondary, btn.small)}
						onClick={(e) => {
							e.stopPropagation();
							setPay(row.original);
						}}
					>
						Pay
					</button>
				) : row.original.paidReference ? (
					<span className="text-xs text-ink-3">
						{row.original.paidReference}
					</span>
				) : null,
		},
	];

	return (
		<>
			<PageHeader
				title="Marketers"
				subtitle="People who bring hotels onto Hospio360 · a share of our fee for a number of months, 5% WHT deducted"
			>
				{editable && (
					<button
						type="button"
						onClick={() => setNew("1")}
						className={cn(btn.primary, "flex items-center gap-2")}
					>
						<UserPlusIcon className="size-4" /> Invite a marketer
					</button>
				)}
			</PageHeader>
			{!money && !editable && (
				<ReadOnlyNote>Read only for your role.</ReadOnlyNote>
			)}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<KpiCard
					label="Active marketers"
					value={marketers.filter((m) => m.status === "ACTIVE").length}
					icon={MegaphoneIcon}
					hint={`${marketers.filter((m) => m.status === "PENDING").length} invited, not yet signed in`}
				/>
				<KpiCard
					label="Businesses referred"
					value={marketers.reduce((a, m) => a + m.businesses, 0)}
					icon={UserPlusIcon}
				/>
				<KpiCard
					label="Earned all time"
					value={nairaShort(marketers.reduce((a, m) => a + m.earnedTotal, 0))}
					icon={CoinsIcon}
				/>
				<KpiCard
					label="Due now"
					value={nairaShort(marketers.reduce((a, m) => a + m.due, 0))}
					icon={CoinsIcon}
					pill={
						marketers.some((m) => m.due > 0) ? (
							<StatusPill tone="warning">
								{marketers.filter((m) => m.due > 0).length} to pay
							</StatusPill>
						) : undefined
					}
				/>
			</div>
			<Toolbar
				left={
					<PillTabs
						tabs={[
							{ key: "marketers", label: "Marketers", count: marketers.length },
							...(money
								? [
										{
											key: "commissions",
											label: "Commissions",
											count: commissions.total,
										},
									]
								: []),
							{ key: "referrals", label: "Referrals", count: referrals.total },
						]}
						value={active}
						onChange={(k) => {
							setTab(k === "marketers" ? null : k);
							setPage(0);
						}}
					/>
				}
				right={
					active === "marketers" ? (
						<>
							<FilterSelect
								value={status}
								onChange={setStatus}
								all="Any status"
								options={[
									{ value: "ACTIVE", label: "Active" },
									{ value: "PENDING", label: "Pending" },
									{ value: "ENDED", label: "Ended" },
								]}
							/>
							<SearchBox
								value={search}
								onChange={setSearch}
								placeholder="Search marketers…"
							/>
						</>
					) : active === "commissions" ? (
						<>
							<FilterSelect
								value={cstatus}
								onChange={(v) => {
									setCstatus(v);
									setPage(0);
								}}
								all="Any status"
								options={[
									{ value: "DUE", label: "Due" },
									{ value: "PAID", label: "Paid" },
									{ value: "WAITING", label: "Waiting on the hotel" },
								]}
							/>
							<FilterSelect
								value={month}
								onChange={(v) => {
									setMonth(v);
									setPage(0);
								}}
								all="All months"
								options={monthOptions(14)}
							/>
						</>
					) : undefined
				}
			/>
			{active === "marketers" && (
				<DataTable
					columns={columns}
					data={rows}
					search={search}
					onRowClick={(m) => setOpen(m.id)}
					emptyTitle="No marketers"
				/>
			)}
			{active === "commissions" && (
				<DataTable
					columns={commissionCols}
					data={commissions.content}
					server={{ page: commissions, onPage: setPage }}
					emptyTitle="No commissions"
					emptyHint="Commissions are created when a referred business pays its monthly fee."
				/>
			)}
			{active === "referrals" && (
				<ReferralsBoard
					referrals={referrals}
					editable={editable}
					onPage={setPage}
					onChanged={refresh}
				/>
			)}

			<MarketerPanel
				id={open}
				editable={editable}
				money={money}
				onClose={() => void setOpen(null)}
				onApprove={(m) => setConfirm({ kind: "approve", m })}
				onEnd={(m) => setConfirm({ kind: "end", m })}
				onReactivate={(m) => setConfirm({ kind: "reactivate", m })}
				onShare={setShare}
				onPay={setPay}
				onChanged={refresh}
			/>

			<ConfirmModal
				open={confirm?.kind === "approve"}
				onOpenChange={(o) => !o && setConfirm(null)}
				title={`Approve ${confirm?.m.fullName}?`}
				subtitle="Their agreement starts; businesses they refer earn them a share once live"
				confirmLabel="Approve marketer"
				pending={pending}
				onConfirm={() =>
					confirm &&
					run(
						() => updateMarketer(confirm.m.id, { status: "ACTIVE" }, confirm.m),
						`${confirm.m.fullName} approved`,
						(m) => {
							update(m);
							setConfirm(null);
							refresh();
						},
					)
				}
			>
				<WhatHappens
					items={[
						`${confirm?.m.sharePct}% of the Hospio360 share for ${confirm?.m.months} months per business they bring`,
						"5% withholding tax is deducted from every payout",
						"They see only businesses they referred",
					]}
				/>
			</ConfirmModal>

			<ConfirmModal
				open={confirm?.kind === "reactivate"}
				onOpenChange={(o) => !o && setConfirm(null)}
				title={`Reactivate ${confirm?.m.fullName}?`}
				subtitle="New referrals count again from today"
				confirmLabel="Reactivate"
				pending={pending}
				onConfirm={() =>
					confirm &&
					run(
						() => updateMarketer(confirm.m.id, { status: "ACTIVE" }, confirm.m),
						`${confirm.m.fullName} reactivated`,
						(m) => {
							update(m);
							setConfirm(null);
							refresh();
						},
					)
				}
			/>

			<ConfirmModal
				open={confirm?.kind === "end"}
				onOpenChange={(o) => !o && setConfirm(null)}
				tone="danger"
				title={`End agreement with ${confirm?.m.fullName}?`}
				subtitle="No new referrals; commissions already earned are still paid out"
				confirmLabel="End agreement"
				pending={pending}
				onConfirm={() =>
					confirm &&
					run(
						() => updateMarketer(confirm.m.id, { status: "ENDED" }, confirm.m),
						`Agreement with ${confirm.m.fullName} ended`,
						(m) => {
							update(m);
							setConfirm(null);
							refresh();
						},
					)
				}
			>
				<WhatHappens
					tone="danger"
					items={[
						"The referral link stops working today",
						`${naira(confirm?.m.due ?? 0)} due now is still paid in the next run`,
						"Months already running keep paying until they expire",
					]}
				/>
			</ConfirmModal>

			<ShareModal
				marketer={share}
				onClose={() => setShare(null)}
				onSaved={(m) => {
					update(m);
					setShare(null);
					refresh();
				}}
			/>
			<PayCommissionModal
				line={pay}
				onClose={() => setPay(null)}
				onPaid={() => {
					setPay(null);
					refresh();
				}}
			/>
			<InviteMarketerPanel
				open={isNew === "1"}
				inviterName={inviterName}
				onOpenChange={(o) => void setNew(o ? "1" : null)}
				onCreated={(m) => {
					setMarketers((all) => [m, ...all]);
					refresh();
				}}
			/>
		</>
	);
}

export function CommissionStatusPill({ status }: { status: string }) {
	return (
		<StatusPill
			dot={false}
			tone={
				status === "PAID" ? "success" : status === "DUE" ? "warning" : "grey"
			}
		>
			{status === "WAITING" ? "hotel hasn't paid" : status.toLowerCase()}
		</StatusPill>
	);
}

/** The commission ledger as a compact table (also used by the marketer portal). */
export function CommissionTable({
	rows,
	sharePct,
	onPay,
}: {
	rows: CommissionLine[];
	sharePct?: number;
	onPay?: (c: CommissionLine) => void;
}) {
	if (rows.length === 0)
		return <p className="text-sm text-ink-3">Nothing earned yet.</p>;
	return (
		<div className="overflow-hidden rounded-xl border border-line">
			<table className="w-full text-left">
				<thead>
					<tr className="border-b border-line bg-[#fafafa] text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
						<th className="px-3 py-2">Month</th>
						<th className="px-3 py-2">Business</th>
						<th className="px-3 py-2 text-right">Hospio360 share</th>
						<th className="px-3 py-2 text-right">
							{sharePct ? `${sharePct}%` : "Commission"}
						</th>
						<th className="px-3 py-2 text-right">WHT</th>
						<th className="px-3 py-2 text-right">Net</th>
						<th className="px-3 py-2">Status</th>
						{onPay && <th className="px-3 py-2" />}
					</tr>
				</thead>
				<tbody>
					{rows.map((c) => (
						<tr
							key={c.id}
							className="border-b border-line text-[13px] last:border-b-0"
						>
							<td className="px-3 py-2">{c.month}</td>
							<td className="px-3 py-2">{c.businessName}</td>
							<td className="px-3 py-2 text-right text-ink-2">
								{naira(c.baseAmount)}
							</td>
							<td className="px-3 py-2 text-right">{naira(c.gross)}</td>
							<td className="px-3 py-2 text-right text-ink-3">
								-{naira(c.wht)}
							</td>
							<td className="px-3 py-2 text-right font-semibold">
								{naira(c.net)}
							</td>
							<td className="px-3 py-2">
								<CommissionStatusPill status={c.status} />
							</td>
							{onPay && (
								<td className="px-3 py-2 text-right">
									{c.status === "DUE" && (
										<button
											type="button"
											className={cn(btn.secondary, btn.small)}
											onClick={() => onPay(c)}
										>
											Pay
										</button>
									)}
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function MarketerPanel({
	id,
	editable,
	money,
	onClose,
	onApprove,
	onEnd,
	onReactivate,
	onShare,
	onPay,
	onChanged,
}: {
	id: string | null;
	editable: boolean;
	money: boolean;
	onClose: () => void;
	onApprove: (m: MarketerProfileRow) => void;
	onEnd: (m: MarketerProfileRow) => void;
	onReactivate: (m: MarketerProfileRow) => void;
	onShare: (m: MarketerProfileRow) => void;
	onPay: (c: CommissionLine) => void;
	onChanged: () => void;
}) {
	const { data, setData, loading, error } = useLoaded(id, loadMarketer);
	const { run, pending } = useAction();
	const m = data?.profile ?? null;
	return (
		<SidePanel
			open={!!id}
			onOpenChange={(o) => !o && onClose()}
			title={m?.fullName ?? "Marketer"}
			subtitle={
				m ? (
					<span className="flex items-center gap-2">
						{[m.email, m.phone].filter(Boolean).join(" · ")}{" "}
						<StatusPill tone={statusTone[m.status]}>
							{m.status.toLowerCase()}
						</StatusPill>
					</span>
				) : undefined
			}
			icon={MegaphoneIcon}
			width="lg"
			footerInfo={
				m
					? `${m.sharePct}% of the Hospio360 share for ${m.months} months per business · joined ${fmtLongDate(m.joined)}`
					: undefined
			}
			footer={
				m && (
					<>
						{editable && (
							<button
								type="button"
								className={btn.secondary}
								onClick={() => onShare(m)}
							>
								Change share
							</button>
						)}
						{m.status === "PENDING" && editable && (
							<button
								type="button"
								className={btn.primary}
								onClick={() => onApprove(m)}
							>
								Approve
							</button>
						)}
						{m.status === "ACTIVE" && editable && (
							<button
								type="button"
								className={btn.dangerSoft}
								onClick={() => onEnd(m)}
							>
								End agreement
							</button>
						)}
						{m.status === "ENDED" && editable && (
							<button
								type="button"
								className={btn.primary}
								onClick={() => onReactivate(m)}
							>
								Reactivate
							</button>
						)}
					</>
				)
			}
		>
			{loading && <Loading />}
			{error && <Note tone="danger">{error}</Note>}
			{data && m && (
				<div className="flex flex-col gap-5">
					<DetailList
						columns={2}
						items={[
							{ label: "Earned so far", value: naira(data.earnedTotal) },
							{ label: "Due now", value: naira(data.due) },
							{ label: "Paid out", value: naira(data.paid) },
							{ label: "Referral code", value: m.referralCode ?? "—" },
							{
								label: "Bank",
								value: m.bankName
									? `${m.bankName} · ${m.bankAccount} · ${m.bankAccountName}`
									: "Not given yet",
							},
							{ label: "Businesses", value: data.agreements.length },
						]}
					/>
					<PanelSection title="Agreements">
						{data.agreements.length === 0 ? (
							<p className="text-sm text-ink-3">
								No business has gone live from their referrals yet.
							</p>
						) : (
							<ul className="divide-y divide-line rounded-xl border border-line">
								{data.agreements.map((a) => (
									<li
										key={a.id}
										className="flex items-center gap-3 px-4 py-[10px] text-[13px]"
									>
										<span className="min-w-0 flex-1 font-semibold text-ink">
											{data.referrals.find((r) => r.businessId === a.businessId)
												?.hotelName ?? `Business ${a.businessId.slice(0, 8)}`}
										</span>
										<span className="text-ink-2">
											{a.sharePct}% · {a.months} months
											{a.startedOn ? ` from ${fmtLongDate(a.startedOn)}` : ""}
										</span>
										<StatusPill
											tone={a.status === "ACTIVE" ? "success" : "grey"}
										>
											{a.status.toLowerCase()}
										</StatusPill>
									</li>
								))}
							</ul>
						)}
					</PanelSection>
					<PanelSection title={`Referrals · ${data.referrals.length}`}>
						{data.referrals.length === 0 ? (
							<p className="text-sm text-ink-3">No referrals yet.</p>
						) : (
							<ul className="divide-y divide-line rounded-xl border border-line">
								{data.referrals.map((r) => (
									<li
										key={r.id}
										className="flex items-center gap-3 px-4 py-[10px]"
									>
										<div className="min-w-0 flex-1">
											<p className="text-[13px] font-semibold text-ink">
												{r.hotelName}
											</p>
											<p className="text-xs text-ink-3">
												{r.ownerName} · {r.city || "—"} · sent{" "}
												{fmtLongDate(r.sentAt)}
												{r.note ? ` · ${r.note}` : ""}
											</p>
										</div>
										{editable ? (
											<select
												value={r.stage}
												disabled={pending}
												onChange={(e) =>
													run(
														() =>
															setReferralStage(
																r.id,
																e.target.value as ReferralStage,
																undefined,
																r,
															),
														"Referral moved",
														(nr) => {
															setData({
																...data,
																referrals: data.referrals.map((x) =>
																	x.id === nr.id ? nr : x,
																),
															});
															onChanged();
														},
													)
												}
												className="h-8 rounded-control border border-line bg-card px-2 text-xs font-medium text-ink"
											>
												{REFERRAL_STAGES.map((s) => (
													<option key={s.value} value={s.value}>
														{s.label}
													</option>
												))}
											</select>
										) : (
											<StagePill stage={stageForPill(r.stage)} />
										)}
									</li>
								))}
							</ul>
						)}
					</PanelSection>
					<PanelSection title="Commission ledger">
						<CommissionTable
							rows={data.commissions}
							sharePct={m.sharePct}
							onPay={money ? onPay : undefined}
						/>
					</PanelSection>
				</div>
			)}
		</SidePanel>
	);
}

function ReferralsBoard({
	referrals,
	editable,
	onPage,
	onChanged,
}: {
	referrals: Paged<ReferralItem>;
	editable: boolean;
	onPage: (p: number) => void;
	onChanged: () => void;
}) {
	const [rows, setRows] = useState(referrals.content);
	const { run, pending } = useAction();
	const move = (r: ReferralItem, stage: ReferralStage) =>
		run(
			() => setReferralStage(r.id, stage, undefined, r),
			"Referral moved",
			(nr) => {
				setRows((all) => all.map((x) => (x.id === nr.id ? nr : x)));
				onChanged();
			},
		);
	return (
		<div className="flex flex-col gap-3">
			<div className="grid gap-3 md:grid-cols-5">
				{REFERRAL_STAGES.map((s) => {
					const items = rows.filter((r) => r.stage === s.value);
					return (
						<div
							key={s.value}
							className="flex flex-col gap-2 rounded-card border border-line bg-card p-3"
						>
							<p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
								{s.label}{" "}
								<span className="rounded-pill bg-subtle px-2 py-px text-[10px] text-ink-2">
									{items.length}
								</span>
							</p>
							{items.length === 0 && (
								<p className="py-3 text-center text-xs text-ink-3">—</p>
							)}
							{items.map((r) => (
								<div
									key={r.id}
									className="rounded-xl border border-line bg-page/50 p-3"
								>
									<p className="text-[13px] font-semibold text-ink">
										{r.hotelName}
									</p>
									<p className="text-xs text-ink-3">
										{r.ownerName} · {r.city || "—"}
									</p>
									<p className="text-[11px] text-ink-3">
										sent {fmtLongDate(r.sentAt)}
									</p>
									{editable && (
										<select
											value={r.stage}
											disabled={pending}
											onChange={(e) => move(r, e.target.value as ReferralStage)}
											className="mt-2 h-7 w-full rounded-control border border-line bg-card px-2 text-xs font-medium text-ink"
										>
											{REFERRAL_STAGES.map((o) => (
												<option key={o.value} value={o.value}>
													{o.label}
												</option>
											))}
										</select>
									)}
								</div>
							))}
						</div>
					);
				})}
			</div>
			<ServerPager
				page={referrals}
				onPage={onPage}
				className="rounded-card border border-line bg-card"
			/>
		</div>
	);
}

function ShareModal({
	marketer,
	onClose,
	onSaved,
}: {
	marketer: MarketerProfileRow | null;
	onClose: () => void;
	onSaved: (m: MarketerProfileRow) => void;
}) {
	const { run, pending } = useAction();
	const [share, setShare] = useState("");
	const [months, setMonths] = useState("");
	const open = !!marketer;
	// Reset the fields whenever another marketer is opened.
	useEffect(() => {
		setShare(marketer ? String(marketer.sharePct) : "");
		setMonths(marketer ? String(marketer.months) : "");
	}, [marketer]);
	return (
		<Modal
			open={open}
			onOpenChange={(o) => !o && onClose()}
			title={`Change ${marketer?.fullName ?? ""}'s share`}
			subtitle="Applies to new businesses they bring from today; agreements already running keep their terms"
			icon={PercentIcon}
			size="form"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || !marketer || !share || !months}
						onClick={() =>
							marketer &&
							run(
								() =>
									updateMarketer(
										marketer.id,
										{ sharePct: Number(share), months: Number(months) },
										marketer,
									),
								"Share saved",
								onSaved,
							)
						}
					>
						Save share
					</button>
				</>
			}
		>
			<FieldRow>
				<TextField
					label="Share of Hospio360 fee (%)"
					value={share}
					onChange={setShare}
				/>
				<TextField
					label="For how many months"
					value={months}
					onChange={setMonths}
				/>
			</FieldRow>
		</Modal>
	);
}

function PayCommissionModal({
	line,
	onClose,
	onPaid,
}: {
	line: CommissionLine | null;
	onClose: () => void;
	onPaid: () => void;
}) {
	const { run, pending } = useAction();
	const [ref, setRef] = useState("");
	const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
	return (
		<Modal
			open={!!line}
			onOpenChange={(o) => !o && onClose()}
			title={`Pay ${line?.marketerName ?? ""}`}
			subtitle={line ? `${line.businessName} · ${line.month}` : undefined}
			icon={CoinsIcon}
			size="form"
			footer={
				<>
					<button type="button" className={btn.secondary} onClick={onClose}>
						Cancel
					</button>
					<button
						type="button"
						className={btn.primary}
						disabled={pending || !line}
						onClick={() =>
							line &&
							run(
								() =>
									payCommission(
										line.id,
										{
											reference: ref || undefined,
											paidOn: paidOn || undefined,
										},
										line,
									),
								`${naira(line.net)} marked paid`,
								() => {
									setRef("");
									onPaid();
								},
							)
						}
					>
						Pay {line ? naira(line.net) : ""}
					</button>
				</>
			}
		>
			{line && (
				<div className="flex flex-col gap-4">
					<TotalsList
						rows={[
							{ label: "Commission", value: naira(line.gross) },
							{ label: "Withholding tax", value: `-${naira(line.wht)}` },
							{
								label: "Paid to marketer",
								value: naira(line.net),
								strong: true,
							},
						]}
					/>
					<TextField
						label="Bank transfer reference"
						value={ref}
						onChange={setRef}
						placeholder="GTB-…"
					/>
					<TextField
						label="Paid on"
						type="date"
						value={paidOn}
						onChange={setPaidOn}
					/>
					<Note tone="info">
						WHT is remitted to FIRS monthly; the marketer gets a credit note.
					</Note>
				</div>
			)}
		</Modal>
	);
}

function InviteMarketerPanel({
	open,
	inviterName,
	onOpenChange,
	onCreated,
}: {
	open: boolean;
	inviterName: string;
	onOpenChange: (o: boolean) => void;
	onCreated: (m: MarketerProfileRow) => void;
}) {
	const { run, pending } = useAction();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [share, setShare] = useState("20");
	const [months, setMonths] = useState("24");
	const [created, setCreated] = useState<MarketerInvitedData | null>(null);
	const reset = () => {
		setName("");
		setEmail("");
		setPhone("");
		setShare("20");
		setMonths("24");
		setCreated(null);
	};
	return (
		<SidePanel
			open={open}
			onOpenChange={(o) => {
				if (!o) reset();
				onOpenChange(o);
			}}
			title="Invite a marketer"
			subtitle="They get a marketer login; their status turns active at the first sign-in"
			icon={UserPlusIcon}
			width="md"
			footer={
				created ? (
					<button
						type="button"
						className={btn.primary}
						onClick={() => {
							reset();
							onOpenChange(false);
						}}
					>
						Done
					</button>
				) : (
					<>
						<button
							type="button"
							className={btn.secondary}
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</button>
						<button
							type="button"
							className={btn.primary}
							disabled={!name || !email || pending}
							onClick={() =>
								run(
									() =>
										withDeliveries(
											inviteMarketer({
												fullName: name,
												email,
												phone: phone || undefined,
												sharePct: Number(share),
												months: Number(months),
											}),
											`Invite for ${name}`,
										),
									`${name} invited`,
									(d) => {
										setCreated(d);
										onCreated(d.profile);
									},
								)
							}
						>
							Send invite
						</button>
					</>
				)
			}
		>
			{created ? (
				<div className="flex flex-col gap-3">
					<InviteCard
						title="Marketer login ready"
						fullName={created.profile.fullName}
						email={created.profile.email}
						phone={created.profile.phone}
						roleLabel="Marketer"
						businessName="Hospio360"
						inviterName={inviterName}
						temporaryPassword={created.login?.temporaryPassword}
						inviteToken={created.login?.inviteToken}
						inviteExpiresAt={created.login?.inviteExpiresAt}
						temporaryPasswordExpiresAt={
							created.login?.temporaryPasswordExpiresAt
						}
					/>
					{created.profile.referralCode && (
						<p className="flex items-center gap-2 text-xs text-ink-2">
							<KeyRoundIcon className="size-3" /> Referral code:{" "}
							<span className="font-mono font-semibold text-ink">
								{created.profile.referralCode}
							</span>
						</p>
					)}
				</div>
			) : (
				<div className="flex flex-col gap-5">
					<PanelSection title="Who">
						<TextField
							label="Full name"
							value={name}
							onChange={setName}
							required
						/>
						<FieldRow>
							<TextField
								label="Email"
								type="email"
								value={email}
								onChange={setEmail}
								required
							/>
							<TextField label="Phone" value={phone} onChange={setPhone} />
						</FieldRow>
					</PanelSection>
					<PanelSection title="Agreement">
						<FieldRow>
							<SelectField
								label="Share of Hospio360 fee"
								value={share}
								onChange={setShare}
								options={[
									{ value: "20", label: "20% · standard" },
									{ value: "15", label: "15%" },
									{ value: "10", label: "10%" },
								]}
							/>
							<SelectField
								label="For how long"
								value={months}
								onChange={setMonths}
								options={[
									{ value: "24", label: "24 months · standard" },
									{ value: "12", label: "12 months" },
									{ value: "6", label: "6 months" },
								]}
							/>
						</FieldRow>
						<Note tone="info">
							Paid monthly after the hotel pays its fee. 5% WHT is deducted.{" "}
							{plural(Number(months) || 0, "month")} per business.
						</Note>
					</PanelSection>
				</div>
			)}
		</SidePanel>
	);
}
