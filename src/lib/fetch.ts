import { env } from "@/env";
import { createFetch, createSchema } from "@better-fetch/fetch";
import { z } from "zod";

export const Role = z.enum([
	"HOTEL_OWNER",
	"MANAGER",
	"FRONT_DESK",
	"MAINTENANCE",
	"INVENTORY",
	"RESTAURANT",
	"RENTALS",
	"SUPER_ADMIN",
]);

const ApiExceptionResponseObject = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: z.object({}), // Generic object
});

const ApiResponseObject = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: z.object({}), // Generic object
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
	token: z.string(),
	role: z.string(),
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
	role: Role,
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

const ApiResponseInventorySuppliers = ApiResponseObject.extend({
	data: Pagination.extend({
		content: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				email: z.email().nullable(),
				phone: z.string().nullable(),
				items: z.array(
					z.object({
						id: z.string(),
						customId: z.string(),
						name: z.string(),
					}),
				),
			}),
		),
	}),
});

export type InventorySuppliers = z.infer<
	typeof ApiResponseInventorySuppliers
>["data"]["content"][number];
export type InventorySupplierItem = InventorySuppliers["items"][number];

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

const InventorySupplier = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	phone: z.string(),
	hotelId: z.string(),
	productIds: z.string().array(),
	products: z.object({
		id: z.string(),
		sku: z.string(),
		name: z.string(),
		category: InventoryProductsCategory
	}).array()

})

const ApiResponseInventorySupplierResponse = ApiResponseObject.extend({
	data: InventorySupplier
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

const InventoryLocations = z.enum([
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
})

const ApiResponseInventoryProductStatistics = ApiResponseObject.extend({
	data: InventoryProductsStatistics
})

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
	imageUrl: z.string().url().optional().or(z.literal("")),
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
})

export type RecentActivity = z.infer<typeof recentActivitySchema>

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

