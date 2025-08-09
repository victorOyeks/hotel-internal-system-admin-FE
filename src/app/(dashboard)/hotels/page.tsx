import { notFound } from "next/navigation";
import { HotelOwnerHotels } from "@/components/roles/hotel-owner/hotels";

function HotelsPage() {
  const role = "hotel-owner";

  switch (role) {
    case "hotel-owner":
      return (
        <HotelOwnerHotels />
      );
    default:
      return notFound();
  }
}

export default HotelsPage;
