"use client";

import { BellIcon, ChevronDownIcon, CircleHelpIcon, LogOutIcon, SearchIcon, TabletSmartphoneIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback } from "@hospio/ui/primitives/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@hospio/ui/primitives/dropdown-menu";
import { SidebarTrigger } from "@hospio/ui/primitives/sidebar";
import type { Me } from "@hospio/api/api/schema";
import { logout } from "@hospio/api/actions";
import { roleLabels, type HotelRole } from "@hospio/api/roles";
import { cn } from "@hospio/ui/utils";
import { type DeviceSetupHotel, LockButton, SetupDeviceModal } from "@hospio/ui/shared/shared-device";

function initials(name: string) {
	return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const iconButton = "flex size-[42px] items-center justify-center rounded-xl border border-line bg-card text-ink-2 transition-colors hover:bg-subtle";

export function Header({
	user,
	role,
	hotelCount,
	unread,
	device,
	setupHotels = [],
	activeHotelId,
}: {
	user: Me;
	role: HotelRole;
	hotelCount: number;
	unread: number;
	/** On a shared device: its name, for the Lock button (docs/shared-devices.md). */
	device?: { name: string };
	/** Where this person may set up a shared device; empty hides "Use this device as a shared device". */
	setupHotels?: DeviceSetupHotel[];
	activeHotelId?: string;
}) {
	const [pending, startTransition] = useTransition();
	const [setupOpen, setSetupOpen] = useState(false);
	const subtitle = `${roleLabels[role]}${hotelCount > 0 ? ` · ${hotelCount} ${hotelCount === 1 ? "branch" : "branches"}` : ""}`;

	return (
		<header className="flex items-center justify-between gap-4 px-8 pt-6">
			<div className="flex items-center gap-3">
				<SidebarTrigger className="md:hidden" />
				<label className="hidden h-[42px] w-[380px] items-center gap-[10px] rounded-xl border border-line bg-card pl-[14px] pr-[10px] md:flex">
					<SearchIcon className="size-[18px] text-ink-3" />
					<input
						type="search"
						placeholder="Search bookings, guests, branches…"
						className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
					/>
					<kbd className="rounded-md bg-subtle px-[6px] py-[2px] text-[11px] font-medium text-ink-2">⌘ K</kbd>
				</label>
			</div>

			<div className="flex items-center gap-3">
				{device && <LockButton deviceName={device.name} />}
				<Link href="/dashboard/help" className={iconButton} aria-label="Help">
					<CircleHelpIcon className="size-5" />
				</Link>
				<Link href="/dashboard/notifications" className={cn(iconButton, "relative")} aria-label="Notifications">
					<BellIcon className="size-5" />
					{unread > 0 && <span className="absolute right-[9px] top-[9px] size-2 rounded-full bg-danger ring-2 ring-card" />}
				</Link>
				<span className="h-7 w-px bg-line-strong/60" />
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button type="button" className="flex items-center gap-[10px] rounded-xl py-1 pl-1 pr-2 text-left hover:bg-subtle">
							<Avatar className="size-10">
								<AvatarFallback className="bg-brand text-sm font-semibold text-white">{initials(user.fullName)}</AvatarFallback>
							</Avatar>
							<span className="hidden flex-col lg:flex">
								<span className="text-sm font-semibold text-ink">{user.fullName}</span>
								<span className="text-xs text-ink-3">{subtitle}</span>
							</span>
							<ChevronDownIcon className="size-4 text-ink-3" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-60 rounded-xl">
						<DropdownMenuLabel>
							<p className="text-sm font-semibold text-ink">{user.fullName}</p>
							<p className="text-xs font-normal text-ink-3">{user.email}</p>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild className="rounded-lg">
							<Link href="/dashboard/profile">
								<UserIcon /> My profile & security
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild className="rounded-lg">
							<Link href="/select-role">Switch role</Link>
						</DropdownMenuItem>
						{setupHotels.length > 0 && (
							<DropdownMenuItem className="rounded-lg" onSelect={() => setSetupOpen(true)}>
								<TabletSmartphoneIcon /> Use this device as a shared device
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="rounded-lg text-danger focus:text-danger"
							disabled={pending}
							onSelect={() => startTransition(() => logout())}
						>
							<LogOutIcon /> {device ? "Lock" : "Sign out"}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				{setupHotels.length > 0 && (
					<SetupDeviceModal open={setupOpen} onOpenChange={setSetupOpen} hotels={setupHotels} activeHotelId={activeHotelId} activeRole={role} />
				)}
			</div>
		</header>
	);
}
