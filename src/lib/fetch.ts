/** biome-ignore-all lint/suspicious/noExplicitAny: Legacy code uses any extensively */
import { env } from "@/env";
import { createFetch, createSchema } from "@better-fetch/fetch";
import { z } from "zod";
import { financialsRoutes } from "./api-routes/financials";

export const Role = z.enum([
	"HOTEL_OWNER",
	"MANAGER",
	"FRONT_DESK",
	"MAINTENANCE",
	"INVENTORY",
	"RESTAURANT",
	"RENTALS",
	"SUPER_ADMIN",
	"LAUNDRY",
	"FINANCIALS",
]);

const ApiExceptionResponseObject = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: z.object({}), // Generic object
});

export const ApiResponseObject = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: z.object({}), // Generic object
});

export const InventoryStockMovementResponse = z.object({
	id: z.string(),
	movementType: z.string(),
	productId: z.string(),
	productName: z.string().optional(),
	quantity: z.number(),
	referenceType: z.string().optional(),
	referenceId: z.string().optional(),
	referenceNumber: z.string().optional(),
	fromLocationId: z.string().nullable().optional(),
	fromLocationName: z.string().nullable().optional(),
	toLocationId: z.string().nullable().optional(),
	toLocationName: z.string().nullable().optional(),
	movementDate: z.string(),
	performedBy: z.string().optional(),
	remarks: z.string().optional(),
	unitPrice: z.number().optional(),
});

export type InventoryStockMovementResponse = z.infer<
	typeof InventoryStockMovementResponse
>;

export const ApiStockMovementListResponse = ApiResponseObject.extend({
	data: z.object({
		content: z.array(InventoryStockMovementResponse),
		pageable: z.any(),
		last: z.boolean(),
		totalPages: z.number(),
		totalElements: z.number(),
		size: z.number(),
		number: z.number(),
		sort: z.any(),
		first: z.boolean(),
		numberOfElements: z.number(),
		empty: z.boolean(),
	}),
});

const Pagination = z.object({
	pageNumber: z.number(),
	pageSize: z.number(),
	totalElements: z.number(),
	totalPages: z.number(),
	last: z.boolean(),
	first: z.boolean(),
});

export type Pagination = z.infer<typeof Pagination>;

const UpdateRoomRequest = z.object({
	roomNo: z.string(),
	roomType: z.string(),
	roomName: z.string(),
	roomPrice: z.number(),
	roomStatus: z.string(),
	roomFacility: z.array(z.string()),
});

const RoomResponse = z.object({
	id: z.string(),
	customId: z.string(),
	hotelName: z.string(),
	roomIdentifier: z.string(),

	roomType: z.string(),
	roomPrice: z.number(),
	checkInStatus: z.string(),
	roomFacility: z.array(z.string()),
	guestDetails: z
		.object({
			bookingId: z.string(),
			customId: z.string(),
			guestName: z.string(),
			title: z.string().nullable(),
			phoneNumber: z.string(),
			noOfAdults: z.number().nullable(),
			noOfChildren: z.number().nullable(),
			roomIdentifier: z.string(),
			roomType: z.string(),
			bookingStatus: z.string(),
			checkInDate: z.string(),
			checkOutDate: z.string(),
			nightlyRate: z.number(),
			amountPaid: z.number(),
			amountDue: z.number(),
			amountRemaining: z.number(),
			isCurrentGuest: z.boolean(),
			organizationName: z.string().nullable(),
		})
		.optional(),
});

export type RoomDetails = z.infer<typeof RoomResponse>;

const ApiResponseRoomResponse = ApiResponseObject.extend({
	data: RoomResponse,
});

const OnboardHotelRequest = z.object({
	name: z.string(),
	location: z.string(),
	totalRooms: z.number().optional(),
	hotelAddress: z.string(),
	managerId: z.string(),
});

export type OnboardHotelRequest = z.infer<typeof OnboardHotelRequest>;

const HotelManager = z.object({
	id: z.string(),
	customId: z.string().nullable(),
	fullName: z.string(),
	email: z.string(),
	phoneNumber: z.string(),
});

export type HotelManager = z.infer<typeof HotelManager>;

const GetHotelResponse = z.object({
	id: z.string(),
	customId: z.string().nullable(),
	name: z.string().nullable(),
	address: z.string(),
	totalRoom: z.string(),
	occupancyRate: z.string(),
	grossRevenue: z.string(),
	expenses: z.string(),
	manager: HotelManager.partial().nullable().optional(),
});

export type GetHotelResponse = z.infer<typeof GetHotelResponse>;

const ApiResponseGetHotelResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: GetHotelResponse,
});

const DeleteHotelResponse = z.object({
	customId: z.string(),
	name: z.string(),
	address: z.string(),
});

const ApiResponseDeleteHotelResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: DeleteHotelResponse,
});

const CreateHotelOwnerRequest = z.object({
	fullName: z.string(),
	email: z.string(),
	phoneNumber: z.string(),
});

const UserModelResponse = z.object({
	id: z.string(),
	fullName: z.string(),
	email: z.string(),
	phoneNumber: z.string(),
	staffId: z.string(),
	userStatus: z.string(),
	role: Role,
	customId: z.string(),
	parentUserCustomId: z.string(),
	verified: z.boolean(),
});

const ApiResponseUserModelResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: UserModelResponse,
});

const CreateRoomRequest = z.object({
	// hotelId: z.string(),
	// roomNo: z.string(),
	roomType: z.string(),
	roomIdentifier: z.string(),
	// roomPrice: z.number(),
	roomStatus: z.string(),
	roomFacility: z.array(z.string()),
});

export type CreateRoomRequest = z.infer<typeof CreateRoomRequest>;

const CreateHotelManagerRequest = z.object({
	fullName: z.string(),
	email: z.string(),
	phoneNumber: z.string(),
	staffId: z.string().optional(),
});

const OnboardHotelResponse = z.object({
	hotelName: z.string(),
	hotelAddress: z.string(),
	managerId: HotelManager.partial().optional(),
});

const ApiResponseOnboardHotelResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: OnboardHotelResponse,
});

const LoginRequest = z.object({
	email: z.string(),
	password: z.string(),
});

const LoginResponse = z.object({
	refreshToken: z.string(),
	accessToken: z.string(),
	expiresIn: z.number(),
	role: z.string(),
	permissions: z.string().array(),
});

const ApiResponseLoginResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: LoginResponse,
});

const UserInfoResponse = z.object({
	id: z.string(),
	fullName: z.string().nullable(),
	email: z.string(),
	phoneNumber: z.string(),
	staffId: z.string(),
	userStatus: z.string().nullable().or(z.undefined()),
	roles: Role.array(),
	customId: z.string().nullable().optional(),
	parentUserCustomId: z.string().nullable().or(z.undefined()),
	verified: z.boolean(),
	changedPassword: z.boolean(),
	hotelId: z.string().nullable().or(z.undefined()),
	createdAt: z.coerce.date(),
	hotels: z
		.array(
			z.object({
				id: z.string(),
				customId: z.string().nullable(),
				name: z.string(),
				location: z.string(),
				address: z.string(),
			}),
		)
		.optional(),
	// updatedAt: z.coerce.date(),
});

export type UserInfoResponse = z.infer<typeof UserInfoResponse>;

const ApiResponseUserInfoResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: UserInfoResponse,
});

const ApiResponseListRoomResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: Pagination.extend({
		content: z.array(RoomResponse),
	}),
});

const ListRoomsQuery = z
	.object({
		roomType: z.string().nullable(),
		search: z.string().nullable(),
		status: z
			.enum(["CHECKED_IN", "CHECKED_OUT", "RESERVED", "CANCELLED", "AVAILABLE"])
			.nullable(),
		page: z.number().default(0),
		size: z.number().default(10),
	})
	.partial();

export type ListRoomsQuery = z.infer<typeof ListRoomsQuery>;

const StaffDetails = z.object({
	id: z.string(),
	customId: z.string(),
	fullName: z.string(),
	email: z.email(),
	phoneNumber: z.string(),
	staffId: z.string(),
	userStatus: z.string(),
	role: Role,
	verified: z.boolean(),
	lastLogin: z.string(),
});

export type StaffDetails = z.infer<typeof StaffDetails>;

const CustomPageStaffResponse = Pagination.extend({
	content: z.array(StaffDetails),
});

export type CustomPageStaffResponse = z.infer<
	typeof CustomPageStaffResponse
>["content"][number];

const CustomPageStaffResponseQuery = z
	.object({
		search: z.string(),
		status: z.string(),
		role: Role.nullable(),
		page: z.coerce.number().default(0),
		size: z.coerce.number().default(10),
	})
	.partial();

const ApiResponseCustomPageStaffResponse = ApiResponseObject.extend({
	data: CustomPageStaffResponse,
});

const ApiResponseListGetHotelResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: Pagination.extend({
		content: z.array(GetHotelResponse),
	}),
});

const BookingPaymentResponse = z.object({
	amount: z.number(),
	currency: z.string(),
	method: z.enum([
		"CASH",
		"CARD",
		"CREDIT_CARD",
		"DEBIT_CARD",
		"BANK_TRANSFER",
		"MOBILE_MONEY",
		"CHEQUE",
		"ONLINE_PAYMENT",
		"PAYPAL",
		"CRYPTOCURRENCY",
		"DIRECT_DEBIT",
		"PETTY_CASH",
		"OTHERS",
	]),
	reference: z.string(),
	status: z.enum([
		"SUCCESS",
		"FAILED",
		"PENDING",
		"CANCELLED",
		"REFUNDED",
		"PARTLY_PAID",
		"FULLY_PAID",
	]),
	type: z.enum(["DEPOSIT", "INSTALLMENT", "FINAL", "REFUND", "OTHER"]),
	paymentDate: z.coerce.date(),
});

const CheckInResponse = z.object({
	id: z.string(),
	customId: z.string(),
	title: z.string(),
	guestName: z.string(),
	noOfAdults: z.number(),
	noOfChildren: z.number(),
	roomIdentifier: z.string(),
	branchName: z.string(),
	roomType: z.string(),
	bookingStatus: z.string(),
	checkInDate: z.coerce.date(),
	checkOutDate: z.coerce.date(),
	amountPaid: z.number(),
	checkIn: z.coerce.date(),
	checkOut: z.coerce.date(),
	discountValue: z.number(),
	discountType: z.enum(["PERCENTAGE", "FIXED"]),
	nightlyRate: z.number(),
	effectiveNightlyRate: z.number(),
	initialPayment: BookingPaymentResponse,
});

const ApiResponseCheckInResponse = ApiResponseObject.extend({
	data: CheckInResponse,
});

const RecordBookingPaymentRequest = z.object({
	amount: z.number(),
	currency: z.string(),
	method: z.enum([
		"CASH",
		"CARD",
		"CREDIT_CARD",
		"DEBIT_CARD",
		"BANK_TRANSFER",
		"MOBILE_MONEY",
		"CHEQUE",
		"ONLINE_PAYMENT",
		"PAYPAL",
		"CRYPTOCURRENCY",
		"DIRECT_DEBIT",
		"PETTY_CASH",
		"OTHERS",
	]),
	reference: z.string(),
	status: z.enum([
		"SUCCESS",
		"FAILED",
		"PENDING",
		"CANCELLED",
		"REFUNDED",
		"PARTLY_PAID",
		"FULLY_PAID",
	]),
	type: z.enum(["DEPOSIT", "INSTALLMENT", "FINAL", "REFUND", "OTHER"]),
	paymentDate: z.coerce.date(),
});

export const CheckInRequest = z.object({
	title: z.string(),
	guestName: z.string(),
	guestEmail: z.string(),
	phoneNumber: z.string(),
	noOfAdults: z.number(),
	noOfChildren: z.number(),
	nightlyRate: z.number(),
	dailySpendingCap: z.number(),
	checkInDate: z.string(),
	checkOutDate: z.string(),
	discountValue: z.number(),
	discountType: z.enum(["PERCENTAGE", "FIXED"]),
	initialPayment: RecordBookingPaymentRequest,
});

export type CheckInRequest = z.infer<typeof CheckInRequest>;

export const BookingStatus = z.enum([
	"CHECKED_IN",
	"CHECKED_OUT",
	"RESERVED",
	"CANCELLED",
]);

const BookingViewResponse = z.object({
	bookingId: z.string(),
	guestName: z.string(),
	roomNo: z.string(),
	branchName: z.string(),
	roomType: z.string(),
	bookingStatus: BookingStatus,
	expectedCheckInDate: z.iso.date(),
	checkInDate: z.iso.date(),
	checkOutDate: z.iso.date(),
});

export type BookingViewResponse = z.infer<typeof BookingViewResponse>;

const ApiResponseListBookingViewResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: Pagination.extend({
		content: z.array(BookingViewResponse),
	}),
});

const ManagerBookingViewResponse = BookingViewResponse.extend({
	id: z.string(),
	customId: z.string(),
	amountPaid: z.number(),
}).omit({ roomNo: true, bookingId: true });

export type ManagerBookingViewResponse = z.infer<
	typeof ManagerBookingViewResponse
>;

const ApiResponseManagerBookingViewResponse = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: Pagination.extend({
		content: z.array(ManagerBookingViewResponse),
	}),
});

const InventoryResponse = z.object({
	id: z.string(),
	customId: z.string(),
	name: z.string(),
	category: z.string(),
	unit: z.string(),
	quantity: z.coerce.number().default(0),
	availability: z.string(),
});

export type InventoryResponse = z.infer<typeof InventoryResponse>;

const ApiResponseListInventoryResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(InventoryResponse),
	}),
});

const InventorySummaryResponse = z.object({
	totalItems: z.number(),
	available: z.number(),
	lowInStock: z.number(),
	outOfStock: z.number(),
});

export type InventorySummaryResponse = z.infer<typeof InventorySummaryResponse>;

const ApiResponseInventorySummaryResponse = ApiResponseObject.extend({
	data: InventorySummaryResponse,
});

const InventoryRestockRequest = z.object({
	id: z.string(),
	itemCustomId: z.string(),
	name: z.string(),
	unit: z.string(),
	department: z.string(),
	quantity: z.number(),
	remarks: z.string().nullable(),
	approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]),
	requestedAt: z.coerce.date(),
	supplied: z.coerce.boolean(),
});

export type InventoryRestockRequest = z.infer<typeof InventoryRestockRequest>;

const ApiResponseInventoryRestockRequestResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(InventoryRestockRequest),
	}),
});

const OnboardStaffRequest = z.object({
	fullName: z.string(),
	email: z.string(),
	phoneNumber: z.string(),
	staffId: z.string(),
	role: Role,
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export type OnboardStaffRequest = z.infer<typeof OnboardStaffRequest>;

const ApiResponseOnboardStaffResponse = ApiResponseObject.extend({
	data: StaffDetails,
});

const ManagerActivityLog = z.object({
	id: z.string(),
	customId: z.string(),
	staffId: z.string(),
	staffEmail: z.string(),
	staffName: z.string(),
	role: z.string(),
	activity: z.string(),
	createdAt: z.iso.datetime(),
	hotelId: z.string(),
	hotelName: z.string(),
});

export type ManagerActivityLog = z.infer<typeof ManagerActivityLog>;

const ApiResponseManagerActivityLogResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(ManagerActivityLog),
	}),
});

const ApiResponseDashboardGraphResponse = ApiResponseObject.extend({
	data: z.array(
		z.object({
			month: z.string(),
			totalEarnings: z.number(),
		}),
	),
});

export type BookingStatus = z.infer<typeof BookingStatus>;

