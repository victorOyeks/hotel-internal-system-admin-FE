"use client";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type {
	ChatMessageResponse,
	TypingIndicatorDTO,
	DeliveryStatusUpdateDTO,
	UserPresenceResponse,
} from "./chat-types";

type MessageHandler = (message: ChatMessageResponse) => void;
type TypingHandler = (event: TypingIndicatorDTO) => void;
type DeleteHandler = (messageId: string) => void;
type EditHandler = (message: ChatMessageResponse) => void;
type DeliveryHandler = (status: DeliveryStatusUpdateDTO) => void;
type PresenceHandler = (presence: UserPresenceResponse) => void;
type ConnectionHandler = (
	status: "connecting" | "connected" | "disconnected" | "error",
) => void;

class ChatWebSocketService {
	private client: Client | null = null;
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	private subscribedConversations = new Set<string>();

	private onMessage: MessageHandler | null = null;
	private onTyping: TypingHandler | null = null;
	private onDelete: DeleteHandler | null = null;
	private onEdit: EditHandler | null = null;
	private onDelivery: DeliveryHandler | null = null;
	private onPresence: PresenceHandler | null = null;
	private onConnectionChange: ConnectionHandler | null = null;

	private _hotelId: string | null = null;

	connect(baseUrl: string, token: string, hotelId: string): void {
		if (this.client?.connected) return;

		this._hotelId = hotelId;
		this.onConnectionChange?.("connecting");

		this.client = new Client({
			webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
			connectHeaders: {
				Authorization: `Bearer ${token}`,
				"X-Hotel-Id": hotelId,
			},
			reconnectDelay: 5000,
			heartbeatIncoming: 10000,
			heartbeatOutgoing: 10000,

			onConnect: () => {
				this.onConnectionChange?.("connected");
				this.subscribeToUserChannels();
				if (this._hotelId) {
					this.subscribeToPresenceChannel(this._hotelId);
				}
				this.startHeartbeat();
				for (const convId of this.subscribedConversations) {
					this.subscribeToConversationTopicInternal(convId);
				}
			},

			onDisconnect: () => {
				this.onConnectionChange?.("disconnected");
				this.stopHeartbeat();
			},

			onStompError: (frame) => {
				console.error("STOMP error:", frame.headers.message);
				this.onConnectionChange?.("error");
			},
		});

		this.client.activate();
	}

	private subscribeToUserChannels(): void {
		if (!this.client?.connected) return;

		this.client.subscribe("/user/queue/chat/messages", (message) => {
			const msg: ChatMessageResponse = JSON.parse(message.body);
			this.onMessage?.(msg);
		});

		this.client.subscribe(
			"/user/queue/chat/message-deleted",
			(message) => {
				const messageId: string = JSON.parse(message.body);
				this.onDelete?.(messageId);
			},
		);

		this.client.subscribe("/user/queue/chat/message-edited", (message) => {
			const msg: ChatMessageResponse = JSON.parse(message.body);
			this.onEdit?.(msg);
		});

		this.client.subscribe("/user/queue/chat/typing", (message) => {
			const event: TypingIndicatorDTO = JSON.parse(message.body);
			this.onTyping?.(event);
		});

		this.client.subscribe(
			"/user/queue/chat/delivery-status",
			(message) => {
				const status: DeliveryStatusUpdateDTO = JSON.parse(message.body);
				this.onDelivery?.(status);
			},
		);
	}

	private subscribeToPresenceChannel(hotelId: string): void {
		if (!this.client?.connected) return;

		this.client.subscribe(`/topic/presence/${hotelId}`, (message) => {
			const presence: UserPresenceResponse = JSON.parse(message.body);
			this.onPresence?.(presence);
		});
	}

	subscribeToConversationTopic(conversationId: string): void {
		this.subscribedConversations.add(conversationId);
		this.subscribeToConversationTopicInternal(conversationId);
	}

	private subscribeToConversationTopicInternal(
		conversationId: string,
	): void {
		if (!this.client?.connected) return;

		this.client.publish({
			destination: "/app/chat/subscribe",
			body: JSON.stringify(conversationId),
		});

		this.client.subscribe(
			`/topic/conversations/${conversationId}`,
			(message) => {
				const msg: ChatMessageResponse = JSON.parse(message.body);
				this.onMessage?.(msg);
			},
		);

		this.client.subscribe(
			`/topic/conversations/${conversationId}/deleted`,
			(message) => {
				const messageId: string = JSON.parse(message.body);
				this.onDelete?.(messageId);
			},
		);

		this.client.subscribe(
			`/topic/conversations/${conversationId}/edited`,
			(message) => {
				const msg: ChatMessageResponse = JSON.parse(message.body);
				this.onEdit?.(msg);
			},
		);
	}

	sendTypingIndicator(conversationId: string, isTyping: boolean): void {
		if (!this.client?.connected) return;
		this.client.publish({
			destination: "/app/chat/typing",
			body: JSON.stringify({ conversationId, isTyping }),
		});
	}

	sendDeliveryConfirmation(
		messageId: string,
		conversationId: string,
	): void {
		if (!this.client?.connected) return;
		this.client.publish({
			destination: "/app/chat/delivered",
			body: JSON.stringify({ messageId, conversationId, status: "DELIVERED" }),
		});
	}

	private startHeartbeat(): void {
		this.stopHeartbeat();
		this.heartbeatInterval = setInterval(() => {
			if (this.client?.connected) {
				this.client.publish({
					destination: "/app/chat/heartbeat",
					body: "",
				});
			}
		}, 30000);
	}

	private stopHeartbeat(): void {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}

	onMessageReceived(handler: MessageHandler) {
		this.onMessage = handler;
	}
	onTypingReceived(handler: TypingHandler) {
		this.onTyping = handler;
	}
	onMessageDeleted(handler: DeleteHandler) {
		this.onDelete = handler;
	}
	onMessageEdited(handler: EditHandler) {
		this.onEdit = handler;
	}
	onDeliveryStatusReceived(handler: DeliveryHandler) {
		this.onDelivery = handler;
	}
	onPresenceUpdate(handler: PresenceHandler) {
		this.onPresence = handler;
	}
	onConnectionStatusChange(handler: ConnectionHandler) {
		this.onConnectionChange = handler;
	}

	disconnect(): void {
		this.stopHeartbeat();
		this.subscribedConversations.clear();
		this.onMessage = null;
		this.onTyping = null;
		this.onDelete = null;
		this.onEdit = null;
		this.onDelivery = null;
		this.onPresence = null;
		this.onConnectionChange = null;
		if (this.client) {
			this.client.deactivate();
			this.client = null;
		}
	}

	isConnected(): boolean {
		return this.client?.connected ?? false;
	}
}

export const chatWs = new ChatWebSocketService();
