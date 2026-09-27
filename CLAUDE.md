@AGENTS.md

# Project Overview

This is a **lottery operations dashboard** built for managing retailers (writers), LMCs (Local Management Companies), sales, draws, winnings, analytics, and reports. The business domain: writers sell lottery tickets, LMCs manage writers, players buy tickets and win prizes.

---

# Tech Stack

| Layer               | Library / Version                           |
| ------------------- | ------------------------------------------- |
| Framework           | Next.js 16.2.1 (App Router)                 |
| UI                  | HeroUI v3 (`@heroui/react`)                 |
| Styling             | Tailwind CSS v4                             |
| Data fetching       | TanStack React Query v5                     |
| HTTP client         | Axios                                       |
| State management    | Zustand v5                                  |
| Charts              | Recharts                                    |
| Date handling       | `@internationalized/date`                   |
| Icons               | `react-icons`                               |
| Animations          | Framer Motion                               |
| Toast notifications | `react-toastify` via `ToastService` wrapper |
| Language            | TypeScript (strict)                         |
| React               | 19                                          |

---

# Project Structure

```
app/
  (dashboard)/          # Authenticated dashboard routes (route group)
    analysis/           # Analytics & charts
    draws/              # Draw management & dual-approval
    lmcs/               # LMC list + [id] detail page
    retailers/          # Writer/retailer list + [id] detail page
    reports/            # Report execution
    sales/              # Sales overview
    settings/           # Settings
    players/            # Players
  login/
    onassis-host/       # Host login page
    onassis-cash/       # Cash login page

api/                    # Service classes (one per domain)
  auth/
  admin-users/
  financials/
  games/
  lmc/
  sales/
  writers/
  index.ts              # Axios instance (base URL, auth interceptors, token refresh)

components/             # Shared UI components
  ui/                   # Design-system primitives — see "Design System" below
    index.ts            # Barrel export; always import from "@/components/ui"
    card.tsx            # Card, CardHeader, CardBody, CardFooter
    metric-card.tsx     # MetricCard — headline figure + breakdown rows
    stat-tile.tsx       # StatTile — compact KPI tile
    hero-panel.tsx      # HeroPanel, HeroStat, HeroLedger, HeroDivider —
                        #   the inverted (near-black) panel and its zones
    badge.tsx           # Badge, StatusBadge, StatusDot, toneForStatus
    avatar.tsx          # Avatar (initials / photo / status dot)
    button.tsx          # Button, IconButton
    segmented-control.tsx    # single choice
    filter-toggle-group.tsx  # multi-select
    detail-row.tsx / form-section.tsx
    search-input.tsx
    number-ball.tsx     # NumberBall, NumberBallRow — mono lottery numbers
    page-header.tsx     # PageHeader, PageShell
    empty-state.tsx / query-state.tsx / skeleton.tsx
    drawer-chrome.tsx   # DrawerTitleBar, drawerDialogClass
  custom-input-component.tsx
  custom-select-component.tsx
  custom-table.tsx
  custom-date-picker.tsx
  custom-button.tsx
  custom-checkbox.tsx
  global-navbar.tsx

hooks/
  use-file-upload.tsx   # File/image upload with preview

interfaces/             # TypeScript interfaces per domain
stores/
  auth.store.ts         # Zustand auth store (access/refresh tokens)

utils/
  api_error.ts          # Centralised API error handler
  currency.ts           # formatGhs() helper
  helpers.ts            # Misc helpers incl. form validation
  toast-service.ts      # ToastService.success/error/info wrappers
```

---

# Patterns & Conventions

## API Service Layer

- Every domain has a static service class in `api/<domain>/index.ts`
- All methods are `static async`, catch with `handleApiError`, and return typed interfaces
- The shared Axios instance (`api/index.ts`) sets `Content-Type: application/json` globally and handles token refresh on 401
- **File uploads (FormData):** must unset `Content-Type` per-request so the browser sets the multipart boundary:
  ```ts
  headers: hasPhoto ? { "Content-Type": undefined } : undefined;
  ```
- Base URL comes from `EnvConstants.API_BASE_URL`

## Data Fetching

- Use TanStack React Query (`useQuery` / `useMutation`) everywhere — no raw `useEffect` data fetching
- Query keys follow the pattern `[domain, resource, ...params]`, e.g. `["writers", writerId, "detail"]`
- After a successful mutation, invalidate the relevant query keys
- `queryFn` must never resolve to `undefined` — provide a fallback default

