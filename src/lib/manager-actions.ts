"use server";
import { cookies } from "next/headers";
import { getManagerCurrentHotel, verifySession } from "./dal";
import { $fetch, type OnboardStaffRequest, type CreateRoomRequest } from "./fetch";


export async function switchManagerCurrentHotel(hotelId: string) {
  const sessionData = await verifySession();

  if (sessionData.role !== "MANAGER") {
    throw new Error("Unauthorized");
  }

  const jar = await cookies();

  jar.set(`${sessionData.userId}:currentHotel`, hotelId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  return { message: "Switched current hotel" };
}

export async function addNewRoomToHotel(payload: Omit<CreateRoomRequest, "hotelId">) {
    const sessionData = await verifySession();
    if (sessionData.role !== "MANAGER") {
        throw new Error("Unauthorized");
    }
    const currentHotel = await getManagerCurrentHotel();

    if (!currentHotel) {
        throw new Error("No hotel found for the manager");
    }

    const { data, error } = await $fetch("@post/api/managers/hotels/:hotelId/rooms", {
        params: { hotelId: currentHotel.id },
        auth: { type: "Bearer", token: sessionData.token },
        body: {
            ...payload,
            hotelId: currentHotel.id,
        }
    })

    if (error) {
        throw new Error(error.message || "Failed to add room");
    }

    return data;    
}

export async function onboardStaffToHotel(payload: OnboardStaffRequest) {
    const sessionData = await verifySession();
    if (sessionData.role !== "MANAGER") {
        throw new Error("Unauthorized");
    }
    const currentHotel = await getManagerCurrentHotel();

    if (!currentHotel) {
        throw new Error("No hotel found for the manager");
    }

    const { data } = await $fetch("@post/api/managers/hotels/:hotelId/onboard-staff", {
        params: { hotelId: currentHotel.id },
        auth: { type: "Bearer", token: sessionData.token },
        body: payload,
        throw: true
    })

    return data;     
}

export async function editStaffDetails(staffId: string, payload: Partial<Omit<OnboardStaffRequest, "role">>) {
    const sessionData = await verifySession();
    if (sessionData.role !== "MANAGER") {
        throw new Error("Unauthorized");
    }
    const currentHotel = await getManagerCurrentHotel();

    if (!currentHotel) {
        throw new Error("No hotel found for the manager");
    }

    const { data } = await $fetch("@put/api/managers/:hotelId/:staffId", {
        params: { hotelId: currentHotel.id, staffId },
        auth: { type: "Bearer", token: sessionData.token },
        body: payload,
        throw: true
    })

    return data;
}