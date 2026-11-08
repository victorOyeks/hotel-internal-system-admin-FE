import type { PillTone } from "@hospio/ui/shared/status-pill";
import type { RoomState } from "@hospio/api/data/types";

export const roomStateMeta: Record<RoomState, { label: string; tone: PillTone; dot: string; card: string }> = {
	occupied: { label: "Occupied", tone: "brand", dot: "bg-brand", card: "border-brand/15 bg-brand-soft/50" },
	ready: { label: "Ready", tone: "success", dot: "bg-success", card: "border-success/20 bg-success-soft" },
	dirty: { label: "Needs cleaning", tone: "warning", dot: "bg-[#dbab00]", card: "border-warning/30 bg-warning-soft" },
	inspecting: { label: "Inspecting", tone: "info", dot: "bg-info", card: "border-info/20 bg-info-soft" },
	held: { label: "Arriving · held", tone: "info", dot: "bg-info", card: "border-dashed border-brand bg-card" },
	out_of_order: { label: "Out of order", tone: "grey", dot: "bg-line-strong", card: "border-line bg-subtle text-ink-3" },
};

export const roomStateOrder: RoomState[] = ["occupied", "ready", "dirty", "inspecting", "held", "out_of_order"];
