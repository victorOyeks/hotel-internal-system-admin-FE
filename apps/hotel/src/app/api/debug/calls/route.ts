import { debugCallsDELETE, debugCallsGET } from "@hospio/api/api/debug-log";

export const dynamic = "force-dynamic";

/** Staging API log: this session's backend calls (404 unless NEXT_PUBLIC_API_LOG=true). */
export const GET = debugCallsGET;
export const DELETE = debugCallsDELETE;
