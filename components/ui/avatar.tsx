"use client";

import { cn } from "@heroui/react";
import Image from "next/image";
import React from "react";
import { StatusDot } from "./badge";

export function getInitials(name?: string | null) {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const SIZES = {
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-2xl rounded-2xl",
} as const;

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  /** Renders a small status dot on the bottom-right corner. */
  status?: string | null;
  /** Use the brand gradient instead of the flat tint. */
  gradient?: boolean;
  className?: string;
};

export function Avatar({
  name,
  src,
  size = "md",
  status,
  gradient,
  className,
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full flex items-center justify-center font-semibold tracking-tight",
          SIZES[size],
          gradient
            ? "bg-brand-gradient text-white"
            : "bg-primary-soft text-primary-strong",
        )}
      >
        {src ? (
          <Image src={src} alt={name ?? "avatar"} fill className="object-cover" />
        ) : (
          initials
        )}
      </div>
      {status && (
        <StatusDot status={status} className="absolute bottom-0 right-0" />
      )}
    </div>
  );
}

export default Avatar;
