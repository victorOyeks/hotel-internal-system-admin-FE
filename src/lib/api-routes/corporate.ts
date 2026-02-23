import { z } from "zod";

const ApiResponseObject = z.object({
	requestTime: z.coerce.date(),
	requestType: z.string(),
	referenceId: z.string(),
	status: z.boolean(),
	message: z.string(),
	data: z.object({}),
});

// --- Schemas ---

export const OrganizationResponse = z.object({
	id: z.string(),
	customId: z.string(),
	name: z.string(),
	email: z.string(),
	phoneNumber: z.string(),
	address: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type OrganizationResponse = z.infer<typeof OrganizationResponse>;

export const PaginatedOrganizationResponse = z.object({
	content: z.array(OrganizationResponse),
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
});

export const BookingAssignmentResponse = z.object({
	bookingId: z.string(),
	guestName: z.string(),
	roomIdentifier: z.string(),
	roomType: z.string(),
	checkInDate: z.string(),
	checkOutDate: z.string(),
	amountPaid: z.number(),
	dailySpendingCap: z.number(),
	organizationId: z.string().nullable(),
	organizationName: z.string().nullable(),
	assignedAt: z.string(),
});

export type BookingAssignmentResponse = z.infer<
	typeof BookingAssignmentResponse
>;

export const StaffBreakdown = z.object({
	staffName: z.string(),
	bookingCustomId: z.string(),
	roomCharges: z.number(),
	restaurantCharges: z.number(),
	barCharges: z.number(),
	laundryCharges: z.number(),
	rentalCharges: z.number(),
	manualCharges: z.number(),
	total: z.number(),
});

export type StaffBreakdown = z.infer<typeof StaffBreakdown>;

export const CorporateReportResponse = z.object({
	organizationId: z.string(),
	organizationName: z.string(),
	startDate: z.string().nullable(),
	endDate: z.string().nullable(),
	totalRoomCharges: z.number(),
	totalRestaurantCharges: z.number(),
	totalBarCharges: z.number(),
	totalLaundryCharges: z.number(),
	totalRentalCharges: z.number(),
	totalManualCharges: z.number(),
	grandTotal: z.number(),
	staffBreakdowns: z.array(StaffBreakdown),
});

export type CorporateReportResponse = z.infer<typeof CorporateReportResponse>;

export const OrgTransactionListItem = z.object({
	bookingCustomId: z.string().nullable(),
	staffName: z.string(),
	type: z.enum(["ROOM", "RESTAURANT", "BAR", "LAUNDRY", "RENTAL", "MANUAL"]),
	reference: z.string(),
	description: z.string(),
	amount: z.number(),
	dateTime: z.string(),
});

export type OrgTransactionListItem = z.infer<typeof OrgTransactionListItem>;

export const OrgTransactionListResponse = z.object({
	totalElements: z.number(),
	totalPages: z.number(),
	page: z.number(),
	size: z.number(),
	items: z.array(OrgTransactionListItem),
});

export type OrgTransactionListResponse = z.infer<
	typeof OrgTransactionListResponse
>;

export const GuestSpendingDetails = z.object({
	bookingId: z.string(),
	bookingCustomId: z.string(),
	guestName: z.string(),
	roomIdentifier: z.string(),
	roomType: z.string(),
	bookingStatus: z.string(),
	checkInDate: z.string(),
	dailySpendingCap: z.number().nullable(),
	amountSpentToday: z.number(),
	amountLeftToday: z.number(),
	totalAmountSpent: z.number(),
	capExceeded: z.boolean(),
});

export type GuestSpendingDetails = z.infer<typeof GuestSpendingDetails>;

export const PaginatedGuestSpendingResponse = z.object({
	content: z.array(GuestSpendingDetails),
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
});

// --- Routes ---

export const corporateRoutes = {
	"@get/api/corporate/organizations": {
		query: z
			.object({
				hotelId: z.string(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
				sortBy: z.string().optional().nullable(),
				sortDir: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: PaginatedOrganizationResponse,
		}),
	},
	"@get/api/corporate/organizations/:id": {
		params: z.object({ id: z.string() }),
		query: z
			.object({
				hotelId: z.string(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: OrganizationResponse,
		}),
	},
	"@post/api/corporate/organizations": {
		input: z.object({
			hotelId: z.string(),
			name: z.string(),
			email: z.string(),
			phoneNumber: z.string(),
			address: z.string(),
		}),
		output: ApiResponseObject.extend({
			data: OrganizationResponse,
		}),
	},
	"@put/api/corporate/organizations/:id": {
		input: z.object({
			hotelId: z.string(),
			name: z.string(),
			email: z.string(),
			phoneNumber: z.string(),
			address: z.string(),
		}),
		params: z.object({ id: z.string() }),
		query: z
			.object({ hotelId: z.string().optional().nullable() })
			.partial(),
		output: ApiResponseObject.extend({
			data: OrganizationResponse,
		}),
	},
	"@delete/api/corporate/organizations/:id": {
		params: z.object({ id: z.string() }),
		query: z
			.object({ hotelId: z.string().optional().nullable() })
			.partial(),
		output: ApiResponseObject,
	},
	"@post/api/corporate/assign-booking": {
		input: z.object({
			hotelId: z.string(),
			bookingId: z.string(),
			organizationId: z.string(),
			dailySpendingCap: z.number(),
		}),
		output: ApiResponseObject.extend({
			data: BookingAssignmentResponse,
		}),
	},
	"@post/api/corporate/manual-charges": {
		input: z.object({
			bookingId: z.string(),
			description: z.string(),
			amount: z.number(),
		}),
		output: ApiResponseObject,
	},
	"@get/api/corporate/reports/:organizationId": {
		params: z.object({ organizationId: z.string() }),
		query: z
			.object({
				hotelId: z.string(),
				start: z.string().optional().nullable(),
				end: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: CorporateReportResponse,
		}),
	},
	"@get/api/corporate/reports/:organizationId/export": {
		params: z.object({ organizationId: z.string() }),
		query: z
			.object({
				hotelId: z.string(),
				start: z.string().optional().nullable(),
				end: z.string().optional().nullable(),
				includeTransactions: z
					.union([z.boolean(), z.string()])
					.optional()
					.nullable(),
			})
			.partial(),
		output: z.any(),
	},
	"@get/api/corporate/transactions/:organizationId": {
		params: z.object({ organizationId: z.string() }),
		query: z
			.object({
				hotelId: z.string(),
				staffName: z.string().optional().nullable(),
				type: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				start: z.string().optional().nullable(),
				end: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: OrgTransactionListResponse,
		}),
	},
	"@get/api/corporate/guests/:organizationId": {
		params: z.object({ organizationId: z.string() }),
		query: z
			.object({
				hotelId: z.string(),
				staffName: z.string().optional().nullable(),
				search: z.string().optional().nullable(),
				page: z.union([z.string(), z.number()]).optional().nullable(),
				size: z.union([z.string(), z.number()]).optional().nullable(),
				sortBy: z.string().optional().nullable(),
				sortDir: z.string().optional().nullable(),
			})
			.partial(),
		output: ApiResponseObject.extend({
			data: PaginatedGuestSpendingResponse,
		}),
	},
};
