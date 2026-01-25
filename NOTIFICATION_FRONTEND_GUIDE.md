# Frontend Notification Integration Guide

This guide explains how to integrate real-time notifications into the frontend application.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket Real-Time Integration](#websocket-real-time-integration)
5. [Frontend Implementation](#frontend-implementation)
6. [Process Flows](#process-flows)
7. [Notification Types & Channels](#notification-types--channels)
8. [Best Practices](#best-practices)

---

## Overview

The notification system supports:
- **Real-time notifications** via WebSocket (STOMP over SockJS)
- **REST API** for fetching, marking as read, and managing notifications
- **Role-based notifications** - Each user sees notifications for their role
- **Per-user read status** - When one user reads a notification, others still see it as unread

### Key Features
- Notifications are fetched by **role** (e.g., all FRONT_DESK staff see the same notifications)
- Read status is tracked **per user** (each user has their own read/unread state)
- Real-time push via WebSocket for instant popup notifications
- REST API for fetching notification history and managing read status

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Business Action (e.g., Room Reserved)                                  │
│              │                                                           │
│              ▼                                                           │
│   NotificationService.sendToRole("FRONT_DESK", hotelId, title, message) │
│              │                                                           │
│              ├──► Save to Database (notifications table)                 │
│              │                                                           │
│              └──► Broadcast via WebSocket                                │
│                   messagingTemplate.convertAndSend(                      │
│                     "/topic/roles/{hotelId}/FRONT_DESK", notification)   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket (STOMP/SockJS)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   WebSocket Client                                                       │
│   Subscribed to: /topic/roles/{hotelId}/FRONT_DESK                      │
│              │                                                           │
│              ▼                                                           │
│   Receives notification in real-time                                     │
│              │                                                           │
│              ├──► Show toast/popup notification                          │
│              ├──► Update notification bell badge count                   │
│              └──► Add to notification list                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## REST API Endpoints

Base URL: `/api/notifications`

### 1. Get My Notifications (Paginated)

Fetches all notifications for the current user (includes role-based + direct + hotel-wide + global).

```http
GET /api/notifications/my-notifications?page=0&size=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Notifications retrieved successfully",
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "abc123",
        "title": "Room Reserved",
        "message": "Room 101 has been reserved for John Doe",
        "type": "ROLE",
        "targetUserId": null,
        "targetRole": "FRONT_DESK",
        "targetHotelId": "hotel-456",
        "category": "BOOKING",
        "actionLink": "/bookings/abc123",
        "referenceId": "booking-789",
        "icon": null,
        "color": null,
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-01-21T10:30:00"
      }
    ],
    "unreadCount": 5,
    "totalElements": 50,
    "totalPages": 3,
    "currentPage": 0,
    "pageSize": 20,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### 2. Get Unread Notifications

Fetches only unread notifications (no pagination).

```http
GET /api/notifications/unread
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Unread notifications retrieved successfully",
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "Room Reserved",
      "message": "Room 101 has been reserved",
      "type": "ROLE",
      "isRead": false,
      "createdAt": "2026-01-21T10:30:00"
    }
  ]
}
```

### 3. Get Unread Count

Returns the count of unread notifications (for badge display).

```http
GET /api/notifications/unread/count
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Unread count retrieved successfully",
  "success": true,
  "data": 5
}
```

### 4. Mark Notification as Read

Marks a single notification as read for the current user.

```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Notification marked as read",
  "success": true,
  "data": null
}
```

### 5. Mark All as Read

Marks all notifications as read for the current user.

```http
PUT /api/notifications/mark-all-read
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "All notifications marked as read",
  "success": true,
  "data": null
}
```

### 6. Delete Notification

Deletes a notification (admin only).

```http
DELETE /api/notifications/{notificationId}
Authorization: Bearer {token}
```

---

## WebSocket Real-Time Integration

### Connection Details

| Property | Value |
|----------|-------|
| **Endpoint** | `/ws` |
| **Protocol** | STOMP over SockJS |
| **Authentication** | JWT token in `Authorization` header during CONNECT |

### Channels to Subscribe

After connecting, subscribe to these channels based on user context:

| Channel | Purpose | Example |
|---------|---------|---------|
| `/user/queue/notifications` | Direct notifications to the user | Personal messages |
| `/topic/roles/{hotelId}/{role}` | Role-based notifications | `/topic/roles/hotel123/FRONT_DESK` |
| `/topic/hotels/{hotelId}` | Hotel-wide notifications | Announcements to all staff |
| `/topic/global` | System-wide notifications | Maintenance alerts |

### Notification Payload Structure

```typescript
interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'USER' | 'ROLE' | 'HOTEL' | 'GLOBAL';
  targetUserId: string | null;
  targetRole: string | null;
  targetHotelId: string | null;
  category: string | null;      // e.g., "BOOKING", "INVENTORY", "PAYMENT"
  actionLink: string | null;    // e.g., "/bookings/abc123"
  referenceId: string | null;   // e.g., booking ID, order ID
  icon: string | null;
  color: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
