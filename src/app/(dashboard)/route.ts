import { verifySession } from "@/lib/dal";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await verifySession();
  console.log("Session verified in /dashboard route", request.nextUrl.toString());
  return Response.redirect(new URL("/dashboard", request.nextUrl));
}
