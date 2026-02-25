"use client";

import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
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
import { chatHotelIdAtom } from "@/lib/chat-store";
import type {
	ChatMessageResponse,
	CustomPage,
} from "@/lib/chat-types";

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
		enabled: !!conversationId,
		staleTime: 60_000,
	});
}

export function useSendMessage() {
	const queryClient = useQueryClient();
	const hotelId = useAtomValue(chatHotelIdAtom);

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
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: chatKeys.messages(variables.conversationId),
			});
		},
	});
}

export function useDeleteMessage() {
	return useMutation({
		mutationFn: async (messageId: string) => {
			const result = await deleteMessageAction(messageId);
			if (!result.success) throw new Error(result.error);
			return result.data;
		},
	});
}

export function useEditMessage() {
	return useMutation({
		mutationFn: async ({
			messageId,
			newContent,
		}: {
			messageId: string;
			newContent: string;
		}) => {
			const result = await editMessageAction(messageId, newContent);
			if (!result.success) throw new Error(result.error);
			return result.data;
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
