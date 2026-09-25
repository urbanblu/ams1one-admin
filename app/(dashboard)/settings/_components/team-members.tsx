"use client";
import {
  Avatar,
  Badge,
  EmptyState,
  SearchInput,
  SkeletonList,
} from "@/components/ui";
import React from "react";
import { LuCalendarCheck, LuIdCard, LuUsers } from "react-icons/lu";
import NewUserDrawer from "./new-user-drawer";
import ExistingRolesDrawer from "./existing-roles-drawer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminUsersService from "@/api/admin-users";
import type { IAdminUser } from "@/interfaces/admin-users.interface";
import EditUserDrawer from "./edit-user";

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

  return (
    <div className="w-full h-full min-h-0 flex flex-col space-y-4">
      <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span className="text-sm font-semibold text-foreground">
          Current members
        </span>
        <ExistingRolesDrawer />
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full md:flex-1">
          <SearchInput
            placeholder="Search by name or phone number"
            value={searchDraft}
            onChange={setSearchDraft}
          />
          {/* <Button
 size="sm"
 variant="ghost"
 className="h-10 cursor-pointer rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-subtle w-full shrink-0 md:w-auto"
 onClick={() => setSearchDraft((prev) => prev.trim())}
          >
            <IoFilter className="text-muted-foreground h-4 w-4" />
 Filter
          </Button> */}
        </div>
        <div className="w-full md:w-auto md:shrink-0">
          <NewUserDrawer
            onCreated={() =>
              queryClient.invalidateQueries({
                queryKey: ["admin-users", "list"],
              })
            }
          />
        </div>
      </div>

      <div className="md:flex-1 md:min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-3">
        {isPending ? (
          <SkeletonList rows={4} className="divide-y-0 space-y-3" />
        ) : filteredAdmins.length === 0 ? (
          <EmptyState
            icon={<LuUsers />}
            title="No members found"
            description="Try a different name or phone number."
          />
        ) : (
          filteredAdmins.map((user) => (
            <MemberItem
              key={user.id}
              user={user}
              onEdited={() =>
                queryClient.invalidateQueries({
                  queryKey: ["admin-users", "list"],
                })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

export default TeamMembers;

const MemberItem = ({
  user,
  onEdited,
}: {
  user: IAdminUser;
  onEdited?: () => void;
}) => {
  const joined = user.date_joined
    ? new Date(user.date_joined).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface p-4 md:flex-row md:items-center md:justify-between md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          name={user.full_name || `${user.first_name} ${user.last_name}`}
          size="md"
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">
              {user.full_name || `${user.first_name} ${user.last_name}`}
            </span>
            <EditUserDrawer user={user} onEdited={onEdited} />
          </div>
          <span className="mt-0.5 break-all text-[11px] text-muted-foreground">
            {user.email}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 md:ml-auto md:w-auto md:flex-row md:items-center md:gap-3">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {user.phone}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">
            <LuIdCard className="size-3.5" />
            {user.role}
          </Badge>
          <Badge tone="neutral">
            <LuCalendarCheck className="size-3.5" />
            {joined}
          </Badge>
          <Badge tone={user.is_active ? "success" : "danger"} dot>
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
    </div>
  );
};
