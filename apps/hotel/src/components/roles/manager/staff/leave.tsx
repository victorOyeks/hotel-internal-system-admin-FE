"use client";

import { CalendarRangeIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@hospio/ui/primitives/button";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { AvatarName } from "@hospio/ui/shared/detail-list";
import { FieldRow, TextField, TextareaField } from "@hospio/ui/shared/field";
import { fmtDay, humanize, plural } from "@hospio/ui/shared/format";
import { ConfirmModal, Modal } from "@hospio/ui/shared/modal";
import { withDeliveries } from "@hospio/ui/shared/deliveries-store";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { useAction } from "@hospio/api/actions/use-action";
import { decideLeave, decideShiftRequest } from "@hospio/api/actions/workforce";
import type { LeaveRow, ShiftRequestRow } from "@hospio/api/data/types";
import type { ColumnDef } from "@tanstack/react-table";

const leaveTone = {
	PENDING: "warning",
	APPROVED: "success",
	DECLINED: "danger",
	CHANGE_REQUESTED: "info",
} as const;

export function LeaveTable({
	rows,
	search,
}: {
	rows: LeaveRow[];
	search: string;
}) {
	const { run, pending } = useAction();
	const [decline, setDecline] = useState<LeaveRow | null>(null);
	const [change, setChange] = useState<LeaveRow | null>(null);
	const [reason, setReason] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");

	const columns: ColumnDef<LeaveRow, unknown>[] = [
		{
			header: "Staff",
			accessorKey: "staffName",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.staffName}
					secondary={humanize(row.original.role)}
					size="sm"
				/>
			),
		},
		{
			header: "Dates",
			accessorKey: "from",
			cell: ({ row }) => (
				<TwoLine
					primary={`${fmtDay(row.original.from)} → ${fmtDay(row.original.to)}`}
					secondary={plural(row.original.days, "day")}
				/>
			),
		},
		{
			header: "Reason",
			accessorKey: "reason",
			cell: ({ row }) => (
				<TwoLine primary={row.original.reason} secondary={row.original.note} />
			),
		},
		{
			header: "Status",
			accessorKey: "status",
			cell: ({ row }) => (
				<StatusPill tone={leaveTone[row.original.status]}>
					{humanize(row.original.status)}
				</StatusPill>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) =>
				row.original.status === "PENDING" ||
				row.original.status === "CHANGE_REQUESTED" ? (
					<div className="flex justify-end gap-2">
						<Button
							size="sm"
							variant="outline"
							className={`${btn.secondary} ${btn.small}`}
							onClick={() => {
								setChange(row.original);
								setFrom(row.original.from);
								setTo(row.original.to);
							}}
						>
							Change dates
						</Button>
						<Button
							size="sm"
							variant="outline"
							className={`${btn.dangerSoft} ${btn.small}`}
							onClick={() => setDecline(row.original)}
						>
							Decline
						</Button>
						<Button
							size="sm"
							className={`${btn.primary} ${btn.small}`}
							disabled={pending}
							onClick={() =>
								run(
									() =>
										withDeliveries(
											decideLeave(
												row.original.id,
												"APPROVED",
												undefined,
												row.original,
											),
											`Leave for ${row.original.staffName}`,
										),
									`${row.original.staffName}'s leave approved · their shifts in those days are cancelled`,
								)
							}
						>
							Approve
						</Button>
					</div>
				) : null,
		},
	];

	return (
		<>
			<DataTable
				columns={columns}
				data={rows}
				search={search}
				emptyTitle="No leave requests"
			/>
			<ConfirmModal
				open={!!decline}
				onOpenChange={(o) => !o && setDecline(null)}
				tone="danger"
				title="Decline leave?"
				subtitle={
					decline
						? `${decline.staffName} · ${fmtDay(decline.from)} → ${fmtDay(decline.to)}`
						: ""
				}
				confirmLabel="Decline leave"
				pending={pending}
				onConfirm={() =>
					decline &&
					run(
						() =>
							withDeliveries(
								decideLeave(decline.id, "DECLINED", reason, decline),
								`Leave for ${decline.staffName}`,
							),
						"Leave declined · they are told why",
						() => {
							setDecline(null);
							setReason("");
						},
					)
				}
				alternative={{
					label: "Suggest other dates instead",
					onClick: () => {
						setChange(decline);
						setDecline(null);
					},
				}}
			>
				<TextareaField
					label="Reason they will see"
					value={reason}
					onChange={setReason}
					placeholder="We're short on housekeeping that week…"
				/>
			</ConfirmModal>
			<Modal
				open={!!change}
				onOpenChange={(o) => !o && setChange(null)}
				icon={CalendarRangeIcon}
				title="Suggest different dates"
				subtitle={change?.staffName}
				footer={
					<>
						<Button
							variant="outline"
							className={btn.secondary}
							onClick={() => setChange(null)}
						>
							Cancel
						</Button>
						<Button
							className={btn.primary}
							disabled={pending}
							onClick={() =>
								change &&
								run(
									() =>
										withDeliveries(
											decideLeave(
												change.id,
												"CHANGE_REQUESTED",
												`Suggested ${fmtDay(from)} to ${fmtDay(to)}${reason.trim() ? `: ${reason.trim()}` : ""}`,
												change,
											),
											`Leave for ${change.staffName}`,
										),
									"New dates sent for them to accept",
									() => {
										setChange(null);
										setReason("");
									},
								)
							}
						>
							Send suggestion
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-4">
					<FieldRow>
						<TextField
							label="From"
							type="date"
							value={from}
							onChange={setFrom}
						/>
						<TextField label="To" type="date" value={to} onChange={setTo} />
					</FieldRow>
					<TextareaField
						label="Message"
						value={reason}
						onChange={setReason}
						placeholder="Can you move it a week later?"
					/>
				</div>
			</Modal>
		</>
	);
}

