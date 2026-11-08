import type { Hotel, Me } from "@hospio/api/api/schema";
import type { HotelSummary, LeaveRow, RoomRow, RoomState, RoomTypeRow, ShiftRequestRow, ShiftRow, StaffRow } from "@hospio/api/data/types";
import { addDays, formatISO } from "date-fns";

export const BUSINESS_ID = "b0000000-0000-4000-8000-000000000001";
export const BUSINESS_NAME = "Royal Suites Ltd";
export const HOTEL_ID = "a0000000-0000-4000-8000-000000000001";

export const today = () => formatISO(new Date(), { representation: "date" });
export const day = (offset: number) => formatISO(addDays(new Date(), offset), { representation: "date" });
export const at = (offsetDays: number, hh: number, mm = 0) => {
	const d = addDays(new Date(), offsetDays);
	d.setHours(hh, mm, 0, 0);
	return d.toISOString();
};

export const demoHotels: Hotel[] = [
	{ id: HOTEL_ID, businessId: BUSINESS_ID, name: "Simpas Ikeja", city: "Lagos", address: "12 Allen Avenue, Ikeja GRA", phone: "+234 801 000 0001", email: "ikeja@simpashotels.com", timezone: "Africa/Lagos", status: "ACTIVE", roomCount: 120 },
	{ id: "a0000000-0000-4000-8000-000000000002", businessId: BUSINESS_ID, name: "Simpas Lekki", city: "Lagos", address: "4 Admiralty Way, Lekki Phase 1", phone: "+234 801 000 0002", email: "lekki@simpashotels.com", timezone: "Africa/Lagos", status: "ACTIVE", roomCount: 86 },
	{ id: "a0000000-0000-4000-8000-000000000003", businessId: BUSINESS_ID, name: "Simpas Abuja", city: "Abuja", address: "Plot 9, Ademola Adetokunbo Cres, Wuse 2", phone: "+234 801 000 0003", email: "abuja@simpashotels.com", timezone: "Africa/Lagos", status: "ACTIVE", roomCount: 64 },
	{ id: "a0000000-0000-4000-8000-000000000004", businessId: BUSINESS_ID, name: "Simpas Port Harcourt", city: "Port Harcourt", address: "22 Aba Road, GRA Phase 2", phone: "+234 801 000 0004", email: "ph@simpashotels.com", timezone: "Africa/Lagos", status: "ACTIVE", roomCount: 48 },
];

export const demoHotelSummaries: HotelSummary[] = [
	{ id: demoHotels[0].id, name: "Simpas Ikeja", city: "Lagos", address: demoHotels[0].address ?? "", rooms: 120, timezone: "Africa/Lagos", occupancy: 84, manager: "Tunde Bakare" },
	{ id: demoHotels[1].id, name: "Simpas Lekki", city: "Lagos", address: demoHotels[1].address ?? "", rooms: 86, timezone: "Africa/Lagos", occupancy: 71, manager: "Amaka Eze" },
	{ id: demoHotels[2].id, name: "Simpas Abuja", city: "Abuja", address: demoHotels[2].address ?? "", rooms: 64, timezone: "Africa/Lagos", occupancy: 62, manager: "Ibrahim Musa" },
	{ id: demoHotels[3].id, name: "Simpas Port Harcourt", city: "Port Harcourt", address: demoHotels[3].address ?? "", rooms: 48, timezone: "Africa/Lagos", occupancy: 55, manager: "Blessing Okoro" },
];

export function demoMe(email: string, name: string, roles: string[]): Me {
	return {
		id: "demo-user",
		fullName: name,
		email,
		phoneNumber: "+234 801 000 0002",
		businessId: BUSINESS_ID,
		userStatus: "ACTIVE",
		roles,
		roleLevels: roles.map((r) => ({ role: r, level: "FULL", hotelId: HOTEL_ID })),
		verified: true,
		changedPassword: true,
		twoStepEnabled: false,
		hotelIds: demoHotels.map((h) => h.id),
		createdAt: "2025-01-15T09:00:00Z",
	};
}