## State Management

- Auth state (access/refresh tokens) lives in Zustand: `useAuth` from `stores/auth.store.ts`
- Component-local UI state uses `useState`

## Forms

- Use HeroUI `<Form>` with `onSubmit`. Read values via `Object.fromEntries(new FormData(e.currentTarget))`
- Use `CustomInputComponent` for all text inputs — it is **uncontrolled** (`defaultValue` only, no `value` prop)
- To pre-fill a form after async data loads, wrap inputs in a `<div key={someUniqueLoadedValue}>` — this forces a re-render with new `defaultValues` when data arrives
- For `type="tel"` inputs, only phone characters (`0-9 + - space ( )`) are accepted; paste is sanitized

## Design System

The UI follows the **Supabase** design language, rebuilt around the Ams1one
violet rather than Supabase green. Tokens live in `app/globals.css`; never
hardcode a hex value in a component.

The three rules the whole system rests on:

1. **Borders do the work.** Separation comes from a visible 1px line, never
   from a shadow and rarely from a fill difference. There are no shadows in
   the app except on overlays (`shadow-overlay`).
2. **Structure over decoration.** No gradients, no blurred highlights, no
   tinted icon chips. An icon is a bare 14–16px glyph in `text-foreground-muted`.
3. **Hierarchy comes from size and colour, not weight.** `font-medium` is the
   heaviest weight in the app. `font-bold` and `font-semibold` are not used.

### Tokens

Neutrals are the Radix `slate` ramp Supabase's light theme is built on — a
cool grey with a faint blue cast, not Tailwind's purple-leaning zinc. Do not
reach for `zinc-*`, `gray-*` or `slate-*` utilities; use the tokens.

| Token | Value | Use |
| --- | --- | --- |
| `--background` | `#ffffff` | main content canvas (`bg-background`) |
| `--background-alt` | `#f8f9fa` | chrome: nav rail, mobile top bar |
| `--surface` | `#ffffff` | panels, drawers, tables |
| `--surface-100` | `#f6f7f8` | table headers, panel footers, control fills |
| `--surface-200` | `#f1f3f5` | hover |
| `--surface-300` | `#eceef0` | pressed / active nav item |
| `--foreground` | `#11181c` | primary text |
| `--foreground-light` | `#5b6166` | all secondary text and labels (6.3:1) |
| `--foreground-lighter` | `#6f777d` | placeholders, dimmed figures (4.6:1) |
| `--foreground-muted` | `#a8b0b6` | icon glyphs, disabled — **never body text** |
| `--border` | `#e6e8eb` | panel outlines, row rules, dividers |
| `--border-strong` | `#dfe3e6` | inputs, buttons |
| `--border-stronger` | `#d7dbdf` | hover on a bordered control |
| `--brand-500` | `#9387eb` | the identity violet — accents, dots, underlines |
| `--brand-700` | `#6355d8` | **button fills and brand text** (5.5:1 with white) |
| `--brand-100` | `#efedfd` | brand tint fill |
| `--brand-800` | `#5244b4` | text on a brand tint |

`--brand-500` is the brand, but white text on it only reaches 3:1, so anything
that fills a surface and carries white text uses `--brand-700`. `--muted` is
also read by `@heroui/styles` for its own secondary text, so it has to stay a
foreground colour. The `:root` block re-points HeroUI's `--accent`, `--danger`,
`--segment` and `--default` at these tokens so HeroUI widgets inherit the brand.

**Radii are collapsed on purpose:** `sm` 4px, `md`/default 6px, `lg`/`xl`/`2xl`
8px, `3xl` 12px. `rounded-lg` is the panel radius, `rounded-md` the control
radius, `rounded-full` is only for dots, badges and status indicators.

Custom utilities: `font-ident` (mono, for IDs/codes/draw numbers),
`bg-line-grid` (the faint grid on inverted panels), `focus-brand`,
`animate-fade-in`, `animate-rise-in`, `animate-slide-up`. `bg-brand-gradient`
survives as a legacy alias that now resolves to a flat `--brand-700` fill.

Chart colours live in `utils/chart-colors.ts` (Recharts needs literals).

### Visual language

- **Panels:** `rounded-lg border border-border bg-surface`, no shadow. Header
  `px-5 py-3.5 border-b border-border`; footer `bg-surface-100`.
