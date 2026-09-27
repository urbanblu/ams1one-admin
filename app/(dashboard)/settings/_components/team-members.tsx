"use client";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  SearchInput,
  Skeleton,
} from "@/components/ui";
import React from "react";
import { LuUsers } from "react-icons/lu";
import NewUserDrawer from "./new-user-drawer";
import ExistingRolesDrawer from "./existing-roles-drawer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminUsersService from "@/api/admin-users";
import type { IAdminUser } from "@/interfaces/admin-users.interface";
import EditUserDrawer from "./edit-user";

/**
 * Four columns, one grid template, shared by the header strip and every row —
 * that is what keeps a member with no phone number from sliding their badges
 * left and breaking the column the row above established.
 */
const COLUMNS =
  "md:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_minmax(0,9rem)_2rem]";

function TeamMembers() {
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = React.useState("");

  const { data: adminResp, isPending } = useQuery({
    queryKey: ["admin-users", "list"],
    queryFn: () =>
      AdminUsersService.fetchAdmins({
        page: 1,
        page_size: 100,
      }),
  });

  const admins = React.useMemo(
    () => adminResp?.results ?? [],
    [adminResp?.results],
  );
  const filteredAdmins = React.useMemo(() => {
    const query = searchDraft.trim().toLowerCase();
    if (!query) return admins;

    return admins.filter((user) => {
      const fullName = user.full_name?.toLowerCase() ?? "";
      const firstName = user.first_name?.toLowerCase() ?? "";
      const lastName = user.last_name?.toLowerCase() ?? "";
      const phone = user.phone?.toLowerCase() ?? "";
      const email = user.email?.toLowerCase() ?? "";

      return (
        fullName.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        phone.includes(query) ||
        email.includes(query)
      );
    });
  }, [admins, searchDraft]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-users", "list"] });

  return (
    <Card className="flex h-full min-h-0 w-full flex-col">
      <CardHeader
        className="shrink-0"
        icon={<LuUsers />}
        title="Team members"
        description={
          isPending
            ? "Loading…"
            : `${admins.length.toLocaleString("en-US")} with console access`
        }
        action={
          <div className="flex items-center gap-2">
            <ExistingRolesDrawer />
            <NewUserDrawer onCreated={invalidate} />
          </div>
        }
      />

      <div className="shrink-0 border-b border-border px-5 py-2.5">
        <SearchInput
          className="max-w-xs"
          placeholder="Search by name, email or phone"
          value={searchDraft}
          onChange={setSearchDraft}
        />
      </div>

      {/* Column headings, so the middle of each row is read as data in a
          column rather than as text that happens to sit over there. */}
      <div
        className={`hidden shrink-0 gap-4 border-b border-border bg-surface-100 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted md:grid ${COLUMNS}`}
      >
        <span>Member</span>
        <span>Contact</span>
        <span>Role &amp; status</span>
        <span className="sr-only">Actions</span>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {isPending ? (
          Array.from({ length: 4 }).map((_, i) => <MemberSkeleton key={i} />)
        ) : filteredAdmins.length === 0 ? (
          <EmptyState
            className="h-full min-h-56"
            icon={<LuUsers />}
            title={searchDraft.trim() ? "No members found" : "No members yet"}
            description={
              searchDraft.trim()
                ? "Try a different name, email or phone number."
                : "Invite someone to give them console access."
            }
          />
        ) : (
          filteredAdmins.map((user) => (
            <MemberRow key={user.id} user={user} onEdited={invalidate} />
          ))
        )}
      </div>
    </Card>
  );
}

export default TeamMembers;

const MemberRow = ({
  user,
  onEdited,
}: {
  user: IAdminUser;
  onEdited?: () => void;
}) => {
  const name =
    user.full_name || `${user.first_name} ${user.last_name}`.trim() || "—";

  /* The weekday in the old format told nobody anything, and a missing date
     rendered as an "N/A" badge — a pill drawing the eye to an absence. */
  const joined = user.date_joined
    ? new Date(user.date_joined).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`grid items-center gap-2 px-5 py-3 transition-colors hover:bg-surface-100 md:gap-4 ${COLUMNS}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} size="md" shape="circle" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="mt-0.5 truncate text-xs text-foreground-light">
            {user.email || "—"}
          </p>
        </div>
      </div>

      <div className="min-w-0 pl-11 md:pl-0">
        <p className="truncate text-xs tabular-nums text-foreground">
          {user.phone || "—"}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-foreground-light">
          {joined ? `Joined ${joined}` : "Join date unknown"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pl-11 md:pl-0">
        <Badge tone="brand">{user.role}</Badge>
        <Badge tone={user.is_active ? "success" : "danger"} dot>
          {user.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="flex justify-start md:justify-end">
        <EditUserDrawer user={user} onEdited={onEdited} />
      </div>
    </div>
  );
};

const MemberSkeleton = () => (
  <div className={`grid items-center gap-4 px-5 py-3 ${COLUMNS}`}>
    <div className="flex items-center gap-3">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-44" />
      </div>
    </div>
    <div className="hidden space-y-1.5 md:block">
      <Skeleton className="h-2.5 w-28" />
      <Skeleton className="h-2 w-20" />
    </div>
    <div className="hidden gap-1.5 md:flex">
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="hidden size-8 rounded-md md:block" />
  </div>
);
