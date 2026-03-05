import type z from "zod";
import type { schema } from "./fetch";

export type Prettify<T> = {
	[key in keyof T]: T[key];
} & {};

// A helper type for our consistent server action responses
export type ServerActionResponse<T> = Promise<
	{ success: true; data: T } | { success: false; error: string }
>;

export type ServerActionResponseFromEndpoint<T extends keyof Schema> =
	ServerActionResponse<APIOutput<T>> extends Promise<infer R>
		? Promise<Prettify<R>>
		: ServerActionResponse<APIOutput<T>>;

/**
 * Parses an unknown error into a standardized string message.
 * This helps handle errors from $fetch, database calls, or other exceptions.
 * @param error - The error caught in a catch block.
 * @returns A user-friendly error message.
 */
export function parseError(error: unknown): string {
	// Rethrow redirect errors so Next.js can handle them
	if (
		error &&
		typeof error === "object" &&
		"digest" in error &&
		typeof (error as { digest: unknown }).digest === "string" &&
		(error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
	) {
		throw error;
	}

	// BetterFetchError (thrown when $fetch uses throw: true):
	// Shape: Error { message: "Bad Request", status: 400, error: { message: "...", data: { message: "..." } } }
	// The backend message is in error.error.message; fallback: error.error.data.message
	if (error && typeof error === "object" && "error" in error) {
		const bfe = error as { error?: { message?: string; data?: { message?: string } } };
		if (typeof bfe.error?.data?.message === "string") {
			return bfe.error.data.message;
		}
		if (typeof bfe.error?.message === "string") {
			return bfe.error.message;
		}
	}
	// $fetch non-throw error objects (returned, not thrown):
	// Shape: { ...parsedBody, status: 400, statusText: "Bad Request" }
	// The backend message is spread at the top level as error.message
	if (error && typeof error === "object" && "data" in error) {
		const fetchError = error as { data?: { message?: string } };
		if (typeof fetchError.data?.message === "string") {
			return fetchError.data.message;
		}
	}
	if (error instanceof Error) {
		return error.message;
	}
	// Handle plain objects with a message field
	if (error && typeof error === "object" && "message" in error) {
		const msg = (error as { message: unknown }).message;
		if (typeof msg === "string") {
			return msg;
		}
	}
	if (typeof error === "string") {
		return error;
	}
	return "An unexpected error occurred. Please try again.";
}

type Schema = (typeof schema)["schema"];

type ExtractAPIOutput<
	Endpoint extends keyof Schema,
	SchemaDef extends Schema[Endpoint] = Schema[Endpoint],
> = SchemaDef;

export type APIInput<T extends keyof Schema> = ExtractAPIOutput<T> extends {
	input: infer I;
}
	? I extends z.ZodTypeAny
		? z.infer<I>
		: I
	: never;

export type APIOutput<T extends keyof Schema> = ExtractAPIOutput<T> extends {
	output: infer O;
}
	? O extends z.ZodTypeAny
		? z.infer<O>
		: O
	: unknown;