```

---

## Frontend Implementation

### 1. Install Dependencies

```bash
npm install sockjs-client @stomp/stompjs
npm install react-toastify  # For toast notifications (optional)
```

### 2. WebSocket Service

```typescript
// services/notificationWebSocket.ts
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'USER' | 'ROLE' | 'HOTEL' | 'GLOBAL';
  category?: string;
  actionLink?: string;
  isRead: boolean;
  createdAt: string;
}

type NotificationCallback = (notification: NotificationPayload) => void;

class NotificationWebSocketService {
  private client: Client | null = null;
  private callbacks: NotificationCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string, userId: string, role: string, hotelId: string) {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${backendUrl}/ws`),

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('WebSocket connected!');
        this.reconnectAttempts = 0;
        this.subscribeToChannels(userId, role, hotelId);
      },

      onStompError: (frame) => {
        console.error('WebSocket error:', frame.headers['message']);
      },

      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },

      onWebSocketClose: () => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
        }
      },
    });

    this.client.activate();
  }

  private subscribeToChannels(userId: string, role: string, hotelId: string) {
    if (!this.client || !this.client.connected) return;

    // 1. User-specific notifications
    this.client.subscribe('/user/queue/notifications', (message: IMessage) => {
      this.handleNotification(message);
    });

    // 2. Role-based notifications (MOST COMMON)
    this.client.subscribe(`/topic/roles/${hotelId}/${role}`, (message: IMessage) => {
      this.handleNotification(message);
    });

    // 3. Hotel-wide notifications
    this.client.subscribe(`/topic/hotels/${hotelId}`, (message: IMessage) => {
      this.handleNotification(message);
    });

    // 4. Global notifications
    this.client.subscribe('/topic/global', (message: IMessage) => {
      this.handleNotification(message);
    });

    console.log(`Subscribed to channels for user: ${userId}, role: ${role}, hotel: ${hotelId}`);
  }

  private handleNotification(message: IMessage) {
    try {
      const notification: NotificationPayload = JSON.parse(message.body);
      console.log('Received notification:', notification);
      this.callbacks.forEach(callback => callback(notification));
    } catch (error) {
      console.error('Failed to parse notification:', error);
    }
  }

  onNotification(callback: NotificationCallback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.callbacks = [];
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export const notificationService = new NotificationWebSocketService();
```

### 3. React Hook

```typescript
// hooks/useNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import { notificationService } from '../services/notificationWebSocket';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  actionLink?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications on mount
  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [token]);

  // Connect to WebSocket
  useEffect(() => {
    if (token && user?.id && user?.role && user?.hotelId) {
      notificationService.connect(token, user.id, user.role, user.hotelId);

      const unsubscribe = notificationService.onNotification((notification) => {
        // Add to list
        setNotifications(prev => [notification, ...prev]);

        // Increment unread count
        setUnreadCount(prev => prev + 1);

        // Show toast
        showToast(notification);
      });

      return () => {
        unsubscribe();
        notificationService.disconnect();
      };
    }
  }, [token, user?.id, user?.role, user?.hotelId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/my-notifications?page=0&size=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const showToast = (notification: Notification) => {
    toast.info(
      <div>
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
      </div>,
      {
        position: 'top-right',
        autoClose: 5000,
        onClick: () => {
          markAsRead(notification.id);
          if (notification.actionLink) {
            window.location.href = notification.actionLink;
          }
        }
      }
    );
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
```

### 4. Notification Bell Component

```tsx
// components/NotificationBell.tsx
import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Bell } from 'lucide-react';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.actionLink) {
                      window.location.href = notification.actionLink;
                    }
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">
                      {notification.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  {notification.category && (
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {notification.category}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t text-center">
              <a
                href="/notifications"
                className="text-sm text-blue-600 hover:underline"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Process Flows

### Flow 1: User Receives Real-Time Notification

```
1. Business Action Occurs
   └─► Example: Front Desk Officer reserves a room

2. Backend Sends Notification
   └─► NotificationService.sendToRole("FRONT_DESK", hotelId, title, message, category)
       ├─► Saves to database (notifications table)
       └─► Broadcasts to WebSocket channel: /topic/roles/{hotelId}/FRONT_DESK

3. Frontend Receives via WebSocket
   └─► All FRONT_DESK users subscribed to /topic/roles/{hotelId}/FRONT_DESK
       ├─► Toast popup appears instantly
       ├─► Badge count increments
       └─► Added to notification dropdown list

4. User Interacts
   └─► Clicks notification
       ├─► Calls PUT /api/notifications/{id}/read
       ├─► Local state updates (isRead: true)
       └─► Navigates to actionLink (e.g., /bookings/abc123)
```

### Flow 2: User Opens Notification Dropdown

```
1. User Clicks Bell Icon
   └─► Dropdown opens showing cached notifications

2. On Initial Load (or Refresh)
   └─► Calls GET /api/notifications/my-notifications
       └─► Returns paginated notifications with per-user read status

3. User Sees Notifications
   └─► Unread notifications highlighted (blue background)
   └─► Badge shows unread count

4. User Marks All as Read
   └─► Calls PUT /api/notifications/mark-all-read
       └─► All notifications show as read
       └─► Badge count becomes 0
```

### Flow 3: WebSocket Connection Lifecycle

```
1. User Logs In
   └─► Get JWT token, userId, role, hotelId from auth response

2. Initialize WebSocket Connection
   └─► Connect to /ws with JWT in Authorization header
       └─► Backend validates token, extracts userId

3. Subscribe to Channels
   └─► /user/queue/notifications (personal)
   └─► /topic/roles/{hotelId}/{role} (role-based)
   └─► /topic/hotels/{hotelId} (hotel-wide)
   └─► /topic/global (system-wide)

4. Connection Maintained
   └─► Heartbeat every 4 seconds
   └─► Auto-reconnect on disconnect (up to 5 attempts)

5. User Logs Out
   └─► Disconnect WebSocket
   └─► Clear local notification state
```

---

## Notification Types & Channels

### By Notification Type

| Type | Channel Pattern | Example Use Case |
|------|-----------------|------------------|
| `USER` | `/user/queue/notifications` | "Your password has been reset" |
| `ROLE` | `/topic/roles/{hotelId}/{role}` | "Room 101 reserved" to FRONT_DESK |
| `HOTEL` | `/topic/hotels/{hotelId}` | "System maintenance at 2AM" |
| `GLOBAL` | `/topic/global` | "New feature released!" |

### By Role (Common Notifications)

| Role | Common Notifications |
|------|---------------------|
| `FRONT_DESK` | Check-in, Check-out, Reservations, Payments, Laundry orders |
| `INVENTORY` | PO approvals, GRN posted, Stock adjustments |
| `RESTAURANT` | New food orders, Order status changes |
| `MANAGER` | Staff changes, Security alerts, Large adjustments |
| `SUPER_ADMIN` | Staff suspensions, Deletions, Audit events |

---

## Best Practices

### 1. Initial Load
- Fetch notifications via REST API on page load
- Connect to WebSocket after authentication
- Use REST API for pagination, WebSocket for real-time updates

### 2. State Management
- Keep notifications in global state (Context, Redux, Zustand)
- Merge WebSocket notifications with REST API data
- Deduplicate by notification ID

### 3. Error Handling
- Handle WebSocket disconnections gracefully
- Show connection status indicator
- Fallback to polling if WebSocket fails

### 4. Performance
- Limit notification history (e.g., last 100)
- Use virtual scrolling for large lists
- Debounce badge count updates

### 5. User Experience
- Show toast for new notifications
- Play sound (optional, with user preference)
- Group similar notifications
- Allow dismissing individual notifications

---

## Testing

### Test WebSocket Connection
```javascript
// In browser console
const socket = new SockJS('http://localhost:8080/ws');
const client = Stomp.over(socket);
client.connect(
  { Authorization: 'Bearer YOUR_JWT_TOKEN' },
  () => console.log('Connected!'),
  (error) => console.error('Connection failed:', error)
);
```

### Test API Endpoints
```bash
# Get notifications
curl -X GET "http://localhost:8080/api/notifications/my-notifications" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get unread count
curl -X GET "http://localhost:8080/api/notifications/unread/count" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Mark as read
curl -X PUT "http://localhost:8080/api/notifications/{notificationId}/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Questions?

Contact the backend team for:
- WebSocket connection issues
- Missing notification types
- New notification requirements