// --- Main Fetch Schema ---
export const schema = createSchema({
	// Auth APIs
	"@post/api/auth/sign-in": {
		input: LoginRequest,
		output: ApiResponseLoginResponse,
	},

	// User APIs
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
	"@get/api/inventories/grn/statistics": {
		output: ApiResponseInventoryGRNStatistics,
	},
	"@get/api/inventories/products": {
		query: z
			.object({
				status: z.enum([
					"ACTIVE",
					"INACTIVE",
					"DISCONTINUED",
					"DRAFT",
					"ARCHIVED",
				]),
				category: InventoryProductsCategory,
				search: z.string(),
				trackBatches: z.boolean(),
				trackExpiry: z.boolean(),
				page: z.coerce.number().default(0),
				size: z.coerce.number().default(10),
			})
			.partial(),
		output: ApiResponseInventoryProductResponse,
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
	"@get/api/front-desks/bookings/:bookingId/payments": {
		output: ApiResponseObject.extend({
			data: z.array(
				z.object({
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
			),
		}),
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
			imageUrl: z.string().url().nullable().optional(),
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
		query: z.object({
			roomType: z.string().nonempty(),
			roomStatus: z.literal("AVAILABLE"),
		}),
		output: ApiResponseObject.extend({
			data: z.array(z.string()),
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
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						name: z.string(),
						category: z.string(),
						dailyRate: z.number(),
						depositAmount: z.number(),
						totalQuantity: z.number(),
						availableQuantity: z.number(),
						active: z.boolean(),
					})
					.array(),
			}),
		}),
	},
	"@get/api/hotels/rentals/items/available": {
		output: ApiResponseObject.extend({
			data: z
				.object({
					id: z.string(),
					name: z.string(),
					category: z.string(),
					dailyRate: z.number(),
					hourlyRate: z.number().optional(),
					weeklyRate: z.number().optional(),
					monthlyRate: z.number().optional(),
					depositAmount: z.number(),
					availableQuantity: z.number(),
					description: z.string().optional(),
				})
				.array(),
		}),
	},
	"@get/api/hotels/rentals/orders": {
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						orderNumber: z.string(),
						customerName: z.string(),
						customerPhone: z.string(),
						status: z.string(),
						paymentStatus: z.string(),
						totalAmount: z.number(),
						rentalStartDate: z.string(),
						rentalEndDate: z.string(),
					})
					.array(),
			}),
		}),
	},
	"@get/api/hotels/rentals/orders/overdue": {
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						orderNumber: z.string(),
						customerName: z.string(),
						customerPhone: z.string(),
						daysOverdue: z.number(),
						lateFees: z.number(),
						totalAmount: z.number(),
						rentalEndDate: z.string(),
					})
					.array(),
			}),
		}),
	},
	"@get/api/hotels/rentals/payments": {
		output: ApiResponseObject.extend({
			data: Pagination.extend({
				content: z
					.object({
						id: z.string(),
						orderNumber: z.string(),
						amount: z.number(),
						paymentType: z.string(),
						paymentMethod: z.string(),
						paymentDate: z.string(),
						customerName: z.string(),
					})
					.array(),
			}),
		}),
	},
	"@get/api/hotels/rentals/dashboard/stats": {
		output: ApiResponseObject.extend({
			data: z.object({
				totalActiveItems: z.number(),
				totalQuantity: z.number(),
				currentlyRented: z.number(),
				availableItems: z.number(),
				totalOrders: z.number(),
				activeRentals: z.number(),
				overdueRentals: z.number(),
				completedRentals: z.number(),
				ordersToday: z.number(),
				completedToday: z.number(),
				totalRevenue: z.number(),
				outstandingAmount: z.number(),
				revenueToday: z.number(),
				depositsHeld: z.number(),
				pendingRefunds: z.number(),
			}),
		}),
	},
	"@post/api/hotels/rentals/payments": {
		output: ApiResponseObject.extend({
			data: z.object({
				id: z.string(),
				receiptNumber: z.string(),
				orderNumber: z.string(),
				amount: z.number(),
				paymentType: z.string(),
				paymentMethod: z.string(),
				paymentDate: z.string(),
			}),
		}),
	},
	"@post/api/hotels/rentals/orders": {
		output: ApiResponseObject.extend({
			data: z.object({
				id: z.string(),
				orderNumber: z.string(),
				customerName: z.string(),
				customerPhone: z.string(),
				totalAmount: z.number(),
				depositAmount: z.number(),
				rentalStartDate: z.string(),
				rentalEndDate: z.string(),
				status: z.string(),
			}),
		}),
	},
	"@post/api/hotels/rentals/orders/:orderId/extend": {
		output: ApiResponseObject.extend({
			data: z.object({
				id: z.string(),
				orderNumber: z.string(),
				newReturnDate: z.string(),
				extensionFee: z.number(),
			}),
		}),
	},
	"@post/api/hotels/rentals/orders/:orderId/return": {
		output: ApiResponseObject.extend({
			data: z.object({
				id: z.string(),
				orderNumber: z.string(),
				returnDate: z.string(),
				refundAmount: z.number(),
				damageFee: z.number(),
			}),
		}),
	},
	"@post/api/hotels/rentals/items": {
		output: ApiResponseObject.extend({
			data: z.object({
				id: z.string(),
				name: z.string(),
				category: z.string(),
				dailyRate: z.number(),
				depositAmount: z.number(),
				totalQuantity: z.number(),
				availableQuantity: z.number(),
				active: z.boolean(),
			}),
		}),
	},
	"@put/api/hotels/rentals/items/:itemId": {
		output: ApiResponseObject.extend({
			data: z.object({
				id: z.string(),
				name: z.string(),
				category: z.string(),
				dailyRate: z.number(),
				depositAmount: z.number(),
				totalQuantity: z.number(),
				availableQuantity: z.number(),
				active: z.boolean(),
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
		type: "exponential",
		attempts: 3,
		baseDelay: 1000, // 1 second
		maxDelay: 5000, // 5 seconds
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
