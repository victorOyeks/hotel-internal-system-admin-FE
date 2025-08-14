import { cookies } from "next/headers";
import { isServer } from "@tanstack/react-query";
import { $fetch } from "./fetch";

export const tokenKey = "hms.jwt.session_token";

if (!isServer) {
  throw new Error("This function can only be used on the server side.");
}

export async function getToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenKey)?.value;

  if (!token) {
    return null;
  }

  return token;
}

export async function getUser() {
  const token = await getToken();

  if (!token) {
    return null;
  }

  const { data, error } = await $fetch("@get/api/users/me", {
    auth: {
      type: "Bearer",
      token,
    },
  });

  if (error) {
    return null;
  }

  return data;
}
