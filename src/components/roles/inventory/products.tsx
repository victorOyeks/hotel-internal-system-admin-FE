"use client";

import { atom, useSetAtom } from "jotai";
import type { Table as TableType } from "@tanstack/react-table";
import type { InventoryProductResponse } from "@/lib/fetch";
import { useCallback, useState } from "react";
import {
	type ExportData,
	ExportDialog,
} from "@/components/shared/shared-dialogs";
import { SearchIcon } from "lucide-react";
import { TableFilter } from "@/components/shared/table-filter";

const successDialogAtom = atom({
	show: false,
	message: "",
});

export function ProductsToolbar({
	table,
}: {
	table: TableType<InventoryProductResponse>;
}) {
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const setSuccessDialogOpen = useSetAtom(successDialogAtom);

	const handleExport = useCallback(
		async (data: ExportData) => {
			// Handle the export logic here, e.g., sending data to an API
			console.log("Exporting data with the following details:", data);
			setExportDialogOpen(false);
			setSuccessDialogOpen({
				show: true,
				message: "Data exported successfully!",
			});
		},
		[setSuccessDialogOpen],
	);

	const [open, setOpen] = useState(false);

	return (
		<div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl">
			<div>
				<p>All Products
				 ({table.getRowCount()})</p>
			</div>

			<div className="flex items-center gap-x-2 ">
				<div className="relative">
					<input
						type="text"
						placeholder="Search..."
						value=""
						className="w-full pl-9 py-2 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full"
					/>
					<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
				</div>

				<div className="flex items-center gap-2">
					<TableFilter open={open} setOpen={setOpen}></TableFilter>

					{/* Applied Filters Display */}
					{/* {(statusFilter || postedFilter) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {statusFilter && (
                                <>
                                    <span>Status:</span>
                                    <span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                                        {statusFilter}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                        // onClick={() => setQueryState({ status: null })}
                                    >
                                        <XIcon className="h-3 w-3" />
                                    </Button>
                                </>
                            )} */}
					{/* {queryState.role && (
                <>
                  <span>Role:</span>
                  <span className="bg-primary-5/10 px-2 py-1 rounded-md font-medium">
                    {queryState.role.replace('_', ' ')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setQueryState({ role: null })}
                  >
                    <XIcon className="h-3 w-3" />
                  </Button>
                </>
              )} */}
					{/* </div> */}
					{/* )} */}
				</div>

				<ExportDialog
					open={exportDialogOpen}
					setOpenAction={setExportDialogOpen}
					onSubmitAction={handleExport}
				/>
			</div>
		</div>
	);
}
