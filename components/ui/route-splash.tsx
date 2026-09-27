import { cn } from "@heroui/react";

/* The persisted session lives in localStorage, which React cannot read during
   the hydration render — zustand serves `getInitialState()` as the server
   snapshot, so the first paint of any route always looks signed out. Routes
   that exist only to decide where someone belongs hold this neutral surface
   for that one frame rather than painting a screen they are about to leave.
   A route whose own canvas is not `--background` passes its fill in, so the
   hold and the screen that follows it are the same colour. */
export function RouteSplash({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-dvh bg-background", className)} aria-hidden />
  );
}
