"use client";

import { cn } from "@heroui/react";
import React from "react";

/**
 * The one field label in the app.
 *
 * `CustomInputComponent`, `CustomSelectComponent` and `CustomDatePicker` all
 * render their label from this class, so a hand-built field — a textarea, a
 * dropzone, a native date input — can sit in the same column as a text input
 * without the two labels disagreeing about size, weight or colour.
 *
 * 14px regular in `foreground-light`, not an 11–12px medium micro-label: 12px
 * is the type floor and `font-medium` is reserved for the values, not the
 * things naming them.
 */
export const fieldLabelClass =
  "mb-1.5 block text-sm font-normal text-foreground-light";

type FieldLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  /** Appends the required marker the rest of the form language uses. */
  isRequired?: boolean;
};

export function FieldLabel({
  isRequired,
  className,
  children,
  ...rest
}: FieldLabelProps) {
  return (
    <label className={cn(fieldLabelClass, className)} {...rest}>
      {children}
      {isRequired && (
        <span aria-hidden="true" className="ml-0.5 text-destructive">
          *
        </span>
      )}
    </label>
  );
}

export default FieldLabel;
