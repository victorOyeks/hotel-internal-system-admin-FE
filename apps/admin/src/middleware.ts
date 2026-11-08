export { appMiddleware as middleware } from "@hospio/api/middleware";

// Next reads this literal at build time; it cannot be re-exported from the package.
export const config = {
	matcher: ["/((?!api|_next/static|_next/image|icon|.*\\.(?:png|svg|ico|jpg|webp)$).*)"],
};
