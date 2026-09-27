"use client";

import React from "react";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/* Subscribed rather than read once: an ops console is often left open for a
   whole shift, and the OS setting can change under it. */
function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const readMotion = () => window.matchMedia(MOTION_QUERY).matches;

/* The server can't know the preference, so it assumes the cautious answer and
   renders the settled figure. A client that does animate starts from zero on
   the first frame after hydration, which is where the count-up wants to be. */
const readServerMotion = () => true;

/** ease-out-expo — fast off the mark, settles rather than stops. */
function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Animates a figure from where it currently reads to where it should read.
 *
 * Built for the one number on a screen that people actually watch, not for
 * every figure on it — a page where each tile counts itself in is a page that
 * takes a second to become readable.
 *
 * Returns `undefined` while `target` is, so a caller can keep rendering its
 * own placeholder. Interruptions resume from the value on screen rather than
 * restarting, so a figure that updates twice in quick succession stays
 * continuous.
 *
 * In a background tab `requestAnimationFrame` is paused, so the figure holds
 * at its start value — but the first frame after the tab is focused is
 * already past the duration, so it snaps to the real number before anyone
 * sees it.
 */
export function useCountUp(target: number | undefined, duration = 650) {
  const reducedMotion = React.useSyncExternalStore(
    subscribeMotion,
    readMotion,
    readServerMotion,
  );

  const [display, setDisplay] = React.useState(target ?? 0);
  const displayRef = React.useRef(target ?? 0);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (target === undefined) return;

    if (reducedMotion) {
      // Ref only: the render below already reports `target` in this mode.
      displayRef.current = target;
      return;
    }

    const from = displayRef.current;
    if (from === target) return;

    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const value = from + (target - from) * easeOutExpo(t);

      displayRef.current = value;
      setDisplay(value);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        displayRef.current = target;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [target, duration, reducedMotion]);

  if (target === undefined) return undefined;
  return reducedMotion ? target : display;
}

export default useCountUp;