export const demoRoomTypes: RoomTypeRow[] = [
	{ id: "rt-regular", name: "Regular", basePrice: 35000, capacityAdults: 2, capacityChildren: 1, rooms: 48, facilities: ["AC", "TV", "Wi-Fi", "Hot water"], specialPrices: [] },
	{ id: "rt-deluxe", name: "Deluxe", basePrice: 45000, capacityAdults: 2, capacityChildren: 2, rooms: 40, facilities: ["AC", "TV", "Wi-Fi", "Hot water", "Minibar", "Work desk"], specialPrices: [{ id: "sp-1", name: "Weekend rate", price: 52000, fromDate: day(3), toDate: day(5) }] },
	{ id: "rt-executive", name: "Executive", basePrice: 65000, capacityAdults: 2, capacityChildren: 2, rooms: 24, facilities: ["AC", "TV", "Wi-Fi", "Hot water", "Minibar", "Work desk", "Bathtub", "Lounge access"], specialPrices: [] },
	{ id: "rt-suite", name: "Suite", basePrice: 120000, capacityAdults: 3, capacityChildren: 2, rooms: 8, facilities: ["AC", "TV", "Wi-Fi", "Hot water", "Minibar", "Living room", "Bathtub", "Lounge access", "Butler"], specialPrices: [{ id: "sp-2", name: "Detty December", price: 150000, fromDate: "2026-12-15", toDate: "2026-12-31" }] },
];

const guestsForRooms = ["Ngozi Okonkwo", "Chidinma Obi", "Musa Ibrahim", "Kelechi Uba", "Funke Adeyemi", "Emeka Nwosu", "Aisha Bello", "Tobi Lawal", "Yemi Alade", "Ifeoma Nwachukwu", "Bola Tinubu-Smith", "Uche Nnaji", "Halima Abubakar", "Seun Kuti", "Nneka Egbuna", "Dayo Amusa", "Zainab Yusuf", "Gbenga Ojo", "Amara Chukwu", "Femi Otedola"];

/** 120 rooms over 4 floors: A1xx–A3xx, B1xx; states spread like the dashboard mock (101 occupied). */
export const demoRooms: RoomRow[] = (() => {
	const rooms: RoomRow[] = [];
	const plan: [string, string, RoomTypeRow][] = [
		["A", "1", demoRoomTypes[0]],
		["A", "2", demoRoomTypes[1]],
		["A", "3", demoRoomTypes[2]],
		["B", "1", demoRoomTypes[0]],
	];
	let n = 0;
	for (const [block, floor, type] of plan) {
		for (let i = 1; i <= 30; i++) {
			n++;
			const number = `${block}${floor}${String(i).padStart(2, "0")}`;
			const isSuite = block === "A" && floor === "3" && i > 22;
			const t = isSuite ? demoRoomTypes[3] : type;
			let state: RoomState = "occupied";
			if ([4, 10, 17, 25].includes(n)) state = "dirty";
			else if ([7, 33, 48, 61, 72, 88, 95, 104, 118].includes(n)) state = "ready";
			else if ([12, 57].includes(n)) state = "held";
			else if ([41, 99].includes(n)) state = "out_of_order";
			else if ([30, 66].includes(n)) state = "inspecting";
			rooms.push({
				id: `room-${number}`,
				number,
				floor: `${block} · floor ${floor}`,
				typeId: t.id,
				typeName: t.name,
				price: t.basePrice,
				state,
				guestName: state === "occupied" ? guestsForRooms[n % guestsForRooms.length] : undefined,
				checkOut: state === "occupied" ? day((n % 4) + 1) : undefined,
				outOfOrderReason: n === 41 ? "AC compressor replacement" : n === 99 ? "Water damage · ceiling" : undefined,
				outOfOrderUntil: n === 41 ? day(2) : n === 99 ? day(9) : undefined,
				lastCleaned: at(state === "dirty" ? -1 : 0, 9 + (n % 5), 15),
				attendant: ["Grace Okafor", "Kemi Adebayo", "Lola Eze", "Mariam Bello"][n % 4],
				note: n === 12 ? "Held for Ifeoma Nwachukwu · arrives 3:30pm" : undefined,
			});
		}
	}
	return rooms;
})();

