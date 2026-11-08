/**
 * Demo mode: the whole UI runs on sample data, sign-in accepts any email and password, and every
 * role is available to walk through. Set NEXT_PUBLIC_DEMO_MODE=false once the backend is wired in.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

/** A short pause so lists and saves feel real in demo mode. */
export const demoDelay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));
