"use client";

import { parseAsString, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

export type PillTab<K extends string = string> = { key: K; label: string; count?: number };

/**
 * The tab strip above every list (Arrivals · Departures · In-house…). Either controlled through
 * `value`/`onChange` or, with `param`, kept in the URL so links like ?tab=arrivals open it.
 */
export function PillTabs<K extends string>({
	tabs,
	value,
	onChange,
	param,
	defaultValue,
	className,
}: {
	tabs: PillTab<K>[];
	value?: K;
	onChange?: (key: K) => void;
	param?: string;
	defaultValue?: K;
	className?: string;
}) {
	const [urlValue, setUrlValue] = useQueryState(param ?? "tab", parseAsString.withDefault(defaultValue ?? tabs[0].key));
	const active = (value ?? (param ? urlValue : defaultValue ?? tabs[0].key)) as K;
	const set = (key: K) => {
		onChange?.(key);
		if (param) void setUrlValue(key === (defaultValue ?? tabs[0].key) ? null : key);
	};

	return (
		<div className={cn("inline-flex w-fit gap-[2px] rounded-[10px] bg-subtle p-1", className)}>
			{tabs.map((t) => {
				const isActive = active === t.key;
				return (
					<button
						key={t.key}
						type="button"
						onClick={() => set(t.key)}
						className={cn(
							"flex items-center gap-[6px] rounded-lg py-[6px] pl-[10px] pr-2 text-xs transition-colors",
							isActive ? "bg-card font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "font-medium text-ink-2 hover:text-ink",
						)}
					>
						{t.label}
						{typeof t.count === "number" && (
							<span className={cn("rounded-[6px] px-[5px] py-px text-[10px] font-semibold", isActive ? "bg-brand-soft text-brand" : "bg-card text-ink-2")}>{t.count}</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

/** Read the active tab without rendering the strip (for pages that render tabs elsewhere). */
export function useTabParam<K extends string>(defaultValue: K, param = "tab") {
	const [value, setValue] = useQueryState(param, parseAsString.withDefault(defaultValue));
	return [value as K, (k: K) => void setValue(k === defaultValue ? null : k)] as const;
}
