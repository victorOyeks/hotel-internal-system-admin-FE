"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getBookingFinancialDetails } from "@/lib/financials-actions";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface BookingFinancialDetailModalProps {
    bookingId: string;
    trigger?: React.ReactNode;
}

export function BookingFinancialDetailModal({ bookingId, trigger }: BookingFinancialDetailModalProps) {
    const [open, setOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ["financials", "booking", bookingId],
        queryFn: () => getBookingFinancialDetails(bookingId),
        enabled: open,
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm">View Financials</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Booking Financial Details</DialogTitle>
                    <DialogDescription>
                        Complete financial breakdown for Booking #{bookingId}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500">Failed to load booking details</div>
                ) : data ? (
                    <div className="space-y-6">
                        <div>
                            <h4 className="mb-2 font-medium">Charges</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.charges?.map((item: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold">
                                        <TableCell>Total Charges</TableCell>
                                        <TableCell className="text-right">{formatCurrency(data.totalCharges || 0)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        <div>
                            <h4 className="mb-2 font-medium">Payments</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.payments?.map((item: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{item.method}</TableCell>
                                            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold">
                                        <TableCell colSpan={2}>Total Paid</TableCell>
                                        <TableCell className="text-right">{formatCurrency(data.totalPaid || 0)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-between rounded-lg bg-muted p-4 font-bold">
                            <span>Outstanding Balance</span>
                            <span className={(data.balance || 0) > 0 ? "text-red-600" : "text-green-600"}>
                                {formatCurrency(data.balance || 0)}
                            </span>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
