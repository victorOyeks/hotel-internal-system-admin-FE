"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { StockMovementResponse } from "@/lib/fetch";

interface StockMovementDetailsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    movement: StockMovementResponse;
}

export function StockMovementDetails({
    open,
    onOpenChange,
    movement,
}: StockMovementDetailsProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Stock Movement Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
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

                    <Separator />

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
            </DialogContent>
        </Dialog>
    );
}
