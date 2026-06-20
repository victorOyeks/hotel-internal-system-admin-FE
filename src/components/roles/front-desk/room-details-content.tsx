import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { RoomDetails } from "@/lib/fetch";
import { cn, formatCurrency } from "@/lib/utils";
import {
    AlertTriangle,
    Calendar,
    User,
    Hotel,
    Bed,
    CheckCircle,
    Tag,
    Building,
    CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RoomDetailsContentProps {
    room: RoomDetails;
}

const STATUS_COLORS: Record<string, string> = {
    AVAILABLE:   "bg-green-100 text-green-800 border-green-200",
    RESERVED:    "bg-yellow-100 text-yellow-800 border-yellow-200",
    BOOKED:      "bg-blue-100 text-blue-800 border-blue-200",
    CHECKED_IN:  "bg-blue-100 text-blue-800 border-blue-200",
    CHECKED_OUT: "bg-gray-100 text-gray-800 border-gray-200",
    BLOCKED:     "bg-red-100 text-red-800 border-red-200",
    DIRTY:       "bg-red-50 text-red-600 border-red-200",
};

export function RoomDetailsContent({ room }: RoomDetailsContentProps) {
    const g = room.guestDetails;
    const hasGuest = !!g;

    return (
        <DialogContent className="sm:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl flex-wrap">
                    <Hotel className="h-5 w-5 text-primary shrink-0" />
                    <span>{room.roomIdentifier}</span>
                    <Badge
                        variant="outline"
                        className={cn(STATUS_COLORS[room.checkInStatus] ?? "bg-gray-100 text-gray-800", "capitalize")}
                    >
                        {room.checkInStatus.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                    {hasGuest && g!.isCurrentGuest && (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 font-normal">
                            {g!.title ? `${g!.title} ` : ""}{g!.guestName}
                        </span>
                    )}
                    {room.active === false && (
                        <Badge variant="destructive">Deactivated</Badge>
                    )}
                </DialogTitle>
            </DialogHeader>

            {room.active === false && room.deactivationReason && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-red-700">Deactivation Reason</p>
                        <p className="text-sm text-red-600 mt-0.5">{room.deactivationReason}</p>
                    </div>
                </div>
            )}

            <div className={cn("grid gap-4 py-2", hasGuest ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>

                {/* Column 1 — Room Info */}
                <div className="space-y-3">
                    {/* General */}
                    <div className="rounded-xl border bg-card p-4 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Room</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <div className="text-xs text-muted-foreground mb-0.5">Type</div>
                                <div className="font-medium flex items-center gap-1.5">
                                    <Bed className="h-3.5 w-3.5 text-muted-foreground" />{room.roomType}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground mb-0.5">Branch</div>
                                <div className="font-medium flex items-center gap-1.5">
                                    <Hotel className="h-3.5 w-3.5 text-muted-foreground" />{room.hotelName}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-xs text-muted-foreground mb-0.5">System ID</div>
                                <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">{room.customId}</div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Facilities */}
                    <div className="rounded-xl border bg-card p-4 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5" /> Pricing & Amenities
                        </h3>
                        <div className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded-lg">
                            <span className="text-sm text-muted-foreground">Nightly Rate</span>
                            <span className="text-lg font-bold text-primary">
                                {formatCurrency(room.roomPrice)}
                                <span className="text-xs font-normal text-muted-foreground ml-1">/night</span>
                            </span>
                        </div>
                        {room.roomFacility.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {room.roomFacility.map((f) => (
                                    <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-medium border border-primary/10">
                                        <CheckCircle className="h-2.5 w-2.5" />{f}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No amenities listed</p>
                        )}
                    </div>
                </div>

                {/* Column 2 — Guest / Stay (only when guest exists) */}
                {hasGuest && (
                    <div className="space-y-3">
                        {/* Guest identity */}
                        <div className="rounded-xl border bg-card p-4 space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" /> Guest
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">{g!.title ? `${g!.title} ` : ""}{g!.guestName}</div>
                                    <div className="text-xs text-muted-foreground">{g!.phoneNumber}</div>
                                </div>
                            </div>
                            {g!.organizationName && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1.5 rounded">
                                    <Building className="h-3.5 w-3.5 shrink-0" />
                                    {g!.organizationName}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-muted/40 rounded p-2 text-center">
                                    <div className="text-[10px] text-muted-foreground">Adults</div>
                                    <div className="font-semibold text-sm">{g!.noOfAdults ?? 0}</div>
                                </div>
                                <div className="bg-muted/40 rounded p-2 text-center">
                                    <div className="text-[10px] text-muted-foreground">Children</div>
                                    <div className="font-semibold text-sm">{g!.noOfChildren ?? 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* Stay dates */}
                        <div className="rounded-xl border bg-card p-4 space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" /> Stay
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-muted/30 rounded p-2.5 space-y-0.5">
                                    <div className="text-[10px] text-muted-foreground">Check In</div>
                                    <div className="font-medium text-xs">{new Date(g!.checkInDate).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</div>
                                </div>
                                <div className="bg-muted/30 rounded p-2.5 space-y-0.5">
                                    <div className="text-[10px] text-muted-foreground">{g!.bookingStatus === "CHECKED_OUT" ? "Check Out" : "Exp. Check Out"}</div>
                                    <div className="font-medium text-xs">{new Date(g!.checkOutDate).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-1 border-t">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="font-medium">{g!.numberOfNights} night{g!.numberOfNights !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Booking ID</span>
                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border">{g!.customId}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Column 3 (or 2 when no guest) — Financials or Available state */}
                <div>
                    {hasGuest ? (
                        <div className="rounded-xl border bg-card p-4 space-y-4 h-full">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5" /> Financials
                            </h3>

                            {/* Rate line */}
                            {(() => {
                                const hasDiscount = (g!.discountValue != null && g!.discountValue > 0) ||
                                    (g!.effectiveNightlyRate != null && g!.effectiveNightlyRate < g!.nightlyRate);
                                return (
                                    <div className="space-y-1.5 pb-3 border-b text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nightly Rate</span>
                                            <span className={cn("font-mono", hasDiscount && "line-through text-muted-foreground text-xs")}>
                                                {formatCurrency(g!.nightlyRate)}
                                            </span>
                                        </div>
                                        {hasDiscount && (
                                            <>
                                                {g!.discountValue != null && g!.discountValue > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Discount</span>
                                                        <span className="text-green-600 font-medium">
                                                            -{g!.discountType === "PERCENTAGE" ? `${g!.discountValue}%` : formatCurrency(g!.discountValue)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Effective Rate</span>
                                                    <span className="font-mono">{formatCurrency(g!.effectiveNightlyRate ?? g!.nightlyRate)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Accommodation</span>
                                    <span className="font-semibold">{formatCurrency(g!.accommodationCost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Due</span>
                                    <span className="font-semibold">{formatCurrency(g!.totalAmountDue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount Paid</span>
                                    <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">{formatCurrency(g!.amountPaid)}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t">
                                <div className="text-xs text-muted-foreground mb-1">Balance</div>
                                <div className={cn("text-2xl font-bold", g!.amountRemaining > 0 ? "text-red-600" : "text-green-600")}>
                                    {formatCurrency(g!.amountRemaining)}
                                </div>
                                {g!.amountRemaining > 0 && (
                                    <div className="text-xs text-red-500 font-medium mt-0.5">Payment required</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border bg-card p-6 flex flex-col items-center justify-center text-center text-muted-foreground h-full min-h-[160px]">
                            <Bed className="h-10 w-10 mb-3 opacity-20" />
                            <p className="font-medium text-sm">Room is available</p>
                            <p className="text-xs mt-1 max-w-[160px]">No guest currently assigned to this room.</p>
                        </div>
                    )}
                </div>
            </div>
        </DialogContent>
    );
}
