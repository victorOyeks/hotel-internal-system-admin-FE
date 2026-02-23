"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatProvider } from "./chat-provider";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatArea } from "./chat-area";
import { EmptyChatState } from "./empty-chat-state";
import { NewConversationDialog } from "./new-conversation-dialog";
import {
	activeConversationIdAtom,
	activeConversationAtom,
	mobileChatViewAtom,
} from "@/lib/chat-store";
import { chatWs } from "@/lib/chat-websocket";
import { breadcrumbAtom } from "@/lib/store";
import type { ChatLayoutProps, ChatConversationResponse } from "@/lib/chat-types";

export function ChatLayout({
	token,
	userId,
	hotelId,
	fullName,
}: ChatLayoutProps) {
	const isMobile = useIsMobile();
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const [newConvOpen, setNewConvOpen] = useState(false);
	const [activeConversationId, setActiveConversationId] = useAtom(
		activeConversationIdAtom,
	);
	const [activeConversation, setActiveConversation] = useAtom(activeConversationAtom);
	const [mobileView, setMobileView] = useAtom(mobileChatViewAtom);

	useLayoutEffect(() => {
		setBreadcrumb({
			title: "Messages",
			breadcrumbs: [
				{ label: "Dashboard", href: "/dashboard" },
				{ label: "Messages", href: "/dashboard/messages" },
			],
		});
		return () => setBreadcrumb(null);
	}, [setBreadcrumb]);

	// Subscribe to group conversation topics when active conversation changes
	useEffect(() => {
		if (activeConversation?.conversationType === "GROUP" && activeConversation.id) {
			chatWs.subscribeToConversationTopic(activeConversation.id);
		}
	}, [activeConversation]);

	const handleNewConversationCreated = (conversation: ChatConversationResponse) => {
		setActiveConversationId(conversation.id);
		setActiveConversation(conversation);
		setMobileView("chat");
	};

	const handleBackToSidebar = () => {
		setMobileView("sidebar");
	};

	const sidebar = (
		<ConversationSidebar
			currentUserId={userId}
			onNewConversation={() => setNewConvOpen(true)}
		/>
	);

	const chatArea = activeConversation ? (
		<ChatArea
			conversation={activeConversation}
			currentUserId={userId}
			showBackButton={!!isMobile}
			onBack={handleBackToSidebar}
		/>
	) : (
		<EmptyChatState onNewConversation={() => setNewConvOpen(true)} />
	);

	return (
		<ChatProvider token={token} hotelId={hotelId} userId={userId}>
			{isMobile ? (
				<div className="h-full">
					{mobileView === "sidebar" ? sidebar : chatArea}
				</div>
			) : (
				<ResizablePanelGroup direction="horizontal" className="h-full">
					<ResizablePanel
						defaultSize={30}
						minSize={22}
						maxSize={40}
					>
						{sidebar}
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={70}>
						{chatArea}
					</ResizablePanel>
				</ResizablePanelGroup>
			)}

			<NewConversationDialog
				open={newConvOpen}
				onOpenChange={setNewConvOpen}
				currentUserId={userId}
				hotelId={hotelId}
				onConversationCreated={handleNewConversationCreated}
			/>
		</ChatProvider>
	);
}
