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
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    Guest Details
                    <span className="text-muted-foreground font-normal text-base">- {roomIdentifier}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${guestDetails.isCurrentGuest ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}>
                        {guestDetails.isCurrentGuest ? "Current Guest" : "Past Guest"}
                    </span>
                </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                {/* Guest Info Section - Column 1 */}
                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Guest Information</h4>
                    <div className="flex flex-col gap-4 p-4 rounded-lg border bg-card h-full">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">
                                    {guestDetails.title ? `${guestDetails.title} ` : ""}{guestDetails.guestName}
                                </h3>
                                <div className="text-sm text-muted-foreground">{guestDetails.phoneNumber}</div>
                            </div>
                        </div>

                        {guestDetails.organizationName && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted p-2 rounded">
                                <Building className="h-4 w-4" />
                                <span className="font-medium">Org:</span> {guestDetails.organizationName}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-auto pt-4">
                            <div className="bg-muted/50 p-2 rounded text-center">
                                <div className="text-xs text-muted-foreground">Adults</div>
                                <div className="font-semibold">{guestDetails.noOfAdults || 0}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded text-center">
                                <div className="text-xs text-muted-foreground">Children</div>
                                <div className="font-semibold">{guestDetails.noOfChildren || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Info Section - Column 2 */}
                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Booking Details</h4>
                    <div className="flex flex-col gap-4 h-full">
                        <div className="p-4 rounded-lg border bg-muted/30 space-y-3 flex-1">
                            <div className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Stay Information
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Booking ID</span>
                                    <span className="font-mono bg-background px-1 rounded border">{guestDetails.bookingId.slice(0, 8)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="capitalize px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                        {guestDetails.bookingStatus.toLowerCase().replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Room Type</span>
                                    <span className="font-medium text-right">{guestDetails.roomType}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border bg-muted/30 space-y-3 flex-1">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Check In</div>
                                        <div className="font-medium">{new Date(guestDetails.checkInDate).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground">Check Out</div>
                                        <div className="font-medium">{new Date(guestDetails.checkOutDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-medium">{Math.ceil((new Date(guestDetails.checkOutDate).getTime() - new Date(guestDetails.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} Nights</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Section - Column 3 */}
                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Financials</h4>
                    <div className="p-5 rounded-lg border bg-card h-full flex flex-col">
                        <div className="flex items-center gap-2 font-medium mb-4 text-primary">
                            <CreditCard className="h-5 w-5" />
                            Payment Summary
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center pb-3 border-b border-dashed">
                                <span className="text-muted-foreground">Nightly Rate</span>
                                <span className="font-mono">{formatCurrency(guestDetails.nightlyRate)}</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Bill</span>
                                    <span className="font-semibold">{formatCurrency(guestDetails.amountPaid + guestDetails.amountRemaining)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Amount Paid</span>
                                    <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">{formatCurrency(guestDetails.amountPaid)}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                                    <span className={`text-2xl font-bold ${guestDetails.amountRemaining > 0 ? "text-red-600" : "text-green-600"}`}>
                                        {formatCurrency(guestDetails.amountRemaining)}
                                    </span>
                                    {guestDetails.amountRemaining > 0 && (
                                        <span className="text-xs text-red-500 font-medium">Payment Required</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}
