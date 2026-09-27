"use client";

import { cn } from "@heroui/react";
import Image from "next/image";
import React from "react";
import { LuCamera, LuFile, LuTrash2, LuUpload } from "react-icons/lu";
import { FieldLabel } from "./field-label";

/** The bordered square that clears a picked file. Never a bare `<span onClick>`. */
function RemoveButton({
  onRemove,
  className,
}: {
  onRemove: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Remove file"
      title="Remove file"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className={cn(
        "absolute z-20 flex size-7 cursor-pointer items-center justify-center rounded-md",
        "border border-border-strong bg-surface text-rose-600 transition-colors",
        "hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
        className,
      )}
    >
      <LuTrash2 className="size-3.5" />
    </button>
  );
}

const emptyZoneClass =
  "border border-dashed border-border-strong bg-surface-100 hover:border-brand-500";

type SharedProps = {
  /** The newly picked file, if any. Takes precedence over `existingUrl`. */
  file?: File | null;
  /**
   * Blob URL for `file` — `previewUrls[0]` from `useFileUpload`, which owns
   * creating and revoking it. Rendering must never mint its own.
   */
  previewUrl?: string | null;
  /** An already-saved image, for edit forms. */
  existingUrl?: string | null;
  onPick: () => void;
  onRemove: () => void;
};

/**
 * Circular photo picker — the profile-photo field on every person form.
 *
 * The four copies this replaces disagreed on size (128px vs 140px), on whether
 * the empty state had a border colour, and on whether the prompt text had a
 * type size at all; one of them sized its `next/image` with `width={0}`.
 */
export function AvatarDropzone({
  file,
  previewUrl,
  existingUrl,
  onPick,
  onRemove,
  label,
  className,
}: SharedProps & { label?: string; className?: string }) {
  const objectUrl = file ? (previewUrl ?? null) : null;
  const src = objectUrl ?? existingUrl ?? null;

  return (
    <div className={cn("flex w-full flex-col items-center gap-1.5", className)}>
      {label && <FieldLabel className="mb-0 self-start">{label}</FieldLabel>}
      <div className="relative size-32 shrink-0">
        <button
          type="button"
          onClick={onPick}
          aria-label={src ? "Replace photo" : "Add photo"}
          className={cn(
            "group absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5",
            "overflow-hidden rounded-full transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
            !src && emptyZoneClass,
          )}
        >
          {src ? (
            <>
              <Image
                src={src}
                alt="Profile photo"
                fill
                sizes="128px"
                className="object-cover"
                unoptimized={!!objectUrl}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                Replace
              </span>
            </>
          ) : (
            <>
              <LuCamera className="size-5 text-foreground-muted" />
              <span className="px-4 text-center text-xs text-foreground-light">
                Add photo
              </span>
            </>
          )}
        </button>
        {file && <RemoveButton onRemove={onRemove} className="right-0 top-0" />}
      </div>
    </div>
  );
}

/**
 * Wide picker — an ID card image, an APK.
 *
 * `preview="name"` is for files that have no useful thumbnail: it shows the
 * filename instead of trying to render the bytes.
 */
export function FileDropzone({
  file,
  previewUrl,
  existingUrl,
  onPick,
  onRemove,
  label,
  hint,
  isRequired,
  preview = "image",
  className,
}: SharedProps & {
  label?: string;
  hint?: string;
  isRequired?: boolean;
  preview?: "image" | "name";
  className?: string;
}) {
  const objectUrl = file ? (previewUrl ?? null) : null;
  const imageSrc =
    preview === "image" ? (objectUrl ?? existingUrl ?? null) : null;
  const hasContent = !!file || !!imageSrc;

  return (
    <div className={cn("w-full", className)}>
      {label && <FieldLabel isRequired={isRequired}>{label}</FieldLabel>}
      <div className="relative w-full">
        <button
          type="button"
          onClick={onPick}
          aria-label={
            hasContent ? `Replace ${label ?? "file"}` : `Add ${label ?? "file"}`
          }
          className={cn(
            "group relative flex w-full cursor-pointer items-center justify-center",
            "overflow-hidden rounded-lg transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
            imageSrc ? "min-h-[7.5rem]" : "min-h-[7.5rem] " + emptyZoneClass,
          )}
        >
          {imageSrc ? (
            <>
              <Image
                src={imageSrc}
                alt={label ?? "Selected file"}
                width={480}
                height={220}
                sizes="480px"
                className="max-h-[13.75rem] w-full object-cover"
                unoptimized={!!objectUrl}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                Click to replace
              </span>
            </>
          ) : file ? (
            <span className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
              <LuFile className="size-5 text-foreground-muted" />
              <span className="text-sm font-medium text-foreground">
                {file.name}
              </span>
              {hint && (
                <span className="text-xs text-foreground-light">{hint}</span>
              )}
            </span>
          ) : (
            <span className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
              <LuUpload className="size-5 text-foreground-muted" />
              <span className="text-xs text-foreground-light">
                {preview === "name"
                  ? "Click to select a file"
                  : "Click to upload an image"}
              </span>
              {hint && (
                <span className="text-xs text-foreground-lighter">{hint}</span>
              )}
            </span>
          )}
        </button>
        {file && <RemoveButton onRemove={onRemove} className="right-2 top-2" />}
      </div>
    </div>
  );
}

export default FileDropzone;