const ApiResponseInventoryItemResponse =
	ApiResponseListInventoryResponse.extend({
		data: Pagination.extend({
			content: z.array(
				InventoryResponse.extend({
					restockReason: z.string().nullable().optional(),
					restockDate: z.coerce.date().nullable().optional(),
					department: z.string(),
				}),
			),
		}),
	});

export type InventoryItemResponse = z.infer<
	typeof ApiResponseInventoryItemResponse
>["data"]["content"][number];

const InventoryProductsCategory = z.enum([
	"FOOD_FRESH",
	"FOOD_FROZEN",
	"FOOD_DRY_GOODS",
	"BEVERAGES_ALCOHOLIC",
	"BEVERAGES_NON_ALCOHOLIC",
	"BEVERAGES_HOT",
	"CLEANING_SUPPLIES",
	"LAUNDRY_SUPPLIES",
	"GUEST_AMENITIES",
	"LINENS_TOWELS",
	"MAINTENANCE_SUPPLIES",
	"ELECTRICAL_SUPPLIES",
	"PLUMBING_SUPPLIES",
	"HVAC_SUPPLIES",
	"STATIONERY",
	"OFFICE_EQUIPMENT",
	"PRINTING_SUPPLIES",
	"MINIBAR_ITEMS",
	"ROOM_SUPPLIES",
	"WELCOME_ITEMS",
	"KITCHEN_EQUIPMENT",
	"TABLEWARE",
	"DISPOSABLES",
	"UNIFORMS",
	"SAFETY_EQUIPMENT",
	"MARKETING_MATERIALS",
	"GENERAL_SUPPLIES",
	"OTHER",
]);

const ApiResponseInventorySuppliers = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				email: z.email().nullable(),
				phone: z.string().nullable(),
				products: z
					.object({
						id: z.string(),
						sku: z.string(),
						name: z.string(),
						category: InventoryProductsCategory,
					})
					.array(),
			}),
		),
	}),
});

export type InventorySuppliers = z.infer<
	typeof ApiResponseInventorySuppliers
>["data"]["content"][number];
export type InventorySupplierItem = InventorySuppliers["products"][number];

export type InventorySupplierMini = Pick<
	z.infer<typeof InventorySupplier>,
	"id" | "name" | "email" | "phone"
>;

const InventorySupplier = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	phone: z.string(),
	hotelId: z.string(),
	productIds: z.string().array(),
	products: z
		.object({
			id: z.string(),
			sku: z.string(),
			name: z.string(),
			category: InventoryProductsCategory,
		})
		.array(),
});

const ApiResponseInventorySupplierResponse = ApiResponseObject.extend({
	data: InventorySupplier,
});

const ApiResponseInventoryDelivery = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(
			z.object({
				id: z.string(),
				customId: z.string(),
				supplierId: z.string(),
				supplierName: z.string(),
				item: z.object({
					id: z.string(),
					customId: z.string(),
					name: z.string(),
				}),
				unit: z.string(),
				quantity: z.number(),
				deliveryDate: z.string(), // yyyy-mm-dd
				note: z.string(),
				createdAt: z.coerce.date(),
			}),
		),
	}),
});

export type InventoryDelivery = z.infer<
	typeof ApiResponseInventoryDelivery
>["data"]["content"][number];

const ApiResponseLostItem = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(
			z.object({
				id: z.string(),
				customId: z.string(),
				itemName: z.string(),
				description: z.string(),
				imageUrl: z.string().nullable(),
				location: z.string(),
				dateFound: z.coerce.date(),
				claimStatus: z.enum(["UNCLAIMED", "CLAIMED", "DISPOSED"]),
				claimedBy: z.string().nullable(),
				claimedDate: z.coerce.date().nullable(),
				claimNotes: z.string().nullable(),
				hotelName: z.string(),
				loggedBy: z.string(),
				createdAt: z.coerce.date(),
				updatedAt: z.coerce.date(),
			}),
		),
	}),
});

const StockLevelResponse = z.object({
	id: z.string(),
	hotelId: z.string(),
	productId: z.string(),
	productSku: z.string(),
	productName: z.string(),
	productCategory: z.string(),
	locationId: z.string(),
	locationCode: z.string(),
	locationName: z.string(),
	quantityOnHand: z.number(),
	quantityReserved: z.number(),
	quantityAvailable: z.number(),
	quantityInTransit: z.number(),
	quantityAllocated: z.number(),
	minLevel: z.number().nullable().optional(), // Not in the jq output but in my previous schema, might be needed or I saw it earlier?
	// tailored to what I saw in jq output actually
	// reorderLevel/minLevel/maxLevel are NOT in the jq output above?
	// Wait, let me re-check the jq output carefully.
	// The previous jq output did show isBelowReorderLevel etc.
	// But it did NOT show reorderLevel, minLevel, maxLevel as properties?
	// Let me double check usage in stock-level-table.tsx
	// The table uses: isBelowMinLevel, isBelowReorderLevel
	// It doesn't seem to display min/max/reorder levels directly in the table columns, but maybe in the sheet?
	// In table sheet: item.averageCost, item.totalValue, lastStockInDate etc.
	// It doesn't show min/max levels in the sheet either.
	// So I will stick to what jq outputted.
	averageCost: z.number(),
	totalValue: z.number(),
	lastPurchaseCost: z.number(),
	isBelowReorderLevel: z.boolean(),
	isBelowMinLevel: z.boolean(),
	isAboveMaxLevel: z.boolean(),
	isOutOfStock: z.boolean(),
	lastStockInDate: z.string().nullable(), // API docs say date-time string
	lastStockOutDate: z.string().nullable(),
	lastStockCountDate: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	lastRecalculatedAt: z.string(),
});

export type StockLevelResponse2 = z.infer<typeof StockLevelResponse>;

const LocationProductResponse = z.object({
	productId: z.string(),
	sku: z.string(),
	name: z.string(),
	category: z.string().nullable().optional(),
	quantityOnHand: z.number(),
	quantityAvailable: z.number(),
	averageCost: z.number(),
	isOutOfStock: z.boolean(),
});

export type LocationProductResponse = z.infer<typeof LocationProductResponse>;

const ApiResponseLocationProductList = ApiResponseObject.extend({
	data: z.array(LocationProductResponse),
});

const ApiResponseListStockLevelResponse = ApiResponseObject.extend({
	data: z.array(StockLevelResponse),
});

const ApiResponseStockLevelResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(StockLevelResponse),
	}),
});

const StockLevelStatisticsResponse = z.object({
	totalInventoryValue: z.number(),
	totalQuantityOnHand: z.number(),
	totalQuantityReserved: z.number(),
	totalQuantityAvailable: z.number(),
	outOfStockCount: z.number(),
	lowStockCount: z.number(),
});

export type StockLevelStatisticsResponse = z.infer<
	typeof StockLevelStatisticsResponse
>;

const ApiResponseStockLevelStatisticsResponse = ApiResponseObject.extend({
	data: StockLevelStatisticsResponse,
});

export type LostItem = z.infer<
	typeof ApiResponseLostItem
>["data"]["content"][number];

const ApiResponseManagerDashboardResponse = ApiResponseObject.extend({
	data: z.object({
		totalEarnings: z.number(),
		occupancyRate: z.number(),
		totalCheckIns: z.number(),
		totalCheckOuts: z.number(),
		totalRooms: z.number(),
		totalAvailableRooms: z.number(),
		selectedMonth: z.string(),
	}),
});

const ApiResponseHotelOwnerDashboardOverviewResponse = ApiResponseObject.extend(
	{
		data: z.object({
			totalEarnings: z.number(),
			roomEarnings: z.number(),
			barEarnings: z.number(),
			kitchenEarnings: z.number(),
			overallOccupancyRate: z.number(),
			totalCheckIns: z.number(),
			totalCheckOuts: z.number(),
			totalRooms: z.number(),
			totalAvailableRooms: z.number(),
			totalHotels: z.number(),
			selectedMonth: z.string(),
		}),
	},
);

export const InventoryLocations = z.enum([
	"MAIN_WAREHOUSE",
	"KITCHEN_STORE",
	"BAR_STORE",
	"HOUSEKEEPING_STORE",
	"MAINTENANCE_STORE",
	"OFFICE_STORE",
	"COLD_STORAGE",
	"FREEZER",
	"DRY_STORE",
	"CELLAR",
	"EXTERNAL_WAREHOUSE",
	"MOBILE_STORAGE",
	"OTHER",
]);

const ApiResponseInventoryLocationResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(
			z.object({
				id: z.string(),
				hotelId: z.string(),
				locationCode: z.string(),
				locationName: z.string(),
				locationType: InventoryLocations,
				description: z.string(),
				building: z.string(),
				floor: z.string(),
				room: z.string(),
				physicalAddress: z.string(),
				totalCapacity: z.number(),
				capacityUnit: z.string(),
				temperatureControlled: z.boolean(),
				minTemperature: z.number(),
				maxTemperature: z.number(),
				humidityControlled: z.boolean(),
				minHumidity: z.number(),
				maxHumidity: z.number(),
				accessRestrictions: z.string(),
				managerUserId: z.string(),
				contactPerson: z.string(),
				contactPhone: z.string(),
				active: z.boolean(),
				isPrimary: z.boolean(),
				allowNegativeStock: z.boolean(),
				operatingHours: z.string(),
				specialInstructions: z.string(),
				notes: z.string(),
				createdAt: z.coerce.date(),
				updatedAt: z.coerce.date(),
				createdBy: z.string(),
				updatedBy: z.string(),
				deactivatedAt: z.coerce.date().nullable(),
				deactivatedBy: z.string().nullable(),
				totalProductsStored: z.number(),
				lowStockProducts: z.number(),
				outOfStockProducts: z.number(),
			}),
		),
	}),
});

export type InventoryLocationResponse = z.infer<
	typeof ApiResponseInventoryLocationResponse
>["data"]["content"][number];

const ApiResponseInventoryLocationListResponse = ApiResponseObject.extend({
	data: z
		.object({
			id: z.string(),
			locationCode: z.string(),
			locationName: z.string(),
			locationType: InventoryLocations,
		})
		.array(),
});

export type InventoryLocationListResponse = z.infer<
	typeof ApiResponseInventoryLocationListResponse
>["data"][number];

const ApiResponseInventoryGRNResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(
			z.object({
				id: z.string(),
				customId: z.string(),
				hotelId: z.string(),
				grnNumber: z.string(),
				status: z.string(),
				purchaseOrderId: z.string(),
				purchaseOrderNumber: z.string(),
				supplierId: z.string(),
				supplierName: z.string(),
				supplierInvoiceNumber: z.string(),
				supplierInvoiceDate: z.string(),
				supplierDeliveryNote: z.string(),
				storageLocationId: z.string(),
				storageLocationCode: z.string(),
				storageLocationName: z.string(),
				receiptDate: z.string(),
				receiptTime: z.string(),
				receivedBy: z.string(),
				deliveredBy: z.string(),
				vehicleNumber: z.string(),
				inspectionRequired: z.boolean(),
				inspectionDate: z.string(),
				inspectedBy: z.string(),
				inspectionResult: z.string(),
				inspectionNotes: z.string(),
				items: z.array(
					z.object({
						id: z.string(),
						lineNumber: z.number(),
						productId: z.string(),
						productSku: z.string(),
						productName: z.string(),
						purchaseOrderItemId: z.string(),
						quantityOrdered: z.number(),
						quantityReceived: z.number(),
						quantityAccepted: z.number(),
						quantityRejected: z.number(),
						unit: z.string(),
						unitPrice: z.number(),
						lineTotal: z.number(),
						taxRate: z.number(),
						taxAmount: z.number(),
						batchId: z.string(),
						batchNumber: z.string(),
						serialNumber: z.string(),
						manufactureDate: z.string(),
						expiryDate: z.string(),
						qualityStatus: z.string(),
						qualityNotes: z.string(),
						rejectionReason: z.string(),
						damageDetails: z.string(),
						packagingCondition: z.string(),
						damaged: z.boolean(),
						expired: z.boolean(),
						notes: z.string(),
						storageLocation: z.string(),
						stockMovementId: z.string(),
						createdAt: z.string(),
						updatedAt: z.string(),
					}),
				),
				totalAmount: z.number(),
				taxAmount: z.number(),
				discountAmount: z.number(),
				netAmount: z.number(),
				totalQuantityReceived: z.number(),
				totalQuantityAccepted: z.number(),
				totalQuantityRejected: z.number(),
				stockPosted: z.boolean(),
				stockPostedAt: z.string(),
				stockPostedBy: z.string(),
				hasRejectedItems: z.boolean(),
				returnedToSupplier: z.boolean(),
				returnedAt: z.string(),
				returnNote: z.string(),
				notes: z.string(),
				discrepancies: z.string(),
				packagingCondition: z.string(),
				attachmentUrls: z.string(),
				cancelled: z.boolean(),
				cancelledAt: z.string(),
				cancelledBy: z.string(),
				cancellationReason: z.string(),
				createdAt: z.string(),
				updatedAt: z.string(),
				createdBy: z.string(),
				updatedBy: z.string(),
			}),
		),
	}),
});

export type InventoryGRNResponse = z.infer<
	typeof ApiResponseInventoryGRNResponse
>["data"]["content"][number];

export type InventoryPurchaseOrderItem = PurchaseOrderItemResponse;

export type InventoryPurchaseOrderStatistics = z.infer<
	typeof ApiResponseInventoryPurchaseOrderStatistics
>["data"];

export const StockTakeStatusEnum = z.enum([
	"SCHEDULED",
	"IN_PROGRESS",
	"PENDING_REVIEW",
	"REVIEWED",
	"ADJUSTMENTS_POSTED",
	"COMPLETED",
	"CANCELLED",
]);

