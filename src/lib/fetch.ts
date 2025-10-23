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
      })
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

export type BookingStatus = z.infer<typeof BookingStatus>;

const ApiResponseInventoryItemResponse =
  ApiResponseListInventoryResponse.extend({
    data: Pagination.extend({
      content: z.array(
        InventoryResponse.extend({
          restockReason: z.string().nullable().optional(),
          restockDate: z.coerce.date().nullable().optional(),
          department: z.string(),
        })
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
          })
        ),
      })
    ),
  }),
});

export type InventorySuppliers = z.infer<
  typeof ApiResponseInventorySuppliers
>["data"]["content"][number];
export type InventorySupplierItem = InventorySuppliers["items"][number];

const ApiResponseLostItem = ApiResponseObject.extend({
  data: Pagination.extend({
    content: z.array(
      z.object({
        id: z.string(),
        customId: z.string(),
        itemName: z.string(),
        description: z.string(),
        imageUrl: z.string().nullable(),
        roomIdentifier: z.string(),
        dateFound: z.coerce.date(),
        claimStatus: z.enum(["UNCLAIMED", "CLAIMED", "DISPOSED"]),
        claimedBy: z.string().nullable(),
        claimedDate: z.coerce.date().nullable(),
        claimNotes: z.string().nullable(),
        hotelName: z.string(),
        loggedBy: z.string(),
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date(),
      })
    ),
  }),
});

export type LostItem = z.infer<typeof ApiResponseLostItem>["data"]["content"][number];

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
        search: z.enum(["CHECKED_IN", "CHECKED_OUT", "RESERVED", "AVAILABLE"]),
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

  // Inventory Officer APIs
  "@get/api/inventories/items": {
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
    output: ApiResponseInventoryItemResponse,
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
      })
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
    output: ApiResponseListBookingViewResponse.and(z.object({
      data: Pagination.extend({
        content: z.array(BookingViewResponse.extend({
          amountPaid: z.number().min(0),
          id: z.string(),
          customId: z.string(),
          guestPhoneNumber: z.string(),
          roomIdentifier: z.string(),
        })),
      }),
    })),
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
          })
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
  "@get/api/front-desks/lost-and-found/stats": {
    output: ApiResponseObject.extend({
      data: z.object({
        totalItems: z.number(),
        unclaimedItems: z.number(),
        claimedItems: z.number(),
      }),
    }),
  }
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
        : error.error,
      {
        cause: error,
      }
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
