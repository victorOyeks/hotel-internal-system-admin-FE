"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
	type InfiniteData,
} from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { chatKeys } from "@/lib/chat-query-keys";
import {
	getMessages,
	sendMessage as sendMessageAction,
	deleteMessage as deleteMessageAction,
	editMessage as editMessageAction,
	markConversationAsRead as markReadAction,
} from "@/lib/chat-actions";
import { chatHotelIdAtom, chatUserIdAtom, chatFullNameAtom } from "@/lib/chat-store";
import type {
	ChatMessageResponse,
	CustomPage,
} from "@/lib/chat-types";

type MessagesCache = InfiniteData<CustomPage<ChatMessageResponse>>;

export function useChatMessages(conversationId: string | null) {
	return useInfiniteQuery({
		queryKey: chatKeys.messages(conversationId ?? ""),
		queryFn: async ({ pageParam = 0 }) => {
			const result = await getMessages(conversationId!, pageParam, 50);
			if (!result.success) throw new Error(result.error);
			return result.data as CustomPage<ChatMessageResponse>;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) =>
			lastPage.last ? undefined : lastPage.pageNumber + 1,
		maxPages: 10,
		enabled: !!conversationId,
		staleTime: 60_000,
	});
}

export function useSendMessage() {
	const queryClient = useQueryClient();
	const hotelId = useAtomValue(chatHotelIdAtom);
	const userId = useAtomValue(chatUserIdAtom);
	const fullName = useAtomValue(chatFullNameAtom);

	return useMutation({
		mutationFn: async ({
			conversationId,
			content,
			messageType = "TEXT",
			replyToMessageId,
		}: {
			conversationId: string;
			content: string;
			messageType?: string;
			replyToMessageId?: string;
		}) => {
			const result = await sendMessageAction(
				conversationId,
				content,
				messageType,
				replyToMessageId,
				hotelId,
			);
			if (!result.success) throw new Error(result.error);
			return result.data as ChatMessageResponse;
		},
		onMutate: async (variables) => {
			const queryKey = chatKeys.messages(variables.conversationId);
			await queryClient.cancelQueries({ queryKey });

			const previous = queryClient.getQueryData<MessagesCache>(queryKey);

			const optimisticMessage: ChatMessageResponse = {
				id: `optimistic-${Date.now()}`,
				conversationId: variables.conversationId,
				senderId: userId,
				senderName: fullName,
				senderAvatar: null,
				content: variables.content,
				messageType: (variables.messageType ?? "TEXT") as ChatMessageResponse["messageType"],
				attachmentUrl: null,
				attachmentName: null,
				attachmentType: null,
				attachmentSize: null,
				isDeleted: false,
				isEdited: false,
				editedAt: null,
				readByCount: 0,
				deliveryStatus: "SENT",
				deliveredAt: null,
				replyToMessage: null,
				createdAt: new Date().toISOString(),
				deleteAt: null,
			};

			queryClient.setQueryData<MessagesCache>(queryKey, (old) => {
				if (!old) return old;
				const pages = [...old.pages];
				// First page (index 0) contains newest messages (DESC from server)
				const firstPage = { ...pages[0] };
				firstPage.content = [optimisticMessage, ...firstPage.content];
				firstPage.totalElements += 1;
				pages[0] = firstPage;
				return { ...old, pages };
			});

			return { previous };
		},
		onError: (_err, variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					chatKeys.messages(variables.conversationId),
					context.previous,
				);
			}
		},
		onSettled: (_, __, variables) => {
			queryClient.invalidateQueries({
				queryKey: chatKeys.messages(variables.conversationId),
			});
		},
	});
}

export function useDeleteMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			messageId,
		}: {
			messageId: string;
			conversationId: string;
		}) => {
			const result = await deleteMessageAction(messageId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onMutate: async ({ messageId, conversationId }) => {
			const queryKey = chatKeys.messages(conversationId);
			await queryClient.cancelQueries({ queryKey });

			const previous = queryClient.getQueryData<MessagesCache>(queryKey);

			queryClient.setQueryData<MessagesCache>(queryKey, (old) => {
				if (!old) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						content: page.content.map((msg) =>
							msg.id === messageId ? { ...msg, isDeleted: true, content: "" } : msg,
						),
					})),
				};
			});

			return { previous };
		},
		onError: (_err, { conversationId }, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					chatKeys.messages(conversationId),
					context.previous,
				);
			}
		},
		onSettled: (_, __, { conversationId }) => {
			queryClient.invalidateQueries({
				queryKey: chatKeys.messages(conversationId),
			});
		},
	});
}

export function useEditMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			messageId,
			newContent,
		}: {
			messageId: string;
			newContent: string;
			conversationId: string;
		}) => {
			const result = await editMessageAction(messageId, newContent);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onMutate: async ({ messageId, newContent, conversationId }) => {
			const queryKey = chatKeys.messages(conversationId);
			await queryClient.cancelQueries({ queryKey });

			const previous = queryClient.getQueryData<MessagesCache>(queryKey);

			queryClient.setQueryData<MessagesCache>(queryKey, (old) => {
				if (!old) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						content: page.content.map((msg) =>
							msg.id === messageId
								? { ...msg, content: newContent, isEdited: true, editedAt: new Date().toISOString() }
								: msg,
						),
					})),
				};
			});

			return { previous };
		},
		onError: (_err, { conversationId }, context) => {
			if (context?.previous) {
				queryClient.setQueryData(
					chatKeys.messages(conversationId),
					context.previous,
				);
			}
		},
		onSettled: (_, __, { conversationId }) => {
			queryClient.invalidateQueries({
				queryKey: chatKeys.messages(conversationId),
			});
		},
	});
}

export function useMarkConversationAsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (conversationId: string) => {
			const result = await markReadAction(conversationId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: chatKeys.conversations(),
			});
			queryClient.invalidateQueries({
				queryKey: chatKeys.unreadCount(),
			});
		},
	});
}
