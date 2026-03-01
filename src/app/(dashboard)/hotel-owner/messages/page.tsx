import { redirect } from "next/navigation";
import { use } from "react";
import { verifySession, getUser, getOwnerCurrentHotel } from "@/lib/dal";
import { DynamicChatLayout } from "@/components/chat/chat-layout-dynamic";

export default function HotelOwnerMessagesPage() {
	const session = use(verifySession("HOTEL_OWNER"));
	const user = use(getUser());
	const currentHotel = use(getOwnerCurrentHotel());

	if (!user || !user.hotels?.length) {
		redirect("/dashboard");
	}

	const hotelId = currentHotel?.id ?? user.hotels[0].id;

	return (
		<div className="h-[calc(100dvh-60px)]">
			<DynamicChatLayout
				token={session.token}
				userId={session.userId}
				hotelId={hotelId}
				fullName={session.fullName}
			/>
		</div>
	);
}
