import type { LucideIcon } from "lucide-react";
import {
	ActivityIcon,
	BarChart3Icon,
	BedDoubleIcon,
	BellIcon,
	BookOpenIcon,
	BuildingIcon,
	CalendarCheckIcon,
	CalendarDaysIcon,
	ChefHatIcon,
	ClipboardCheckIcon,
	ClipboardListIcon,
	CoinsIcon,
	CreditCardIcon,
	FolderIcon,
	HandshakeIcon,
	HeadsetIcon,
	HomeIcon,
	IdCardIcon,
	InboxIcon,
	LayoutGridIcon,
	MegaphoneIcon,
	MessageSquareIcon,
	MoonIcon,
	PackageIcon,
	ReceiptIcon,
	SearchIcon,
	SettingsIcon,
	ShieldCheckIcon,
	ShirtIcon,
	SlidersHorizontalIcon,
	SprayCanIcon,
	TruckIcon,
	UserCircleIcon,
	UsersIcon,
	WalletIcon,
	WineIcon,
	WrenchIcon,
	UtensilsIcon,
} from "lucide-react";
import type { HotelRole } from "@hospio/api/roles";

export type NavLink = {
	title: string;
	url: string;
	icon: LucideIcon;
	/** A count shown on the link (the shell fills it): unpaid sales for the bar and kitchen, unread staff messages for the Inbox. */
	badge?: "unpaidSales" | "inbox";
};

