import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableFilter } from "@/components/shared/table-filter";
import { useState, type PropsWithChildren } from "react";

interface StockTakeToolbarProps {
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	statusFilter: string;
	setStatusFilter: (value: string) => void;
	totalCount: number;
}

export function StockTakeToolbar({
	searchQuery,
	setSearchQuery,
	statusFilter,
	setStatusFilter,
	totalCount,
	children,
}: PropsWithChildren<StockTakeToolbarProps>) {
	const isFiltered = searchQuery !== "" || statusFilter !== "all";
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-card">
			<div>
				<p className="text-primary md:pl-2 font-medium">
					All Stock Takes ({totalCount})
				</p>
			</div>

			<div className="flex items-center gap-x-2">
				<div className="relative w-[250px]">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
					<Input
						placeholder="Search Stock Takes..."
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						className="pl-9 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full border-none"
					/>
				</div>

				<TableFilter
					open={isFilterOpen}
					setOpen={setIsFilterOpen}
					count={statusFilter !== "all" ? 1 : 0}
				>
					<div className="flex flex-col gap-y-4">
						<div className="flex items-center justify-between gap-x-4">
							<div className="flex flex-col gap-2">
								<span className="text-sm font-medium text-muted-foreground">
									Status
								</span>
								<div className="flex flex-wrap gap-2">
									{[
										{ label: "All", value: "all" },
										{ label: "Scheduled", value: "SCHEDULED" },
										{ label: "In Progress", value: "IN_PROGRESS" },
										{ label: "Pending Review", value: "PENDING_REVIEW" },
										{ label: "Reviewed", value: "REVIEWED" },
										{ label: "Completed", value: "COMPLETED" },
									].map((status) => (
										<Button
											key={status.value}
											size={"sm"}
											variant={"outline"}
											className="shadow-none text-xs hover:border-transparent"
											onClick={() => setStatusFilter(status.value)}
											data-active={statusFilter === status.value}
										>
											{statusFilter === status.value && (
												<CheckIcon className="w-3 h-3 mr-1" />
											)}
											<span>{status.label}</span>
										</Button>
									))}
								</div>
							</div>
						</div>

						<div className="flex items-center justify-end gap-x-2">
							<Button
								size={"sm"}
								variant={"ghost"}
								onClick={() => {
									setStatusFilter("all");
								}}
								className="h-8 px-2"
							>
								Reset
							</Button>
							<Button
								size={"sm"}
								onClick={() => setIsFilterOpen(false)}
								className="h-8 px-2"
							>
								Done
							</Button>
						</div>
					</div>
				</TableFilter>

				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => {
							setSearchQuery("");
							setStatusFilter("all");
						}}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<XIcon className="ml-2 h-4 w-4" />
					</Button>
				)}

				{children}
			</div>
		</div>
	);
}
