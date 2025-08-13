import { ViewSingleHotelPage } from "@/components/roles/hotel-owner/view-single-hotel";
import type { RoomDetails } from "@/lib/types";

async function resolveHotelName(id: string): Promise<string> {
	// Simulate fetching hotel name from an API or database
	return `Hotel ${id}`;
}

export default async function Page({
	params,
}: {
	params: Promise<{
		id: string;
	}>;
}) {
	const id = await params.then((params) => params.id);

	const breadcrumbs = {
		title: await resolveHotelName(id),
		breadcrumbs: [
			{
				label: "Dashboard",
				href: "/home",
			},
			{
				label: "Hotels",
				href: "/hotels",
			},
			{
				label: `Hotel ${id}`,
				href: `/hotels/${id}`,
			},
		],
	};

	const rooms: RoomDetails[] = [
		{
			roomNumber: "101",
			roomType: "Deluxe",
			roomName: "Deluxe Room 101",
			roomPrice: 150,
			roomStatus: "available",
			roomFacilities: ["WiFi", "Air Conditioning", "TV"],
		},
		{
			roomNumber: "102",
			roomType: "Standard",
			roomName: "Standard Room 102",
			roomPrice: 100,
			roomStatus: "booked",
			roomFacilities: ["WiFi", "TV"],
		},
		{
			roomNumber: "103",
			roomType: "Suite",
			roomName: "Suite Room 103",
			roomPrice: 250,
			roomStatus: "dirty",
			roomFacilities: ["WiFi", "Air Conditioning", "TV", "Mini Bar"],
		},
		{
			roomNumber: "104",
			roomType: "Standard",
			roomName: "Standard Room 104",
			roomPrice: 100,
			roomStatus: "blocked",
			roomFacilities: ["WiFi", "TV"],
		},
	];

	return <ViewSingleHotelPage breadcrumbs={breadcrumbs} rooms={rooms} />;
}
