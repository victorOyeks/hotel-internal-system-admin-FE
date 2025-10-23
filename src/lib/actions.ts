"use server";

import { redirect } from "next/navigation";
import {
  $fetch,
  type OnboardStaffRequest,
  type OnboardHotelRequest,
} from "./fetch";
import { createSession, deleteSession } from "./session";
import { getUser, verifySession } from "./dal";
import { revalidatePath } from "next/cache";
import {
  type ServerActionResponse,
  type ServerActionResponseFromEndpoint,
  parseError,
} from "./action-utils";

export async function revalidateRoute(path: string) {
  revalidatePath(path);
}

// --- Authentication Actions ---

export async function login(payload: {
  email: string;
  password: string;
}): ServerActionResponse<{
  message: string;
  role: string;
  referenceId?: string;
}> {
  try {
    const existingUser = await getUser();
    if (existingUser) {
      return {
        success: true,
        data: { message: "User already logged in", ...existingUser },
      };
    }

    const { data, message, referenceId } = await $fetch(
      "@post/api/auth/sign-in",
      {
        body: payload,
        throw: true,
      }
    );

    await createSession(data.token);

    return { success: true, data: { message, referenceId, role: data.role } };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function logout(): Promise<void> {
  await deleteSession();
  // Note: redirect() throws a NEXT_REDIRECT error, which Next.js handles.
  // We don't wrap this in try/catch as we want that behavior.
  redirect("/auth");
}

export async function forgotPassword(payload: {
  email: string;
}): ServerActionResponse<{ message: string; data: string }> {
  try {
    const response = await $fetch("@post/api/auth/reset-password", {
      body: payload,
      throw: true,
    });
    return {
      success: true,
      data: response as { message: string; data: string },
    };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

// --- Hotel Branch Actions ---

export async function createHotelBranch(payload: OnboardHotelRequest) {
  try {
    const sessionData = await verifySession();
    const response = await $fetch("@post/api/hotel-owners/hotels", {
      body: payload,
      auth: { type: "Bearer", token: sessionData.token },
      throw: true,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function deleteHotelBranch(
  id: string
): ServerActionResponseFromEndpoint<"@delete/api/hotel-owners/hotels/:hotelId"> {
  try {
    const sessionData = await verifySession();
    const response = await $fetch("@delete/api/hotel-owners/hotels/:hotelId", {
      params: { hotelId: id },
      auth: { type: "Bearer", token: sessionData.token },
      throw: true, // Let's assume you want to throw here for consistency
    });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function editHotelBranch(
  id: string,
  payload: Omit<OnboardHotelRequest, "managerId">
): ServerActionResponseFromEndpoint<"@put/api/hotel-owners/hotels/:hotelId"> {
  try {
    const sessionData = await verifySession();
    const response = await $fetch("@put/api/hotel-owners/hotels/:hotelId", {
      params: { hotelId: id },
      body: payload,
      auth: { type: "Bearer", token: sessionData.token },
      throw: true,
    });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

// --- Staff & Manager Actions ---

export async function deleteStaffMember(
  id: string
): ServerActionResponse<unknown> {
  try {
    const sessionData = await verifySession();
    const response = await $fetch("@delete/api/hotel-owners/staff/:staffId", {
      params: { staffId: id },
      auth: { type: "Bearer", token: sessionData.token },
      throw: true,
    });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function assignManagerToHotelBranch(
  payload: { hotelId: string; managerId: string },
  action: "ASSIGN" | "UNASSIGN"
): ServerActionResponseFromEndpoint<"@post/api/hotel-owners/:hotelId/manager/:managerId"> {
  try {
    const sessionData = await verifySession();
    const response = await $fetch(
      "@post/api/hotel-owners/:hotelId/manager/:managerId",
      {
        params: payload,
        query: { action },
        auth: { type: "Bearer", token: sessionData.token },
        throw: true,
      }
    );
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function onboardManagerToHotel(
  payload: Omit<OnboardStaffRequest, "role" | "staffId">
): ServerActionResponseFromEndpoint<"@post/api/hotel-owners/managers"> {
  try {
    const sessionData = await verifySession();
    if (sessionData.role !== "HOTEL_OWNER") {
      // Handle authorization as a returned error, not a thrown one
      return {
        success: false,
        error:
          "Unauthorized: You do not have permission to perform this action.",
      };
    }

    const response = await $fetch("@post/api/hotel-owners/managers", {
      auth: { type: "Bearer", token: sessionData.token },
      body: { ...payload, role: "MANAGER" },
      throw: true,
    });

    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function updateStaffDetailsByOwner({
  staffId,
  ...payload
}: Omit<OnboardStaffRequest, "password">): ServerActionResponse<string> {
  try {
    const sessionData = await verifySession();
    if (sessionData.role !== "HOTEL_OWNER") {
      return {
        success: false,
        error:
          "Unauthorized: You do not have permission to perform this action.",
      };
    }

    await $fetch("@put/api/hotel-owners/users/:staffId", {
      params: { staffId },
      auth: { type: "Bearer", token: sessionData.token },
      body: payload,
      throw: true,
    });
    // Successful update with no data to return
    return { success: true, data: "Staff details updated successfully" };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function uploadImage(payload: { file: File }) {
  const { token } = await verifySession();

  const formData = new FormData();
  formData.append("file", payload.file);

  const response = await $fetch("@post/api/upload", {
    body: formData,
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (response.error) {
    return {
      success: false,
      error: response.error.message || "An error occurred during file upload.",
    };
  }

  return {
    success: true,
    data: (response.data as { data: { url: string } }).data,
  };
}
