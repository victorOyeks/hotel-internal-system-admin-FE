/**
 * Two switches, so the backend can be wired in one domain at a time:
 *
 * - DEMO_AUTH: sign-in accepts any email and password and the session carries every role. Set
 *   NEXT_PUBLIC_DEMO_AUTH=false to sign in against identity-service with real (seeded) accounts.
 * - DEMO (data): screens read sample data through src/lib/data. Each data function switches to the
 *   API as its service is wired; NEXT_PUBLIC_DEMO_MODE=false turns the remaining fixtures off.
 *
 * Both default to on. DEMO_AUTH follows NEXT_PUBLIC_DEMO_MODE unless set on its own.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
export const DEMO_AUTH = (process.env.NEXT_PUBLIC_DEMO_AUTH ?? process.env.NEXT_PUBLIC_DEMO_MODE) !== "false";

/** A short pause so lists and saves feel real in demo mode. */
export const demoDelay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));