/** Manager portal, in the order of the Figma sidebar. */
export const managerLinks: NavLink[] = [
	{ title: "Dashboard", url: "/dashboard", icon: HomeIcon },
	{ title: "Departments", url: "/dashboard/departments", icon: LayoutGridIcon },
	{ title: "Rooms", url: "/dashboard/rooms", icon: BuildingIcon },
	{ title: "Bookings", url: "/dashboard/bookings", icon: CalendarCheckIcon },
	{ title: "Folios", url: "/dashboard/folios", icon: ReceiptIcon },
	{ title: "Staff", url: "/dashboard/staff", icon: IdCardIcon },
	{ title: "Financials", url: "/dashboard/financials", icon: BarChart3Icon },
	{ title: "Payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{
		title: "Organizations",
		url: "/dashboard/organizations",
		icon: HandshakeIcon,
	},
	{ title: "Night audit", url: "/dashboard/night-audit", icon: MoonIcon },
	{ title: "Messaging", url: "/dashboard/messaging", icon: MessageSquareIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Inventory", url: "/dashboard/inventory", icon: PackageIcon },
	{ title: "Menus", url: "/dashboard/menus", icon: BookOpenIcon },
	{ title: "Reports", url: "/dashboard/reports", icon: FolderIcon },
	{ title: "Tasks", url: "/dashboard/tasks", icon: ClipboardListIcon },
	{
		title: "Roles & Permissions",
		url: "/dashboard/roles",
		icon: ShieldCheckIcon,
	},
	{ title: "Activity log", url: "/dashboard/activity", icon: BookOpenIcon },
	{ title: "Hotel setup", url: "/dashboard/hotel-setup", icon: SettingsIcon },
];

export const ownerLinks: NavLink[] = [
	{ title: "Dashboard", url: "/dashboard", icon: HomeIcon },
	{ title: "Hotels", url: "/dashboard/hotels", icon: BuildingIcon },
	{ title: "Bookings", url: "/dashboard/bookings", icon: CalendarCheckIcon },
	{ title: "Staff", url: "/dashboard/staff", icon: IdCardIcon },
	{ title: "Financials", url: "/dashboard/financials", icon: BarChart3Icon },
	{ title: "Payments", url: "/dashboard/payments", icon: WalletIcon },
	{ title: "Reports", url: "/dashboard/reports", icon: FolderIcon },
	{ title: "Users", url: "/dashboard/users", icon: UsersIcon },
	{
		title: "Roles & Permissions",
		url: "/dashboard/roles",
		icon: ShieldCheckIcon,
	},
	{ title: "Operations", url: "/dashboard/operations", icon: ActivityIcon },
	{ title: "Inventory", url: "/dashboard/inventory", icon: PackageIcon },
	// The owner's staff threads live on Messaging (their Inbox), so the unread count shows here.
	{
		title: "Messaging",
		url: "/dashboard/messaging",
		icon: MessageSquareIcon,
		badge: "inbox",
	},
	{
		title: "Hotel setup",
		url: "/dashboard/hotel-setup",
		icon: SlidersHorizontalIcon,
	},
	{ title: "Settings", url: "/dashboard/settings", icon: SettingsIcon },
];

export const frontOfficeLinks: NavLink[] = [
	{ title: "Today", url: "/dashboard", icon: HomeIcon },
	{ title: "Bookings", url: "/dashboard/bookings", icon: CalendarCheckIcon },
	{ title: "Rooms", url: "/dashboard/rooms", icon: BedDoubleIcon },
	{ title: "Folios", url: "/dashboard/folios", icon: ReceiptIcon },
	{ title: "Room service", url: "/dashboard/room-service", icon: UtensilsIcon },
	{ title: "Guest laundry", url: "/dashboard/laundry", icon: ShirtIcon },
	{ title: "Repairs", url: "/dashboard/repairs", icon: WrenchIcon },
	{ title: "Guests", url: "/dashboard/guests", icon: UsersIcon },
	{ title: "Lost & found", url: "/dashboard/lost-found", icon: SearchIcon },
	{ title: "Messages", url: "/dashboard/messages", icon: MessageSquareIcon },
	{ title: "Payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Till", url: "/dashboard/till", icon: WalletIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const housekeepingLinks: NavLink[] = [
	{ title: "My rooms", url: "/dashboard", icon: SprayCanIcon },
	{ title: "Inspect", url: "/dashboard/inspect", icon: ClipboardCheckIcon },
	{ title: "Lost & found", url: "/dashboard/lost-found", icon: SearchIcon },
	{ title: "Linen", url: "/dashboard/linen", icon: ShirtIcon },
	{ title: "Housekeeping store", url: "/dashboard/store", icon: PackageIcon },
	{ title: "Repairs", url: "/dashboard/repairs", icon: WrenchIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const laundryLinks: NavLink[] = [
	{ title: "Jobs", url: "/dashboard", icon: ShirtIcon },
	{ title: "Linen", url: "/dashboard/linen", icon: TruckIcon },
	{ title: "Laundry store", url: "/dashboard/store", icon: PackageIcon },
	{ title: "My payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const maintenanceLinks: NavLink[] = [
	{ title: "Work orders", url: "/dashboard", icon: WrenchIcon },
	{ title: "Preventive", url: "/dashboard/preventive", icon: CalendarDaysIcon },
	{ title: "Maintenance store", url: "/dashboard/store", icon: PackageIcon },
	{ title: "Rooms out of order", url: "/dashboard/rooms", icon: BedDoubleIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const kitchenLinks: NavLink[] = [
	{ title: "Orders", url: "/dashboard", icon: ChefHatIcon },
	{
		title: "Sales",
		url: "/dashboard/sales",
		icon: CoinsIcon,
		badge: "unpaidSales",
	},
	{ title: "Menu", url: "/dashboard/menu", icon: BookOpenIcon },
	{ title: "Kitchen store", url: "/dashboard/store", icon: PackageIcon },
	{ title: "My payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Till", url: "/dashboard/till", icon: WalletIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const barLinks: NavLink[] = [
	{ title: "Bar today", url: "/dashboard", icon: WineIcon },
	{ title: "Tabs", url: "/dashboard/tabs", icon: ReceiptIcon },
	{
		title: "Sales",
		url: "/dashboard/sales",
		icon: CoinsIcon,
		badge: "unpaidSales",
	},
	{ title: "Menu", url: "/dashboard/menu", icon: BookOpenIcon },
	{ title: "Bar stock", url: "/dashboard/stock", icon: PackageIcon },
	{ title: "My payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Till", url: "/dashboard/till", icon: WalletIcon },
	{ title: "My shifts", url: "/dashboard/shifts", icon: CalendarDaysIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const inventoryLinks: NavLink[] = [
	{ title: "Stores & stock", url: "/dashboard", icon: PackageIcon },
	{ title: "Requests", url: "/dashboard/requests", icon: ClipboardListIcon },
	{ title: "Purchase orders", url: "/dashboard/orders", icon: ReceiptIcon },
	{ title: "Deliveries", url: "/dashboard/deliveries", icon: TruckIcon },
	{ title: "Stock counts", url: "/dashboard/counts", icon: ClipboardCheckIcon },
	{ title: "Suppliers", url: "/dashboard/suppliers", icon: HandshakeIcon },
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const financeLinks: NavLink[] = [
	{ title: "Today's money", url: "/dashboard", icon: CoinsIcon },
	{ title: "Month", url: "/dashboard/month", icon: BarChart3Icon },
	{ title: "Expenses", url: "/dashboard/expenses", icon: ReceiptIcon },
	{ title: "Outlet sales", url: "/dashboard/sales", icon: WineIcon },
	{ title: "Tills", url: "/dashboard/tills", icon: WalletIcon },
	{ title: "Night audit", url: "/dashboard/night-audit", icon: MoonIcon },
	{
		title: "Organizations",
		url: "/dashboard/organizations",
		icon: HandshakeIcon,
	},
	{ title: "Inbox", url: "/dashboard/inbox", icon: InboxIcon, badge: "inbox" },
	{ title: "Notifications", url: "/dashboard/notifications", icon: BellIcon },
];

export const adminLinks: NavLink[] = [
	{ title: "Dashboard", url: "/dashboard", icon: HomeIcon },
	{ title: "Businesses", url: "/dashboard/businesses", icon: BuildingIcon },
	{
		title: "Onboarding",
		url: "/dashboard/onboarding",
		icon: ClipboardCheckIcon,
	},
	{ title: "Support", url: "/dashboard/support", icon: HeadsetIcon },
	{ title: "Fees & billing", url: "/dashboard/fees", icon: CoinsIcon },
	{ title: "Payments", url: "/dashboard/payments", icon: CreditCardIcon },
	{ title: "Marketers", url: "/dashboard/marketers", icon: MegaphoneIcon },
	{ title: "Changes by H.M.S", url: "/dashboard/changes", icon: BookOpenIcon },
	{ title: "Admin team", url: "/dashboard/team", icon: UsersIcon },
	{ title: "Settings", url: "/dashboard/settings", icon: SettingsIcon },
];

export const marketerLinks: NavLink[] = [
	{ title: "Dashboard", url: "/dashboard", icon: HomeIcon },
	{ title: "My businesses", url: "/dashboard/businesses", icon: BuildingIcon },
	{ title: "Commissions", url: "/dashboard/commissions", icon: CoinsIcon },
	{ title: "Refer a hotel", url: "/dashboard/refer", icon: MegaphoneIcon },
	{ title: "Profile", url: "/dashboard/profile", icon: UserCircleIcon },
];

export const linksByRole: Record<HotelRole, NavLink[]> = {
	OWNER: ownerLinks,
	MANAGER: managerLinks,
	FRONT_OFFICE: frontOfficeLinks,
	HOUSEKEEPING: housekeepingLinks,
	LAUNDRY: laundryLinks,
	MAINTENANCE: maintenanceLinks,
	KITCHEN: kitchenLinks,
	BAR: barLinks,
	INVENTORY: inventoryLinks,
	FINANCE: financeLinks,
	SUPER_ADMIN: adminLinks,
	SUPPORT: adminLinks,
	FINANCE_ADMIN: adminLinks,
	MARKETER: marketerLinks,
};
