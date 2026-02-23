import { redirect } from "next/navigation";
import { use } from "react";
import { verifySession, getUser } from "@/lib/dal";
import { ChatLayout } from "@/components/chat/chat-layout";

export default function InventoryMessagesPage() {
	const session = use(verifySession("INVENTORY"));
	const user = use(getUser());

	if (!user || !user.hotels?.length) {
		redirect("/dashboard");
	}

	const hotelId = user.hotels[0].id;

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
