import { redirect } from "next/navigation";
import { use } from "react";
import { verifySession, getUser, getManagerCurrentHotel } from "@/lib/dal";
import { ChatLayout } from "@/components/chat/chat-layout";

export default function ManagerMessagesPage() {
	const session = use(verifySession("MANAGER"));
	const user = use(getUser());
	const currentHotel = use(getManagerCurrentHotel());

	if (!user || !user.hotels?.length) {
		redirect("/dashboard");
	}

	const hotelId = currentHotel?.id ?? user.hotels[0].id;

	return (
		<div className="h-[calc(100dvh-60px)]">
			<ChatLayout
				token={session.token}
				userId={session.userId}
				hotelId={hotelId}
				fullName={session.fullName}
			/>
		</div>
	);
}
