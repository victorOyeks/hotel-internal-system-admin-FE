import z from "zod";
import { Role } from "./fetch";

export interface PageProps extends AppLayoutProps {}

export interface AppLayoutProps {
	params: Promise<Record<string, string>>;
	searchParams: Promise<Record<string, string>>;
	children: React.ReactNode;
}

export interface ApiResponse<Data> {
	requestTime: string;
	requestType: string;
	referenceId: string;
	status: boolean;
	message: string;
	data: Data;
}

export type HotelRole = z.infer<typeof Role>;

export type UserPayload = {
  userId: string;
  userCustomId: string;
  email: string;
  fullName: string;
  phone: string;
  staffId: string;
  status: "ACTIVE" | "INACTIVE" | string & {};
  role: HotelRole;
  sub: string;
  iat: number;
  exp: number;
};
