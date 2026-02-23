export type MessageDeliveryStatus = "SENT" | "DELIVERED" | "READ";
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
export type ConversationType = "ONE_ON_ONE" | "GROUP";
export type ParticipantRole = "ADMIN" | "MEMBER";

export interface ReplyToMessageSummary {
	id: string;
	senderId: string;
	senderName: string;
	content: string;
	messageType: string;
}

export interface ChatMessageResponse {
	id: string;
	conversationId: string;
	senderId: string;
	senderName: string;
	senderAvatar: string | null;
	content: string;
	messageType: MessageType;
	attachmentUrl: string | null;
	attachmentName: string | null;
	attachmentType: string | null;
	attachmentSize: number | null;
	isDeleted: boolean;
	isEdited: boolean;
	editedAt: string | null;
	readByCount: number;
	deliveryStatus: MessageDeliveryStatus;
	deliveredAt: string | null;
	replyToMessage: ReplyToMessageSummary | null;
	createdAt: string;
	deleteAt: string | null;
}

export interface ChatParticipantSummary {
	userId: string;
	userName: string;
	userAvatar: string | null;
	role: ParticipantRole;
	unreadCount: number;
	isMuted: boolean;
	isActive: boolean;
	lastReadAt: string | null;
	joinedAt: string;
}

export interface ChatConversationResponse {
	id: string;
	hotelId: string;
	conversationType: ConversationType;
	conversationName: string | null;
	conversationAvatar: string | null;
	isActive: boolean;
	lastMessageAt: string | null;
	lastMessagePreview: string | null;
	totalMessages: number;
	unreadCount: number;
	participants: ChatParticipantSummary[];
	createdAt: string;
	updatedAt: string;
}

export interface TypingIndicatorDTO {
	conversationId: string;
	userId: string;
	userName: string;
	isTyping: boolean;
}

export interface DeliveryStatusUpdateDTO {
	messageId: string;
	conversationId: string;
	status: MessageDeliveryStatus;
	updatedByUserId: string;
	updatedAt: string;
}

export interface UserPresenceResponse {
	userId: string;
	userName: string;
	isOnline: boolean;
	lastActiveAt: string | null;
}

export interface CustomPage<T> {
	content: T[];
	pageNumber: number;
	pageSize: number;
	totalElements: number;
	totalPages: number;
	last: boolean;
	first: boolean;
}

export interface ChatLayoutProps {
	token: string;
	userId: string;
	hotelId: string;
	fullName: string;
}