export const demoStaff: StaffRow[] = [
	{ id: "u-owner", fullName: "Godwin Kwin", email: "godwin@royalsuites.ng", phone: "+234 801 000 0001", role: "OWNER", level: "FULL", department: "Management", jobTitle: "Owner", status: "ACTIVE", shift: "—", startedOn: "2024-01-10", lastSignIn: at(0, 7, 10), hotelId: HOTEL_ID },
	{ id: "u-manager", fullName: "Tunde Bakare", email: "tunde@simpashotels.com", phone: "+234 801 000 0002", role: "MANAGER", level: "FULL", department: "Management", jobTitle: "General manager", status: "ACTIVE", shift: "Morning", startedOn: "2024-02-01", lastSignIn: at(0, 6, 55), hotelId: HOTEL_ID },
	{ id: "u-victor", fullName: "Victor Adeyemi", email: "victor@simpashotels.com", phone: "+234 801 000 0011", role: "FRONT_OFFICE", level: "FULL", department: "Front office", jobTitle: "Front desk lead", status: "ACTIVE", shift: "Morning", startedOn: "2024-03-12", lastSignIn: at(0, 6, 58), hotelId: HOTEL_ID },
	{ id: "u-toyin", fullName: "Toyin Balogun", email: "toyin@simpashotels.com", phone: "+234 801 000 0020", role: "FRONT_OFFICE", level: "EDIT", department: "Front office", jobTitle: "Receptionist", status: "ACTIVE", shift: "Morning", startedOn: "2024-06-03", lastSignIn: at(0, 7, 2), hotelId: HOTEL_ID },
	{ id: "u-bisi", fullName: "Bisi Adekunle", email: "bisi@simpashotels.com", phone: "+234 801 000 0021", role: "FRONT_OFFICE", level: "EDIT", department: "Front office", jobTitle: "Night receptionist", status: "ON_LEAVE", shift: "Night", startedOn: "2024-08-19", lastSignIn: at(-1, 22, 5), hotelId: HOTEL_ID },
	{ id: "u-grace", fullName: "Grace Okafor", email: "grace@simpashotels.com", phone: "+234 801 000 0012", role: "HOUSEKEEPING", level: "FULL", department: "Housekeeping", jobTitle: "Housekeeping supervisor", status: "ACTIVE", shift: "Morning", startedOn: "2024-03-12", lastSignIn: at(0, 6, 40), hotelId: HOTEL_ID },
	{ id: "u-kemi", fullName: "Kemi Adebayo", email: "kemi@simpashotels.com", phone: "+234 801 000 0013", role: "HOUSEKEEPING", level: "EDIT", department: "Housekeeping", jobTitle: "Room attendant", status: "ACTIVE", shift: "Morning", startedOn: "2024-05-20", lastSignIn: at(0, 6, 44), hotelId: HOTEL_ID },
	{ id: "u-lola", fullName: "Lola Eze", email: "lola@simpashotels.com", phone: "+234 801 000 0014", role: "LAUNDRY", level: "FULL", department: "Laundry", jobTitle: "Laundry lead", status: "ACTIVE", shift: "Morning", startedOn: "2024-04-02", lastSignIn: at(0, 7, 20), hotelId: HOTEL_ID },
	{ id: "u-chinedu", fullName: "Chinedu Obi", email: "chinedu@simpashotels.com", phone: "+234 801 000 0015", role: "MAINTENANCE", level: "FULL", department: "Maintenance", jobTitle: "Technician", status: "ACTIVE", shift: "Morning", startedOn: "2024-02-14", lastSignIn: at(0, 7, 30), hotelId: HOTEL_ID },
	{ id: "u-mariam", fullName: "Mariam Bello", email: "mariam@simpashotels.com", phone: "+234 801 000 0016", role: "KITCHEN", level: "FULL", department: "Kitchen", jobTitle: "Head chef", status: "ACTIVE", shift: "Morning", startedOn: "2024-02-14", lastSignIn: at(0, 6, 30), hotelId: HOTEL_ID },
	{ id: "u-segun", fullName: "Segun Ajayi", email: "segun@simpashotels.com", phone: "+234 801 000 0017", role: "BAR", level: "FULL", department: "Bar", jobTitle: "Bar lead", status: "ACTIVE", shift: "Afternoon", startedOn: "2024-07-01", lastSignIn: at(-1, 23, 40), hotelId: HOTEL_ID },
	{ id: "u-jide", fullName: "Jide Alabi", email: "jide@simpashotels.com", phone: "+234 801 000 0018", role: "INVENTORY", level: "FULL", department: "Store", jobTitle: "Storekeeper", status: "ACTIVE", shift: "Morning", startedOn: "2024-03-01", lastSignIn: at(0, 7, 5), hotelId: HOTEL_ID },
	{ id: "u-femi", fullName: "Femi Ojo", email: "femi@simpashotels.com", phone: "+234 801 000 0019", role: "FINANCE", level: "FULL", department: "Finance", jobTitle: "Accountant", status: "ACTIVE", shift: "Morning", startedOn: "2024-02-20", lastSignIn: at(0, 8, 1), hotelId: HOTEL_ID },
	{ id: "u-ada", fullName: "Ada Okeke", email: "ada@simpashotels.com", phone: "+234 801 000 0022", role: "HOUSEKEEPING", level: "VIEW", department: "Housekeeping", jobTitle: "Room attendant", status: "PAUSED", shift: "Afternoon", startedOn: "2025-09-01", hotelId: HOTEL_ID },
	{ id: "u-emeka", fullName: "Emeka Nwankwo", email: "emeka.n@simpashotels.com", phone: "+234 801 000 0023", role: "KITCHEN", level: "EDIT", department: "Kitchen", jobTitle: "Cook", status: "ACTIVE", shift: "Afternoon", startedOn: "2025-03-15", lastSignIn: at(-1, 14, 2), hotelId: HOTEL_ID },
	{ id: "u-sade", fullName: "Sade Williams", email: "sade@simpashotels.com", phone: "+234 801 000 0024", role: "FRONT_OFFICE", level: "VIEW", department: "Front office", jobTitle: "Trainee", status: "ACTIVE", shift: "Afternoon", startedOn: "2025-10-01", lastSignIn: at(-1, 15, 20), hotelId: HOTEL_ID },
	{ id: "u-ibrahim", fullName: "Ibrahim Danjuma", email: "ibrahim.d@simpashotels.com", phone: "+234 801 000 0025", role: "MAINTENANCE", level: "EDIT", department: "Maintenance", jobTitle: "Electrician", status: "ACTIVE", shift: "Afternoon", startedOn: "2025-01-08", lastSignIn: at(-1, 16, 45), hotelId: HOTEL_ID },
	{ id: "u-ruth", fullName: "Ruth Eze", email: "ruth@simpashotels.com", phone: "+234 801 000 0026", role: "HOUSEKEEPING", level: "EDIT", department: "Housekeeping", jobTitle: "Room attendant", status: "ACTIVE", shift: "Morning", startedOn: "2025-02-11", lastSignIn: at(0, 6, 50), hotelId: HOTEL_ID },
];

