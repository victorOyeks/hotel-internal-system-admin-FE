import type z from "zod";
import type { schema } from "./fetch";

export type Prettify<T> = {
    [key in keyof T]: T[key];
} & {};


// A helper type for our consistent server action responses
export type ServerActionResponse<T> = Promise<
  { success: true; data: T } | { success: false; error: string }
>;

export type ServerActionResponseFromEndpoint<
  T extends keyof Schema
> = ServerActionResponse<APIOutput<T>> extends Promise<infer R>
    ? Promise<Prettify<R>>
    : ServerActionResponse<APIOutput<T>>;

/**
 * Parses an unknown error into a standardized string message.
 * This helps handle errors from $fetch, database calls, or other exceptions.
 * @param error - The error caught in a catch block.
 * @returns A user-friendly error message.
 */
export function parseError(error: unknown): string {
  if (error instanceof Error) {
    // Check for fetch error structure which often has error.data.message
    if (typeof error === "object" && error !== null && "data" in error) {
      const fetchError = error as { data?: { message?: string } };
      if (typeof fetchError.data?.message === "string") {
        return fetchError.data.message;
      }
    }
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred. Please try again.";
}

type Schema = (typeof schema)["schema"];

type ExtractAPIOutput<
  Endpoint extends keyof Schema,
  SchemaDef extends Schema[Endpoint] = Schema[Endpoint]
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