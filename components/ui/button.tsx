"use client";

import { cn } from "@heroui/react";
import React from "react";
import { LuLoaderCircle } from "react-icons/lu";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white hover:opacity-95 active:scale-[0.98] disabled:opacity-60",
  secondary:
    "bg-primary-soft text-primary-strong hover:bg-primary/15 active:scale-[0.98]",
  outline:
    "bg-surface border border-border text-foreground hover:bg-subtle active:scale-[0.98]",
  ghost: "text-muted-foreground hover:bg-subtle hover:text-foreground",
  danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs rounded-xl gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-sm rounded-2xl gap-2",
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
        "inline-flex items-center justify-center font-semibold transition-all cursor-pointer whitespace-nowrap",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        "[&>svg]:size-4 [&>svg]:shrink-0",
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
  /** Circular pill used for back / refresh / overflow actions. */
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
        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed [&>svg]:size-4",
        tone === "brand" && "bg-brand-gradient text-white",
        tone === "danger" && "bg-rose-50 text-rose-500 hover:bg-rose-100",
        tone === "default" &&
          "bg-surface border border-border-subtle text-muted-foreground hover:text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
