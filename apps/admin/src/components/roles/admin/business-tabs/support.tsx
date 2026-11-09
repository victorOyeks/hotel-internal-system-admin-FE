"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Paged, TicketItem } from "@hospio/api/data/admin-types";
import { DataTable, TwoLine } from "@hospio/ui/shared/data-table";
import { fmtAgo } from "@hospio/ui/shared/format";
import { StatusPill } from "@hospio/ui/shared/status-pill";
import { btn } from "@hospio/ui/shared/ui";
import { cn } from "@hospio/ui/utils";
import { ticketPriority, ticketStatus } from "../shared";
import { BusinessTabHeader } from "./nav";

/** Business · Support tab: this business's tickets; opening one lands on the Support screen with the panel open. */
export function SupportTab({
	businessId,
	businessName,
	tickets,
}: {
	businessId: string;
	businessName: string;
	tickets: Paged<TicketItem>;
}) {
	const router = useRouter();
	const columns: ColumnDef<TicketItem, unknown>[] = [
		{
			accessorKey: "subject",
			header: "Ticket",
			cell: ({ row }) => (
				<TwoLine
					primary={row.original.subject}
					secondary={row.original.openedByName}
				/>
			),
		},
		{
			accessorKey: "priority",
			header: "Priority",
			cell: ({ row }) => (
				<StatusPill tone={ticketPriority[row.original.priority]}>
					{row.original.priority.toLowerCase()}
				</StatusPill>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusPill tone={ticketStatus[row.original.status].tone}>
					{ticketStatus[row.original.status].label}
				</StatusPill>
			),
		},
		{
			accessorKey: "assignedToName",
			header: "Assigned",
			cell: ({ row }) =>
				row.original.assignedToName ?? (
					<span className="text-ink-3">Unassigned</span>
				),
		},
		{
			accessorKey: "lastActivityAt",
			header: "Last activity",
			cell: ({ row }) => (
				<span className="text-ink-3">
					{fmtAgo(row.original.lastActivityAt ?? row.original.openedAt)}
				</span>
			),
		},
	];
	const open = tickets.content.filter((t) => t.status !== "RESOLVED").length;
	return (
		<>
			<BusinessTabHeader
				businessId={businessId}
				businessName={businessName}
				active="support"
				subtitle={`${open} open · ${tickets.total} in all`}
			>
				<Link
					href={`/dashboard/support?new=biz:${businessId}:`}
					className={cn(btn.primary, "flex items-center gap-2")}
				>
					<PlusIcon className="size-4" /> New ticket
				</Link>
			</BusinessTabHeader>
			<DataTable
				columns={columns}
				data={tickets.content}
				pageSize={25}
				onRowClick={(t) =>
					router.push(
						`/dashboard/support?status=ALL&businessId=${businessId}&open=${t.id}`,
					)
				}
				emptyTitle="No tickets from this business"
			/>
		</>
	);
}
