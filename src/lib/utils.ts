import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
	return Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
	}).format(value);
}
/**
 * @fileoverview A simple utility to match a pathname against a list of paths.
 * It finds the best match by prioritizing specificity (longer paths and exact matches).
 */

/**
 * Configuration for a single path within the matcher.
 */
export interface PathConfig {
  /** The path pattern to match against (e.g., '/dashboard'). */
  path: string;
  /**
   * If true, the pathname must match the path exactly.
   * If false (default), the pathname only needs to start with the path.
   * @default false
   */
  exact?: boolean;
}

/**
 * The result of a successful match operation.
 */
export interface MatcherResult {
  /** The path from the original list that was matched. */
  path: string;
  /** The pathname that was tested. */
  pathname: string;
}

/**
 * An internal helper function to check if a single path matches a pathname.
 * @param pathname The URL pathname to test.
 * @param path The path to match against.
 * @param exact Whether to perform an exact match.
 * @returns True if it's a match, otherwise false.
 * @internal
 */
function isPathMatch(pathname: string, path: string, exact: boolean): boolean {
  // Sanitize paths by removing any trailing slashes for consistent matching.
  const sanitizedPathname = pathname.endsWith('/') && pathname.length > 1 
    ? pathname.slice(0, -1) 
    : pathname;
  const sanitizedPath = path.endsWith('/') && path.length > 1 
    ? path.slice(0, -1) 
    : path;

  if (exact) {
    return sanitizedPathname === sanitizedPath;
  }

  // For non-exact, it must be an identical match or a prefix match.
  // This prevents '/users-other' from matching '/users'.
  return (
    sanitizedPathname === sanitizedPath ||
    sanitizedPathname.startsWith(`${sanitizedPath}/`)
  );
}

/**
 * Creates a matcher function from a list of paths.
 *
 * @param paths - An array of path strings or PathConfig objects.
 * @returns An object with a `match` method.
 *
 * @example
 * const matcher = createPathMatcher(['/users', { path: '/users/123', exact: true }]);
 * const result = matcher.match('/users/456');
 * // result: { path: '/users', pathname: '/users/456' }
 */
export function createPathMatcher(paths: Array<string | PathConfig>) {
  // "Precompile" by normalizing all path inputs into a consistent object structure.
  const compiledPaths: Required<PathConfig>[] = paths.map(p => {
    if (typeof p === 'string') {
      return { path: p, exact: false };
    }
    return { path: p.path, exact: p.exact ?? false };
  });

  return {
    /**
     * Finds the best match for a given pathname from the preconfigured list of paths.
     * @param pathname - The URL pathname to test (e.g., '/dashboard/settings').
     * @returns A `MatcherResult` object for the best match, or `null` if no match is found.
     */
    match: (pathname: string): MatcherResult | null => {
      let bestMatch: { path: string; score: number } | null = null;

      for (const route of compiledPaths) {
        if (isPathMatch(pathname, route.path, route.exact)) {
          // Score is based on path length, with a small bonus for exact matches
          // to ensure they are preferred over non-exact matches of the same length.
          const score = route.path.length + (route.exact ? 0.5 : 0);

          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { path: route.path, score: score };
          }
        }
      }

      if (bestMatch) {
        return {
          path: bestMatch.path,
          pathname: pathname,
        };
      }

      return null;
    },
  };
}