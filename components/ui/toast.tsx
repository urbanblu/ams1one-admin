"use client";

import { cn } from "@heroui/react";
import {
  Slide,
  toast,
  ToastContainer,
  type ToastContentProps,
} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from "react-icons/lu";

/**
 * A toast is a panel that arrives on its own: white, bordered, in the app's
 * face, lifted by the overlay shadow — the one shadow the system allows. It
 * is not a tinted strip; a coloured slab sliding in from the corner shouts,
 * and these fire on every save. The state is carried the way the rest of
 * the app carries it: by one bare Lucide glyph in the semantic colour.
 *
 * The content is rendered here rather than handed to the library as a
 * string. A string toast in react-toastify 11 is a bare text node between
 * the library's icon and its close button, with nothing that can take the
 * width — so the dismiss control ends up hugging the last word. Owning the
 * row means owning the layout.
 */
export type ToastTone = "success" | "error" | "info";

const GLYPHS: Record<
  ToastTone,
  { Icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  success: { Icon: LuCircleCheck, className: "text-emerald-600" },
  error: { Icon: LuCircleAlert, className: "text-rose-600" },
  info: { Icon: LuInfo, className: "text-blue-600" },
};

function ToastRow({
  tone,
  text,
  closeToast,
}: { tone: ToastTone; text: string } & Partial<ToastContentProps>) {
  const { Icon, className } = GLYPHS[tone];
  return (
    <div className="flex w-full items-start gap-2.5">
      <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
      <p className="min-w-0 flex-1 text-sm leading-5 text-foreground">{text}</p>
      <button
        type="button"
        onClick={() => closeToast?.()}
        aria-label="Dismiss"
        className="-mt-0.5 -mr-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
      >
        <LuX className="size-3.5" />
      </button>
    </div>
  );
}

/** What `ToastService` calls. The library supplies only the slide and the timer. */
export function showToast(tone: ToastTone, text: string) {
  toast((props) => <ToastRow tone={tone} text={text} {...props} />, {
    type: tone,
    icon: false,
    closeButton: false,
    // The light theme paints its own background and text; the panel has to win.
    className:
      "mb-2.5! border border-border! bg-surface! font-sans text-foreground!",
  });
}

/**
 * The library reads its geometry from custom properties it also declares on
 * :root, so a :root override from globals.css wins or loses on chunk order.
 * Declared inline on the container, these are inherited by every toast and
 * nothing can be ordered ahead of them. The z-index has to clear HeroUI's
 * overlays (portalled at 100000), or a toast renders behind the very drawer
 * whose form just fired it.
 */
const TOAST_GEOMETRY = {
  "--toastify-z-index": "100002",
  "--toastify-toast-width": "360px",
  "--toastify-toast-min-height": "0",
  "--toastify-toast-padding": "12px 14px",
  "--toastify-toast-bd-radius": "8px",
  "--toastify-toast-shadow": "var(--shadow-overlay)",
  "--toastify-font-family": "inherit",
  "--toastify-text-color-light": "var(--foreground)",
} as React.CSSProperties;

/**
 * The one toast host in the app: position, timing and geometry. The glyph and
 * the dismiss control belong to the row above, so the library's are off.
 */
export function AppToastContainer() {
  return (
    <ToastContainer
      style={TOAST_GEOMETRY}
      position="top-right"
      autoClose={5000}
      limit={4}
      hideProgressBar
      closeOnClick={false}
      pauseOnHover
      pauseOnFocusLoss
      draggable
      theme="light"
      transition={Slide}
      icon={false}
      closeButton={false}
    />
  );
}