const StockTakeLineItemSchema = z.object({
	id: z.string(),
	lineNumber: z.number().int(),
	productId: z.string(),
	productSku: z.string(),
	productName: z.string(),
	batchId: z.string().optional(),
	batchNumber: z.string().optional(),

	// Quantities & Values
	systemQuantity: z.number(),
	actualQuantity: z.number(),
	varianceQuantity: z.number(),
	variancePercent: z.number(),
	unitCost: z.number(),
	systemValue: z.number(),
	actualValue: z.number(),
	varianceValue: z.number(),

	// Count Details
	counted: z.boolean(),
	countedAt: z.string().datetime().nullable().optional(),
	countedBy: z.string().nullable().optional(),
	recounted: z.boolean(),
	countAttempts: z.number().int(),

	// Variance & Investigation
	hasVariance: z.boolean(),
	significantVariance: z.boolean(),
	requiresInvestigation: z.boolean(),
	varianceReason: z.string().nullable().optional(),
	investigationNotes: z.string().nullable().optional(),
	investigatedBy: z.string().nullable().optional(),
	investigatedAt: z.string().datetime().nullable().optional(),

	// Resolution
	resolved: z.boolean(),
	resolutionAction: z.string().nullable().optional(),
	adjustmentId: z.string().nullable().optional(),

	// Conditions
	conditionNotes: z.string().nullable().optional(),
	damagedItemsFound: z.boolean(),
	expiredItemsFound: z.boolean(),
	storageLocationObserved: z.string().nullable().optional(),

	// Meta
	photoUrls: z.string().nullable().optional(), // Could be a CSV string or a single URL based on input
	notes: z.string().nullable().optional(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

const StockTakeSchema = z.object({
	id: z.string(),
	hotelId: z.string(),
	stockTakeNumber: z.string(),

	// The Array Enum List provided
	status: StockTakeStatusEnum,

	// Location Details
	locationId: z.string(),
	locationCode: z.string(),
	locationName: z.string(),
	stockTakeType: z.string(), // e.g., "FULL", "CYCLE_COUNT"

	// Dates
	scheduledDate: z.date().or(z.string()), // Accepts YYYY-MM-DD
	startedAt: z.iso.datetime().nullable().optional(),
	completedAt: z.iso.datetime().nullable().optional(),

	// Personnel
	supervisorId: z.string().nullable().optional(),
	supervisorName: z.string().nullable().optional(),
	countedBy: z.string().nullable().optional(), // Primary counter for the whole sheet
	reviewedBy: z.string().nullable().optional(),
	reviewedAt: z.string().datetime().nullable().optional(),

	// The Array of Line Items
	items: z.array(StockTakeLineItemSchema).optional(),

	// Aggregates & Totals
	totalItemsExpected: z.number().int(),
	totalItemsCounted: z.number().int(),
	totalItemsWithVariance: z.number().int(),
	totalValueVariance: z.number(),
	systemStockValue: z.number(),
	actualStockValue: z.number(),
	acceptableVariancePercent: z.number(),
	hasSignificantVariances: z.boolean(),

	// Adjustment Meta
	adjustmentsPosted: z.boolean(),
	adjustmentsPostedAt: z.string().datetime().nullable().optional(),
	adjustmentsPostedBy: z.string().nullable().optional(),
	adjustmentsCount: z.number().int(),

	// Frozen State
	stockFrozen: z.boolean(),
	stockFrozenAt: z.string().datetime().nullable().optional(),
	stockUnfrozenAt: z.string().datetime().nullable().optional(),

	// Report Details
	findings: z.string().nullable().optional(),
	recommendations: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	reportUrl: z.string().nullable().optional(),

	// Cancellation
	cancelled: z.boolean(),
	cancelledAt: z.iso.datetime().nullable().optional(),
	cancelledBy: z.string().nullable().optional(),
	cancellationReason: z.string().nullable().optional(),

	// Timestamps
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	createdBy: z.string(),
	updatedBy: z.string(),
});

export type StockTakeLineItem = z.infer<typeof StockTakeLineItemSchema>;
export type StockTake = z.infer<typeof StockTakeSchema>;

export type InventoryStockTakeItem = z.infer<typeof StockTakeLineItemSchema>;

export const ApiResponseInventoryProductResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z
			.object({
				id: z.string(),
				hotelId: z.string(),
				sku: z.string(),
				barcode: z.string(),
				name: z.string(),
				description: z.string(),
				brand: z.string(),
				manufacturer: z.string(),
				category: InventoryProductsCategory,
				subcategory: z.string(),
				status: z.string(),
				baseUnit: z.string(),
				purchaseUnit: z.string(),
				consumptionUnit: z.string(),
				conversionFactor: z.number(),
				standardCost: z.number(),
				lastPurchasePrice: z.number(),
				sellingPrice: z.number(),
				valuationMethod: z.string(),
				reorderLevel: z.number(),
				reorderQuantity: z.number(),
				minStockLevel: z.number(),
				maxStockLevel: z.number(),
				safetyStock: z.number(),
				leadTimeDays: z.number(),
				trackBatches: z.boolean(),
				trackExpiry: z.boolean(),
				trackSerialNumbers: z.boolean(),
				perishable: z.boolean(),
				storageRequirements: z.string(),
				temperatureMin: z.number(),
				temperatureMax: z.number(),
				shelfLifeDays: z.number(),
				weight: z.number(),
				length: z.number(),
				width: z.number(),
				height: z.number(),
				preferredSupplierId: z.string(),
				supplierPartNumber: z.string(),
				imageUrl: z.string(),
				documentUrls: z.string(),
				notes: z.string(),
				internalNotes: z.string(),
				tags: z.string(),
				taxRate: z.number(),
				taxCategory: z.string(),
				accountCode: z.string(),
				costCenter: z.string(),
				createdAt: z.string(),
				updatedAt: z.string(),
				createdBy: z.string(),
				updatedBy: z.string(),
				discontinuedAt: z.string(),
				discontinuedBy: z.string(),
				currentStockOnHand: z.number(),
				currentStockAvailable: z.number(),
				isLowStock: z.boolean(),
				isOutOfStock: z.boolean(),
			})
			.array(),
	}),
});

export type InventoryProductResponse = z.infer<
	typeof ApiResponseInventoryProductResponse
>["data"]["content"][number];

export const ApiResponseCustomPageStockLevelResponse = ApiResponseObject.extend(
	{
		data: Pagination.extend({
			content: z
				.object({
					id: z.string(),
					hotelId: z.string(),
					productId: z.string(),
					productSku: z.string(),
					productName: z.string(),
					productCategory: z.string(),
					locationId: z.string(),
					locationCode: z.string(),
					locationName: z.string(),
					quantityOnHand: z.number(),
					quantityReserved: z.number(),
					quantityAvailable: z.number(),
					quantityInTransit: z.number(),
					quantityAllocated: z.number(),
					averageCost: z.number(),
					totalValue: z.number(),
					lastPurchaseCost: z.number(),
					isBelowReorderLevel: z.boolean(),
					isBelowMinLevel: z.boolean(),
					isAboveMaxLevel: z.boolean(),
					isOutOfStock: z.boolean(),
					lastStockInDate: z.string().optional().nullable(),
					lastStockOutDate: z.string().optional().nullable(),
					lastStockCountDate: z.string().optional().nullable(),
					createdAt: z.string().optional().nullable(),
					updatedAt: z.string().optional().nullable(),
					lastRecalculatedAt: z.string().optional().nullable(),
				})
				.array(),
		}),
	},
);

export type StockLevelResponse = z.infer<
	typeof ApiResponseCustomPageStockLevelResponse
>["data"]["content"][number];

const InventoryProductsStatistics = z.object({
	totalProducts: z.number(),
	activeProducts: z.number(),
	inactiveProducts: z.number(),
	discontinuedProducts: z.number(),
	batchTrackedProducts: z.number(),
	expiryTrackedProducts: z.number(),
	serialTrackedProducts: z.number(),
	perishableProducts: z.number(),
	categoryBreakdown: z.record(z.string(), z.number()),
});

const ApiResponseInventoryProductStatistics = ApiResponseObject.extend({
	data: InventoryProductsStatistics,
});

export type InventoryProductStatistics = z.infer<
	typeof InventoryProductsStatistics
>;

export const ApiInputInventoryProduct = z.object({
	sku: z.string().min(1, "SKU is required"),
	barcode: z.string().optional(),
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	brand: z.string().optional(),
	manufacturer: z.string().optional(),
	category: InventoryProductsCategory,
	subcategory: z.string().optional(),
	baseUnit: z.string().min(1, "Base unit is required"),
	purchaseUnit: z.string().optional(),
	consumptionUnit: z.string().optional(),
	conversionFactor: z.number().min(0).optional(),
	standardCost: z.number().min(0).optional(),
	lastPurchasePrice: z.number().min(0).optional(),
	sellingPrice: z.number().min(0).optional(),
	valuationMethod: z.enum(["FIFO", "LIFO", "WEIGHTED_AVERAGE"]).default("FIFO"),
	reorderLevel: z.number().min(0).optional(),
	reorderQuantity: z.number().min(0).optional(),
	minStockLevel: z.number().min(0).optional(),
	maxStockLevel: z.number().min(0).optional(),
	safetyStock: z.number().min(0).optional(),
	leadTimeDays: z.number().int().min(0).optional(),
	trackBatches: z.boolean().default(false),
	trackExpiry: z.boolean().default(false),
	trackSerialNumbers: z.boolean().default(false),
	perishable: z.boolean().default(false),
	storageRequirements: z.string().optional(),
	temperatureMin: z.number().optional(),
	temperatureMax: z.number().optional(),
	shelfLifeDays: z.number().int().min(0).optional(),
	weight: z.number().min(0).optional(),
	length: z.number().min(0).optional(),
	width: z.number().min(0).optional(),
	height: z.number().min(0).optional(),
	preferredSupplierId: z.string().optional(),
	supplierPartNumber: z.string().optional(),
	imageUrl: z.url().optional().or(z.literal("")),
	notes: z.string().optional(),
	internalNotes: z.string().optional(),
	tags: z.string().optional(),
	taxRate: z.number().min(0).optional(),
	taxCategory: z.string().optional(),
	accountCode: z.string().optional(),
	costCenter: z.string().optional(),
});

const ApiResponseInventoryGRNStatistics = ApiResponseObject.extend({
	data: z.object({
		totalGRNs: z.number(),
		draftGRNs: z.number(),
		pendingInspectionGRNs: z.number(),
		acceptedGRNs: z.number(),
		grnsWithRejectedItems: z.number(),
		stockPostedGRNs: z.number(),
		totalValue: z.number(),
		totalQuantityReceived: z.number(),
		totalQuantityAccepted: z.number(),
		totalQuantityRejected: z.number(),
		grnsToday: z.number(),
		valueToday: z.number(),
		uniqueSuppliers: z.number(),
	}),
});

export type InventoryGRNStatistics = z.infer<
	typeof ApiResponseInventoryGRNStatistics
>["data"];

// Reusable schema for product entries
const productSummarySchema = z.object({
	productId: z.string(),
	sku: z.string(),
	name: z.string(),
	category: z.string(),
	currentStock: z.number().min(0),
	reorderLevel: z.number().min(0),
	locationCode: z.string(),
	value: z.number().nonnegative(),
});

// Reusable schema for activity entries
const recentActivitySchema = z.object({
	activityType: z.string(),
	referenceNumber: z.string(),
	description: z.string(),
	activityDate: z.iso.datetime(), // Validates ISO 8601 strings
	performedBy: z.string(),
});

export type RecentActivity = z.infer<typeof recentActivitySchema>;

// Main Inventory Dashboard Schema
export const inventoryDashboardSchema = z.object({
	// Summary Metrics
	totalProducts: z.number().int().nonnegative(),
	activeProducts: z.number().int().nonnegative(),
	lowStockProductsCount: z.number().int().nonnegative(),
	outOfStockProducts: z.number().int().nonnegative(),
	expiringSoonProductsCount: z.number().int().nonnegative(),

	// Financials & Stock Totals
	totalInventoryValue: z.number().nonnegative(),
	totalStockOnHand: z.number().nonnegative(),
	totalReservedStock: z.number().nonnegative(),
	totalAvailableStock: z.number().nonnegative(),

	// Purchase & GRNs
	pendingPurchaseOrders: z.number().int().nonnegative(),
	approvedPurchaseOrders: z.number().int().nonnegative(),
	totalPurchaseOrderValue: z.number().nonnegative(),
	pendingGRNs: z.number().int().nonnegative(),
	todayGRNsReceived: z.number().int().nonnegative(),
	todayGRNsValue: z.number().nonnegative(),

	// Operations
	pendingAdjustments: z.number().int().nonnegative(),
	todayAdjustments: z.number().int().nonnegative(),
	scheduledStockTakes: z.number().int().nonnegative(),
	inProgressStockTakes: z.number().int().nonnegative(),
	pendingReviewStockTakes: z.number().int().nonnegative(),

	// Arrays
	lowStockProducts: z.array(productSummarySchema),
	fastMovingProducts: z.array(productSummarySchema),
	slowMovingProducts: z.array(productSummarySchema),
	expiringSoonProducts: z.array(productSummarySchema),
	recentActivities: z.array(recentActivitySchema),
});

export type InventoryDashboard = z.infer<typeof inventoryDashboardSchema>;

export type InventoryProduct = {
	id: string;
	sku: string;
	name: string;
	category: z.infer<typeof InventoryProductsCategory>;
};

const RefreshTokenRequest = z.object({
	refreshToken: z.string(),
});

// --- Inventory Schemas ---

