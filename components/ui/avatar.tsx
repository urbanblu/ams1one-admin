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
  sm: "size-7 text-xs",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-14 text-lg",
} as const;

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  /**
   * The plate's outline. Square is the console default; circle is for the
   * places an avatar stands in for a person rather than labelling a row.
   *
   * It is a prop rather than something `className` can reach because that
   * lands on the positioning wrapper, not on the plate.
   */
  shape?: "square" | "circle";
  /** Renders a small status dot on the bottom-right corner. */
  status?: string | null;
  /** Solid brand fill instead of the neutral one — for the signed-in user. */
  gradient?: boolean;
  className?: string;
};

/** Bordered, square-ish initials plate — the console's identity chip. */
export function Avatar({
  name,
  src,
  size = "md",
  shape = "square",
  status,
  gradient,
  className,
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden border font-medium tracking-tight",
          shape === "circle" ? "rounded-full" : "rounded-md",
          SIZES[size],
          gradient
            ? "border-brand-800 bg-brand-700 text-white"
            : "border-border bg-surface-200 text-foreground-light",
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={name ?? "avatar"}
            fill
            className="object-cover"
          />
        ) : (
          initials
        )}
      </div>
      {status && (
        <StatusDot
          status={status}
          className="absolute -bottom-0.5 -right-0.5"
        />
      )}
    </div>
  );
}

export default Avatar;
