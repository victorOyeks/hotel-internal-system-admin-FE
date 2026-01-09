import {
	BookOpenIcon,
	BookTextIcon,
	ChartNoAxesCombined,
	FolderClosedIcon,
	HomeIcon,
	HotelIcon,
	IdCardIcon,
	MessagesSquare,
	PlusIcon,
	ToolCaseIcon,
	TruckIcon,
	PackageIcon,
	ClipboardListIcon,
	AlertCircleIcon,
	DollarSignIcon,
	FileIcon,
	PinIcon,
	ClockAlertIcon,
} from "lucide-react";

export const hotelOwnerLinks = [
	{ title: "Home", icon: <HomeIcon />, url: "/dashboard" },
	{ title: "Hotels", icon: <HotelIcon />, url: "/dashboard/hotels" },
	{ title: "Bookings", icon: <BookTextIcon />, url: "/dashboard/bookings" },
	{
		title: "Staff Management",
		icon: <IdCardIcon />,
		url: "/dashboard/staff-management",
	},
	{
		title: "Financials",
		icon: <ChartNoAxesCombined />,
		url: "/dashboard/financials",
	},
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
	{ title: "Inventory", icon: <ToolCaseIcon />, url: "/dashboard/inventory" },
	{ title: "Activity Log", icon: <BookOpenIcon />, url: "/dashboard/activity" },
	// { title: "Reports", icon: <FolderIcon />, url: "/dashboard/reports" },
	// { title: "Roles & Permissions", icon: <IdCardLanyardIcon />, url: "/dashboard/roles" },
	// { title: "Audit Log", icon: <MonitorDot />, url: "/dashboard/audit" },
];

export const managerOwnerLinks = [
	{ title: "Home", icon: <HomeIcon />, url: "/dashboard" },
	{ title: "Room Management", icon: <HotelIcon />, url: "/dashboard/rooms" },
	{
		title: "Manage bookings",
		icon: <BookTextIcon />,
		url: "/dashboard/bookings",
	},
	{
		title: "Staff Management",
		icon: <IdCardIcon />,
		url: "/dashboard/staff-management",
	},
	{
		title: "Financials",
		icon: <ChartNoAxesCombined />,
		url: "/dashboard/financials",
	},
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
	{ title: "Inventory", icon: <ToolCaseIcon />, url: "/dashboard/inventory" },
	{ title: "Activity Log", icon: <BookOpenIcon />, url: "/dashboard/activity" },
	// { title: "Roles & Permissions", icon: <IdCardLanyardIcon />, url: "/dashboard/settings/permissions" },
	// { title: "Task Management", icon: <MonitorCheckIcon />, url: "/dashboard/tasks" },
];

export const inventoryOfficerLinks = [
	{ title: "Home", icon: <HomeIcon />, url: "/dashboard" },
	{
		title: "Products",
		icon: <PackageIcon />,
		url: "/dashboard/products",
	},
	// { title: "Inventory", icon: <ToolCaseIcon />, url: "/dashboard/inventory" },
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
	{
		title: "Supplies & Deliveries",
		icon: <TruckIcon />,
		url: "/dashboard/supplies",
	},
	{ title: "Reports", icon: <FolderClosedIcon />, url: "/dashboard/reports" },
	{
		title: "GRN",
		icon: <FileIcon />,
		url: "/dashboard/grn",
	},
	{
		title: "Locations",
		icon: <PinIcon />,
		url: "/dashboard/locations",
	},
	{
		title: "Purchase Orders",
		icon: <ClockAlertIcon />,
		url: "/dashboard/purchase-orders",
	},
	{
		title: "Stock takes",
		url: "/dashboard/stock-takes",
	},
];

export const frontDeskLinks = [
	{ title: "Home", icon: <HomeIcon />, url: "/dashboard" },
	{ title: "Bookings", icon: <BookTextIcon />, url: "/dashboard/bookings" },
	{ title: "Rooms", icon: <HotelIcon />, url: "/dashboard/rooms" },
	{ title: "Guests Log", icon: <IdCardIcon />, url: "/dashboard/guests" },
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
	{
		title: "Lost & Found",
		icon: <FolderClosedIcon />,
		url: "/dashboard/lost-and-found",
	},
];

export const restaurantLinks = [
	{
		title: "Home",
		icon: <HomeIcon />,
		url: "/dashboard",
	},
	{ title: "New Order", icon: <PlusIcon />, url: "/dashboard/create-order" },
	{
		title: "Inventory",
		icon: <ToolCaseIcon />,
		url: "/dashboard/inventory",
	},
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
];

export const rentalsLinks = [
	{ title: "Home", icon: <HomeIcon />, url: "/dashboard" },
	{ title: "Rental Items", icon: <PackageIcon />, url: "/dashboard/items" },
	{ title: "Orders", icon: <ClipboardListIcon />, url: "/dashboard/orders" },
	{
		title: "Overdue Rentals",
		icon: <AlertCircleIcon />,
		url: "/dashboard/overdue",
	},
	{ title: "Payments", icon: <DollarSignIcon />, url: "/dashboard/payments" },
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
];