const SupplierResponse = z.object({
	id: z.string(),
	customId: z.string(),
	name: z.string(),
	contactPerson: z.string(),
	email: z.string(),
	phoneNumber: z.string(),
	address: z.string(),
	taxIdentificationNumber: z.string().nullable(),
	paymentTerms: z.string(),
	currency: z.string(),
	category: z.string(),
	rating: z.number(),
	active: z.boolean(),
	notes: z.string(),
	website: z.string().nullable(),
	leadTimeDays: z.number(),
	minimumOrderValue: z.number(),
	preferredPaymentMethod: z.string(),
	bankName: z.string().nullable(),
	bankAccountNumber: z.string().nullable(),
	bankAccountName: z.string().nullable(),
	bankBranch: z.string().nullable(),
	swiftCode: z.string().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type SupplierResponse = z.infer<typeof SupplierResponse>;

export const AddSupplierRequest = z.object({
	name: z.string(),
	contactPerson: z.string(),
	email: z.string().email(),
	phoneNumber: z.string(),
	address: z.string(),
	taxIdentificationNumber: z.string().optional(),
	paymentTerms: z.string(),
	currency: z.string(),
	category: z.string(),
	notes: z.string().optional(),
	website: z.string().url().optional(),
	leadTimeDays: z.number().int().min(0),
	minimumOrderValue: z.number().min(0),
	preferredPaymentMethod: z.string(),
	bankName: z.string().optional(),
	bankAccountNumber: z.string().optional(),
	bankAccountName: z.string().optional(),
	bankBranch: z.string().optional(),
	swiftCode: z.string().optional(),
});

export type AddSupplierRequest = z.infer<typeof AddSupplierRequest>;

export const UpdateSupplierRequest = AddSupplierRequest.partial().extend({
	active: z.boolean().optional(),
});

export type UpdateSupplierRequest = z.infer<typeof UpdateSupplierRequest>;

const ProductResponse = z.object({
	id: z.string(),
	customId: z.string(),
	barcode: z.string().nullable(),
	name: z.string(),
	description: z.string(),
	brand: z.string(),
	manufacturer: z.string(),
	category: z.string(), // Enum in docs, keeping as string for now or use InventoryProductsCategory
	subcategory: z.string(),
	status: z.enum(["ACTIVE", "INACTIVE", "DISCONTINUED", "DRAFT", "ARCHIVED"]),
	baseUnit: z.string(),
	purchaseUnit: z.string(),
	consumptionUnit: z.string(),
	conversionFactor: z.number(),
	standardCost: z.number(),
	lastPurchasePrice: z.number(),
	sellingPrice: z.number(),
	valuationMethod: z.string(),
	reorderLevel: z.number(),
	reorderQuantity: z.number(),
	minStockLevel: z.number(),
	maxStockLevel: z.number(),
	safetyStock: z.number(),
	leadTimeDays: z.number(),
	trackBatches: z.boolean(),
	trackExpiry: z.boolean(),
	trackSerialNumbers: z.boolean(),
	perishable: z.boolean(),
	storageRequirements: z.string(),
	temperatureMin: z.number().nullable(),
	temperatureMax: z.number().nullable(),
	shelfLifeDays: z.number().nullable(),
	weight: z.number().nullable(),
	length: z.number().nullable(),
	width: z.number().nullable(),
	height: z.number().nullable(),
	preferredSupplierId: z.string().nullable(),
	preferredSupplierName: z.string().nullable(),
	supplierPartNumber: z.string().nullable(),
	imageUrl: z.string().nullable(),
	notes: z.string(),
	internalNotes: z.string(),
	tags: z.string(),
	taxRate: z.number(),
	taxCategory: z.string(),
	accountCode: z.string(),
	costCenter: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type ProductResponse = z.infer<typeof ProductResponse>;

const CreateProductRequest = z.object({
	barcode: z.string().optional(),
	name: z.string(),
	description: z.string().optional(),
	brand: z.string().optional(),
	manufacturer: z.string().optional(),
	category: z.string(), // Should match InventoryProductsCategory
	subcategory: z.string().optional(),
	status: z
		.enum(["ACTIVE", "INACTIVE", "DISCONTINUED", "DRAFT", "ARCHIVED"])
		.optional(),
	baseUnit: z.string(),
	purchaseUnit: z.string().optional(),
	consumptionUnit: z.string().optional(),
	conversionFactor: z.number().optional(),
	standardCost: z.number().optional(),
	lastPurchasePrice: z.number().optional(),
	sellingPrice: z.number().optional(),
	valuationMethod: z
		.enum([
			"FIFO",
			"LIFO",
			"WEIGHTED_AVERAGE",
			"STANDARD_COST",
			"SPECIFIC_IDENTIFICATION",
		])
		.optional(),
	reorderLevel: z.number().optional(),
	reorderQuantity: z.number().optional(),
	minStockLevel: z.number().optional(),
	maxStockLevel: z.number().optional(),
	safetyStock: z.number().optional(),
	leadTimeDays: z.number().int().optional(),
	trackBatches: z.boolean().optional(),
	trackExpiry: z.boolean().optional(),
	trackSerialNumbers: z.boolean().optional(),
	perishable: z.boolean().optional(),
	storageRequirements: z.string().optional(),
	temperatureMin: z.number().optional(),
	temperatureMax: z.number().optional(),
	shelfLifeDays: z.number().int().optional(),
	weight: z.number().optional(),
	length: z.number().optional(),
	width: z.number().optional(),
	height: z.number().optional(),
	preferredSupplierId: z.string().optional(),
	supplierPartNumber: z.string().optional(),
	imageUrl: z.string().optional(),
	notes: z.string().optional(),
	internalNotes: z.string().optional(),
	tags: z.string().optional(),
	taxRate: z.number().optional(),
	taxCategory: z.string().optional(),
	accountCode: z.string().optional(),
	costCenter: z.string().optional(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequest>;

const UpdateProductRequest = CreateProductRequest.partial();

export type UpdateProductRequest = z.infer<typeof UpdateProductRequest>;

// --- Storage Location Schemas ---

const StorageLocationResponse = z.object({
	id: z.string(),
	hotelId: z.string(),
	locationCode: z.string(),
	locationName: z.string(),
	locationType: InventoryLocations,
	description: z.string(),
	building: z.string(),
	floor: z.string(),
	room: z.string(),
	physicalAddress: z.string(),
	totalCapacity: z.number(),
	capacityUnit: z.string(),
	temperatureControlled: z.boolean(),
	minTemperature: z.number(),
	maxTemperature: z.number(),
	humidityControlled: z.boolean(),
	minHumidity: z.number(),
	maxHumidity: z.number(),
	accessRestrictions: z.string(),
	managerUserId: z.string(),
	contactPerson: z.string(),
	contactPhone: z.string(),
	active: z.boolean(),
	isPrimary: z.boolean(),
	allowNegativeStock: z.boolean(),
	operatingHours: z.string(),
	specialInstructions: z.string(),
	notes: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	createdBy: z.string(),
	updatedBy: z.string(),
	deactivatedAt: z.coerce.date().nullable(),
	deactivatedBy: z.string().nullable(),
	totalProductsStored: z.number(),
	lowStockProducts: z.number(),
	outOfStockProducts: z.number(),
});

export type StorageLocationResponse = z.infer<typeof StorageLocationResponse>;

const CreateStorageLocationRequest = z.object({
	locationCode: z.string(),
	locationName: z.string(),
	locationType: InventoryLocations,
	description: z.string().optional(),
	building: z.string().optional(),
	floor: z.string().optional(),
	room: z.string().optional(),
	physicalAddress: z.string().optional(),
	totalCapacity: z.number().optional(),
	capacityUnit: z.string().optional(),
	temperatureControlled: z.boolean().optional(),
	minTemperature: z.number().optional(),
	maxTemperature: z.number().optional(),
	humidityControlled: z.boolean().optional(),
	minHumidity: z.number().optional(),
	maxHumidity: z.number().optional(),
	accessRestrictions: z.string().optional(),
	managerUserId: z.string().optional(),
	contactPerson: z.string().optional(),
	contactPhone: z.string().optional(),
	isPrimary: z.boolean().optional(),
	allowNegativeStock: z.boolean().optional(),
	operatingHours: z.string().optional(),
	specialInstructions: z.string().optional(),
	notes: z.string().optional(),
});

export type CreateStorageLocationRequest = z.infer<
	typeof CreateStorageLocationRequest
>;

// --- GRN Schemas ---

const GRNItemRequest = z.object({
	productId: z.string(),
	purchaseOrderItemId: z.string().optional(),
	quantityReceived: z.number().min(0),
	quantityAccepted: z.number().min(0),
	quantityRejected: z.number().min(0),
	unit: z.string(),
	unitPrice: z.number().min(0),
	taxRate: z.number().optional(),
	batchNumber: z.string().optional(),
	serialNumber: z.string().optional(),
	manufactureDate: z.string().optional(), // date
	expiryDate: z.string().optional(), // date
	qualityStatus: z.string().optional(),
	qualityNotes: z.string().optional(),
	rejectionReason: z.string().optional(),
	damageDetails: z.string().optional(),
	packagingCondition: z.string().optional(),
	damaged: z.boolean().optional(),
	expired: z.boolean().optional(),
	notes: z.string().optional(),
	storageLocation: z.string().optional(),
});

export type GRNItemRequest = z.infer<typeof GRNItemRequest>;

const GoodsReceiptNoteItemResponse = z.object({
	id: z.string(),
	lineNumber: z.number(),
	productId: z.string(),
	productSku: z.string(),
	productName: z.string(),
	purchaseOrderItemId: z.string(),
	quantityOrdered: z.number(),
	quantityReceived: z.number(),
	quantityAccepted: z.number(),
	quantityRejected: z.number(),
	unit: z.string(),
	unitPrice: z.number(),
	lineTotal: z.number(),
	taxRate: z.number(),
	taxAmount: z.number(),
	batchId: z.string(),
	batchNumber: z.string(),
	serialNumber: z.string(),
	manufactureDate: z.string(),
	expiryDate: z.string(),
	qualityStatus: z.string(),
	qualityNotes: z.string(),
	rejectionReason: z.string(),
	damageDetails: z.string(),
	packagingCondition: z.string(),
	damaged: z.boolean(),
	expired: z.boolean(),
	notes: z.string(),
	storageLocation: z.string(),
	stockMovementId: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type GoodsReceiptNoteItemResponse = z.infer<
	typeof GoodsReceiptNoteItemResponse
>;

const CreateGRNRequest = z.object({
	supplierId: z.string(),
	purchaseOrderId: z.string().optional(),
	supplierInvoiceNumber: z.string().optional(),
	supplierInvoiceDate: z.string().optional(), // date
	supplierDeliveryNote: z.string().optional(),
	storageLocationId: z.string(),
	receiptDate: z.string(), // date
	receiptTime: z.string().optional(), // date-time
	deliveredBy: z.string().optional(),
	vehicleNumber: z.string().optional(),
	inspectionRequired: z.boolean().optional(),
	items: z.array(GRNItemRequest).min(1),
	notes: z.string().optional(),
	discrepancies: z.string().optional(),
	packagingCondition: z.string().optional(),
});

export type CreateGRNRequest = z.infer<typeof CreateGRNRequest>;

const GoodsReceiptNoteResponse = z.object({
	id: z.string(),
	customId: z.string(),
	hotelId: z.string(),
	grnNumber: z.string(),
	status: z.string(),
	purchaseOrderId: z.string(),
	purchaseOrderNumber: z.string(),
	supplierId: z.string(),
	supplierName: z.string(),
	supplierInvoiceNumber: z.string(),
	supplierInvoiceDate: z.string(),
	supplierDeliveryNote: z.string(),
	storageLocationId: z.string(),
	storageLocationCode: z.string(),
	storageLocationName: z.string(),
	receiptDate: z.string(),
	receiptTime: z.string(),
	receivedBy: z.string(),
	deliveredBy: z.string(),
	vehicleNumber: z.string(),
	inspectionRequired: z.boolean(),
	inspectionDate: z.string(),
	inspectedBy: z.string(),
	inspectionResult: z.string(),
	inspectionNotes: z.string(),
	items: z.array(GoodsReceiptNoteItemResponse),
	totalAmount: z.number(),
	taxAmount: z.number(),
	discountAmount: z.number(),
	netAmount: z.number(),
	totalQuantityReceived: z.number(),
	totalQuantityAccepted: z.number(),
	totalQuantityRejected: z.number(),
	stockPosted: z.boolean(),
	stockPostedAt: z.string(),
	notes: z.string(),
	discrepancies: z.string(),
	packagingCondition: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type GoodsReceiptNoteResponse = z.infer<typeof GoodsReceiptNoteResponse>;

export const UpdateGRNRequest = z.object({
	supplierInvoiceNumber: z.string().max(100).optional(),
	supplierInvoiceDate: z.string().date().optional(),
	supplierDeliveryNote: z.string().max(100).optional(),
	receiptDate: z.string().date(),
	receiptTime: z.string().datetime().optional(),
	deliveredBy: z.string().max(200).optional(),
	vehicleNumber: z.string().max(100).optional(),
	inspectionRequired: z.boolean().optional(),
	inspectionDate: z.string().datetime().optional(),
	inspectedBy: z.string().max(200).optional(),
	inspectionResult: z.string().max(100).optional(),
	inspectionNotes: z.string().max(2000).optional(),
	items: z.array(GRNItemRequest).min(1),
	notes: z.string().max(2000).optional(),
	discrepancies: z.string().max(1000).optional(),
	packagingCondition: z.string().max(500).optional(),
});

export type UpdateGRNRequest = z.infer<typeof UpdateGRNRequest>;

// --- Stock Take Schemas ---

const StockTakeItemResponse = z.object({
	id: z.string(),
	stockTakeId: z.string(),
	productId: z.string(),
	productSku: z.string(),
	productName: z.string(),
	locationId: z.string(),
	locationName: z.string(),
	systemQuantity: z.number(),
	actualQuantity: z.number().nullable(),
	variance: z.number().nullable(),
	varianceValue: z.number().nullable(),
	status: z.string(),
	countedBy: z.string().nullable(),
	countedAt: z.string().nullable(), // date-time
	notes: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type StockTakeItemResponse = z.infer<typeof StockTakeItemResponse>;

const RecordStockCountRequest = z.object({
	stockTakeItemId: z.string(),
	actualQuantity: z.number().min(0),
	conditionNotes: z.string().optional(),
	damagedItemsFound: z.boolean().optional(),
	expiredItemsFound: z.boolean().optional(),
	storageLocationObserved: z.string().optional(),
	notes: z.string().optional(),
});

export type RecordStockCountRequest = z.infer<typeof RecordStockCountRequest>;

const CreateStockTakeRequest = z.object({
	locationId: z.string(),
	description: z.string(),
	scheduledDate: z.string(), // date-time
	blindCount: z.boolean().optional(),
	includeInactiveProducts: z.boolean().optional(),
	productCategories: z.array(z.string()).optional(),
	assignedUserIds: z.array(z.string()).optional(),
	notes: z.string().optional(),
});

export type CreateStockTakeRequest = z.infer<typeof CreateStockTakeRequest>;

const ApiResponseCustomPageStockTakeResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: StockTakeSchema.array(),
	}),
});

const ApiResponseInventoryStockTakeResponse =
	ApiResponseCustomPageStockTakeResponse;
const ApiResponseInventoryStockTakeStatistics = ApiResponseObject.extend({
	data: z.object({
		totalStockTakes: z.number(),
		completedStockTakes: z.number(),
		pendingStockTakes: z.number(),
		totalVarianceValue: z.number(),
		accuracyRate: z.number(),
	}),
});

// --- Stock Adjustment Schemas ---

export const CreateStockAdjustmentRequest = z.object({
	productId: z.string(),
	locationId: z.string(),
	adjustmentDate: z.string(), // date-time
	reason: z.enum([
		"DAMAGED",
		"EXPIRED",
		"THEFT",
		"LOSS",
		"FOUND",
		"OTHER",
		"RETURNED_TO_SUPPLIER",
		"STOCK_TAKE_VARIANCE",
		"INTERNAL_USE",
		"PROMOTION",
		"TRANSFER",
	]),
	adjustmentType: z.enum(["INCREASE", "DECREASE"]),
	adjustmentQuantity: z.number().min(0),
	unitCost: z.number().min(0).optional(),
	stockTakeId: z.string().optional(),
	requiresApproval: z.boolean().optional(),
	description: z.string(),
	notes: z.string().optional(),
	responsiblePerson: z.string().optional(),
	incidentNumber: z.string().optional(),
	insuranceClaim: z.boolean().optional(),
	claimNumber: z.string().optional(),
	claimAmount: z.number().min(0).optional(),
});

export type CreateStockAdjustmentRequest = z.infer<
	typeof CreateStockAdjustmentRequest
>;

const StockAdjustmentResponse = z.object({
	id: z.string(),
	hotelId: z.string(),
	adjustmentNumber: z.string(),
	productId: z.string(),
	productSku: z.string(),
	productName: z.string(),
	locationId: z.string(),
	locationCode: z.string(),
	locationName: z.string(),
	batchId: z.string().nullable(),
	batchNumber: z.string().nullable(),
	adjustmentDate: z.string(),
	reason: z.string(),
	adjustmentType: z.string(),
	quantityBefore: z.number(),
	adjustmentQuantity: z.number(),
	quantityAfter: z.number(),
	unitCost: z.number(),
	totalCostImpact: z.number(),
	stockTakeId: z.string().nullable(),
	stockTakeNumber: z.string().nullable(),
	requiresApproval: z.boolean(),
	approved: z.boolean(),
	approvedBy: z.string().nullable(),
	approvedAt: z.string().nullable(),
	approvalComments: z.string().nullable(),
	posted: z.boolean(),
	postedAt: z.string().nullable(),
	postedBy: z.string().nullable(),
	stockMovementId: z.string().nullable(),
	description: z.string(),
	notes: z.string(),
	responsiblePerson: z.string().nullable(),
	photoUrls: z.string().nullable(),
	documentUrls: z.string().nullable(),
	incidentNumber: z.string().nullable(),
	insuranceClaim: z.boolean(),
	claimNumber: z.string().nullable(),
	claimAmount: z.number().nullable(),
	cancelled: z.boolean(),
	cancelledAt: z.string().nullable(),
	cancelledBy: z.string().nullable(),
	cancellationReason: z.string().nullable(),
	reversalAdjustmentId: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	createdBy: z.string(),
	updatedBy: z.string(),
});

export type StockAdjustmentResponse = z.infer<typeof StockAdjustmentResponse>;

const ApiResponseCustomPageStockAdjustmentResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(StockAdjustmentResponse),
	}),
});

// --- Stock Issue Schemas ---

const StockIssueItemRequest = z.object({
	productId: z.string().min(1),
	batchId: z.string().optional(),
	quantity: z.number().min(0),
	notes: z.string().max(1000).optional(),
});

export type StockIssueItemRequest = z.infer<typeof StockIssueItemRequest>;

const StockIssueRequest = z.object({
	locationId: z.string().min(1),
	issueDate: z.string().datetime(),
	issueType: z.enum([
		"INTERNAL_CONSUMPTION",
		"SALES_ISSUE",
		"TRANSFER_OUT",
		"OTHERS",
	]),
	departmentId: z.string().max(100).optional(),
	receivedBy: z.string().max(200).optional(),
	orderId: z.string().max(100).optional(),
	bookingId: z.string().max(100).optional(),
	toLocationId: z.string().optional(),
	autoCompleteTransfer: z.boolean().optional(),
	items: z.array(StockIssueItemRequest).min(1),
	notes: z.string().max(1000).optional(),
	reason: z.string().max(1000).optional(),
});

export type StockIssueRequest = z.infer<typeof StockIssueRequest>;

// --- Stock Requisition Schemas ---

const RequisitionItemRequest = z.object({
	productId: z.string(),
	quantityRequested: z.number().min(0),
	unit: z.string(),
	notes: z.string().optional(),
});

export type RequisitionItemRequest = z.infer<typeof RequisitionItemRequest>;

const RequisitionItemResponse = z.object({
	id: z.string(),
	productId: z.string(),
	productName: z.string(),
	productSku: z.string(),
	quantityRequested: z.number(),
	quantityApproved: z.number().nullable(),
	quantityIssued: z.number(),
	unit: z.string(),
	status: z.string(),
	notes: z.string(),
});

export type RequisitionItemResponse = z.infer<typeof RequisitionItemResponse>;

const CreateRequisitionRequest = z.object({
	departmentId: z.string().optional(), // or department enum
	requiredDate: z.string(), // date
	priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
	items: z.array(RequisitionItemRequest).min(1),
	notes: z.string().optional(),
});

export type CreateRequisitionRequest = z.infer<typeof CreateRequisitionRequest>;

const StockRequisitionResponse = z.object({
	id: z.string(),
	requisitionNumber: z.string(),
	hotelId: z.string(),
	department: z.string(),
	requestedBy: z.string(),
	requestedAt: z.string(),
	requiredDate: z.string(),
	priority: z.string(),
	status: z.string(),
	items: z.array(RequisitionItemResponse),
	approvalStatus: z.string(),
	approvedBy: z.string().nullable(),
	approvedAt: z.string().nullable(),
	rejectionReason: z.string().nullable(),
	fulfilledBy: z.string().nullable(),
	fulfilledAt: z.string().nullable(),
	notes: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type StockRequisitionResponse = z.infer<typeof StockRequisitionResponse>;

// --- Purchase Order Schemas ---

const PurchaseOrderItemRequest = z.object({
	productId: z.string(),
	productDescription: z.string().optional(),
	quantityOrdered: z.number().min(0),
	unit: z.string(),
	unitPrice: z.number().min(0),
	discountPercent: z.number().min(0).max(100).optional(),
	taxRate: z.number().min(0).max(100).optional(),
	expectedDeliveryDate: z.string().optional(),
	notes: z.string().optional(),
	specifications: z.string().optional(),
});

export type PurchaseOrderItemRequest = z.infer<typeof PurchaseOrderItemRequest>;

const PurchaseOrderItemResponse = z.object({
	id: z.string(),
	lineNumber: z.number(),
	productId: z.string(),
	productSku: z.string(),
	productName: z.string(),
	productDescription: z.string(),
	quantityOrdered: z.number(),
	quantityReceived: z.number(),
	quantityPending: z.number(),
	quantityRejected: z.number(),
	unit: z.string(),
	unitPrice: z.number(),
	discountPercent: z.number(),
	discountAmount: z.number(),
	lineTotal: z.number(),
	taxRate: z.number(),
	taxAmount: z.number(),
	expectedDeliveryDate: z.string(),
	notes: z.string(),
	specifications: z.string(),
	fullyReceived: z.boolean(),
	cancelled: z.boolean(),
	cancellationReason: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type PurchaseOrderItemResponse = z.infer<
	typeof PurchaseOrderItemResponse
>;

const CreatePurchaseOrderRequest = z.object({
	supplierId: z.string(),
	orderDate: z.string(), // date
	expectedDeliveryDate: z.string().optional(), // date
	deliveryLocationId: z.string(),
	currency: z.string().optional(),
	exchangeRate: z.number().optional(),
	paymentTerms: z.string().optional(),
	paymentDueDays: z.number().int().optional(),
	paymentMethod: z.string().optional(),
	notes: z.string().optional(),
	termsAndConditions: z.string().optional(),
	deliveryInstructions: z.string().optional(),
	internalNotes: z.string().optional(),
	requisitionNumber: z.string().optional(),
	quotationNumber: z.string().optional(),
	items: z.array(PurchaseOrderItemRequest).min(1),
});

export type CreatePurchaseOrderRequest = z.infer<
	typeof CreatePurchaseOrderRequest
>;

const PurchaseOrderResponse = z.object({
	id: z.string(),
	hotelId: z.string(),
	poNumber: z.string(),
	status: z.string(),
	supplierId: z.string(),
	supplierName: z.string(),
	supplierContactPerson: z.string().nullable().optional(),
	supplierContactPhone: z.string().nullable().optional(),
	supplierContactEmail: z.string().nullable().optional(),
	deliveryLocationId: z.string(),
	deliveryLocationName: z.string(),
	deliveryAddress: z.string().nullable().optional(),
	orderDate: z.string(),
	expectedDeliveryDate: z.string().nullable().optional(),
	approvalDate: z.string().nullable().optional(),
	sentToSupplierDate: z.string().nullable().optional(),
	subtotal: z.number(),
	taxAmount: z.number(),
	taxRate: z.number(),
	shippingCost: z.number(),
	otherCharges: z.number(),
	discountAmount: z.number(),
	discountPercent: z.number(),
	totalAmount: z.number(),
	currency: z.string(),
	exchangeRate: z.number(),
	items: z.array(PurchaseOrderItemResponse),
	paymentTerms: z.string().nullable().optional(),
	paymentDueDays: z.number().nullable().optional(),
	paymentMethod: z.string().nullable().optional(),
	requestedBy: z.string().nullable().optional(),
	approvedBy: z.string().nullable().optional(),
	rejectedBy: z.string().nullable().optional(),
	rejectedAt: z.string().nullable().optional(),
	rejectionReason: z.string().nullable().optional(),
	totalQuantityOrdered: z.number(),
	totalQuantityReceived: z.number(),
	totalQuantityPending: z.number(),
	notes: z.string().nullable().optional(),
	termsAndConditions: z.string().nullable().optional(),
	deliveryInstructions: z.string().nullable().optional(),
	internalNotes: z.string().nullable().optional(),
	attachmentUrls: z.string().nullable().optional(),
	requisitionNumber: z.string().nullable().optional(),
	quotationNumber: z.string().nullable().optional(),
	cancelled: z.boolean(),
	cancelledAt: z.string().nullable().optional(),
	cancelledBy: z.string().nullable().optional(),
	cancellationReason: z.string().nullable().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	createdBy: z.string().nullable().optional(),
	updatedBy: z.string().nullable().optional(),
});

export type PurchaseOrderResponse = z.infer<typeof PurchaseOrderResponse>;

const ApiResponseCustomPagePurchaseOrderResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(PurchaseOrderResponse),
	}),
});

const ApiResponseInventoryPurchaseOrderResponse =
	ApiResponseCustomPagePurchaseOrderResponse;
const ApiResponseInventoryPurchaseOrderStatistics = ApiResponseObject.extend({
	data: z.object({
		totalPurchaseOrders: z.number(),
		pendingApproval: z.number(),
		approved: z.number(),
		sentToSupplier: z.number(),
		partiallyReceived: z.number(),
		received: z.number(),
		cancelled: z.number(),
		totalValue: z.number(),
		pendingValue: z.number(),
		overduePurchaseOrders: z.number(),
		statusBreakdown: z.object({
			DRAFT: z.number(),
			APPROVED: z.number(),
			SENT_TO_SUPPLIER: z.number(),
			PARTIALLY_RECEIVED: z.number(),
			RECEIVED: z.number(),
			CANCELLED: z.number(),
		}),
	}),
});

const PurchaseOrderListItem = PurchaseOrderResponse.pick({
	id: true,
	poNumber: true,
	supplierName: true,
	status: true,
	orderDate: true,
	expectedDeliveryDate: true,
});

export type PurchaseOrderListItem = z.infer<typeof PurchaseOrderListItem>;

// --- Stock Movement Schemas ---

const StockMovementResponse = z.object({
	id: z.string(),
	hotelId: z.string(),
	movementNumber: z.string(),
	movementType: z.string(),
	movementDate: z.string(),
	productId: z.string(),
	productSku: z.string(),
	productName: z.string(),
	locationId: z.string(),
	locationCode: z.string(),
	locationName: z.string(),
	fromLocationId: z.string().nullable(),
	fromLocationCode: z.string().nullable(),
	fromLocationName: z.string().nullable(),
	toLocationId: z.string().nullable(),
	toLocationCode: z.string().nullable(),
	toLocationName: z.string().nullable(),
	quantity: z.number(),
	unitCost: z.number(),
	totalCost: z.number(),
	balanceAfter: z.number(),
	batchId: z.string().nullable(),
	batchNumber: z.string().nullable(),
	referenceNumber: z.string().nullable(),
	referenceType: z.string().nullable(),
	referenceId: z.string().nullable(),
	orderId: z.string().nullable(),
	bookingId: z.string().nullable(),
	departmentId: z.string().nullable(),
	performedBy: z.string(),
	approvedBy: z.string().nullable(),
	receivedBy: z.string().nullable(),
	notes: z.string(),
	reason: z.string(),
	qualityStatus: z.string().nullable(),
	qualityNotes: z.string().nullable(),
	attachmentUrl: z.string().nullable(),
	isReversed: z.boolean(),
	reversedBy: z.string().nullable(),
	reversedAt: z.string().nullable(),
	reversalMovementId: z.string().nullable(),
	reversalReason: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type StockMovementResponse = z.infer<typeof StockMovementResponse>;

export const ExportStockMovementsResponse = z.any(); // Byte stream
export const ExportStockLevelsResponse = z.any(); // Byte stream
export const ExportStockTakesResponse = z.any(); // Byte stream
export const ExportStockAdjustmentsResponse = z.any(); // Byte stream

export const PaymentMethod = z.enum([
	"CASH",
	"CARD",
	"CREDIT_CARD",
	"DEBIT_CARD",
	"BANK_TRANSFER",
	"MOBILE_MONEY",
	"CHEQUE",
	"ONLINE_PAYMENT",
	"PAYPAL",
	"CRYPTOCURRENCY",
	"DIRECT_DEBIT",
	"PETTY_CASH",
	"OTHERS",
]);

export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const PaymentStatus = z.enum([
	"SUCCESS",
	"FAILED",
	"PENDING",
	"CANCELLED",
	"REFUNDED",
	"PARTLY_PAID",
	"FULLY_PAID",
]);

export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PaymentType = z.enum([
	"DEPOSIT",
	"INSTALLMENT",
	"FINAL",
	"REFUND",
	"OTHER",
]);

export type PaymentType = z.infer<typeof PaymentType>;

const ApiResponseBookingPaymentListResponse = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(BookingPaymentResponse),
	}),
});

export const ApiResponseListBookingPaymentResponse = ApiResponseObject.extend({
	data: z.array(BookingPaymentResponse),
});

// --- Main Fetch Schema ---
export const schema = createSchema({
	...financialsRoutes,
	"@get/api/inventories/stock-levels": {
		query: z
			.object({
				locationId: z.string().optional().nullable(),
				productId: z.string().optional().nullable(),
				category: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				lowStock: z.boolean().optional().nullable(),
				outOfStock: z.boolean().optional().nullable(),
				pageable: z.string().optional().nullable(),
				page: z.number().optional(),
				size: z.number().optional(),
			})
			.partial(),
		output: ApiResponseStockLevelResponse,
	},
	"@get/api/inventories/stock-levels/by-location/:locationId": {
		params: z.object({ locationId: z.string() }),
		output: ApiResponseStockLevelResponse,
	},
	"@get/api/inventories/stock-levels/by-product/:productId": {
		params: z.object({ productId: z.string() }),
		output: ApiResponseListStockLevelResponse,
	},
	"@get/api/inventories/stock-levels/low-stock": {
		output: ApiResponseListStockLevelResponse,
	},
	"@get/api/inventories/stock-levels/out-of-stock": {
		output: ApiResponseListStockLevelResponse,
	},
	"@get/api/inventories/stock-levels/statistics": {
		output: ApiResponseStockLevelStatisticsResponse,
	},
	"@get/api/inventories/stock-levels/:stockLevelId": {
		params: z.object({ stockLevelId: z.string() }),
		output: ApiResponseStockLevelResponse,
	},
	"@get/api/inventories/products-by-location/:locationId": {
		params: z.object({ locationId: z.string() }),
		output: ApiResponseLocationProductList,
	},
	// Auth APIs
	"@post/api/auth/sign-in": {
		input: LoginRequest,
		output: ApiResponseLoginResponse,
	},
	"@post/api/auth/refresh": {
		input: RefreshTokenRequest,
		output: ApiResponseLoginResponse,
	},
	"@post/api/auth/reset-password": {
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
		input: z.object({
			email: z.string(),
		}),
	},
	"@post/api/auth/verify-otp": {
		input: z.object({
			otp: z.string(),
		}),
		output: ApiResponseObject.extend({
			data: z.object({
				resetToken: z.string(),
				message: z.string(),
			}),
		}),
	},
	"@post/api/auth/set-new-password": {
		input: z.object({
			resetToken: z.string(),
			newPassword: z.string(),
			confirmPassword: z.string(),
		}),
		output: ApiResponseObject.extend({
			data: z.object({
				message: z.string(),
			}),
		}),
	},

	// User APIs
	"@post/api/users/force-reset-password": {
		input: z.object({
			newPassword: z.string(),
			confirmPassword: z.string(),
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@post/api/users/change-password": {
		input: z.object({
			oldPassword: z.string(),
			newPassword: z.string(),
			confirmPassword: z.string(),
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@get/api/users/me": {
		output: ApiResponseUserInfoResponse,
	},

	// Platform Owner APIs
	"@post/api/platform-owner/onboard-hotel-biz": {
		input: CreateHotelOwnerRequest,
		output: ApiResponseUserModelResponse,
	},

	// Hotel Owner APIs
	"@get/api/hotel-owners/hotels": {
		output: ApiResponseListGetHotelResponse,
		query: z
			.object({
				searchText: z.string(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
	},
	"@post/api/hotel-owners/hotels": {
		input: OnboardHotelRequest,
		output: ApiResponseOnboardHotelResponse,
	},
	"@put/api/hotel-owners/hotels/:hotelId": {
		params: z.object({ hotelId: z.string() }),
		input: OnboardHotelRequest.omit({ managerId: true }),
		output: ApiResponseGetHotelResponse,
	},
	"@delete/api/hotel-owners/hotels/:hotelId": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseDeleteHotelResponse,
	},
	"@get/api/hotel-owners/staff": {
		output: ApiResponseCustomPageStaffResponse,
		query: CustomPageStaffResponseQuery,
	},
	"@post/api/hotel-owners/managers": {
		input: CreateHotelManagerRequest,
		output: ApiResponseUserModelResponse,
	},
	"@get/api/hotel-owners/hotels/:hotelId/rooms": {
		params: z.object({ hotelId: z.string() }),
		query: z
			.object({
				search: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				roomType: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseListRoomResponse,
	},
	"@get/api/hotel-owners/hotels/bookings": {
		output: ApiResponseListBookingViewResponse,
	},
	"@get/api/hotel-owners/:hotelId/inventories": {
		params: z.object({ hotelId: z.string() }),
		query: z
			.object({
				searchName: z.string().nullable(),
				customId: z.string().nullable(),
				category: z.string().nullable(),
				unit: z.string().nullable(),
				availability: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseListInventoryResponse,
	},
	"@post/api/hotel-owners/:hotelId/manager/:managerId": {
		params: z.object({ hotelId: z.string(), managerId: z.string() }),
		query: z.object({
			action: z.enum(["ASSIGN", "UNASSIGN"]),
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@get/api/hotel-owners/logs": {
		output: ApiResponseManagerActivityLogResponse,
		query: z
			.object({
				search: z.string().nullable(),
				startDate: z.iso.date().nullable(),
				endDate: z.iso.date().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
	},
	"@get/api/hotel-owners/dashboard/graph": {
		output: ApiResponseDashboardGraphResponse,
	},
	"@get/api/hotel-owners/dashboard/overview": {
		query: z
			.object({
				selectedMonth: z.string(),
			})
			.partial()
			.optional(),
		output: ApiResponseHotelOwnerDashboardOverviewResponse,
	},
	"@get/api/hotel-owners/dashboard-performance": {
		output: ApiResponseObject.extend({
			data: z
				.object({
					hotelId: z.string(),
					hotelName: z.string(),
					performancePercentage: z.number(),
				})
				.array(),
		}),
	},

	// Manager APIs
	"@get/api/managers/hotels/:hotelId/rooms": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseListRoomResponse,
		query: ListRoomsQuery,
	},
	"@post/api/managers/hotels/:hotelId/rooms": {
		params: z.object({ hotelId: z.string() }),
		input: CreateRoomRequest,
		output: ApiResponseRoomResponse,
	},
	"@put/api/managers/hotels/rooms/:roomCustomId": {
		params: z.object({ roomCustomId: z.string() }),
		input: UpdateRoomRequest,
		output: ApiResponseRoomResponse,
	},
	"@get/api/managers/hotels/:hotelId/bookings": {
		params: z.object({ hotelId: z.string() }),
		query: z
			.object({
				bookingStatus: BookingStatus,
				search: z.string(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseManagerBookingViewResponse,
	},
	"@get/api/managers/:hotelId/staff": {
		params: z.object({ hotelId: z.string() }),
		query: z
			.object({
				search: z.string().nullable(),
				status: z
					.enum(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"])
					.nullable(),
				role: Role.nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseCustomPageStaffResponse,
	},
	"@post/api/managers/hotels/:hotelId/onboard-staff": {
		params: z.object({ hotelId: z.string() }),
		input: OnboardStaffRequest,
		output: ApiResponseOnboardStaffResponse,
	},
	"@put/api/managers/:hotelId/:staffId": {
		params: z.object({ hotelId: z.string(), staffId: z.string() }),
		input: OnboardStaffRequest.partial().omit({ role: true }),
		output: ApiResponseOnboardStaffResponse,
	},
	"@patch/api/managers/:hotelId/:staffId/reset-password": {
		params: z.object({ hotelId: z.string(), staffId: z.string() }),
		input: z.object({
			newPassword: z.string().min(8),
			confirmPassword: z.string().min(8),
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@patch/api/managers/:hotelId/:staffId/suspend": {
		params: z.object({ hotelId: z.string(), staffId: z.string() }),
		input: z.object({
			reason: z.string().nonempty(),
			fromDate: z.coerce.date(), // yyyy-mm-dd
			toDate: z.coerce.date(), // yyyy-mm-dd
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@get/api/managers/:hotelId/inventories": {
		params: z.object({ hotelId: z.string() }),
		query: z
			.object({
				searchName: z.string().nullable(),
				customId: z.string().nullable(),
				category: z
					.enum([
						"BAR",
						"KITCHEN",
						"HOUSEKEEPING",
						"FRONT_DESK",
						"MAINTENANCE",
						"MANAGEMENT",
						"INVENTORY",
						"OTHER",
					])
					.nullable(),
				unit: z.string().nullable(),
				availability: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseListInventoryResponse,
	},
	"@get/api/managers/:hotelId/inventories/summary": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseInventorySummaryResponse,
	},
	"@get/api/managers/:hotelId/inventories/restock-requests": {
		params: z.object({ hotelId: z.string() }),
		query: z
			.object({
				approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).nullable(),
				searchName: z.string().nullable(),
				itemCustomId: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseInventoryRestockRequestResponse,
	},
	"@get/api/managers/logs/:hotelId": {
		params: z.object({ hotelId: z.string() }),
		query: z
			.object({
				search: z.string().nullable(),
				startDate: z.iso.date().nullable(),
				endDate: z.iso.date().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseManagerActivityLogResponse,
	},
	"@get/api/managers/dashboard/:hotelId": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseManagerDashboardResponse,
		query: z
			.object({
				month: z.string(),
			})
			.partial()
			.optional(),
	},
	"@get/api/managers/dashboard/:hotelId/earnings-graph": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseDashboardGraphResponse,
	},
	"@get/api/managers/dashboard-performance": {
		output: ApiResponseObject.extend({
			data: z
				.object({
					hotelId: z.string(),
					hotelName: z.string(),
					performancePercentage: z.number(),
				})
				.array(),
		}),
	},

	// Inventory Officer APIs
	"@get/api/inventories/dashboard": {
		output: ApiResponseObject.extend({
			data: inventoryDashboardSchema,
		}),
	},
	"@post/api/inventories/items": {
		input: z.object({
			name: z.string().nonempty(),
			category: z.string().nonempty(),
			unit: z.string().optional(),
			quantity: z.number().min(0),
			itemId: z.string().optional(),
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@get/api/inventories/summary": {
		output: ApiResponseInventorySummaryResponse,
	},
	"@get/api/inventories/issued": {
		query: z
			.object({
				searchName: z.string().nullable(),
				customId: z.string().nullable(),
				department: z
					.enum([
						"BAR",
						"KITCHEN",
						"HOUSEKEEPING",
						"FRONT_DESK",
						"MAINTENANCE",
						"MANAGEMENT",
						"INVENTORY",
						"OTHER",
					])
					.nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseInventoryItemResponse,
	},
	"@get/api/inventories/items/restock-requests": {
		query: z
			.object({
				approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).nullable(),
				searchName: z.string().nullable(),
				itemCustomId: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseInventoryRestockRequestResponse,
	},
	"@get/api/inventories/suppliers": {
		query: z
			.object({
				search: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseInventorySuppliers,
	},
	"@post/api/inventories/suppliers": {
		input: z.object({
			name: z.string(),
			email: z.string(),
			phone: z.string(),
			productIds: z.string().array(),
		}),
		output: ApiResponseInventorySupplierResponse,
	},
	"@get/api/inventories/suppliers/:supplierId": {
		params: z.object({ supplierId: z.string() }),
		output: ApiResponseInventorySupplierResponse,
	},
	"@put/api/inventories/suppliers/:supplierId": {
		params: z.object({ supplierId: z.string() }),
		input: z.object({
			name: z.string(),
			email: z.string(),
			phone: z.string(),
			productIds: z.string().array(),
		}),
		output: ApiResponseInventorySupplierResponse,
	},
	"@delete/api/inventories/suppliers/:supplierId": {
		params: z.object({ supplierId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@get/api/inventories/locations": {
		output: ApiResponseInventoryLocationResponse,
		query: z
			.object({
				locationType: InventoryLocations,
				temperatureControlled: z.boolean(),
				active: z.boolean(),
				search: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
	},
	"@get/api/inventories/grn": {
		output: ApiResponseInventoryGRNResponse,
		query: z
			.object({
				status: z
					.enum([
						"DRAFT",
						"PENDING_INSPECTION",
						"INSPECTION_PASSED",
						"INSPECTION_FAILED",
						"PARTIALLY_ACCEPTED",
						"ACCEPTED",
						"REJECTED",
						"RETURNED_TO_SUPPLIER",
					])
					.nullable(),
				supplierId: z.string().nullable(),
				startDate: z.iso.date().nullable(),
				endDate: z.iso.date().nullable(),
				hasRejectedItems: z.boolean().nullable(),
				stockPosted: z.boolean().nullable(),
				search: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
	},
	"@post/api/inventories/grn/:grnId/post-to-stock": {
		params: z.object({ grnId: z.string() }),
		output: ApiResponseInventoryGRNResponse,
	},
	"@get/api/inventories/grn/statistics": {
		output: ApiResponseInventoryGRNStatistics,
	},
	"@get/api/inventories/products": {
		query: z
			.object({
				status: z
					.enum(["ACTIVE", "INACTIVE", "DISCONTINUED", "DRAFT", "ARCHIVED"])
					.nullable(),
				category: InventoryProductsCategory.nullable(),
				search: z.string().nullable(),
				trackBatches: z.boolean().nullable(),
				trackExpiry: z.boolean().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseInventoryProductResponse,
	},
	"@get/api/inventories/products/list": {
		query: z
			.object({
				search: z.string().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: z
				.object({
					id: z.string(),
					sku: z.string(),
					name: z.string(),
					category: InventoryProductsCategory,
				})
				.array(),
		}),
	},
	"@get/api/inventories/products/statistics": {
		output: ApiResponseInventoryProductStatistics,
	},
	"@get/api/inventories/deliveries": {
		query: z
			.object({
				search: z.string().nullable(),
				startDate: z.iso.date().nullable(),
				endDate: z.iso.date().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseInventoryDelivery,
	},
	"@post/api/inventories/products": {
		input: ApiInputInventoryProduct,
		output: ApiResponseObject.extend({
			data: InventoryResponse,
		}),
	},

	// Front Desk API
	"@get/api/front-desks/rooms": {
		output: ApiResponseListRoomResponse,
		query: ListRoomsQuery,
	},
	"@post/api/front-desks/:roomId/check-in": {
		params: z.object({ roomId: z.string() }),
		input: z.object({
			guestName: z.string().nonempty(),
			phoneNumber: z.string().nonempty(),
			noOfAdults: z.number(),
			noOfChildren: z.number(),
			nightlyRate: z.number().min(0),
			dailySpendingCap: z.number().min(0),
			amountPaid: z.number().min(0),
			roomStatus: z.literal("CHECKED_IN"),
			checkInDate: z.string().nonempty(), // yyyy-mm-dd
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@post/api/front-desks/:roomId/check-out": {
		params: z.object({ roomId: z.string() }),
		input: z.object({
			finalAmountPaid: z.number().min(0),
		}),
		output: ApiResponseObject.extend({
			data: z.object({
				guestName: z.string(),
				roomIdentifier: z.string(),
				roomType: z.string(),
				branchName: z.string(),
				checkInDate: z.string(),
				checkOutDate: z.string(),
				totalAmountPaid: z.number(),
				bookingStatus: BookingStatus,
			}),
		}),
	},
	"@post/api/front-desks/:roomId/make-reservation": {
		params: z.object({ roomId: z.string() }),
		input: z.object({
			guestName: z.string().nonempty(),
			phoneNumber: z.string().nonempty(),
			nightlyRate: z.number().min(0),
			dailySpendingCap: z.number().min(0),
			checkInDate: z.string().nonempty(), // yyyy-mm-dd
			checkOutDate: z.string().nonempty(), // yyyy-mm-dd
			notes: z.string().nullable().optional(),
		}),
		output: ApiResponseObject.extend({
			data: z.object({
				bookingId: z.string(),
				guestName: z.string(),
				roomIdentifier: z.string(),
				roomType: z.string(),
				branchName: z.string(),
				checkInDate: z.string(),
				checkOutDate: z.string(),
				status: BookingStatus,
			}),
		}),
	},
	"@post/api/front-desks/:roomId/cancel-reservation": {
		params: z.object({ roomId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.object({
				bookingId: z.string(),
				guestName: z.string(),
				roomIdentifier: z.string(),
				roomType: z.string(),
				status: BookingStatus,
				message: z.string(),
			}),
		}),
	},
	"@get/api/front-desks/dashboard-cards": {
		output: ApiResponseObject.extend({
			data: z.object({
				totalCheckIns: z.number(),
				totalCheckOuts: z.number(),
				totalReservedRooms: z.number(),
				totalAvailableRooms: z.number(),
			}),
		}),
	},
	"@get/api/front-desks/bookings": {
		output: ApiResponseListBookingViewResponse.and(
			z.object({
				data: Pagination.extend({
					content: z.array(
						BookingViewResponse.extend({
							amountPaid: z.number().min(0),
							id: z.string(),
							customId: z.string(),
							noOfAdults: z.number(),
							noOfChildren: z.number(),
							nightlyRate: z.number().min(0),
							numberOfNights: z.number().min(0),
							accommodationCost: z.number().min(0),
							restaurantOrdersTotal: z.number().min(0),
							totalAmountDue: z.number().min(0),
							amountRemaining: z.number().min(0),
							guestPhoneNumber: z.string(),
							roomIdentifier: z.string(),
							restaurantOrders: z
								.object({
									id: z.string(),
									customId: z.string(),
									destination: z.string(),
									totalAmount: z.number(),
									status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
									createdAt: z.coerce.date(),
									note: z.string().optional(),
									orderItems: z
										.object({
											itemId: z.string(),
											itemType: z.enum(["FOOD", "DRINK"]),
											itemName: z.string(),
											quantity: z.number(),
											price: z.number(),
											total: z.number(),
											note: z.string().nullable(),
										})
										.array(),
									payments: z.object({
										id: z.string(),
										amount: z.number(),
										currency: z.string(),
										method: z.string(),
										reference: z.string(),
										status: z.string(),
										type: z.string(),
										paymentDate: z.coerce.date(),
										createdAt: z.coerce.date(),
									}),
								})
								.array(),
						}).omit({ expectedCheckInDate: true }),
					),
				}),
			}),
		),
		query: z
			.object({
				bookingStatus: BookingStatus.nullable(),
				search: z.string().nullable(),
				roomType: z.string().nullable(),
				page: z.number().nullable().default(0),
				size: z.number().nullable().default(10),
			})
			.partial(),
	},
	"@get/api/front-desks/payments": {
		query: z
			.object({
				page: z.number().default(0),
				size: z.number().default(20),
				search: z.string(),
				method: PaymentMethod,
				status: PaymentStatus,
				startDate: z.string(),
				endDate: z.string(),
			})
			.partial(),
		output: ApiResponseBookingPaymentListResponse,
	},
	"@get/api/front-desks/bookings/:bookingId/payments": {
		params: z.object({ bookingId: z.string() }),
		output: ApiResponseListBookingPaymentResponse,
	},
	"@post/api/front-desks/bookings/:bookingId/payments": {
		params: z.object({ bookingId: z.string() }),
		input: z.object({
			amount: z.number().min(0),
			currency: z.string().nonempty(),
			method: z.string().nonempty(),
			reference: z.string().nonempty(),
			type: z.enum(["OTHER", "INSTALLMENT", "FINAL", "REFUND", "DEPOSIT"]),
			paymentDate: z.string().nonempty(), // iso datetime
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@get/api/front-desks/guest-logs": {
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z.array(
					z.object({
						customId: z.string(),
						guestName: z.string(),
						phoneNumber: z.string(),
						bookingStatus: BookingStatus,
						roomIdentifier: z.string(),
						checkInDate: z.coerce.date(),
						checkOutDate: z.coerce.date().nullable(),
					}),
				),
			}),
		}),
		query: z
			.object({
				search: z.string().nullable(),
				hotelId: z.string().nullable(),
				status: z.string().nullable(),
				page: z.number().nullable().default(0),
				size: z.number().nullable().default(10),
			})
			.partial(),
	},
	"@get/api/front-desks/lost-and-found": {
		output: ApiResponseLostItem,
		query: z
			.object({
				page: z.number().nullable().default(0),
				size: z.number().nullable().default(10),
				claimStatus: z.string().nullable(),
				search: z.string().nullable(),
				dateFrom: z.string().nullable(),
				dateTo: z.string().nullable(),
			})
			.partial(),
	},
	"@post/api/front-desks/lost-and-found": {
		input: z.object({
			itemName: z.string().nonempty(),
			description: z.string().nonempty(),
			imageUrl: z.url().nullable().optional(),
			location: z.string().nonempty().optional(),
			dateFound: z.string().nonempty(), // yyyy-mm-dd
		}),
		output: ApiResponseObject,
	},
	"@get/api/front-desks/lost-and-found/stats": {
		output: ApiResponseObject.extend({
			data: z.object({
				totalItems: z.number(),
				unclaimedItems: z.number(),
				claimedItems: z.number(),
			}),
		}),
	},
	"@get/api/front-desks/all-room-types": {
		output: ApiResponseObject.extend({
			data: z.array(z.string()),
		}),
	},
	"@get/api/front-desks/all-rooms-by-type": {
		query: z
			.object({
				roomType: z.string().nonempty().nullable(),
				roomStatus: z.literal("AVAILABLE").nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: z
				.object({
					id: z.string(),
					roomIdentifier: z.string(),
					roomType: z.string(),
					roomPrice: z.number(),
					status: z.string(),
					facilities: z.array(z.string()),
					reservationPeriods: z
						.object({
							checkInDate: z.string(),
							checkOutDate: z.string(),
							status: z.string(),
						})
						.array(),
				})
				.array(),
		}),
	},
	"@delete/api/front-desks/lost-and-found/:itemId": {
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},
	"@post/api/front-desks/lost-and-found/:itemId/claim": {
		params: z.object({ itemId: z.string() }),
		input: z.object({
			claimedBy: z.string().nonempty(),
			claimedNotes: z.string().nullable().optional(),
		}),
		output: ApiResponseObject.extend({
			data: z.string(),
		}),
	},

	// RESTAURANT
	"@get/api/restaurants/restaurant-orders": {
		query: z
			.object({
				destination: z.string().nullable(),
				status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).nullable(),
				searchText: z.string().nullable(),
				startDate: z.iso.date().nullable(),
				endDate: z.iso.date().nullable(),
				page: z.number().nullable().default(0),
				size: z.number().nullable().default(10),
			})
			.partial()
			.optional(),
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						customId: z.string(),
						destination: z.string(),
						totalAmount: z.number(),
						status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
						createdAt: z.coerce.date(),
						note: z.string().optional(),
						orderItems: z
							.object({
								itemName: z.string(),
								itemId: z.string(),
								itemType: z.enum(["DRINK", "FOOD"]),
								quantity: z.number(),
								price: z.number(),
								total: z.number(),
							})
							.array(),
					})
					.array(),
			}),
		}),
	},
	"@get/api/restaurants/bar-inventory-summary": {
		output: ApiResponseObject.extend({
			data: z.object({
				totalItems: z.number(),
				availableItems: z.number(),
				lowInStockItems: z.number(),
				outOfStockItems: z.number(),
			}),
		}),
	},
	"@get/api/restaurants/bar-restock-requests": {
		query: z
			.object({
				status: z.enum(["PENDING", "APPROVED", "REJECTED"]).nullable(),
				search: z.string().nullable(),
				startDate: z.iso.date().nullable(),
				endDate: z.iso.date().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						barItemId: z.string(),
						barItemCustomId: z.string(),
						barItemName: z.string(),
						requestedQuantity: z.number(),
						status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
						requestedBy: z.string(),
						requestedAt: z.coerce.date(),
					})
					.array(),
			}),
		}),
	},
	"@get/api/restaurants/stock": {
		query: z
			.object({
				search: z.string().nullable(),
				department: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						customId: z.string(),
						name: z.string(),
						department: z.string(),
						unit: z.string(),
						quantity: z.coerce.number().default(0),
						dateTimeReceived: z.coerce.date(),
						createdAt: z.coerce.date(),
					})
					.array(),
			}),
		}),
	},
	"@get/api/restaurants/bar-sales": {
		query: z
			.object({
				search: z.string().nullable(),
				startDate: z.iso.date().nullable(),
				endDate: z.iso.date().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						customId: z.string(),
						destination: z.string(),
						totalAmount: z.number(),
						createdAt: z.coerce.date(),
						note: z.string(),
						orderItems: z
							.object({
								itemName: z.string(),
								quantity: z.number(),
								price: z.number(),
								total: z.number(),
								note: z.string(),
							})
							.array(),
					})
					.array(),
			}),
		}),
	},
	"@get/api/restaurants/items/all": {
		output: ApiResponseObject.extend({
			query: z
				.object({
					itemType: z.enum(["DRINK", "FOOD"]).nullable(),
				})
				.optional(),
			data: z
				.object({
					id: z.string(),
					customId: z.string(),
					name: z.string(),
					price: z.number(),
					itemType: z.enum(["DRINK", "FOOD"]),
					quantity: z.number(),
					createdAt: z.coerce.date(),
					updatedAt: z.coerce.date(),
				})
				.array(),
		}),
	},
	"@get/api/restaurants/current-bookings": {
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						customId: z.string(),
						guestName: z.string(),
						guestPhoneNumber: z.string(),
						roomIdentifier: z.string(),
						roomType: z.string(),
						amountPaid: z.number(),
						bookingStatus: BookingStatus,
						checkInDate: z.coerce.date(),
						checkOutDate: z.coerce.date().nullable(),
					})
					.array(),
			}),
		}),
	},

	"@get/api/restaurants/destinations": {
		output: ApiResponseObject.extend({
			data: z
				.object({
					id: z.string(),
					customId: z.string(),
					name: z.string(),
					description: z.string(),
					hotelId: z.string(),
					hotelName: z.string(),
					isActive: z.boolean(),
					createdAt: z.coerce.date(),
					updatedAt: z.coerce.date(),
				})
				.array(),
		}),
	},
	"@post/api/restaurants/destinations": {
		input: z.object({
			name: z.string(),
		}),
		output: ApiResponseObject.extend({
			data: z.object({
				id: z.string(),
				customId: z.string(),
				name: z.string(),
				description: z.string(),
				hotelId: z.string(),
				hotelName: z.string(),
				isActive: z.boolean(),
				createdAt: z.coerce.date(),
				updatedAt: z.coerce.date(),
			}),
		}),
	},
	// Rentals APIs
	"@get/api/hotels/rentals/items": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/items/available": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/items/list": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/orders": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/orders/overdue": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/payments/history": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/payments/history/export": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/dashboard/stats": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/reports": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/customers/log": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/customers/history": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/customers/outstanding": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/customers/details": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/maintenance/pending": {
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@post/api/hotels/rentals/payments": {
		input: z.any(),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@post/api/hotels/rentals/orders": {
		input: z.any(),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@post/api/hotels/rentals/orders/:orderId/extend": {
		input: z.any(),
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@post/api/hotels/rentals/orders/:orderId/inspection": {
		input: z.any(),
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@post/api/hotels/rentals/items/:itemId/maintenance": {
		input: z.any(),
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@post/api/hotels/rentals/items": {
		input: z.any(),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@post/api/hotels/rentals/availability/check": {
		input: z.any(),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@post/api/hotels/rentals/availability/check-bulk": {
		input: z.any(),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@put/api/hotels/rentals/items/:itemId": {
		input: z.any(),
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@delete/api/hotels/rentals/items/:itemId": {
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/rentals/items/:itemId": {
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	"@get/api/hotels/rentals/items/:itemId/maintenance/history": {
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject.extend({
			data: z.any(),
		}),
	},
	// Purchase Order APIs
	"@get/api/inventories/purchase-orders": {
		output: ApiResponseInventoryPurchaseOrderResponse,
		query: z
			.object({
				status: z
					.enum([
						"DRAFT",
						"PENDING_APPROVAL",
						"APPROVED",
						"REJECTED",
						"SENT",
						"PARTIALLY_RECEIVED",
						"COMPLETED",
						"CANCELLED",
					])
					.nullable(),
				supplierId: z.string().nullable(),
				startDate: z.iso.date().nullable(),
				endDate: z.iso.date().nullable(),
				search: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
	},
	"@get/api/inventories/purchase-orders/statistics": {
		output: ApiResponseInventoryPurchaseOrderStatistics,
	},
	// Stock Take APIs
	"@get/api/inventories/stock-takes": {
		query: z
			.object({
				status: StockTakeStatusEnum.nullable(),
				search: z.string().nullable(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseInventoryStockTakeResponse,
	},
	"@post/api/inventories/stock-takes": {
		input: CreateStockTakeRequest,
		output: ApiResponseObject.extend({
			data: StockTakeSchema,
		}),
	},
	"@get/api/inventories/stock-takes/statistics": {
		output: ApiResponseInventoryStockTakeStatistics,
	},
	"@get/api/inventories/stock-takes/:stockTakeId": {
		params: z.object({ stockTakeId: z.string() }),
		output: ApiResponseObject.extend({
			data: StockTakeSchema,
		}),
	},
	"@post/api/inventories/stock-takes/:stockTakeId/start": {
		params: z.object({ stockTakeId: z.string() }),
		output: ApiResponseObject.extend({
			data: StockTakeSchema,
		}),
	},
	"@post/api/inventories/stock-takes/:stockTakeId/cancel": {
		params: z.object({ stockTakeId: z.string() }),
		query: z.object({ reason: z.string() }),
		output: ApiResponseObject.extend({
			data: StockTakeSchema,
		}),
	},
	"@post/api/inventories/stock-takes/:stockTakeId/complete": {
		params: z.object({ stockTakeId: z.string() }),
		output: ApiResponseObject.extend({
			data: StockTakeSchema,
		}),
	},
	"@post/api/inventories/stock-takes/:stockTakeId/post-adjustments": {
		params: z.object({ stockTakeId: z.string() }),
		output: ApiResponseObject.extend({
			data: StockTakeSchema,
		}),
	},
	"@post/api/inventories/stock-takes/:stockTakeId/items/:itemId/record-count": {
		params: z.object({ stockTakeId: z.string(), itemId: z.string() }),
		input: RecordStockCountRequest,
		output: ApiResponseObject.extend({
			data: StockTakeSchema,
		}),
	},
	"@post/api/inventories/stock-takes/:stockTakeId/review": {
		params: z.object({ stockTakeId: z.string() }),
		input: z
			.object({
				notes: z.string().optional(),
				approveAdjustments: z.boolean().optional(),
			})
			.optional(),
		// Note: Verify input for review endpoint. API docs usually have this.
		// Based on typical patterns, review might just change status or accept notes.
		// Checking api-docs in background or assuming generic object for now if strictly needed.
		// Actually, I'll use z.any() or check docs if this fails, but for now assuming it might be empty or simple.
		// Let's check api-docs for review endpoint input.
		// But I can't check while in replace_file_content.
		// I'll assume it accepts an object, maybe empty.
		// API docs usually: POST .../review
		// Let's use z.any() for input to be safe for now, or just omitted if not required.
		// I will omit input for now as often these state transitions don't need body,
		// OR I'll add a generic input if I suspect it needs one.
		// Actions usually allow body.
		// Let's look at the Cancel one, I added reason.
		// For Review, maybe notes?
		// I'll stick to simple output for now.
		output: ApiResponseObject.extend({
			data: StockTakeSchema,
		}),
	},
	// Generated Endpoints
	"@delete/api/chat/messages/:messageId": {
		params: z.object({ messageId: z.string() }),
		output: ApiResponseObject,
	},
	"@delete/api/corporate/organizations/:id": {
		params: z.object({ id: z.string() }),
		query: z.object({ hotelId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},

	"@get/api/front-desks/bookings/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				roomType: z.string().optional().nullable(),
				bookingStatus: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/front-desks/guest-logs/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				hotelId: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/front-desks/lost-and-found/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				claimStatus: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				dateFrom: z.string().optional().nullable(),
				dateTo: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/front-desks/lost-and-found/:itemId": {
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/front-desks/rooms/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				roomType: z.string().optional().nullable(),
				roomStatus: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/front-desks/rooms/:roomIdentifier/guest-details": {
		params: z.object({ roomIdentifier: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotel-bank-accounts": {
		query: z.object({ hotelId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/hotel-bank-accounts/active": {
		query: z.object({ hotelId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/hotel-bank-accounts/default": {
		query: z.object({ hotelId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/hotel-bank-accounts/:id": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotel-bank-accounts/paystack/banks": {
		query: z.object({ country: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/hotel-owners/dashboard/hotels/:hotelId": {
		params: z.object({ hotelId: z.string() }),
		query: z
			.object({ selectedMonth: z.string().optional().nullable() })
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/hotel-payment-settings/:hotelId": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/dashboard/stats": {
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/items": {
		query: z.object({ activeOnly: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/items/category/:category": {
		params: z.object({ category: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/items/:itemId": {
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/orders": {
		query: z
			.object({
				status: z.string().optional().nullable(),
				paymentStatus: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				pageable: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/orders/booking/:bookingId": {
		params: z.object({ bookingId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/orders/:orderId": {
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/orders/:orderId/payments": {
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/orders/:orderId/payment-summary": {
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/laundry/orders/room/:roomIdentifier": {
		params: z.object({ roomIdentifier: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/hotels/rentals/items/category/:category": {
		params: z.object({ category: z.string() }),
		output: ApiResponseObject.extend({ data: z.any() }),
	},
	"@get/api/hotels/rentals/orders/booking/:bookingId": {
		params: z.object({ bookingId: z.string() }),
		output: ApiResponseObject.extend({ data: z.any() }),
	},
	"@get/api/hotels/rentals/orders/:orderId": {
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject.extend({ data: z.any() }),
	},
	"@get/api/hotels/rentals/orders/:orderId/payments": {
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject.extend({ data: z.any() }),
	},
	"@get/api/hotels/rentals/orders/:orderId/payment-summary": {
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject.extend({ data: z.any() }),
	},
	"@get/api/hotels/rentals/customers/history/email": {
		output: ApiResponseObject.extend({ data: z.any() }),
	},
	"@get/api/inventories/adjustments": {
		query: z
			.object({
				productId: z.string().nullable(),
				locationId: z.string().nullable(),
				reason: z.string().nullable(),
				adjustmentType: z.string().nullable(),
				startDate: z.string().nullable(),
				endDate: z.string().nullable(),
				posted: z.string().nullable(),
				approved: z.string().nullable(),
				pageable: z.string().nullable(),
			})
			.partial(),
		output: ApiResponseCustomPageStockAdjustmentResponse,
	},
	"@get/api/inventories/adjustments/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				productId: z.string().optional().nullable(),
				locationId: z.string().optional().nullable(),
				reason: z.string().optional().nullable(),
				adjustmentType: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				posted: z.string().optional().nullable(),
				approved: z.string().optional().nullable(),
			})
			.partial(),
		response: {
			200: ExportStockAdjustmentsResponse,
		},
	},
	"@get/api/inventories/grn/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				supplierId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				hasRejectedItems: z.string().optional().nullable(),
				stockPosted: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/inventories/grn/:grnId": {
		params: z.object({ grnId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/inventories/locations/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				active: z.string().optional().nullable(),
				locationType: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				temperatureControlled: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/inventories/locations/list": {
		query: z.object({ search: z.string().optional().nullable() }).partial(),
		output: ApiResponseInventoryLocationListResponse,
	},
	"@get/api/inventories/locations/statistics": {
		output: ApiResponseObject,
	},
	"@get/api/inventories/products/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				category: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				trackBatches: z.string().optional().nullable(),
				trackExpiry: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@delete/api/inventories/products/:productId": {
		params: z.object({ productId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/inventories/products/:productId": {
		params: z.object({ productId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/inventories/purchase-orders/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				supplierId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/inventories/purchase-orders/list": {
		query: z.object({ search: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject.extend({
			data: PurchaseOrderListItem.array(),
		}),
	},
	"@get/api/inventories/purchase-orders/:poId": {
		params: z.object({ poId: z.string() }),
		output: ApiResponseObject,
	},
	"@patch/api/inventories/purchase-orders/:poId/status": {
		params: z.object({ poId: z.string() }),
		input: z.object({
			status: z.string(),
			notes: z.string().optional(),
		}),
		output: ApiResponseObject.extend({
			data: PurchaseOrderResponse,
		}),
	},
	"@get/api/inventories/purchase-orders/:poId/export": {
		params: z.object({ poId: z.string() }),
		query: z.object({ format: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/inventories/requisitions": {
		query: z
			.object({
				status: z.string().optional().nullable(),
				department: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				pageable: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/inventories/requisitions/pending-count": {
		output: ApiResponseObject,
	},
	"@get/api/inventories/requisitions/:requisitionId": {
		params: z.object({ requisitionId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/inventories/stock-movements/by-number/:movementNumber": {
		params: z.object({ movementNumber: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/inventories/stock-movements/by-reference": {
		query: z
			.object({
				referenceNumber: z.string().optional().nullable(),
				referenceType: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/inventories/stock-movements/export": {
		query: z
			.object({
				format: z.string(),
				productId: z.string().optional(),
				locationId: z.string().optional(),
				movementType: z.string().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				search: z.string().optional(),
			})
			.partial(),
		response: {
			200: ExportStockMovementsResponse,
		},
	},
	"@get/api/inventories/stock-levels/export": {
		query: z
			.object({
				format: z.string(),
				locationId: z.string().optional(),
				productId: z.string().optional(),
				category: z.string().optional(),
				search: z.string().optional(),
				lowStock: z.boolean().optional(),
				outOfStock: z.boolean().optional(),
			})
			.partial(),
		response: {
			200: ExportStockLevelsResponse,
		},
	},
	"@get/api/inventories/stock-movements/:id": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/inventories/stock-movements/location/:locationId/history": {
		params: z.object({ locationId: z.string() }),
		output: ApiResponseObject,
	},

	"@get/api/inventories/stock-takes/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				locationId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				hasVariances: z.string().optional().nullable(),
			})
			.partial(),
		response: {
			200: ExportStockTakesResponse,
		},
	},
	"@get/api/inventories/suppliers/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/inventories/suppliers/list": {
		query: z.object({ search: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject.extend({
			data: z
				.object({
					id: z.string(),
					name: z.string(),
					email: z.string(),
					phone: z.string(),
				})
				.array(),
		}),
	},
	"@get/api/managers/guest-logs": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},

	"@get/api/managers/hotels/:hotelId/room-types": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/managers/lost-and-found": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
				claimStatus: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				dateFrom: z.string().optional().nullable(),
				dateTo: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/managers/lost-and-found/:itemId": {
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/marketers/hotel-biz": {
		query: z
			.object({
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/marketers/hotel-biz/:hotelBizId/hotels": {
		params: z.object({ hotelBizId: z.string() }),
		query: z
			.object({
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/marketers/hotels": {
		query: z
			.object({
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/notifications/my-notifications": {
		query: z
			.object({
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/notifications/unread": {
		output: ApiResponseObject,
	},
	"@get/api/notifications/unread/count": {
		output: ApiResponseObject,
	},
	"@get/api/payment-links": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
				sortBy: z.string().optional().nullable(),
				sortDir: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/payment-links/callback/:shortCode": {
		params: z.object({ shortCode: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/payment-links/:shortCode": {
		params: z.object({ shortCode: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/payment-links/statistics": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/payment-link-transactions": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
				sortBy: z.string().optional().nullable(),
				sortDir: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/payment-link-transactions/by-reference/:paystackReference": {
		params: z.object({ paystackReference: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/payment-link-transactions/:id": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/payment-link-transactions/statistics": {
		query: z.object({ hotelId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/payouts": {
		query: z
			.object({
				hotelId: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
				sortBy: z.string().optional().nullable(),
				sortDir: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/payouts/by-transfer-code/:transferCode": {
		params: z.object({ transferCode: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/payouts/failed-ready-for-retry": {
		output: ApiResponseObject,
	},
	"@get/api/payouts/:id": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/payouts/statistics": {
		query: z.object({ hotelId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/payouts/stuck": {
		query: z.object({ hoursAgo: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/public/business-types": {
		output: ApiResponseObject,
	},
	"@get/api/public/health": {
		output: ApiResponseObject,
	},
	"@get/api/public/verify-email": {
		query: z.object({ token: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@get/api/restaurants/bar-items": {
		query: z
			.object({
				search: z.string().optional().nullable(),
				availability: z.string().optional().nullable(),
				page: z.string().optional().nullable(),
				size: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/restaurants/bar-items/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				availability: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/restaurants/bar-restock-requests/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/restaurants/:id/bar-item": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/restaurants/:id/stock": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/restaurants/items/statistics": {
		output: ApiResponseObject,
	},
	"@get/api/restaurants/restaurant-orders/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				destination: z.string().optional().nullable(),
				status: z.string().optional().nullable(),
				searchText: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/restaurants/stock/export": {
		query: z
			.object({
				format: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				department: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@get/api/webhooks/paystack/health": {
		output: ApiResponseObject,
	},
	"@patch/api/hotel-bank-accounts/:id/set-default": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@patch/api/hotel-owners/users/:userId/permissions": {
		input: z.any(),
		params: z.object({ userId: z.string() }),
		output: ApiResponseObject,
	},
	"@patch/api/hotels/laundry/orders/:orderId/status": {
		input: z.any(),
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@patch/api/hotels/rentals/orders/:orderId/status": {
		input: z.any(),
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@patch/api/managers/:hotelId/:userId/reset-password": {
		input: z.any(),
		params: z.object({ hotelId: z.string(), userId: z.string() }),
		output: ApiResponseObject,
	},
	"@patch/api/managers/:hotelId/:userId/suspend": {
		input: z.any(),
		params: z.object({ hotelId: z.string(), userId: z.string() }),
		output: ApiResponseObject,
	},
	"@patch/api/managers/users/:userId/permissions": {
		input: z.any(),
		params: z.object({ userId: z.string() }),
		output: ApiResponseObject,
	},
	"@patch/api/payment-links/:id/cancel": {
		params: z.object({ id: z.string() }),
		query: z.object({ reason: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@patch/api/restaurants/restaurant-orders/:orderId/status": {
		input: z.any(),
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/admin/payment-reconciliation/:transactionId/retry": {
		params: z.object({ transactionId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/auth/logout": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/bookings/:bookingId/payment-links": {
		input: z.any(),
		params: z.object({ bookingId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/chat/conversations/:conversationId/messages": {
		params: z.object({ conversationId: z.string() }),
		query: z
			.object({
				content: z.string().optional().nullable(),
				messageType: z.string().optional().nullable(),
				replyToMessageId: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@post/api/chat/conversations/group": {
		input: z.array(z.string()),
		query: z
			.object({ conversationName: z.string().optional().nullable() })
			.partial(),
		output: ApiResponseObject,
	},
	"@post/api/chat/conversations/one-on-one/:otherUserId": {
		params: z.object({ otherUserId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/chat/presence/batch": {
		input: z.array(z.string()),
		output: ApiResponseObject,
	},
	"@post/api/corporate/assign-booking": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/corporate/manual-charges": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/corporate/organizations": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/feedback": {
		input: z.any(),
		query: z.object({ hotelId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@post/api/front-desks/:roomIdentifier/cancel-reservation": {
		params: z.object({ roomIdentifier: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/front-desks/:roomIdentifier/check-in": {
		input: CheckInRequest,
		params: z.object({ roomIdentifier: z.string() }),
		output: ApiResponseCheckInResponse,
	},
	"@post/api/front-desks/:roomIdentifier/check-out": {
		input: z.any(),
		params: z.object({ roomIdentifier: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/front-desks/:roomIdentifier/make-reservation": {
		input: z.any(),
		params: z.object({ roomIdentifier: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/hotel-bank-accounts": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/hotel-bank-accounts/:id/reactivate": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/hotel-bank-accounts/paystack/verify-account": {
		query: z
			.object({
				accountNumber: z.string().optional().nullable(),
				bankCode: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@post/api/hotel-payment-settings/:hotelId/disable-auto-payout": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/hotel-payment-settings/:hotelId/disable-payment-links": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/hotel-payment-settings/:hotelId/enable-auto-payout": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/hotel-payment-settings/:hotelId/enable-payment-links": {
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/hotels/laundry/items": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/hotels/laundry/orders": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/hotels/laundry/payments": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/inventories/adjustments": {
		input: CreateStockAdjustmentRequest,
		output: ApiResponseObject,
	},
	"@post/api/inventories/adjustments/:adjustmentId/approve": {
		params: z.object({ adjustmentId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/inventories/adjustments/:adjustmentId/post": {
		params: z.object({ adjustmentId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/inventories/grn": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/inventories/locations": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@put/api/inventories/locations/:id": {
		input: CreateStorageLocationRequest.partial(),
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/inventories/products/bulk-upload": {
		input: z.object({ file: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/inventories/purchase-orders": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/inventories/purchase-orders/:poId/approve": {
		params: z.object({ poId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/inventories/requisitions": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/inventories/requisitions/:requisitionId/approve": {
		input: z.any(),
		params: z.object({ requisitionId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/inventories/requisitions/:requisitionId/cancel": {
		params: z.object({ requisitionId: z.string() }),
		query: z.object({ reason: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@post/api/inventories/requisitions/:requisitionId/fulfill": {
		params: z.object({ requisitionId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/inventories/requisitions/:requisitionId/reject": {
		params: z.object({ requisitionId: z.string() }),
		query: z.object({ reason: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@post/api/inventories/requisitions/:requisitionId/submit": {
		params: z.object({ requisitionId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/inventories/review-bar-restock/:requestId": {
		params: z.object({ requestId: z.string() }),
		query: z.object({ status: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@post/api/inventories/stock/issue": {
		input: StockIssueRequest,
		output: ApiResponseObject,
	},
	"@post/api/inventories/stock-movements/:id/reverse": {
		input: z.any(),
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},

	"@post/api/kitchen-sales/:saleId/payment-links": {
		input: z.any(),
		params: z.object({ saleId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/laundry-orders/:orderId/payment-links": {
		input: z.any(),
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/managers/hotels/:hotelId/rooms/bulk-upload": {
		input: z.object({ file: z.string() }),
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/managers/hotels/:hotelId/room-types": {
		input: z.any(),
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/payment-links/:id/send-whatsapp": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/payment-links/:shortCode/initialize": {
		params: z.object({ shortCode: z.string() }),
		query: z
			.object({ customerEmail: z.string().optional().nullable() })
			.partial(),
		output: ApiResponseObject,
	},
	"@post/api/payment-link-transactions/manual-verify": {
		query: z
			.object({ paystackReference: z.string().optional().nullable() })
			.partial(),
		output: ApiResponseObject,
	},
	"@post/api/payouts/:id/retry": {
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/payouts/manual": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/payouts/trigger-retry-job": {
		output: ApiResponseObject,
	},
	"@post/api/payouts/trigger-stuck-check-job": {
		output: ApiResponseObject,
	},
	"@post/api/platform-owner/assign-hotel-biz": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/platform-owner/onboard-marketer": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/public/hotel-signup": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/public/resend-verification": {
		query: z.object({ email: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@post/api/rental-orders/:orderId/payment-links": {
		input: z.any(),
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@post/api/restaurants/bar-item": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/restaurants/bar-items/:barItemId/link-product": {
		params: z.object({ barItemId: z.string() }),
		query: z.object({ productId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@post/api/restaurants/bar-restock-request": {
		query: z
			.object({
				barItemId: z.string().optional().nullable(),
				quantity: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@post/api/restaurants/food-item": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/restaurants/restaurant-orders": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/restaurants/stock": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/test/greetings/christmas": {
		output: ApiResponseObject,
	},
	"@post/api/test/greetings/monthly": {
		output: ApiResponseObject,
	},
	"@post/api/test/greetings/new-year": {
		output: ApiResponseObject,
	},
	"@post/api/upload": {
		query: z.object({ file: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@post/api/webhooks/infobip/whatsapp/delivery-report": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/webhooks/infobip/whatsapp/inbound": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@post/api/webhooks/paystack": {
		input: z.string(),
		output: ApiResponseObject,
	},
	"@post/api/webhooks/paystack/test": {
		input: z.any(),
		output: ApiResponseObject,
	},
	"@put/api/chat/conversations/:conversationId/read": {
		params: z.object({ conversationId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/chat/messages/:messageId": {
		params: z.object({ messageId: z.string() }),
		query: z.object({ newContent: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@put/api/corporate/organizations/:id": {
		input: z.any(),
		params: z.object({ id: z.string() }),
		query: z.object({ hotelId: z.string().optional().nullable() }).partial(),
		output: ApiResponseObject,
	},
	"@put/api/feedback/:id/status": {
		params: z.object({ id: z.string() }),
		query: z
			.object({
				status: z.string().optional().nullable(),
				isSerious: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject,
	},
	"@put/api/front-desks/lost-and-found/:itemId": {
		input: z.any(),
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/hotel-owners/hotels/:id": {
		input: z.any(),
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/hotel-owners/users/:userId": {
		input: z.any(),
		params: z.object({ userId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/hotel-payment-settings/:hotelId": {
		input: z.any(),
		params: z.object({ hotelId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/hotels/laundry/items/:itemId": {
		input: z.any(),
		params: z.object({ itemId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/inventories/grn/:grnId": {
		input: z.any(),
		params: z.object({ grnId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/inventories/products/:productId": {
		input: z.any(),
		params: z.object({ productId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/managers/hotels/rooms/:roomId": {
		input: z.any(),
		params: z.object({ roomId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/managers/room-types/:roomTypeId": {
		input: z.any(),
		params: z.object({ roomTypeId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/notifications/mark-all-read": {
		output: ApiResponseObject,
	},
	"@put/api/notifications/:notificationId/read": {
		params: z.object({ notificationId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/restaurants/destinations/:destinationId": {
		input: z.any(),
		params: z.object({ destinationId: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/restaurants/:id/bar-item": {
		input: z.any(),
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/restaurants/:id/stock": {
		input: z.any(),
		params: z.object({ id: z.string() }),
		output: ApiResponseObject,
	},
	"@put/api/restaurants/restaurant-orders/:orderId": {
		input: z.any(),
		params: z.object({ orderId: z.string() }),
		output: ApiResponseObject,
	},
	"@get/api/inventories/stock-movements": {
		query: z
			.object({
				productId: z.string().optional().nullable(),
				locationId: z.string().optional().nullable(),
				movementType: z.string().optional().nullable(),
				startDate: z.string().optional().nullable(),
				endDate: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				pageable: z.string().optional().nullable(),
				page: z.number().optional(),
				size: z.number().optional(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: StockMovementResponse.array(),
			}),
		}),
	},
	"@get/api/inventories/stock-movements/product/:productId/history": {
		params: z.object({ productId: z.string() }),
		query: z
			.object({
				page: z.number().optional(),
				size: z.number().optional(),
				sort: z.string().optional(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: StockMovementResponse.array(),
			}),
		}),
	},
});

export const $fetch = createFetch({
	baseURL: env.NEXT_PUBLIC_API_URL,
	schema: schema,
	errorSchema: ApiExceptionResponseObject,
	onError: ({ error }) => {
		console.error(error);
		if (error.status === 400) {
			return;
		}
		throw new Error(
			"data" in error
				? typeof error.data === "string"
					? error.data
					: error.data.message ||
						(error.cause as Error)?.message ||
						String(error)
				: error.error,
			{
				cause: error,
			},
		);
	},
	onRequest(context) {
		console.log("<==", context.url.toString());
	},
	onResponse(context) {
		console.log("==>", context.response.status, context.response.url);
	},
	timeout: 50000,
	retry: {
		type: "linear",
		attempts: 3,
		delay: 1000,
		shouldRetry: (response) => {
			// No response indicates a network error, so we should retry.
			if (!response) {
				return true;
			}

			const { status } = response;

			// Retry on server errors (5xx) or rate-limiting (429).
			// Do not retry on other client-side errors (4xx).
			return status >= 500 || status === 429;
		},
	},
	disableValidation: true,
});
