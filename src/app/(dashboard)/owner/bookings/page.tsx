import { BookingsPage } from "@/components/roles/hotel-owner/bookings";
import type { RoomBooking } from "@/lib/types";

function Page() {

  const bookings: RoomBooking[] = [
    {
      id: "1",
      guestName: "John Doe",
      roomType: "Deluxe Suite",
      roomNumber: "101",
      branchName: "Main Branch",
      checkInDate: "2023-10-01",
      checkOutDate: "2023-10-05",
      status: "checked-in",
    },
    {
      id: "2",
      guestName: "Jane Smith",
      roomType: "Standard Room",
      roomNumber: "102",
      branchName: "Main Branch",
      checkInDate: "2023-10-02",
      checkOutDate: "2023-10-06",
      status: "checked-out",
    },
    {
      id: "3",
      guestName: "Alice Johnson",
      roomType: "Executive Room",
      roomNumber: "103",
      branchName: "Downtown Branch",
      checkInDate: "2023-10-03",
      checkOutDate: "2023-10-07",
      status: "pending",
    },
    {
      id: "4",
      guestName: "Bob Brown",
      roomType: "Family Suite",
      roomNumber: "104",
      branchName: "Downtown Branch",
      checkInDate: "2023-10-04",
      checkOutDate: "2023-10-08",
      status: "cancelled",
    },
    {
      id: "5",
      guestName: "Charlie Green",
      roomType: "Single Room",
      roomNumber: "105",
      branchName: "Airport Branch",
      checkInDate: "2023-10-05",
      checkOutDate: "2023-10-09",
      status: "checked-out",
    },
  ];

  return (
    <BookingsPage
      bookings={bookings}
      breadcrumb={{
        title: "Bookings",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Bookings", href: "/dashboard/bookings" },
        ],
      }}
    />
  );
}

export default Page;
