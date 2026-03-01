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
    Hash,
    Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RoomDetailsContentProps {
    room: RoomDetails;
}

export function RoomDetailsContent({ room }: RoomDetailsContentProps) {
    const statusToColor = {
        AVAILABLE: "bg-green-100 text-green-800 border-green-200",
        RESERVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
        BOOKED: "bg-blue-100 text-blue-800 border-blue-200",
        CHECKED_IN: "bg-blue-100 text-blue-800 border-blue-200",
        CHECKED_OUT: "bg-gray-100 text-gray-800 border-gray-200",
        BLOCKED: "bg-red-100 text-red-800 border-red-200",
        DIRTY: "bg-red-50 text-red-600 border-red-200",
    };

    return (
        <DialogContent className="sm:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                    <Hotel className="h-6 w-6 text-primary" />
                    Room Details
                    <Badge
                        variant="outline"
                        className={cn(`ml-2 ${statusToColor[room.checkInStatus as keyof typeof statusToColor] || "bg-gray-100 text-gray-800"
                            } capitalize`)}
                    >
                        {room.checkInStatus.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                    {room.active === false && (
                        <Badge variant="destructive" className="ml-1">
                            Deactivated
                        </Badge>
                    )}
                </DialogTitle>
            </DialogHeader>

            {room.active === false && room.deactivationReason && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 mt-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-red-700">Deactivation Reason</p>
                        <p className="text-sm text-red-600 mt-0.5">{room.deactivationReason}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 py-4">
                {/* Room Information - Column 1 */}
                <div className="space-y-2">
                    <div className="bg-card border rounded-xl p-5 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                            <Info className="h-5 w-5" />
                            General Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Room Name/No
                                </span>
                                <div className="flex items-center gap-2 font-medium">
                                    <Hash className="h-4 w-4 text-gray-400" />
                                    {room.roomIdentifier}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    System ID
                                </span>
                                <div className="font-mono text-xs bg-muted p-1 rounded truncate" title={room.id}>
                                    {room.customId}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Room Type
                                </span>
                                <div className="flex items-center gap-2 font-medium">
                                    <Bed className="h-4 w-4 text-gray-400" />
                                    {room.roomType}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Branch
                                </span>
                                <div className="font-medium">{room.hotelName}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-xl p-5 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                            <Tag className="h-5 w-5" />
                            Pricing & Facilities
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                                <span className="text-sm font-medium text-muted-foreground">Standard Rate</span>
                                <span className="text-xl font-bold text-primary">
                                    {formatCurrency(room.roomPrice)}
                                    <span className="text-sm font-normal text-muted-foreground ml-1">/night</span>
                                </span>
                            </div>

                            <div className="space-y-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                    Amenities
                                </span>
                                {room.roomFacility.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {room.roomFacility.map((facility) => (
                                            <span
                                                key={facility}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 text-primary text-xs font-medium border border-primary/10"
                                            >
                                                <CheckCircle className="h-3 w-3" />
                                                {facility}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">
                                        No facilities listed for this room.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guest Information - Column 2 (Current or Empty State) */}
                <div className="space-y-6">
                    <div className="bg-card border rounded-xl p-5 h-full flex flex-col">
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-primary mb-4">
                            <User className="h-5 w-5" />
                            {room.checkInStatus === "AVAILABLE" ? "Last Known Guest" : "Current Occupancy"}
                        </h3>

                        {room.guestDetails ? (
                            <div className="space-y-6 flex-1">
                                <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-lg">
                                            {room.guestDetails.title} {room.guestDetails.guestName}
                                        </h4>
                                        <div className="text-sm text-muted-foreground flex gap-3">
                                            <span>{room.guestDetails.phoneNumber}</span>
                                        </div>
                                        {room.guestDetails.organizationName && (
                                            <div className="text-xs font-medium bg-white px-2 py-0.5 rounded border inline-block mt-1">
                                                {room.guestDetails.organizationName}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/20 rounded border space-y-1">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Check In
                                        </div>
                                        <div className="font-medium text-sm">
                                            {new Date(room.guestDetails.checkInDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded border space-y-1">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Check Out
                                        </div>
                                        <div className="font-medium text-sm">
                                            {new Date(room.guestDetails.checkOutDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t mt-auto">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">Booking Status</span>
                                        <Badge variant="outline">{room.guestDetails.bookingStatus}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Balance</span>
                                        <span className={`font-bold ${room.guestDetails.amountRemaining > 0 ? "text-red-600" : "text-green-600"}`}>
                                            {formatCurrency(room.guestDetails.amountRemaining)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-10">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <Bed className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="font-medium">Room is currently empty</p>
                                <p className="text-sm text-center max-w-[200px] mt-1">
                                    This room is available for reservation or check-in.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DialogContent>
    );
}
