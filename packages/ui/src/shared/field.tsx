"use client";

import Link from "next/link";
import { createContext, type ReactNode, useContext } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@hospio/ui/primitives/select";
import { Switch } from "@hospio/ui/primitives/switch";
import { cn } from "@hospio/ui/utils";
import {
	input as inputCls,
	select as selectCls,
	textarea as textareaCls,
} from "./ui";

/**
 * Form fields for panels and modals. These hold plain React state (value/onChange) so a demo
 * screen can be built quickly; wrap them in react-hook-form's <FormField> when validation lands.
 */

/**
 * Whether "Manage … in Hotel setup" links lead anywhere for the person signed in: only the manager and the owner
 * have Hotel setup. The dashboard shell sets it from the active role; everyone else sees "Set up by the manager".
 */
const SetupLinksContext = createContext(true);

export function SetupLinks({
	allowed,
	children,
}: {
	allowed: boolean;
	children: ReactNode;
}) {
	return (
		<SetupLinksContext.Provider value={allowed}>
			{children}
		</SetupLinksContext.Provider>
	);
}

export function Field({
	label,
	hint,
	error,
	required,
	setupLink,
	children,
	className,
}: {
	label: string;
	hint?: ReactNode;
	error?: string;
	required?: boolean;
	setupLink?: string;
	children: ReactNode;
	className?: string;
}) {
	// Setup links are live only for the manager and the owner (front office has no Hotel setup: the link was a 404).
	const canSetup = useContext(SetupLinksContext);
	return (
		<div className={cn("flex flex-col gap-[6px]", className)}>
			<div className="flex items-center justify-between gap-3">
				<span className="text-[13px] font-medium text-ink-2">
					{label}
					{required && <span className="text-danger"> *</span>}
				</span>
				{setupLink &&
					(canSetup ? (
						<Link
							href="/dashboard/hotel-setup"
							prefetch={false}
							className="text-[11px] font-medium text-brand hover:underline"
						>
							Manage {setupLink} in Hotel setup
						</Link>
					) : (
						<span className="text-[11px] text-ink-3">
							{capitalise(setupLink)} are set up by the manager
						</span>
					))}
			</div>
			{children}
			{error ? (
				<p className="text-xs text-danger">{error}</p>
			) : hint ? (
				<p className="text-xs text-ink-3">{hint}</p>
			) : null}
		</div>
	);
}

export function TextField({
	label,
	value,
	onChange,
	type = "text",
	placeholder,
	hint,
	error,
	required,
	prefix,
	className,
	disabled,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	placeholder?: string;
	hint?: ReactNode;
	error?: string;
	required?: boolean;
	prefix?: string;
	className?: string;
	disabled?: boolean;
}) {
	return (
		<Field
			label={label}
			hint={hint}
			error={error}
			required={required}
			className={className}
		>
			<div className="relative">
				{prefix && (
					<span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-sm text-ink-3">
						{prefix}
					</span>
				)}
				<input
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
					className={cn(inputCls, prefix && "pl-8", error && "border-danger")}
				/>
			</div>
		</Field>
	);
}

/** Naira amount with thousands separators as you type. */
export function MoneyField({
	label,
	value,
	onChange,
	hint,
	error,
	required,
	className,
	disabled,
	placeholder = "0",
}: {
	label: string;
	value: number | "";
	onChange: (v: number | "") => void;
	hint?: ReactNode;
	error?: string;
	required?: boolean;
	className?: string;
	disabled?: boolean;
	/** Grey hint shown while empty; never a value. */
	placeholder?: string;
}) {
	return (
		<Field
			label={label}
			hint={hint}
			error={error}
			required={required}
			className={className}
		>
			<div className="relative">
				<span className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-sm text-ink-3">
					₦
				</span>
				<input
					inputMode="numeric"
					value={value === "" ? "" : value.toLocaleString("en-NG")}
					onChange={(e) => {
						const digits = e.target.value.replace(/[^\d]/g, "");
						onChange(digits === "" ? "" : Number(digits));
					}}
					disabled={disabled}
					placeholder={placeholder}
					className={cn(inputCls, "pl-8", error && "border-danger")}
				/>
			</div>
		</Field>
	);
}

export function TextareaField({
	label,
	value,
	onChange,
	placeholder,
	hint,
	error,
	rows = 3,
	className,
}: {
	label: string;
	value: string;
	/** Without it the text is read only (shown for copying, not edited). */
	onChange?: (v: string) => void;
	placeholder?: string;
	hint?: ReactNode;
	error?: string;
	rows?: number;
	className?: string;
}) {
	return (
		<Field label={label} hint={hint} error={error} className={className}>
			<textarea
				value={value}
				readOnly={!onChange}
				onChange={(e) => onChange?.(e.target.value)}
				placeholder={placeholder}
				rows={rows}
				className={cn(textareaCls, error && "border-danger")}
			/>
		</Field>
	);
}

