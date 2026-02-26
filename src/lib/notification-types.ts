export type NotificationType = "USER" | "ROLE" | "HOTEL" | "GLOBAL";

export interface NotificationResponse {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	targetUserId?: string;
	targetRole?: string;
	targetHotelId?: string;
	category?: string;
	actionLink?: string;
	referenceId?: string;
	icon?: string;
	color?: string;
	isRead: boolean;
	readAt?: string;
	createdAt: string;
}

export interface NotificationPageResponse {
	notifications: NotificationResponse[];
	unreadCount: number;
	totalElements: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
	hasNext: boolean;
	hasPrevious: boolean;
}
