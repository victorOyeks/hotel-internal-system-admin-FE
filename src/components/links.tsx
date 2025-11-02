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
  { title: "Inventory", icon: <ToolCaseIcon />, url: "/dashboard/inventory" },
  { title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
  {
    title: "Supplies & Deliveries",
    icon: <TruckIcon />,
    url: "/dashboard/supplies",
  },
  { title: "Reports", icon: <FolderClosedIcon />, url: "/dashboard/reports" },
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
    url: "/dashboard/inventory"
  },
  { title: "Messages", icon: <MessagesSquare />, url: "/dashboard/messages" },
];