export function SelectField({
	label,
	value,
	onChange,
	options,
	placeholder = "Choose…",
	hint,
	error,
	required,
	setupLink,
	className,
	disabled,
	empty,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	options: ({ value: string; label: string; hint?: string } | string)[];
	placeholder?: string;
	hint?: ReactNode;
	error?: string;
	required?: boolean;
	setupLink?: string;
	className?: string;
	disabled?: boolean;
	/** What the closed box says when there is nothing to pick (an empty list opened to nothing and looked broken). */
	empty?: string;
}) {
	const opts = options.map((o) =>
		typeof o === "string" ? { value: o, label: o } : o,
	);
	const none = opts.length === 0;
	return (
		<Field
			label={label}
			hint={hint}
			error={error}
			required={required}
			setupLink={setupLink}
			className={className}
		>
			<Select
				value={value || undefined}
				onValueChange={onChange}
				disabled={disabled || none}
			>
				<SelectTrigger
					className={cn(
						selectCls,
						"data-[size=default]:h-auto",
						error && "border-danger",
					)}
				>
					<SelectValue
						placeholder={
							none
								? (empty ??
									(setupLink
										? `No ${setupLink} set up yet`
										: "Nothing to choose yet"))
								: placeholder
						}
					/>
				</SelectTrigger>
				<SelectContent className="rounded-xl">
					{opts.map((o) => (
						<SelectItem key={o.value} value={o.value}>
							<span className="flex flex-col items-start text-left">
								<span>{o.label}</span>
								{o.hint && <span className="text-xs text-ink-3">{o.hint}</span>}
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

export function ToggleField({
	label,
	hint,
	checked,
	onChange,
	className,
}: {
	label: string;
	hint?: ReactNode;
	checked: boolean;
	onChange: (v: boolean) => void;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-control border border-line px-4 py-3",
				className,
			)}
		>
			<span className="min-w-0 flex-1">
				<span className="block text-[13px] font-medium text-ink">{label}</span>
				{hint && <span className="block text-xs text-ink-3">{hint}</span>}
			</span>
			<Switch
				checked={checked}
				onCheckedChange={onChange}
				aria-label={label}
				className="data-[state=checked]:bg-brand"
			/>
		</div>
	);
}

/** Radio-style cards for picking one of a few options (payment plan, price kind…). */
export function ChoiceCards<K extends string>({
	label,
	value,
	onChange,
	options,
	columns = 1,
	hint,
	className,
}: {
	label?: string;
	value: K;
	onChange: (v: K) => void;
	options: { value: K; label: string; hint?: ReactNode; disabled?: boolean }[];
	columns?: 1 | 2 | 3;
	hint?: ReactNode;
	className?: string;
}) {
	const body = (
		<div
			className={cn(
				"grid gap-2",
				columns === 2 && "grid-cols-2",
				columns === 3 && "grid-cols-3",
			)}
		>
			{options.map((o) => {
				const active = o.value === value;
				return (
					<button
						key={o.value}
						type="button"
						disabled={o.disabled}
						onClick={() => onChange(o.value)}
						className={cn(
							"flex items-start gap-3 rounded-control border px-4 py-3 text-left transition-colors disabled:opacity-50",
							active
								? "border-brand bg-brand-soft/50"
								: "border-line bg-card hover:bg-subtle",
						)}
					>
						<span
							className={cn(
								"mt-[2px] flex size-4 shrink-0 items-center justify-center rounded-full border",
								active ? "border-brand" : "border-line-strong",
							)}
						>
							{active && <span className="size-2 rounded-full bg-brand" />}
						</span>
						<span className="min-w-0">
							<span className="block text-[13px] font-semibold text-ink">
								{o.label}
							</span>
							{o.hint && (
								<span className="block text-xs text-ink-3">{o.hint}</span>
							)}
						</span>
					</button>
				);
			})}
		</div>
	);
	return label ? (
		<Field label={label} hint={hint} className={className}>
			{body}
		</Field>
	) : (
		<div className={className}>{body}</div>
	);
}

export function FieldRow({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("grid grid-cols-2 gap-3", className)}>{children}</div>
	);
}

function capitalise(s: string) {
	return s ? `${s[0].toUpperCase()}${s.slice(1)}` : s;
}
