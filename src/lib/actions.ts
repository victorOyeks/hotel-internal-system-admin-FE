"use server";

import { redirect } from "next/navigation";
import { $fetch, type OnboardHotelRequest } from "./fetch";
import { createSession, deleteSession } from "./session";
import { getUser, verifySession } from "./dal";

export async function login(payload: { email: string; password: string }) {
  const user = await getUser();
  if (user) {
    return {
      message: "User already logged in",
      ...user,
    };
  }

  const { data, message, referenceId } = await $fetch("@post/api/auth/sign-in", {
    body: payload,
    throw: true
  });

  const { token, role } = data;

  await createSession(token)

  return {
    message,
    referenceId,
    role,
  };
}
export async function logout() {
  await deleteSession()
  redirect('/auth')
}


export async function createHotelBranch(payload: OnboardHotelRequest) {
  const sessionData = await verifySession();

  const response = await $fetch("@post/api/hotel-owners/hotels", {
    body: payload,
    auth: { type: "Bearer", token: sessionData.token },
    throw: true
  });

  return response.data;
}

export async function deleteHotelBranch(id: string) {
  const sessionData = await verifySession();

  const response = await $fetch("@delete/api/hotel-owners/hotels/:hotelId", {
    params: { hotelId: id },
    auth: { type: "Bearer", token: sessionData.token },
    throw: true,
  })

  return response.data;
}

export async function editHotelBranch(id: string, payload: Omit<OnboardHotelRequest, "managerId">) {
  const sessionData = await verifySession();

  const response = await $fetch("@put/api/hotel-owners/hotels/:hotelId", {
    params: { hotelId: id },
    body: payload,
    auth: { type: "Bearer", token: sessionData.token },
    throw: true
  });

  return response.data;
}


export async function assignManagerToHotelBranch(payload: { hotelId: string; managerId: string }, action: "ASSIGN" | "UNASSIGN") {
  const sessionData = await verifySession();

  const response = await $fetch("@post/api/hotel-owners/:hotelId/manager/:managerId", {
    params: payload,
    query: { action },
    auth: { type: "Bearer", token: sessionData.token },
    throw: true
  });

  return response.data;
}

