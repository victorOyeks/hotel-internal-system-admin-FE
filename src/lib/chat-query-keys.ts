export const chatKeys = {
	all: ["chat"] as const,
	conversations: () => [...chatKeys.all, "conversations"] as const,
	conversationsList: (page?: number) =>
		[...chatKeys.conversations(), "list", { page }] as const,
	conversationsSearch: (searchTerm: string) =>
		[...chatKeys.conversations(), "search", searchTerm] as const,
	conversation: (id: string) => [...chatKeys.conversations(), id] as const,
	messages: (conversationId: string) =>
		[...chatKeys.all, "messages", conversationId] as const,
	unreadCount: () => [...chatKeys.all, "unread-count"] as const,
	conversationUnread: (conversationId: string) =>
		[...chatKeys.all, "unread", conversationId] as const,
	presence: (conversationId: string) =>
		[...chatKeys.all, "presence", conversationId] as const,
	onlineUsers: () => [...chatKeys.all, "online-users"] as const,
	hotelStaff: () => [...chatKeys.all, "hotel-staff"] as const,
};
