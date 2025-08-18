import "server-only";

import { cookies } from "next/headers";
import { $fetch, type UserInfoResponse } from "./fetch";

export const tokenKey = "hms.jwt.session_token";

export async function getCookieData() {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenKey)?.value;

  if (!token) {
    return null;
  }

  const cookieData = JSON.parse(token) as {
    token: string;
    user: UserInfoResponse
  }
  return cookieData;
}

export async function getUser() {
  const cookieData = await getCookieData();

  if (!cookieData) {
    return null;
  }

  const { data, error } = await $fetch("@get/api/users/me", {
    auth: {
      type: "Bearer",
      token: cookieData.token,
    },
  });

  if (error) {
    return null;
  }

  return data;
}
