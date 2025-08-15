"use server";

import { $fetch, type OnboardHotelRequest } from "./fetch";
import type { ApiResponse } from "./types";
import { getToken, getUser, tokenKey } from "./server-fns";
import { cookies } from "next/headers";

export async function login(payload: { email: string; password: string }) {
  const user = await getUser();
  if (user) {
    return {
      message: "User already logged in",
      ...user.data,
    };
  }

  const { data, error } = await $fetch<
    ApiResponse<{
      token: string;
      role: string;
    }>
  >("@post/api/auth/sign-in", {
    body: payload,
  });

  if (error) {
    throw error;
  }

  const cookieStore = await cookies();
  const { token, role } = data.data;
  const { message, referenceId } = data;

  cookieStore.set(tokenKey, token, {
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
  const token = await getToken();

  if (!token) {
    throw new Error("Unauthorized")
  }

  const response = await $fetch("@post/api/hotel-owners/hotels", {
    body: payload,
    throw: true
  });


  return response.data;
}

export async function deleteHotelBranch(id: string) {
  const token = await getToken();
  if (!token) {
    throw new Error("Unauthorized");
  }

  const response = await $fetch("@delete/api/hotel-owners/hotels/:hotelCustomId", {
    params: { hotelCustomId: id },
    auth: { type: "Bearer", token },
    throw: true,
  })

  return response.data;
}