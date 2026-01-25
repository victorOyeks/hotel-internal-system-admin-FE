"use client";

import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { env } from "@/env";

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: "USER" | "ROLE" | "HOTEL" | "GLOBAL";
  targetUserId: string | null;
  targetRole: string | null;
  targetHotelId: string | null;
  category: string | null;
  actionLink: string | null;
  referenceId: string | null;
  icon: string | null;
  color: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

type NotificationCallback = (notification: NotificationPayload) => void;

class NotificationWebSocketService {
  private client: Client | null = null;
  private callbacks: NotificationCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  connect(token: string, userId: string, role: string, hotelId: string) {
    if (this.client?.connected || this.isConnecting) {
      console.log("WebSocket already connected or connecting");
      return;
    }

    this.isConnecting = true;
    const baseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${baseUrl}/ws`),

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("WebSocket connected!");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.subscribeToChannels(userId, role, hotelId);
      },

      onStompError: (frame) => {
        console.error("WebSocket STOMP error:", frame.headers["message"]);
        this.isConnecting = false;
      },

      onDisconnect: () => {
        console.log("WebSocket disconnected");
        this.isConnecting = false;
      },

      onWebSocketClose: () => {
        this.isConnecting = false;
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("Max WebSocket reconnection attempts reached");
        }
      },

      onWebSocketError: (error) => {
        console.error("WebSocket error:", error);
        this.isConnecting = false;
      },
    });

    this.client.activate();
  }

  private subscribeToChannels(userId: string, role: string, hotelId: string) {
    if (!this.client || !this.client.connected) return;

    // 1. User-specific notifications
    this.client.subscribe("/user/queue/notifications", (message: IMessage) => {
      this.handleNotification(message);
    });

    // 2. Role-based notifications (MOST COMMON)
    if (hotelId && role) {
      this.client.subscribe(
        `/topic/roles/${hotelId}/${role}`,
        (message: IMessage) => {
          this.handleNotification(message);
        }
      );
    }

    // 3. Hotel-wide notifications
    if (hotelId) {
      this.client.subscribe(`/topic/hotels/${hotelId}`, (message: IMessage) => {
        this.handleNotification(message);
      });
    }

    // 4. Global notifications
    this.client.subscribe("/topic/global", (message: IMessage) => {
      this.handleNotification(message);
    });

    console.log(
      `Subscribed to channels for user: ${userId}, role: ${role}, hotel: ${hotelId}`
    );
  }

  private handleNotification(message: IMessage) {
    try {
      const notification: NotificationPayload = JSON.parse(message.body);
      console.log("Received notification:", notification);
      this.callbacks.forEach((callback) => callback(notification));
    } catch (error) {
      console.error("Failed to parse notification:", error);
    }
  }

  onNotification(callback: NotificationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.callbacks = [];
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// Singleton instance
export const notificationWebSocket = new NotificationWebSocketService();
