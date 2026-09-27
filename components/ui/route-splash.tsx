/* The persisted session lives in localStorage, which React cannot read during
   the hydration render — zustand serves `getInitialState()` as the server
   snapshot, so the first paint of any route always looks signed out. Routes
   that exist only to decide where someone belongs hold this neutral surface
   for that one frame rather than painting a screen they are about to leave. */
export function RouteSplash() {
  return <div className="min-h-dvh bg-background" aria-hidden />;
}
