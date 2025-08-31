import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { decrypt } from "./session";

export const tokenKey = "hms.jwt.session_token";

export const getCookieData = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenKey)?.value;

  if (!token) {
    return null;
  }

  const cookieData = decrypt(token);

  return cookieData
    ? {
        ...cookieData,
        token,
      }
    : null;
});
