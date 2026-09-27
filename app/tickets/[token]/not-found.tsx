import { LuTicketX } from "react-icons/lu";

export default function TicketNotFound() {
  return (
    // Matches the surface language of the ticket page itself, which this
    // previously contradicted: bg-subtle canvas, raw bg-white, and a shadow
    // where the system is flat white with a hairline border.
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-lg bg-subtle text-foreground-muted">
          <LuTicketX className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-medium tracking-tight text-foreground">
            Ticket not found
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This link is invalid or the ticket no longer exists.
          </p>
        </div>
      </div>
    </main>
  );
}