- **Labels:** `text-xs text-foreground-light`, sentence case. The old
  `text-[11px] uppercase tracking-wider` micro-label is gone; 12px is the
  type floor.
- **Figures:** `font-medium tracking-tight tabular-nums`; always `tabular-nums`.
- **Identifiers:** writer IDs, event numbers, codes and draw numbers get
  `font-ident` so a value reads as a value rather than as prose.
- **Controls are compact:** buttons `h-7`/`h-8`/`h-9`, inputs and selects
  `h-9`. Every variant is bordered, including the solid one.
- **Rows:** `divide-y divide-border`, `hover:bg-surface-100`.
- **Semantic colours:** emerald = success/active, amber = pending/warning,
  rose = failed/inactive, blue = info, violet = brand. Use the `-50` fill with
  a `-200` border and `-600`/`-700` text; `-500` is too light for text on
  white. Use `StatusBadge` rather than hand-rolling status pills.
- **Callouts** (tinted alert strips) always carry a matching border.
- **Emphasis panels invert** rather than going brand: `HeroPanel` is a near-
  black `bg-foreground` surface with `bg-line-grid` and white type. That is
  the only "loud" surface in the system.
- **Icons:** `react-icons/lu` (Lucide) only, `size-3.5`/`size-4`, bare.
- Page shells: `px-4 py-5 lg:px-6 lg:py-6` with `gap-4`, opened by
  `<PageHeader>`, which closes itself with a `border-b border-border` rule.

### Tabs

HeroUI's `variant="secondary"` **is** the underline variant — it already gives
a `border-b` container and a 2px bottom-line indicator. Style the indicator
with `<Tabs.Indicator className="rounded-none bg-brand-500" />`; do not give
it a radius or a full background, which turns it back into a pill.

`Tabs.Indicator` also mis-positions itself when the initially selected tab is
**not the first one** (React Aria computes a shared-element offset that never
settles). For any tab bar whose default is not the first tab, use
`<SegmentedControl>` instead — it is plain state, no measurement.

### App bar

The shell renders one app bar for every route ([nav-rail.tsx](components/nav-rail.tsx)).
Pages fill it through portals from `@/components/ui`, so the nodes stay in the
page's own React tree and page state drives them directly:

- `<AppBarActions>` — the right-hand slot: tab bars, search fields, the
  primary action. List pages already use it.
- `<AppBarIdentity>` — the **last breadcrumb** on a detail page: back control,
  avatar, name, an optional inline `adornment` (e.g. an edit trigger) and a
  `meta` identifier. Pass `isLoading` while the entity is still fetching.

A detail route's trail ends in a synthesised "Details" crumb. Mounting an
`AppBarIdentity` supersedes it — the placeholder and its chevron hide, the
identity's chevron appears. That swap is pure CSS (`empty:` on the host,
`group-has-[[data-app-bar-identity]]/bar:` on the crumbs), so neither the bar
nor the shell holds state about what the mounted page published.

**Detail pages therefore carry no header of their own.** Do not re-add a
back button, avatar or `<h1>` to the page body — the bar owns all of it, and
`AppBarIdentity`'s name *is* the page's `<h1>`.

### Selection controls

- `<SegmentedControl>` — single choice. Bordered track on `bg-surface-100`,
  selected item lifted onto `bg-surface` with its own border. No brand fill.
- `<FilterToggleGroup>` — multi-select sibling, same track, plus a dot per
  option that fills with `bg-brand-500` when on.

## Custom Components

### `CustomInputComponent`

Props: `label`, `name`, `type`, `defaultValue`, `isRequired`, `className`, `onChange`, `showPreficIcon`, `showSuffixIcon`, `showPlaceholder`, `showLabel`, `validate`, `minLength`, `placeholder`, `prefixIcon`, `suffixIcon`

- No `value` prop — always uncontrolled

### `CustomSelectComponent`

- Pass `list: { key: string; label: string }[]`
- `initialItemKey` sets the default
- `onSelectionChange` callback receives the selected item

### `CustomTable`

