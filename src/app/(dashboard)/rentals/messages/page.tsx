import { redirect } from "next/navigation";
import { use } from "react";
import { verifySession, getUser } from "@/lib/dal";
import { DynamicChatLayout } from "@/components/chat/chat-layout-dynamic";

export default function RentalsMessagesPage() {
	const session = use(verifySession("RENTALS"));
	const user = use(getUser());

	if (!user || !user.hotels?.length) {
		redirect("/dashboard");
	}

	const hotelId = user.hotels[0].id;

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
