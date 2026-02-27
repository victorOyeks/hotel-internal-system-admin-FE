"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import { ChatProvider } from "./chat-provider";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatArea } from "./chat-area";
import { EmptyChatState } from "./empty-chat-state";
import { NewConversationDialog } from "./new-conversation-dialog";
import {
	activeConversationIdAtom,
	activeConversationAtom,
	mobileChatViewAtom,
	chatHotelIdAtom,
	chatUserIdAtom,
	chatFullNameAtom,
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
	const router = useRouter();
	const setBreadcrumb = useSetAtom(breadcrumbAtom);
	const [newConvOpen, setNewConvOpen] = useState(false);
	const [activeConversationId, setActiveConversationId] = useAtom(
		activeConversationIdAtom,
	);
	const [activeConversation, setActiveConversation] = useAtom(activeConversationAtom);
	const [mobileView, setMobileView] = useAtom(mobileChatViewAtom);
	const setChatHotelId = useSetAtom(chatHotelIdAtom);
	const setChatUserId = useSetAtom(chatUserIdAtom);
	const setChatFullName = useSetAtom(chatFullNameAtom);

	// Set user & hotel context for chat hooks
	useEffect(() => {
		setChatHotelId(hotelId);
		setChatUserId(userId);
		setChatFullName(fullName);
	}, [hotelId, userId, fullName, setChatHotelId, setChatUserId, setChatFullName]);

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

	// Prevent body scroll behind fixed mobile chat
	useEffect(() => {
		if (!isMobile) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isMobile]);

	// Subscribe to conversation topics when active conversation changes
	useEffect(() => {
		if (!activeConversation?.id) return;
		if (activeConversation.conversationType === "GROUP") {
			chatWs.subscribeToConversationTopic(activeConversation.id);
		} else {
			// 1:1 chats use user queues for messages/edits/deletes, but typing is topic-based
			chatWs.subscribeToTypingTopic(activeConversation.id);
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

	const handleCloseChat = () => {
		setActiveConversationId(null);
		setActiveConversation(null);
	};

	const handleNavigateBack = () => {
		document.body.style.overflow = "";
		router.push("/dashboard");
	};

	const sidebar = (
		<ConversationSidebar
			currentUserId={userId}
			onNewConversation={() => setNewConvOpen(true)}
			onBack={isMobile ? handleNavigateBack : undefined}
		/>
	);

	const chatArea = activeConversation ? (
		<ChatArea
			conversation={activeConversation}
			currentUserId={userId}
			showBackButton={!!isMobile}
			onBack={handleBackToSidebar}
			onClose={!isMobile ? handleCloseChat : undefined}
		/>
	) : (
		<EmptyChatState onNewConversation={() => setNewConvOpen(true)} />
	);

	return (
		<ChatProvider token={token} hotelId={hotelId} userId={userId}>
			<title>{activeConversation ? `${fullName} - Chat` : "New Conversation"}</title>
			{isMobile ? (
				<div className="fixed inset-0 z-40 flex flex-col bg-white pt-[env(safe-area-inset-top)]">
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
