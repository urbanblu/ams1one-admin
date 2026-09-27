"use client";

import { cn } from "@heroui/react";
import React from "react";
import { LuLoaderCircle } from "react-icons/lu";

type Variant =
  "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

/**
 * Every variant is bordered, including the solid one — in this design language
 * a button is a bordered rectangle whose fill says how loud it is. The primary
 * fill is brand-700 rather than the brand-500 identity violet because white
 * text only clears 3:1 on 500, and 5.5:1 on 700.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    "border border-brand-800 bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-60",
  secondary:
    "border border-brand-300 bg-brand-100 text-brand-800 hover:bg-brand-200",
  outline:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-200",
  ghost:
    "border border-transparent text-foreground-light hover:border-border hover:bg-surface-200 hover:text-foreground",
  danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  success:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
};

/** Compact by default — Supabase's control heights, not the old 40/48px. */
const SIZES: Record<Size, string> = {
  sm: "h-7 gap-1.5 rounded-md px-2.5 text-xs",
  md: "h-8 gap-1.5 rounded-md px-3 text-xs",
  lg: "h-9 gap-2 rounded-md px-4 text-sm",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isPending?: boolean;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  isPending,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isPending}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-medium",
        // A button is the one control that answers back. Colour alone is a
        // weak answer on a full-width primary, so a press takes it down by a
        // percent — fast enough (120ms) to read as the click itself.
        "transition duration-150 ease-out active:scale-[0.99] disabled:active:scale-100",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "[&>svg]:size-3.5 [&>svg]:shrink-0",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {isPending && <LuLoaderCircle className="animate-spin" />}
      {children}
    </button>
  );
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Square, bordered action — back, refresh, overflow. */
  tone?: "default" | "brand" | "danger";
  label: string;
};

export function IconButton({
  tone = "default",
  label,
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
        "disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:size-3.5",
        tone === "brand" &&
          "border-brand-800 bg-brand-700 text-white hover:bg-brand-800",
        tone === "danger" &&
          "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        tone === "default" &&
          "border-border-strong bg-surface text-foreground-light hover:bg-surface-200 hover:text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
