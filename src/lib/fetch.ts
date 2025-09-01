import { env } from "@/env";
import { createFetch, createSchema } from "@better-fetch/fetch";
import { z } from "zod";

export const Role = z.enum([
  "HOTEL_OWNER",
  "MANAGER",
  "FRONT_DESK",
  "MAINTENANCE",
  "INVENTORY",
  "BAR",
  "KITCHEN",
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
  hotelId: z.string(),
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
  hotelId: z.string().nullable().or(z.undefined()),
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
  data: Pagination.extend({
    content: z.array(RoomResponse),
  }),
});

const ListRoomsQuery = z
  .object({
    roomType: z.string(),
    search: z.string(),
    status: z.enum([
      "CHECKED_IN",
      "CHECKED_OUT",
      "RESERVED",
      "CANCELLED",
      "AVAILABLE",
    ]),
    page: z.coerce.number().default(0),
    size: z.coerce.number().default(10),
  })
  .partial();

export type ListRoomsQuery = z.infer<typeof ListRoomsQuery>;

const CustomPageStaffResponse = Pagination.extend({
  content: z.array(
    z.object({
      id: z.string(),
      customId: z.string(),
      fullName: z.string(),
      email: z.string(),
      phoneNumber: z.string(),
      role: Role,
    })
  ),
});

const CustomPageStaffResponseQuery = z
  .object({
    search: z.string(),
    status: z.string(),
    role: Role,
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

const BookingStatus = z.enum([
  "CHECKED_IN",
  "CHECKED_OUT",
  "RESERVED",
  "CANCELLED",
  "AVAILABLE",
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
  data: z.object({
    content: z.array(BookingViewResponse),
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

const ApiResponseListInventoryResponse = z.object({
  requestTime: z.coerce.date(),
  requestType: z.string(),
  referenceId: z.string(),
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    content: z.array(InventoryResponse),
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
        searchName: z.string(),
        customId: z.string(),
        category: z.string(),
        unit: z.string(),
        availability: z.string(),
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
  "@get/api/hotel-owners/owner": {},

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
});

export const $fetch = createFetch({
  baseURL: env.NEXT_PUBLIC_API_URL,
  schema: schema,
  errorSchema: ApiExceptionResponseObject,
  onError: ({ error }) => {
    console.error("API Error:", error);
    throw new Error(
      "data" in error
        ? typeof error.data === "string"
          ? error.data
          : error.data.message ||
            (error.cause as Error)?.message ||
            String(error)
        : error.error
    );
  },
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