export function RequestsTable({
	rows,
	search,
}: {
	rows: ShiftRequestRow[];
	search: string;
}) {
	const { run, pending } = useAction();
	const columns: ColumnDef<ShiftRequestRow, unknown>[] = [
		{
			header: "Staff",
			accessorKey: "staffName",
			cell: ({ row }) => (
				<AvatarName
					name={row.original.staffName}
					secondary={humanize(row.original.role)}
					size="sm"
				/>
			),
		},
		{
			header: "Request",
			accessorKey: "kind",
			cell: ({ row }) => (
				<TwoLine
					primary={
						row.original.kind === "SWAP"
							? `Swap${row.original.withName ? ` with ${row.original.withName}` : ""}`
							: "Cover a shift"
					}
					secondary={row.original.reason}
				/>
			),
		},
		{
			header: "Shift",
			accessorKey: "date",
			cell: ({ row }) => (
				<TwoLine
					primary={fmtDay(row.original.date)}
					secondary={row.original.shift}
				/>
			),
		},
		{
			header: "Status",
			accessorKey: "status",
			cell: ({ row }) => (
				<StatusPill
					tone={
						row.original.status === "PENDING"
							? "warning"
							: row.original.status === "APPROVED"
								? "success"
								: "danger"
					}
				>
					{humanize(row.original.status)}
				</StatusPill>
			),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) =>
				row.original.status === "PENDING" ? (
					<div className="flex justify-end gap-2">
						<Button
							size="sm"
							variant="outline"
							className={`${btn.dangerSoft} ${btn.small}`}
							disabled={pending}
							onClick={() =>
								run(
									() =>
										withDeliveries(
											decideShiftRequest(row.original.id, false, row.original),
											`Request from ${row.original.staffName}`,
										),
									"Request declined",
								)
							}
						>
							Decline
						</Button>
						<Button
							size="sm"
							className={`${btn.primary} ${btn.small}`}
							disabled={pending}
							onClick={() =>
								run(
									() =>
										withDeliveries(
											decideShiftRequest(row.original.id, true, row.original),
											`Request from ${row.original.staffName}`,
										),
									"Request approved",
								)
							}
						>
							Approve
						</Button>
					</div>
				) : null,
		},
	];
	return (
		<DataTable
			columns={columns}
			data={rows}
			search={search}
			emptyTitle="No shift requests"
		/>
	);
}
