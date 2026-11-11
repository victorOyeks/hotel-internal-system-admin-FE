import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Provider as JotaiProvider } from "jotai";
import { AppSidebar } from "@hospio/ui/shared/app-sidebar";
import { Header } from "@hospio/ui/shared/header";
import { SidebarInset, SidebarProvider } from "@hospio/ui/primitives/sidebar";
import { SupportBar } from "@hospio/ui/shared/support-bar";
import { APP } from "@hospio/api/app";
import { data } from "@hospio/api/data";
import {
	getActiveHotel,
	getActiveRole,
	getBusiness,
	getHotels,
	getSession,
	getUser,
} from "@hospio/api/dal";
import { live } from "@hospio/api/data/live";
import { isHousekeepingSupervisor } from "@hospio/api/supervisor";
import { DEMO_AUTH } from "@hospio/api/demo/mode";
import { REFRESHED_COOKIE, refreshUrl, tokenIsStale } from "@hospio/api/session-refresh";
import { cn } from "@hospio/ui/utils";
import { getSharedDevice, pinPromptAsked } from "@hospio/api/device";
import type { Hotel, Me } from "@hospio/api/api/schema";
import { type DeviceSetupHotel, IdleLock, PinPrompt } from "@hospio/ui/shared/shared-device";
import { DEVICE_ROLES, SHARED_DESK_ROLES } from "@hospio/ui/shared/shared-device-roles";

/** The hotels where this person may set up a shared device, with the roles they may pick there (docs/shared-devices.md). */
function deviceSetupHotels(user: Me, hotels: Hotel[]): DeviceSetupHotel[] {
	const owner = user.roles.includes("OWNER");
	return hotels
		.map((h) => {
			const here = user.roleLevels.filter((g) => g.hotelId === h.id);
			const roles = owner || here.some((g) => g.role === "MANAGER") ? DEVICE_ROLES : here.filter((g) => g.level === "FULL").map((g) => g.role).filter((r) => (DEVICE_ROLES as string[]).includes(r));
			return { id: h.id, name: h.name, roles: [...new Set(roles)] };
		})
		.filter((h) => h.roles.length > 0);
}

export async function DashboardShell({ children }: PropsWithChildren) {
	const [session, user, role, hotels, activeHotel] = await Promise.all([
		getSession(),
		getUser(),
		getActiveRole(),
		getHotels(),
		getActiveHotel(),
	]);
	// "View as owner" from the admin portal: a read-only session with the admin in `act`.
	const support = session.actedBy ? { endsAt: session.exp } : null;
	if (!DEMO_AUTH && live("identity")) {
		// A manager changed this person's roles since the token was issued: the services refuse the old token
		// (401 "Your access has changed"), so swap it for one with the current roles and come back to this page.
		const from = (await headers()).get("x-hospio-path");
		const justRefreshed = !!(await cookies()).get(REFRESHED_COOKIE)?.value;
		if ((!user || tokenIsStale(session, user)) && !(justRefreshed && user)) redirect(refreshUrl(from));
	}
	if (!user) redirect("/auth");
	if (!user.changedPassword) redirect("/reset-password");
	if (!role) redirect("/select-role");
	if (APP === "hotel" && role === "OWNER") {
		// A self-serve owner still in the wizard goes back to it; one handed over by Hospio360 reviews the
		// handover first. getBusiness answers from the fixture (LIVE) in demo mode, so nothing changes there.
		const business = await getBusiness();
		if (business?.stage === "ONBOARDING" && business.source === "SELF_SERVE")
			redirect("/onboarding");
		if (business?.stage === "HANDED_OVER") redirect("/handover");
	}

	// Shared devices (docs/shared-devices.md in hospio-backend): a removed device forgets its token and goes to sign-in; on a
	// shared device the header has Lock and the idle lock runs; anyone with Full access, a manager or the owner can set one up.
	const shared = APP === "hotel" && !DEMO_AUTH ? await getSharedDevice() : null;
	if (shared?.state === "removed") redirect("/api/device/forget");
	const device = shared?.state === "ok" ? shared.device : null;
	const setupHotels = APP === "hotel" && !support && !shared?.device && shared?.state !== "error" ? deviceSetupHotels(user, hotels) : [];
	const pinPrompt =
		APP === "hotel" &&
		!support &&
		!user.hasPin &&
		!user.roles.includes("OWNER") &&
		!!user.businessId &&
		(await pinPromptAsked()) &&
		(!!device || user.roles.some((r) => SHARED_DESK_ROLES.includes(r)));

	const [unread, unpaidSales, inbox, approvals] = await Promise.all([
		data.notifications.unreadCount().catch(() => 0),
		// The bar and kitchen see how many sales still owe money next to Sales.
		role === "BAR" || role === "KITCHEN"
			? data.outlets.unpaidSales(role).catch(() => null)
			: Promise.resolve(null),
		// Every hotel role: unread staff messages next to Inbox (the owner's Messaging).
		APP === "hotel" && !support
			? data.owner.inboxUnread().catch(() => null)
			: Promise.resolve(null),
		// The manager: approvals waiting for a decision next to Approvals.
		role === "MANAGER"
			? data.approvals
					.page({ tab: "waiting", size: 1 })
					.then((r) => (r.ok ? (r.data.counts?.waiting ?? r.data.total) : null))
					.catch(() => null)
			: Promise.resolve(null),
	]);
	const badges = {
		...(unpaidSales ? { unpaidSales } : {}),
		...(inbox ? { inbox } : {}),
		...(approvals ? { approvals } : {}),
	};

	return (
		<NuqsAdapter>
			<JotaiProvider>
				{support && <SupportBar endsAt={support.endsAt} />}
				<SidebarProvider
					className={cn(
						support &&
							"pt-10 [&_[data-slot=sidebar-container]]:top-10 [&_[data-slot=sidebar-container]]:h-[calc(100svh-2.5rem)]",
					)}
				>
					<AppSidebar
						collapsible="icon"
						role={role}
						hotels={hotels}
						activeHotel={activeHotel}
						badges={badges}
						supervisor={role !== "HOUSEKEEPING" || isHousekeepingSupervisor(session)}
					/>
					{/* min-w-0: wide tables scroll inside their card instead of pushing the page sideways. */}
					<SidebarInset className="min-w-0 bg-page">
						<Header
							user={user}
							role={role}
							hotelCount={hotels.length}
							unread={unread}
							device={device ? { name: device.name } : undefined}
							setupHotels={setupHotels}
							activeHotelId={activeHotel?.id}
						/>
						{device && <IdleLock minutes={device.autoLockMinutes} />}
						{pinPrompt && <PinPrompt onDevice={!!device} />}
						<div className="flex flex-1 flex-col gap-5 px-8 py-6">
							{children}
						</div>
					</SidebarInset>
				</SidebarProvider>
			</JotaiProvider>
		</NuqsAdapter>
	);
}
