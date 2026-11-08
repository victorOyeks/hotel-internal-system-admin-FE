import type { HotelRole } from "./roles";

export interface AppLayoutProps {
	params: Promise<Record<string, string>>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
	children: React.ReactNode;
}

export interface PageProps extends AppLayoutProps {}

/** Claims in the access token the backend issues (see identity-service's TokenIssuer). */
export type SessionClaims = {
	sub: string;
	email: string;
	name: string;
	bid?: string;
	hotels: string[];
	/** "ROLE:LEVEL", e.g. "FRONT_OFFICE:EDIT" */
	roles: string[];
	scope: "hotel" | "business" | "platform";
	iat: number;
	exp: number;
};

export type Session = SessionClaims & {
	token: string;
	roleSet: HotelRole[];
	levels: Partial<Record<HotelRole, "FULL" | "EDIT" | "VIEW">>;
};
