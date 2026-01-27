"use client";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableFilter } from "@/components/shared/table-filter";
import { useQueryStates, parseAsString, parseAsStringLiteral } from "nuqs";
import { useState } from "react";

export function PurchaseOrderToolbar() {
	const [queryState, setQueryState] = useQueryStates({
		search: parseAsString,
		status: parseAsStringLiteral([
			"DRAFT",
			"PENDING_APPROVAL",
			"APPROVED",
			"REJECTED",
			"SENT",
			"PARTIALLY_RECEIVED",
			"COMPLETED",
			"CANCELLED",
		]),
	});

	const [open, setOpen] = useState(false);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div className="px-2">
				<p className="font-medium text-primary">Purchase Orders</p>
			</div>

			<div className="flex items-center gap-x-2">
				<div className="relative w-[250px]">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
					<Input
						placeholder="Search POs..."
						value={queryState.search ?? ""}
						onChange={(event) =>
							setQueryState({ search: event.target.value || null })
						}
						className="pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full border-none"
					/>
				</div>

				<TableFilter open={open} setOpen={setOpen} count={queryState.status ? 1 : 0}>
					<div className="flex flex-col gap-y-4 w-[280px]">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">Status</h4>
							<Select
								value={queryState.status ?? "all"}
								onValueChange={(value) =>
									setQueryState({
										status: value === "all" ? null : (value as any),
									})
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Filter by Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="DRAFT">Draft</SelectItem>
									<SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
									<SelectItem value="APPROVED">Approved</SelectItem>
									<SelectItem value="REJECTED">Rejected</SelectItem>
									<SelectItem value="SENT">Sent</SelectItem>
									<SelectItem value="PARTIALLY_RECEIVED">
										Partially Received
									</SelectItem>
									<SelectItem value="COMPLETED">Completed</SelectItem>
									<SelectItem value="CANCELLED">Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center justify-between border-t pt-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setQueryState({ status: null });
								}}
								className="text-muted-foreground hover:text-foreground"
							>
								Reset
							</Button>
							<Button
								size="sm"
								onClick={() => {
									setOpen(false);
								}}
							>
								Done
							</Button>
						</div>
					</div>
				</TableFilter>

				{(queryState.search || queryState.status) && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setQueryState({ search: null, status: null })}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<XIcon className="ml-2 h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
