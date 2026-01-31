"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getProductMovementHistory } from "@/lib/inventory-actions";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { StockMovementResponse } from "@/lib/fetch";
import { Separator } from "@/components/ui/separator";

interface ProductHistorySheetProps {
    productId: string;
    productName: string;
    movement: StockMovementResponse
    children?: React.ReactNode;
}

export function ProductHistorySheet({
    productId,
    productName,
    movement,
    children,
}: ProductHistorySheetProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ["product-movements", productId],
        queryFn: async () => {
            const response = await getProductMovementHistory(productId);
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        enabled: isOpen,
    });

    const movements = data?.content || [];

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {children || (
                    <Button variant="link" className="p-0 h-auto font-medium">
                        {productName}
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent className="sm:max-w-2xl w-[90vw] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{productName}</SheetTitle>
                    <SheetDescription>
                        Recent stock movements for this product.
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading movement history...</p>
                    </div>
                ) : error ? (
                    <div className="p-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                Failed to load movement history. Please try again later.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="space-y-6 px-4">
                        {/* Header Info */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">{movement.movementNumber}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(movement.movementDate), "PPP p")}
                                </p>
                            </div>
                            <Badge variant="outline" className="text-base">
                                {movement.movementType.replace(/_/g, " ")}
                            </Badge>
                        </div>

                        {/* Product & Location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Product
                                </h4>
                                <p className="font-medium">{movement.productName}</p>
                                <p className="text-sm text-muted-foreground">
                                    SKU: {movement.productSku}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Location
                                </h4>
                                <p className="font-medium">{movement.locationName}</p>
                                <p className="text-sm text-muted-foreground">
                                    Code: {movement.locationCode}
                                </p>
                            </div>
                        </div>

                        {/* Quantity & Cost */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Quantity
                                </h4>
                                <p
                                    className={`font-medium ${movement.quantity < 0 ? "text-red-600" : "text-green-600"
                                        }`}
                                >
                                    {movement.quantity > 0 ? "+" : ""}
                                    {movement.quantity}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Balance After
                                </h4>
                                <p className="font-medium">{movement.balanceAfter}</p>
                            </div>
                        </div>

                        <Separator />

                        <section className="space-y-4">
                            <h1 className="text-lg font-medium">
                                Movement History
                            </h1>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead>Ref</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24">
                                                    No movements found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            movements.map((movement) => (
                                                <TableRow key={movement.id}>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className="whitespace-nowrap"
                                                        >
                                                            {movement.movementType.replace(/_/g, " ")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {format(new Date(movement.movementDate), "PP p")}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        <span
                                                            className={
                                                                movement.quantity < 0
                                                                    ? "text-red-600"
                                                                    : "text-green-600"
                                                            }
                                                        >
                                                            {movement.quantity > 0 ? "+" : ""}
                                                            {movement.quantity}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {movement.referenceNumber || "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>

                        {/* Additional Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {movement.batchNumber && (
                                <div>
                                    <span className="font-medium text-muted-foreground">
                                        Batch Number:
                                    </span>{" "}
                                    {movement.batchNumber}
                                </div>
                            )}
                            {movement.referenceNumber && (
                                <div>
                                    <span className="font-medium text-muted-foreground">
                                        Reference:
                                    </span>{" "}
                                    {movement.referenceNumber} ({movement.referenceType})
                                </div>
                            )}
                            {movement.performedBy && (
                                <div>
                                    <span className="font-medium text-muted-foreground">
                                        Performed By:
                                    </span>{" "}
                                    {movement.performedBy}
                                </div>
                            )}
                            {movement.receivedBy && (
                                <div>
                                    <span className="font-medium text-muted-foreground">
                                        Received By:
                                    </span>{" "}
                                    {movement.receivedBy}
                                </div>
                            )}
                        </div>

                        {/* Notes & Reason */}
                        {(movement.notes || movement.reason) && (
                            <div className="space-y-2">
                                {movement.reason && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">
                                            Reason
                                        </h4>
                                        <p className="text-sm">{movement.reason}</p>
                                    </div>
                                )}
                                {movement.notes && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">
                                            Notes
                                        </h4>
                                        <p className="text-sm">{movement.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
