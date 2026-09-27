"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminUsersService from "@/api/admin-users";
import type { IActivityLog } from "@/interfaces/admin-users.interface";
import { LuLogIn, LuUserPlus, LuUserCog, LuActivity } from "react-icons/lu";

const ACTION_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  login: {
    label: "Login",
    icon: LuLogIn,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  create_admin: {
    label: "Created Admin",
    icon: LuUserPlus,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  edit_admin: {
    label: "Edited Admin",
    icon: LuUserCog,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
};

const PAGE_SIZE = 20;

function ActivityLogsTab() {
  const [page, setPage] = useState(1);

  const { data, isPending } = useQuery({
    queryKey: ["admin-users", "activity-logs", page],
    queryFn: () =>
      AdminUsersService.fetchActivityLogs({ page, page_size: PAGE_SIZE }),
  });

  const logs = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">Activity Logs</span>
          {totalCount > 0 && (
            <span className="ml-2 text-xs text-foreground-muted font-medium tabular-nums">
              {totalCount} total
            </span>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {isPending ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-xs text-foreground-muted">Loading…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <LuActivity className="w-8 h-8 text-foreground-muted" />
            <span className="text-xs text-foreground-muted">
              No activity logs yet.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-foreground-muted font-medium tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityLogsTab;

const LogRow = ({ log }: { log: IActivityLog }) => {
  const meta = ACTION_META[log.action] ?? {
    label: log.action.replace(/_/g, " "),
    icon: LuActivity,
    color: "text-muted-foreground",
    bg: "bg-surface-muted",
  };
  const Icon = meta.icon;

  const when = new Date(log.created_at);
  const isValid = !Number.isNaN(when.getTime());
  const dateText = isValid
    ? when.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
  const timeText = isValid
    ? when.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted transition-colors">
      <div className={`${meta.bg} rounded-lg p-2 mt-0.5 shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-xs text-foreground truncate">
            {log.description}
          </span>
        </div>
        <span className="text-xs text-foreground-muted font-medium tabular-nums">
          {log.actor_name ?? log.actor_email}
        </span>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <span className="text-xs text-muted-foreground font-medium tabular-nums">
          {dateText}
        </span>
        <span className="text-xs text-foreground-muted font-medium tabular-nums">
          {timeText}
        </span>
      </div>
    </div>
  );
};