- `columns`: `{ key: string; label: string; sortable: boolean }[]`
- `data`: `TableRow[]` where each key matches a column key
- `pagination`: `{ pageNumber, pageSize, totalCount }`
- Column keys must be unique — duplicate keys cause React rendering errors
- Renders as a white `rounded-lg` panel: header `bg-surface-100` with
  `text-xs font-medium text-foreground-light`, body cells `px-4 py-2.5
  text-xs`, rows `hover:bg-surface-100`, footer on `bg-surface-100`. Cell
  content supplies its own emphasis — wrap the primary column in
  `font-medium text-foreground`, numbers in `font-medium tabular-nums
  text-foreground`, and IDs in `font-ident`.

### Delight moments

Delight lands on specific moments, never across a page — a screen where every
tile animates is a screen that takes a second to become readable.

- `useCountUp` (`hooks/use-count-up.ts`) animates a figure from where it reads
  to where it should read. Reserved for the one number on a screen people
  actually watch (the sales hero), not for every tile. It resumes from the
  value on screen rather than restarting, snaps instantly under
  `prefers-reduced-motion`, and callers pair the animated span with an
  `sr-only` span holding the settled value.
- `CustomTable`'s `emptyState` prop lets a page explain an emptiness it caused
  — a filter, a date with nothing in it — and offer the way out. Prefer it to
  `emptyMessage` whenever the page knows *why* the table is empty.
- Entrance animations run unconditionally at mount (a keyed remount replays
  them); never gate content visibility on a class the page toggles later.

### `CustomDatePicker`

- `onDatePicked(date: DateValue)` callback; call `date.toString()` for an ISO string

### `useFileUpload` hook

Returns: `{ files, onClick, removeFile, clearFiles, InputComponent }`

- `InputComponent` must be rendered (hidden input)
- No `value` or `reset` prop — use `clearFiles()` to empty

## Drawers

Use `drawerDialogClass` on `Drawer.Dialog` and `DrawerTitleBar` (both from
`@/components/ui`) so every drawer shares the same chrome — `rounded-l-xl`
with a `border-l`, and a flat scrim (no backdrop blur). Pattern used
throughout the app:

```tsx
const [drawerIsOpen, setDrawerOpen] = React.useState(false);
// trigger element sets drawerIsOpen = true
// Drawer.Backdrop isOpen={drawerIsOpen} onOpenChange={setDrawerOpen}
```

## Images

- Use `next/image` for all images
- Remote hostnames must be whitelisted in `next.config.ts` under `images.remotePatterns`
- For images that fill a shaped container (e.g. a circle avatar), use `fill` prop with a `relative overflow-hidden` parent — do not use `width={0} height={0}`
- Current whitelisted hostname: `onassismystrocore-production.up.railway.app`

## Filtering & Derived State

- Prefer `useMemo` for derived/filtered lists
- When filtering by game type, use `game_type.id` (not name or code) — the id is present in both the game types list and winning events responses
- When cross-filtering winners by game type, match on `event_no` against the already-filtered events list (winners list has no `game_type` field)

## Toast Notifications

```ts
ToastService.success({ text: "..." });
ToastService.error({ text: "..." });
ToastService.info({ text: "..." });
```

## Error Handling

- API errors flow through `handleApiError(error)` which normalises Axios errors
- Mutation `onError` handlers call `ToastService.error`

## Currency Formatting

```ts
import { formatGhs } from "@/utils/currency";
formatGhs(1234.5); // "GHS 1,234.50"
```

---

# API Base URL

`https://onassismystrocore-production.up.railway.app`

Auth: Bearer token (JWT). Access token stored in Zustand, auto-refreshed via Axios interceptor on 401.

---

# Key Business Domain Notes

- **Writers** = retailers/agents who sell tickets. Identified by `writer_id_display` (human-readable) and UUID `id`
- **LMCs** = Local Management Companies that own writers. Identified by `LMC-XXXX` codes
- **Events** = draw instances for a game type on a date. Have `event_id`, `event_no`, `event_name`, `game_type`
- **Game types** filter by `id` (UUID), not `code` or `name`
- Winning events response includes `game_type: { id, name, code }` — use `id` for filtering
- Winners list does not include `game_type` — filter by `event_no` cross-referencing the filtered events list
- Draw results use dual-approval: submit → pending → confirm/reject

---

# What to Read Before Writing Code

- Check `node_modules/next/dist/docs/` for Next.js 16 specifics before using any routing, metadata, or server component APIs — this version has breaking changes from older Next.js
- Check `interfaces/` for the exact shape of API responses before writing service methods or component data bindings
- Check `ENDPOINTS_DOCS.md` for API endpoint documentation
