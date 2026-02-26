"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { chatWs } from "@/lib/chat-websocket";
import { chatKeys } from "@/lib/chat-query-keys";
import { getOnlineUsers } from "@/lib/chat-actions";
import {
	playNotificationSound,
	showMessageNotification,
	showPushNotification,
	requestNotificationPermission,
} from "@/lib/chat-notification";
import {
	wsConnectionStatusAtom,
	typingIndicatorsAtom,
	onlineUsersAtom,
	unreadRefetchTriggerAtom,
} from "@/lib/chat-store";
import {
	notificationsAtom,
	notificationUnreadCountAtom,
	notificationRefetchTriggerAtom,
} from "@/lib/notification-store";
import type {
	ChatMessageResponse,
	ChatConversationResponse,
	CustomPage,
	TypingIndicatorDTO,
	DeliveryStatusUpdateDTO,
	UserPresenceResponse,
} from "@/lib/chat-types";
import type { NotificationResponse } from "@/lib/notification-types";
import type { InfiniteData } from "@tanstack/react-query";

export function useChatWebSocket(
	token: string,
	hotelId: string,
	userId: string,
	role?: string,
) {
	const queryClient = useQueryClient();
	const setConnectionStatus = useSetAtom(wsConnectionStatusAtom);
	const setTypingIndicators = useSetAtom(typingIndicatorsAtom);
	const setOnlineUsers = useSetAtom(onlineUsersAtom);
	const triggerUnreadRefetch = useSetAtom(unreadRefetchTriggerAtom);
	const setNotifications = useSetAtom(notificationsAtom);
	const setNotificationUnreadCount = useSetAtom(notificationUnreadCountAtom);
	const triggerNotifRefetch = useSetAtom(notificationRefetchTriggerAtom);
	const userIdRef = useRef(userId);
	userIdRef.current = userId;

	useEffect(() => {
		const baseUrl = process.env.NEXT_PUBLIC_API_URL;
		if (!baseUrl || !token || !hotelId) return;

		chatWs.onConnectionStatusChange((status) => {
			setConnectionStatus(status);
			if (status === "connected") {
				queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
				queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });

				// Fetch initial online users so we know who's already online
				getOnlineUsers(hotelId).then((result) => {
					if (result.success && Array.isArray(result.data)) {
						setOnlineUsers(result.data as string[]);
					}
				});

				requestNotificationPermission();
			}
		});

		chatWs.onMessageReceived((message: ChatMessageResponse) => {
			updateMessagesCache(queryClient, message);
			updateConversationsCache(queryClient, message, userIdRef.current);

			if (message.senderId !== userIdRef.current) {
				chatWs.sendDeliveryConfirmation(message.id, message.conversationId);
				triggerUnreadRefetch((prev) => prev + 1);
				playNotificationSound();
				showMessageNotification(
					message.senderName,
					message.content,
				);
			}
		});

		chatWs.onMessageDeleted((messageId: string) => {
			queryClient.setQueriesData<
				InfiniteData<CustomPage<ChatMessageResponse>>
			>({ queryKey: chatKeys.all }, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					pages: oldData.pages.map((page) => ({
						...page,
						content: page.content.map((msg) =>
							msg.id === messageId
								? { ...msg, isDeleted: true, content: "" }
								: msg,
						),
					})),
				};
			});
		});

		chatWs.onMessageEdited((editedMessage: ChatMessageResponse) => {
			queryClient.setQueriesData<
				InfiniteData<CustomPage<ChatMessageResponse>>
			>({ queryKey: chatKeys.all }, (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					pages: oldData.pages.map((page) => ({
						...page,
						content: page.content.map((msg) =>
							msg.id === editedMessage.id ? editedMessage : msg,
						),
					})),
				};
			});
		});

		chatWs.onTypingReceived((event: TypingIndicatorDTO) => {
			// Ignore own typing events — don't show "you are typing" to yourself
			if (event.userId === userIdRef.current) return;

			setTypingIndicators((prev) => {
				const convTyping = prev[event.conversationId] ?? [];
				if (event.isTyping) {
					if (!convTyping.find((t) => t.userId === event.userId)) {
						return {
							...prev,
							[event.conversationId]: [...convTyping, event],
						};
					}
					return prev;
				}
				return {
					...prev,
					[event.conversationId]: convTyping.filter(
						(t) => t.userId !== event.userId,
					),
				};
			});

			if (event.isTyping) {
				setTimeout(() => {
					setTypingIndicators((prev) => {
						const convTyping = prev[event.conversationId] ?? [];
						return {
							...prev,
							[event.conversationId]: convTyping.filter(
								(t) => t.userId !== event.userId,
							),
						};
					});
				}, 5000);
			}
		});

		chatWs.onDeliveryStatusReceived((status: DeliveryStatusUpdateDTO) => {
			queryClient.setQueriesData<
				InfiniteData<CustomPage<ChatMessageResponse>>
			>(
				{ queryKey: chatKeys.messages(status.conversationId) },
				(oldData) => {
					if (!oldData) return oldData;
					return {
						...oldData,
						pages: oldData.pages.map((page) => ({
							...page,
							content: page.content.map((msg) =>
								msg.id === status.messageId
									? { ...msg, deliveryStatus: status.status }
									: msg,
							),
						})),
					};
				},
			);
		});

		chatWs.onPresenceUpdate((presence: UserPresenceResponse) => {
			setOnlineUsers((prev: string[]) => {
				if (presence.isOnline) {
					return prev.includes(presence.userId)
						? prev
						: [...prev, presence.userId];
				}
				return prev.filter((id) => id !== presence.userId);
			});
		});

		chatWs.onNotificationReceived((notification: NotificationResponse) => {
			// Prepend to popover list (keep max 20)
			setNotifications((prev) => [notification, ...prev].slice(0, 20));
			// Increment unread badge
			setNotificationUnreadCount((prev) => prev + 1);
			// Trigger refetch
			triggerNotifRefetch((prev) => prev + 1);
			// Sound + push
			playNotificationSound();
			showPushNotification(notification.title, notification.message);
		});

		chatWs.connect(baseUrl, token, hotelId, role);

		return () => {
			chatWs.disconnect();
		};
	}, [
		token,
		hotelId,
		role,
		queryClient,
		setConnectionStatus,
		setTypingIndicators,
		setOnlineUsers,
		triggerUnreadRefetch,
		setNotifications,
		setNotificationUnreadCount,
		triggerNotifRefetch,
	]);
}

