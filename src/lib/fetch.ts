import { createSchema, createFetch } from "@better-fetch/fetch";
import { z } from "zod";

const Role = z.enum([
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
    hotelName: z.string(),
    hotelAddress: z.string(),
    managerCustomId: z.string(),
});

const GetHotelResponse = z.object({
    customId: z.string(),
    name: z.string(),
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
    customId: z.string(),
    fullName: z.string(),
    email: z.string(),
    phoneNumber: z.string(),
});

export type HotelManager = z.infer<typeof HotelManager>;

const OnboardHotelResponse = z.object({
    hotelName: z.string(),
    hotelAddress: z.string(),
    manager: HotelManager,
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
    userStatus: z.string().nullable(),
    role: Role,
    customId: z.string(),
    parentUserCustomId: z.string().nullable(),
    verified: z.boolean(),
    hotelCustomId: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
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
    data: z.array(RoomResponse),
});

const ApiResponseListHotelManager = z.object({
    requestTime: z.coerce.date(),
    requestType: z.string(),
    referenceId: z.string(),
    status: z.boolean(),
    message: z.string(),
    data: z.array(HotelManager),
});

const ApiResponseListGetHotelResponse = z.object({
    requestTime: z.coerce.date(),
    requestType: z.string(),
    referenceId: z.string(),
    status: z.boolean(),
    message: z.string(),
    data: z.array(GetHotelResponse),
});

const BookingViewResponse = z.object({
    bookingId: z.string(),
    guestName: z.string(),
    roomNo: z.string(),
    branchName: z.string(),
    roomType: z.string(),
    bookingStatus: z.string(),
    expectedCheckInDate: z.string().date(),
    checkInDate: z.string().date(),
    checkOutDate: z.string().date(),
});

const ApiResponseListBookingViewResponse = z.object({
    requestTime: z.coerce.date(),
    requestType: z.string(),
    referenceId: z.string(),
    status: z.boolean(),
    message: z.string(),
    data: z.array(BookingViewResponse),
});


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
            status: z.enum(["CHECKED_IN", "CHECKED_OUT", "RESERVED", "CANCELLED"]),
            checkInDate: z.string().date(),
            search: z.string(),
        }),
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

// --- Example Fetch Instance ---

export const $fetch = createFetch({
    baseURL: "https://hotel-internal-system-be.onrender.com",
    schema: schema,
	errorSchema: AppExceptionResponseObject
});
