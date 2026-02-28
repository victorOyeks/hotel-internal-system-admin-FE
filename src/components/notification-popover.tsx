"use client";

import { BellIcon, CheckCheckIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { useAtomValue, useSetAtom } from "jotai";
import {
	notificationsAtom,
	notificationUnreadCountAtom,
	notificationPageAtom,
	notificationHasNextAtom,
	notificationHotelIdAtom,
} from "@/lib/notification-store";
import {
	markNotificationRead,
	markAllNotificationsRead,
	getMyNotifications,
} from "@/lib/notification-actions";
import { requestNotificationPermission } from "@/lib/chat-notification";
import { formatDistanceToNow } from "date-fns";
import { useTransition, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { NotificationResponse } from "@/lib/notification-types";

function formatNotifTime(dateStr: string): string {
	try {
		return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
	} catch {
		return "";
	}
}

function NotificationItem({
	notification,
	onRead,
}: {
	notification: NotificationResponse;
	onRead: (id: string) => void;
}) {
	return (
		<button
			type="button"
			className={cn(
				"w-full text-left px-3 py-2 rounded-lg transition-colors",
				notification.isRead
					? "opacity-60"
					: "bg-red-50/50 hover:bg-red-50",
			)}
			onClick={() => {
				if (!notification.isRead) {
					onRead(notification.id);
				}
				if (notification.actionLink) {
					window.location.href = notification.actionLink;
				}
			}}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-center gap-1.5 min-w-0">
					{!notification.isRead && (
						<span className="size-1.5 shrink-0 rounded-full bg-red-500" />
					)}
					<p className="font-medium text-xs text-gray-900 truncate">
						{notification.title}
					</p>
				</div>
				<span className="text-[10px] text-gray-400 shrink-0">
					{formatNotifTime(notification.createdAt)}
				</span>
			</div>
			<p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
				{notification.message}
			</p>
		</button>
	);
}

export function NotificationsPopover() {
	const notifications = useAtomValue(notificationsAtom);
	const unreadCount = useAtomValue(notificationUnreadCountAtom);
	const setNotifications = useSetAtom(notificationsAtom);
	const setUnreadCount = useSetAtom(notificationUnreadCountAtom);
	const page = useAtomValue(notificationPageAtom);
	const setPage = useSetAtom(notificationPageAtom);
	const hasNext = useAtomValue(notificationHasNextAtom);
	const setHasNext = useSetAtom(notificationHasNextAtom);
	const hotelId = useAtomValue(notificationHotelIdAtom);
	const [isPending, startTransition] = useTransition();
	const [loadingMore, setLoadingMore] = useState(false);
	const [open, setOpen] = useState(false);

	const loadMore = useCallback(async () => {
		if (loadingMore || !hasNext || !hotelId) return;
		setLoadingMore(true);
		const nextPage = page + 1;
		const result = await getMyNotifications(hotelId, nextPage, 20);
		if (result.success) {
			setNotifications((prev) => [...prev, ...result.data.notifications]);
			setPage(nextPage);
			setHasNext(result.data.hasNext);
		}
		setLoadingMore(false);
	}, [loadingMore, hasNext, hotelId, page, setNotifications, setPage, setHasNext]);

	const handleMarkRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
		);
		setUnreadCount((prev) => Math.max(0, prev - 1));

		startTransition(async () => {
			await markNotificationRead(id);
		});
	};

	const handleMarkAllRead = () => {
		if (!hotelId) return;
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
		setUnreadCount(0);

		startTransition(async () => {
			await markAllNotificationsRead(hotelId);
		});
	};

	return (
		<Popover
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (v) requestNotificationPermission();
			}}
		>
			<PopoverTrigger asChild>
				<Button
					size="icon"
					variant="ghost"
					className="rounded-full relative"
				>
					<BellIcon size={20} className="text-primary-1" />
					{unreadCount > 0 && (
						<span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
							{unreadCount > 99 ? "99+" : unreadCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-80 bg-white rounded-xl p-0 shadow-lg flex flex-col max-h-[400px] overflow-hidden"
				align="end"
				sideOffset={8}
			>
				<div className="flex items-center justify-between px-3 pt-3 pb-1.5 shrink-0">
					<div className="flex items-center gap-1.5">
						<h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
						{unreadCount > 0 && (
							<span className="text-[10px] text-gray-400 tabular-nums">
								({unreadCount})
							</span>
						)}
					</div>
					<div className="flex items-center gap-0.5">
						{unreadCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								className="h-6 px-1.5 text-[11px] text-primary-3 hover:text-primary-1"
								onClick={handleMarkAllRead}
								disabled={isPending}
							>
								<CheckCheckIcon className="size-3 mr-0.5" />
								Mark all read
							</Button>
						)}
						<PopoverClose asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-gray-400 hover:text-gray-600"
							>
								<X className="h-3.5 w-3.5" />
							</Button>
						</PopoverClose>
					</div>
				</div>
				<div className="flex-1 min-h-0 overflow-y-auto">
					<div className="space-y-0.5 px-2 pb-2">
						{notifications.length === 0 ? (
							<div className="py-8 text-center text-xs text-gray-400">
								No notifications yet
							</div>
						) : (
							<>
								{notifications.map((notification) => (
									<NotificationItem
										key={notification.id}
										notification={notification}
										onRead={handleMarkRead}
									/>
								))}
								{hasNext && (
									<button
										type="button"
										className="w-full py-2 text-center text-[11px] text-primary-3 hover:text-primary-1 font-medium disabled:opacity-50"
										onClick={loadMore}
										disabled={loadingMore}
									>
										{loadingMore ? (
											<Loader2 className="size-3.5 text-gray-400 animate-spin mx-auto" />
										) : (
											"Load more"
										)}
									</button>
								)}
							</>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