function updateMessagesCache(
	queryClient: ReturnType<typeof useQueryClient>,
	message: ChatMessageResponse,
) {
	queryClient.setQueryData<InfiniteData<CustomPage<ChatMessageResponse>>>(
		chatKeys.messages(message.conversationId),
		(oldData) => {
			if (!oldData) return oldData;
			const firstPage = oldData.pages[0];
			if (!firstPage) return oldData;
			const exists = firstPage.content.some((m) => m.id === message.id);
			if (exists) return oldData;
			return {
				...oldData,
				pages: [
					{
						...firstPage,
						content: [message, ...firstPage.content],
						totalElements: firstPage.totalElements + 1,
					},
					...oldData.pages.slice(1),
				],
			};
		},
	);
}

function updateConversationsCache(
	queryClient: ReturnType<typeof useQueryClient>,
	message: ChatMessageResponse,
	currentUserId: string,
) {
	queryClient.setQueriesData<CustomPage<ChatConversationResponse>>(
		{ queryKey: chatKeys.conversations() },
		(oldData) => {
			if (!oldData) return oldData;
			const conversations = [...oldData.content];
			const idx = conversations.findIndex(
				(c) => c.id === message.conversationId,
			);
			if (idx > -1) {
				const conv = { ...conversations[idx] };
				conv.lastMessageAt = message.createdAt;
				conv.lastMessagePreview = message.content;
				conv.totalMessages = (conv.totalMessages || 0) + 1;
				if (message.senderId !== currentUserId) {
					conv.unreadCount = (conv.unreadCount || 0) + 1;
				}
				conversations.splice(idx, 1);
				conversations.unshift(conv);
			}
			return { ...oldData, content: conversations };
		},
	);
}
