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

interface PurchaseOrderToolbarProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
}

export function PurchaseOrderToolbar({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
}: PurchaseOrderToolbarProps) {
    const isFiltered = searchQuery !== "" || statusFilter !== "all";

    return (
        <div className="flex items-center justify-between space-x-2 border border-primary-5/20 p-1 md:p-2 rounded-xl md:rounded-3xl bg-background">
            <div className="px-2">
                <p className="font-medium">Purchase Orders</p>
            </div>

            <div className="flex items-center gap-x-2">
                <div className="relative w-[250px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search POs..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="pl-9 bg-primary-5/15 text-primary-1 placeholder:text-primary-1/80 rounded-md md:rounded-full border-none"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] rounded-md md:rounded-full border-primary-5/20 bg-primary-5/15">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
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
            </div>
        </div>
    );
}
