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
    hero-panel.tsx      # HeroPanel, HeroStat — brand gradient panel
    badge.tsx           # Badge, StatusBadge, StatusDot, toneForStatus
    avatar.tsx          # Avatar (initials / photo / status dot)
    button.tsx          # Button, IconButton
    segmented-control.tsx
    search-input.tsx
    number-ball.tsx     # NumberBall, NumberBallRow — lottery numbers
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

The UI follows the **Ams1one Supervisor platform** design language
(`urbanblu/ams1one_supervisor`). Tokens live in `app/globals.css`; never
hardcode a hex value in a component.

### Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--background` | `#f7f8fa` | page canvas (`bg-background`) |
| `--surface` | `#ffffff` | cards, drawers, tables (`bg-surface`) |
| `--subtle` | `#f4f4f5` | hover / track fills (`bg-subtle`) |
| `--foreground` | `#171717` | primary text |
| `--muted-foreground` | `#71717a` | secondary text |
| `--primary` | `#9387eb` | brand violet |
| `--primary-soft` | `#f1effd` | tinted chips, active nav |
| `--brand-gradient` | `135deg #a99df0 → #9387eb → #7d6fe5` | `bg-brand-gradient` |
| `--border-subtle` | `#f1f1f3` | card hairlines |
| `--border` | `#e4e4e7` | inputs, dividers |

`--muted` is **also read by `@heroui/styles`** for its own secondary text, so it
must stay a foreground colour — use `bg-subtle` for tinted surfaces, never
`bg-muted`. The `:root` block also re-points HeroUI's internal `--accent`,
`--danger`, `--success`, `--segment` and `--default` at these tokens so HeroUI
widgets inherit the brand automatically.

Custom utilities: `bg-brand-gradient`, `text-brand-gradient`, `bg-dot-grid`,
`animate-slide-up`, `animate-fade-in`, `animate-rise-in`.

Chart colours live in `utils/chart-colors.ts` (Recharts needs literals).

### Visual language

- **Surfaces:** flat white, `rounded-2xl`, `border border-border-subtle`, no
  shadow. Drawers and hero panels use `rounded-3xl`.
- **Section labels:** `text-[11px] font-semibold uppercase tracking-wider text-zinc-400`.
- **Figures:** `font-bold tracking-tight tabular-nums`; always `tabular-nums` for numbers.
- **Icon chips:** `size-9 rounded-xl` with a 50-weight tint and a 500-weight
  icon (`bg-amber-50 text-amber-500`), icons at `size-4`.
- **Rows:** `divide-y divide-border-subtle`, `hover:bg-subtle`.
- **Semantic colours:** emerald = success/active, amber = pending/warning,
  rose = failed/inactive, blue = info, violet = brand. Use `StatusBadge` rather
  than hand-rolling status pills.
- **Icons:** `react-icons/lu` (Lucide) only, sized with `size-*`.
- Page shells: `px-5 py-6 lg:px-8 lg:py-7` with `gap-5`, opened by `<PageHeader>`.

### Tabs

`Tabs.Indicator` from HeroUI mis-positions itself when the initially selected
tab is **not the first one** (React Aria computes a shared-element offset that
never settles). For any tab bar whose default is not the first tab, use
`<SegmentedControl>` instead — it is plain state, no measurement.

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
- Renders as a white `rounded-2xl` card: header `bg-surface-muted` with
  `text-[11px] uppercase tracking-wider text-zinc-400`, body cells `px-5 py-3.5`,
  rows `hover:bg-subtle`. Cell content supplies its own emphasis — wrap the
  primary column in `font-medium text-foreground` and numbers in
  `font-semibold tabular-nums text-foreground`.

### `CustomDatePicker`

- `onDatePicked(date: DateValue)` callback; call `date.toString()` for an ISO string

### `useFileUpload` hook

Returns: `{ files, onClick, removeFile, clearFiles, InputComponent }`

- `InputComponent` must be rendered (hidden input)
- No `value` or `reset` prop — use `clearFiles()` to empty

## Drawers

Use `drawerDialogClass` on `Drawer.Dialog` and `DrawerTitleBar` (both from
`@/components/ui`) so every drawer shares the same chrome. Pattern used
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
