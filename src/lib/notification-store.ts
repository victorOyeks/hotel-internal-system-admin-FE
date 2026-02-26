"use client";

import { atom } from "jotai";
import type { NotificationResponse } from "./notification-types";

/** Notifications displayed in the popover. */
export const notificationsAtom = atom<NotificationResponse[]>([]);

/** Unread notification count for the bell badge. */
export const notificationUnreadCountAtom = atom<number>(0);

/** Increment to trigger a refetch of unread count + notifications. */
export const notificationRefetchTriggerAtom = atom<number>(0);

/** Current page loaded (0-based). Reset when global provider refetches. */
export const notificationPageAtom = atom<number>(0);

/** Whether there are more pages to load. */
export const notificationHasNextAtom = atom<boolean>(false);
