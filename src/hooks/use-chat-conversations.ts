"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { chatKeys } from "@/lib/chat-query-keys";
import {
	getConversations,
	searchConversations,
	getOrCreateOneOnOneConversation,
	createGroupConversation,
} from "@/lib/chat-actions";
import { chatHotelIdAtom } from "@/lib/chat-store";
import type {
	ChatConversationResponse,
	CustomPage,
} from "@/lib/chat-types";

export function useChatConversations(page = 0) {
	const hotelId = useAtomValue(chatHotelIdAtom);

	return useQuery({
		queryKey: chatKeys.conversationsList(page),
		queryFn: async () => {
			const result = await getConversations(page, 50, hotelId);
			if (!result.success) throw new Error(result.error);
			return result.data as CustomPage<ChatConversationResponse>;
		},
		enabled: !!hotelId,
		staleTime: 30_000,
	});
}

export function useChatConversationsSearch(searchTerm: string) {
	const hotelId = useAtomValue(chatHotelIdAtom);

	return useQuery({
		queryKey: chatKeys.conversationsSearch(searchTerm),
		queryFn: async () => {
			const result = await searchConversations(searchTerm, 0, 20, hotelId);
			if (!result.success) throw new Error(result.error);
			return result.data as CustomPage<ChatConversationResponse>;
		},
		enabled: searchTerm.length >= 2 && !!hotelId,
		staleTime: 0,
	});
}

export function useCreateOneOnOneConversation() {
	const queryClient = useQueryClient();
	const hotelId = useAtomValue(chatHotelIdAtom);

	return useMutation({
		mutationFn: async (otherUserId: string) => {
			const result = await getOrCreateOneOnOneConversation(otherUserId, hotelId);
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
	const hotelId = useAtomValue(chatHotelIdAtom);

	return useMutation({
		mutationFn: async ({
			name,
			participantIds,
		}: {
			name: string;
			participantIds: string[];
		}) => {
			const result = await createGroupConversation(name, participantIds, hotelId);
			if (!result.success) throw new Error(result.error);
			return result.data as ChatConversationResponse;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
		},
	});
}
