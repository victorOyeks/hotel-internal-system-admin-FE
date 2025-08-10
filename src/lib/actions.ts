"use server";

import { cookies } from "next/headers";
import { $fetch } from "./fetch";
import type { ApiResponse } from "./types";

const tokenKey = "hms.jwt.session_token";

export async function login(payload: {
  email: string;
  password: string;
}) {
  const cookieStore = await cookies();

  // check if user is already logged in
  const existingToken = cookieStore.get(tokenKey)?.value;
  if (existingToken) {
    const [role] = existingToken.split("::");
    return {
      message: "User already logged in",
      role,
    };
  }

 const response = await $fetch<ApiResponse<{
   token: string;
   role: string;
}>>("/auth/sign-in", {
   body: payload
 })
  const token = response.data.token;
  const role = response.data.role;

  cookieStore.set(tokenKey, `${role}::${token}`, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    domain: process.env.NODE_ENV === "production" ? "netlify.app" : undefined,
    maxAge: 60 * 60 * 24 * 7,
  });

  return {
    message: response.message,
    referenceId: response.referenceId,
    role: response.data.role,
  };
}
