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
	scope: "hotel" | "business" | "platform" | "marketer";
	iat: number;
	exp: number;
};

export type Session = SessionClaims & {
	token: string;
	roleSet: HotelRole[];
	levels: Partial<Record<HotelRole, "FULL" | "EDIT" | "VIEW">>;
};

// ---- onboarding wizards ----------------------------------------------------------------------------
// The saved form data per step, kept in the business's onboarding draft (`data[stepKey]`) so the owner
// or admin can leave and come back. Both apps' wizards read and write these shapes.

/** Self-serve wizard (apps/hotel `/onboarding`): four steps. */
export const OWNER_ONBOARDING_STEPS = [
	"business",
	"hotel",
	"rooms",
	"manager",
] as const;
export type OwnerOnboardingStep = (typeof OWNER_ONBOARDING_STEPS)[number];

export type OwnerOnboardingData = {
	business?: {
		name: string;
		legalName?: string;
		registrationNumber?: string;
		businessType?: string;
		email?: string;
		phone?: string;
		address?: string;
		city?: string;
		timezone?: string;
	};
	hotel?: { hotelId: string; name: string; city: string };
	rooms?: {
		roomTypes: {
			roomTypeId: string;
			name: string;
			price: number;
			count: number;
		}[];
		created: number;
	};
	manager?: {
		userId: string;
		fullName: string;
		email: string;
		temporaryPassword?: string;
		inviteToken?: string;
	};
};

/** Back-office wizard (apps/admin `/dashboard/onboarding/[businessId]`): ten steps, J2–J14. */
export const ADMIN_ONBOARDING_STEPS = [
	"business",
	"owner",
	"fee",
	"hotels",
	"rooms",
	"template",
	"people",
	"connections",
	"golive",
	"handover",
] as const;
export type AdminOnboardingStep = (typeof ADMIN_ONBOARDING_STEPS)[number];

export type OnboardingLogin = {
	userId: string;
	fullName: string;
	email: string;
	role: string;
	hotelId?: string;
	hotelName?: string;
	temporaryPassword?: string;
	temporaryPasswordExpiresAt?: string;
	inviteToken?: string;
	inviteExpiresAt?: string;
};

export type AdminOnboardingData = {
	business?: {
		name: string;
		legalName?: string;
		registrationNumber?: string;
		businessType?: string;
		address?: string;
		city?: string;
		country?: string;
		timezone?: string;
	};
	owner?: {
		ownerName: string;
		ownerEmail: string;
		ownerPhone?: string;
		email?: string;
		phone?: string;
	};
	fee?: {
		feeModel: string;
		feeValue: number;
		currency?: string;
		contractStartsOn?: string;
		contractNotes?: string;
		marketerId?: string;
	};
	hotels?: { hotelIds: string[] };
	rooms?: {
		byHotel: Record<
			string,
			{
				roomTypes: {
					roomTypeId: string;
					name: string;
					price: number;
					count: number;
				}[];
				created: number;
			}
		>;
	};
	template?: { templateId?: string; appliedTo: string[] };
	people?: { logins: OnboardingLogin[] };
	connections?: {
		terminals: {
			hotelId: string;
			terminalId: string;
			name: string;
			provider: string;
			terminalRef: string;
		}[];
		whatsappNumber?: string;
	};
	golive?: {
		checks: { key: string; label: string; done: boolean; detail?: string }[];
		notes?: string;
	};
	handover?: {
		sentAt?: string;
		ownerUserId?: string;
		ownerEmail?: string;
		inviteToken?: string;
		temporaryPassword?: string;
	};
};

export type OnboardingStepData = OwnerOnboardingData | AdminOnboardingData;

/** Step number ↔ step key, for `PUT /onboarding/.../step` which takes the number. */
export const ownerStepNumber = (step: OwnerOnboardingStep) =>
	OWNER_ONBOARDING_STEPS.indexOf(step) + 1;
export const adminStepNumber = (step: AdminOnboardingStep) =>
	ADMIN_ONBOARDING_STEPS.indexOf(step) + 1;
