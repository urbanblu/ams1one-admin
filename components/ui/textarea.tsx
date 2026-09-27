"use client";

import { cn } from "@heroui/react";
import React from "react";
import { FieldLabel } from "./field-label";

/**
 * The multi-line counterpart to `CustomInputComponent`.
 *
 * It carries that component's exact chrome — `border-border-strong`, the
 * `brand-500` focus border with its 20%-opacity ring, 14px text, a 6px radius
 * — so a description field stacked under a text input reads as the same
 * control with more room rather than as a different widget. Height is the only
 * thing it does differently: `h-9` is a line, so a textarea gets `rows`.
 */
type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> & {
  label?: string;
  /** Sits under the control in the same place `CustomInputComponent` puts it. */
  description?: string;
  isRequired?: boolean;
  id?: string;
};

export function Textarea({
  label,
  description,
  isRequired,
  className,
  rows = 3,
  name,
  id,
  ...rest
}: TextareaProps) {
  const generatedId = React.useId();
  const fieldId = id ?? `${name ?? "textarea"}-${generatedId}`;

  return (
    <div className="w-full">
      {label && (
        <FieldLabel htmlFor={fieldId} isRequired={isRequired}>
          {label}
        </FieldLabel>
      )}
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        required={isRequired}
        className={cn(
          "w-full resize-y rounded-md border border-border-strong bg-surface px-3 py-2",
          "text-sm text-foreground placeholder:text-foreground-lighter",
          "transition-colors duration-200 outline-none",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...rest}
      />
      {description && (
        <p className="mt-1.5 text-xs text-foreground-light">{description}</p>
      )}
    </div>
  );
}

export default Textarea;
