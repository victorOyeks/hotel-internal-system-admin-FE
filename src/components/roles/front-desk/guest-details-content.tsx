import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { RoomDetails } from "@/lib/fetch";
import { formatCurrency } from "@/lib/utils";
import { Calendar, CreditCard, User, Building } from "lucide-react";

interface GuestDetailsContentProps {
    guestDetails: RoomDetails["guestDetails"];
    roomIdentifier: string;
}

export function GuestDetailsContent({
    guestDetails,
    roomIdentifier,
}: GuestDetailsContentProps) {
    if (!guestDetails) return null;

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Guest Details - {roomIdentifier}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{guestDetails.guestName}</h3>
                        <p className="text-sm text-muted-foreground">
                            {guestDetails.phoneNumber}
                        </p>
                    </div>
                </div>

                {guestDetails.organizationName && (
                    <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Organization:</span>
                        <span>{guestDetails.organizationName}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                            <Calendar className="h-3 w-3" />
                            Check In
                        </div>
                        <p className="font-medium">
                            {new Date(guestDetails.checkInDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                            <Calendar className="h-3 w-3" />
                            Check Out
                        </div>
                        <p className="font-medium">
                            {new Date(guestDetails.checkOutDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 font-medium">
                        <CreditCard className="h-4 w-4" />
                        Payment Details
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Total Amount</div>
                        <div className="text-right font-medium">
                            {formatCurrency(guestDetails.amountPaid + guestDetails.amountRemaining)}
                        </div>
                        <div className="text-muted-foreground">Paid</div>
                        <div className="text-right font-medium text-green-600">
                            {formatCurrency(guestDetails.amountPaid)}
                        </div>
                        <div className="text-muted-foreground">Remaining</div>
                        <div className="text-right font-medium text-red-600">
                            {formatCurrency(guestDetails.amountRemaining)}
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}
