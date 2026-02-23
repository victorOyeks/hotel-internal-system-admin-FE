"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatKeys } from "@/lib/chat-query-keys";
import {
	getConversations,
	searchConversations,
	getOrCreateOneOnOneConversation,
	createGroupConversation,
} from "@/lib/chat-actions";
import type {
	ChatConversationResponse,
	CustomPage,
} from "@/lib/chat-types";

export function useChatConversations(page = 0) {
	return useQuery({
		queryKey: chatKeys.conversationsList(page),
		queryFn: async () => {
			const result = await getConversations(page, 50);
			if (!result.success) throw new Error(result.error);
			return result.data as CustomPage<ChatConversationResponse>;
		},
		staleTime: 30_000,
	});
}

export function useChatConversationsSearch(searchTerm: string) {
	return useQuery({
		queryKey: chatKeys.conversationsSearch(searchTerm),
		queryFn: async () => {
			const result = await searchConversations(searchTerm);
			if (!result.success) throw new Error(result.error);
			return result.data as CustomPage<ChatConversationResponse>;
		},
		enabled: searchTerm.length >= 2,
		staleTime: 0,
	});
}

export function useCreateOneOnOneConversation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (otherUserId: string) => {
			const result = await getOrCreateOneOnOneConversation(otherUserId);
			if (!result.success) throw new Error(result.error);
			return result.data as ChatConversationResponse;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
		},
	});
}

export function useCreateGroupConversation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			name,
			participantIds,
		}: {
			name: string;
			participantIds: string[];
		}) => {
			const result = await createGroupConversation(name, participantIds);
			if (!result.success) throw new Error(result.error);
			return result.data as ChatConversationResponse;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
		},
	});
}
