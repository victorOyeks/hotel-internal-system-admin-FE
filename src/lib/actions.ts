"use server";

import { $fetch, type OnboardHotelRequest } from "./fetch";
import { getCookieData, getUser, tokenKey } from "./server-fns";
import { cookies } from "next/headers";

export async function login(payload: { email: string; password: string }) {
  const user = await getUser();
  if (user) {
    return {
      message: "User already logged in",
      ...user.data,
    };
  }

  const { data, message, referenceId } = await $fetch("@post/api/auth/sign-in", {
    body: payload,
    throw: true
  });

  const cookieStore = await cookies();
  const { token, role } = data;

  const { data: userData } = await $fetch("@get/api/users/me", {
    auth: { type: "Bearer", token },
    throw: true,
  });

  const cookieData = JSON.stringify({
    user: userData,
    token,
  });

  cookieStore.set(tokenKey, cookieData, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain:
      process.env.NODE_ENV === "production"
        ? "apex-hms.netlify.app"
        : undefined,
    maxAge: 60 * 60 * 24 * 7,
  });

  return {
    message,
    referenceId,
    role,
  };
}


export async function createHotelBranch(payload: OnboardHotelRequest) {
  const cookieData = await getCookieData();

  if (!cookieData) {
    throw new Error("Unauthorized")
  }

  const response = await $fetch("@post/api/hotel-owners/hotels", {
    body: payload,
    auth: { type: "Bearer", token: cookieData.token },
    throw: true
  });


  return response.data;
}

export async function deleteHotelBranch(id: string) {
  const cookieData = await getCookieData();
  if (!cookieData) {
    throw new Error("Unauthorized");
  }

  const response = await $fetch("@delete/api/hotel-owners/hotels/:hotelId", {
    params: { hotelId: id },
    auth: { type: "Bearer", token: cookieData.token },
    throw: true,
  })

  return response.data;
}