const shiftTimes = { Morning: ["06:00", "14:00"], Afternoon: ["14:00", "22:00"], Night: ["22:00", "06:00"] } as const;

export const demoShifts: ShiftRow[] = demoStaff
	.filter((s) => s.shift !== "—")
	.flatMap((s) =>
		[-1, 0, 1, 2, 3, 4, 5].map(
			(offset): ShiftRow => ({
				id: `shift-${s.id}-${offset}`,
				staffId: s.id,
				staffName: s.fullName,
				role: s.role,
				date: day(offset),
				starts: shiftTimes[s.shift as keyof typeof shiftTimes][0],
				ends: shiftTimes[s.shift as keyof typeof shiftTimes][1],
				status: offset < 0 ? (s.status === "ON_LEAVE" ? "ABSENT" : "PRESENT") : s.id === "u-bisi" ? "ABSENT" : "SCHEDULED",
			}),
		),
	);

export const demoLeave: LeaveRow[] = [
	{ id: "leave-1", staffId: "u-kemi", staffName: "Kemi Adebayo", role: "HOUSEKEEPING", from: day(6), to: day(10), days: 5, reason: "Sister's wedding in Enugu", status: "PENDING" },
	{ id: "leave-2", staffId: "u-bisi", staffName: "Bisi Adekunle", role: "FRONT_OFFICE", from: day(-2), to: day(1), days: 4, reason: "Sick leave", status: "APPROVED", note: "Get well soon" },
	{ id: "leave-3", staffId: "u-segun", staffName: "Segun Ajayi", role: "BAR", from: day(14), to: day(21), days: 8, reason: "Annual leave", status: "CHANGE_REQUESTED", note: "Can you move it a week later? Detty December prep." },
	{ id: "leave-4", staffId: "u-jide", staffName: "Jide Alabi", role: "INVENTORY", from: day(-20), to: day(-16), days: 5, reason: "Annual leave", status: "APPROVED" },
];

export const demoShiftRequests: ShiftRequestRow[] = [
	{ id: "sr-1", staffName: "Toyin Balogun", role: "FRONT_OFFICE", kind: "SWAP", date: day(2), shift: "Morning", withName: "Sade Williams", reason: "Hospital appointment", status: "PENDING" },
	{ id: "sr-2", staffName: "Ruth Eze", role: "HOUSEKEEPING", kind: "COVER", date: day(0), shift: "Night", reason: "Bisi is out sick", status: "APPROVED" },
];
