import { createSchema, createFetch } from "@better-fetch/fetch";
import { z } from "zod";

export const Role = z.enum([
	"HOTEL_OWNER",
	"MANAGER",
	"FRONT_DESK",
	"MAINTENANCE",
	"INVENTORY",
	"BAR",
	"KITCHEN",
]);

const AppExceptionResponseObject = z.object({
    requestTime: z.coerce.date(),
    requestType: z.string(),
    referenceId: z.string(),
    status: z.boolean(),
    message: z.string(),
    data: z.object({}), // Generic object
});

const UpdateRoomRequest = z.object({
    roomNo: z.string(),
    roomType: z.string(),
    roomName: z.string(),
    roomPrice: z.number(),
    roomStatus: z.string(),
    roomFacility: z.array(z.string()),
});

const RoomResponse = z.object({
    customId: z.string(),
    hotelName: z.string(),
    roomNo: z.string(),
    roomType: z.string(),
    roomName: z.string(),
    roomPrice: z.number(),
    roomStatus: z.string(),
    roomFacility: z.array(z.string()),
});

export type RoomDetails = z.infer<typeof RoomResponse>;

const ApiResponseRoomResponse = z.object({
    requestTime: z.coerce.date(),
    requestType: z.string(),
    referenceId: z.string(),
    status: z.boolean(),
    message: z.string(),
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

const GetHotelResponse = z.object({
    customId: z.string().nullable(),
    name: z.string().nullable(),
    address: z.string(),
    totalRoom: z.string(),
    occupancyRate: z.string(),
    grossRevenue: z.string(),
    expenses: z.string(),
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
    hotelCustomId: z.string(),
    roomNo: z.string(),
    roomType: z.string(),
    roomName: z.string(),
    roomPrice: z.number(),
    roomStatus: z.string(),
    roomFacility: z.array(z.string()),
});

const CreateHotelManagerRequest = z.object({
    fullName: z.string(),
    email: z.string(),
    phoneNumber: z.string(),
    staffId: z.string(),
});

const HotelManager = z.object({
    id: z.string(),
    customId: z.string().nullable(),
    fullName: z.string(),
    email: z.string(),
    phoneNumber: z.string(),
});

export type HotelManager = z.infer<typeof HotelManager>;

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
    hotelCustomId: z.string().nullable().or(z.undefined()),
    // createdAt: z.coerce.date(),
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
    data: z.object({
        content: z.array(RoomResponse)
    }),
});

const ApiResponseListHotelManager = z.object({
    requestTime: z.coerce.date(),
    requestType: z.string(),
    referenceId: z.string(),
    status: z.boolean(),
    message: z.string(),
    data: z.object({
        content: z.array(HotelManager)
    }),
});

const ApiResponseListGetHotelResponse = z.object({
    requestTime: z.coerce.date(),
    requestType: z.string(),
    referenceId: z.string(),
    status: z.boolean(),
    message: z.string(),
    data: z.object({
        content: z.array(GetHotelResponse),
    }),
});

const BookingStatus = z.enum(["CHECKED_IN", "CHECKED_OUT", "RESERVED", "CANCELLED"]);

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
    data: z.object({
        content: z.array(BookingViewResponse)
    }),
});



export type BookingStatus = z.infer<typeof BookingStatus>; 
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
    },
    "@post/api/hotel-owners/hotels": {
        input: OnboardHotelRequest,
        output: ApiResponseOnboardHotelResponse,
    },
    "@put/api/hotel-owners/hotels/:hotelCustomId": {
        params: z.object({ hotelCustomId: z.string() }),
        input: OnboardHotelRequest,
        output: ApiResponseGetHotelResponse,
    },
    "@delete/api/hotel-owners/hotels/:hotelCustomId": {
        params: z.object({ hotelCustomId: z.string() }),
        output: ApiResponseDeleteHotelResponse,
    },
    "@get/api/hotel-owners/managers": {
        output: ApiResponseListHotelManager,
    },
    "@post/api/hotel-owners/managers": {
        input: CreateHotelManagerRequest,
        output: ApiResponseUserModelResponse,
    },
    "@get/api/hotel-owners/hotels/:hotelCustomId/rooms": {
        params: z.object({ hotelCustomId: z.string() }),
        output: ApiResponseListRoomResponse,
    },
    "@get/api/hotel-owners/hotels/bookings": {
        query: z.object({
            status: BookingStatus,
            checkInDate: z.string(), // yyyy-mm-dd format
            page: z.coerce.number().default(1),
            size: z.coerce.number().default(100),
            search: z.string(),
        }).partial(),
        output: ApiResponseListBookingViewResponse,
    },

    // Manager APIs
    "@get/api/managers/hotels/:hotelCustomId/rooms": {
        params: z.object({ hotelCustomId: z.string() }),
        output: ApiResponseListRoomResponse,
    },
    "@post/api/managers/hotels/:hotelCustomId/rooms": {
        params: z.object({ hotelCustomId: z.string() }),
        input: CreateRoomRequest,
        output: ApiResponseRoomResponse,
    },
    "@put/api/managers/hotels/rooms/:roomCustomId": {
        params: z.object({ roomCustomId: z.string() }),
        input: UpdateRoomRequest,
        output: ApiResponseRoomResponse,
    },
});

export const $fetch = createFetch({
    baseURL: "https://hotel-internal-system-be.onrender.com",
    schema: schema,
	errorSchema: AppExceptionResponseObject,
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
        }
    },
    onRequest({ url, query }) {
        console.log({
            url: url.toString(),
            query: query,
        })
    },
});
