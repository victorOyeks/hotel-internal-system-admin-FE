import { notFound } from "next/navigation";
import { HotelOwnerHotels } from "@/components/roles/hotel-owner/hotels";
import { faker } from "@faker-js/faker";

const hotels = Array.from({ length: 125 }, () => ({
  id: faker.helpers.rangeToNumber({ min: 1000, max: 10000 }),
  branchName: faker.company.name(),
  location: faker.location.streetAddress(),
  totalRooms: faker.helpers.rangeToNumber({ min: 10, max: 100 }),
  occupancyRate: faker.helpers.rangeToNumber({ min: 0, max: 100 }),
  grossRevenue: faker.helpers.rangeToNumber({ min: 100000, max: 1000000 }),
  expenses: faker.helpers.rangeToNumber({ min: 5000, max: 500000 }),
}));

function HotelsPage() {
  const role = "hotel-owner";

  const breadcrumb = {
    title: "Hotels",
    breadcrumbs: [
      {
        label: "Dashboard",
        href: "/home",
      },
      {
        label: "Hotels",
        href: "/hotels",
      },
    ],
  };

  switch (role) {
    case "hotel-owner":
      return <HotelOwnerHotels breadcrumb={breadcrumb} hotels={hotels} />;
    default:
      return notFound();
  }
}

export default HotelsPage;
