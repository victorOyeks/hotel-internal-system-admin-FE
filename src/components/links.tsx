import {
	BookOpenIcon,
	BookTextIcon,
	BarChart3Icon,
	BellIcon,
	Building2Icon,
	ChartNoAxesCombined,
	FolderClosedIcon,
	HomeIcon,
	HotelIcon,
	IdCardIcon,
	MessagesSquare,
	PlusIcon,
	ShieldCheckIcon,
	ToolCaseIcon,
	TruckIcon,
	PackageIcon,
	ClipboardListIcon,
	AlertCircleIcon,
	DollarSignIcon,
	FileIcon,
	PinIcon,
	ClockAlertIcon,
	FileDiffIcon,
	ArrowLeftRightIcon,
	UsersIcon,
	WrenchIcon,
	ShirtIcon,
	CreditCardIcon,
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
	{
		title: "Approvals",
		icon: <ShieldCheckIcon />,
		url: "/dashboard/approvals",
	},
	{ title: "Room Management", icon: <HotelIcon />, url: "/dashboard/rooms" },
	{
		title: "Manage Bookings",
		icon: <BookTextIcon />,
		url: "/dashboard/bookings",
	},
	{ title: "Guests", icon: <UsersIcon />, url: "/dashboard/guests" },
	{
		title: "Staff Management",
		icon: <IdCardIcon />,
		url: "/dashboard/staff-management",
	},
	{
		title: "Operations",
		icon: <Building2Icon />,
		url: "/dashboard/operations",
	},
	{
		title: "Financials",
		icon: <ChartNoAxesCombined />,
		url: "/dashboard/financials",
	},
	{ title: "Inventory", icon: <ToolCaseIcon />, url: "/dashboard/inventory" },
	{
		title: "Notifications",
		icon: <BellIcon />,
		url: "/dashboard/notifications",
	},
	{
		title: "Activity Log",
		icon: <BookOpenIcon />,
		url: "/dashboard/activity",
	},
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
		title: "Suppliers",
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
		icon: <ClipboardListIcon />,
		url: "/dashboard/stock-takes",
	},
	{
		title: "Stock Levels",
		icon: <BarChart3Icon />,
		url: "/dashboard/stock-levels",
	},
	{
		title: "Stock Movements",
		icon: <ArrowLeftRightIcon />,
		url: "/dashboard/stock-movements",
	},
	{
		title: "Stock Adjustments",
		icon: <FileDiffIcon />,
		url: "/dashboard/adjustments",
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
	{ title: "Payments", icon: <DollarSignIcon />, url: "/dashboard/payments" },
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
	{ title: "Customers", icon: <UsersIcon />, url: "/dashboard/customers" },
	{
		title: "Maintenance",
		icon: <WrenchIcon />,
		url: "/dashboard/maintenance",
	},
	{ title: "Reports", icon: <BarChart3Icon />, url: "/dashboard/reports" },
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
];

export const laundryLinks = [
	{ title: "Home", icon: <HomeIcon />, url: "/dashboard" },
	{ title: "Laundry Items", icon: <ShirtIcon />, url: "/dashboard/items" },
	{ title: "Orders", icon: <ClipboardListIcon />, url: "/dashboard/orders" },
	{ title: "Payments", icon: <CreditCardIcon />, url: "/dashboard/payments" },
	{ title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
];

export const financialsLinks = [
	{ title: "Overview", icon: <ChartNoAxesCombined />, url: "/dashboard" },
	{ title: "Other Income", icon: <DollarSignIcon />, url: "/dashboard/other-income" },
	{ title: "Expenditures", icon: <CreditCardIcon />, url: "/dashboard/expenditures" },
	{ title: "Reports", icon: <BarChart3Icon />, url: "/dashboard/reports" },
];
