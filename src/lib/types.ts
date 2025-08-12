export interface PageProps extends AppLayoutProps {}

export interface AppLayoutProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
  children: React.ReactNode;
}

export interface ApiResponse<Data> {
   requestTime: string;
   requestType: string;
   referenceId: string;
   status: boolean;
   message: string;
   data: Data;
}

export type HotelRole =
  | "HOTEL_OWNER"
  | "MANAGER"
  | "FRONT_DESK"
  | "MAINTENANCE"
  | "INVENTORY"
  | "BAR"
  | "KITCHEN";

export type RoomDetails = {
  roomNumber: string;
  roomType: string;
  roomName: string;
  roomPrice: number;
  roomStatus: "available" | "dirty" | "reserved" | "booked" | "blocked";
  roomFacilities: string[];
}
export type RoomBooking = {
  id: string;
  guestName: string;
  roomType: string;
  roomNumber: string;
  branchName: string;
  checkInDate: string;
  checkOutDate: string;
  status: "checked-in" | "pending" | "available" | "checked-out" | "cancelled";
};
