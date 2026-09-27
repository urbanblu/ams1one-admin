"use client";

import {
  Button as UiButton,
  DrawerTitleBar,
  drawerBodyClass,
  drawerDialogClass,
  drawerWidth,
} from "@/components/ui";

import { cn, AlertDialog, Drawer, Spinner } from "@heroui/react";
import { useState } from "react";
import {
  LuCalendar,
  LuCheck,
  LuCircleX,
  LuGavel,
  LuUser,
} from "react-icons/lu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import GamesService from "@/api/games";
import { IPendingApproval } from "@/interfaces/games.interface";
import ToastService from "@/utils/toast-service";
import React from "react";
import CustomSelectComponent from "@/components/custom-select-component";
import ApiError from "@/utils/api_error";

type PendingAction = {
  type: "confirm" | "reject";
  item: IPendingApproval;
};

const today = new Date().toISOString().split("T")[0];

function ManageDrawDrawer({
  isOpen,
  onCloseTap,
}: {
  isOpen: boolean;
  onCloseTap: () => void;
}) {
  const [selectedEventId, setSelectedEventId] = React.useState<string>("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const queryClient = useQueryClient();

  const { data: eventsData, isPending: eventsPending } = useQuery({
    queryKey: ["games", "events-list", today],
    queryFn: () =>
      GamesService.fetchDrawEvents({ page_size: 100, draw_date: today }),
    enabled: isOpen,
  });

  const eventOptions = React.useMemo(() => {
    const mapped = (eventsData?.results ?? []).map((e) => {
      const name =
        e.event_name ?? e.name ?? e.game_type_name ?? e.game_type?.name ?? "—";
      const date = e.draw_date
        ? new Date(e.draw_date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—";
      return {
        key: e.event_id ?? e.id,
        label: `#${e.event_no} — ${name} (${date})`,
      };
    });
    return [{ key: "allEvents", label: "All Events" }, ...mapped];
  }, [eventsData]);

  const { data, isFetching } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: GamesService.fetchPendingApprovals,
    enabled: isOpen,
  });

  const { mutate: executeAction, isPending: isActing } = useMutation({
    mutationFn: async (action: PendingAction) => {
      if (action.type === "confirm") {
        await GamesService.confirmDrawResult(action.item.confirm_url);
      } else {
        await GamesService.rejectDrawResult(action.item.reject_url);
      }
    },
    onSuccess: (_, action) => {
      ToastService.success({
        text:
          action.type === "confirm"
            ? "Draw result confirmed successfully."
            : "Draw result rejected.",
      });
      setPendingAction(null);
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
    },
    onError: (error: ApiError) => {
      ToastService.error({
        text: error?.message ?? "Action failed. Please try again.",
      });
    },
  });

  const allPending = data?.pending ?? [];
  const filteredPending =
    !selectedEventId || selectedEventId === "allEvents"
      ? allPending
      : allPending.filter((item) => item.draw_event_id === selectedEventId);

  return (
    <div>
      <Drawer isOpen={isOpen}>
        <Drawer.Backdrop isDismissable={true}>
          <Drawer.Content placement="right">
            <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.form)}>
              <DrawerTitleBar
                icon={<LuGavel />}
                title="Pending draws"
                description="Confirm or reject submitted draw results."
                onClose={onCloseTap}
              />

              <div className="shrink-0 border-b border-border px-5 py-3.5">
                <CustomSelectComponent
                  label="Filter by event"
                  placeholder=""
                  showDropDownIcon
                  initialItemKey="allEvents"
                  list={eventOptions}
                  isDisabled={eventsPending || eventOptions.length === 0}
                  onSelectionChange={(item) => setSelectedEventId(item.key)}
                />
              </div>

              <Drawer.Body className={drawerBodyClass}>
                {isFetching ? (
                  <div className="flex justify-center items-center h-32">
                    <Spinner size="sm" className="text-brand-700" />
                  </div>
                ) : filteredPending.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <span className="text-xs text-foreground-light">
                      No pending approvals
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredPending.map((item) => (
                      <PendingCard
                        key={item.approval_id}
                        item={item}
                        onConfirm={() =>
                          setPendingAction({ type: "confirm", item })
                        }
                        onReject={() =>
                          setPendingAction({ type: "reject", item })
                        }
                      />
                    ))}
                  </div>
                )}
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>

      <AlertDialog
        isOpen={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="rounded-lg">
              <AlertDialog.Header>
                <AlertDialog.Icon
                  status={
                    pendingAction?.type === "confirm" ? "success" : "danger"
                  }
                />
                <AlertDialog.Heading className="text-base font-medium tracking-tight">
                  {pendingAction?.type === "confirm"
                    ? "Confirm Draw Result"
                    : "Reject Draw Result"}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm text-foreground-light">
                  {pendingAction?.type === "confirm"
                    ? "Are you sure you want to confirm the draw result? The numbers "
                    : "Are you sure you want to reject the draw result for this event?"}
                  {pendingAction?.type === "confirm" && (
                    <span className="font-medium text-foreground">
                      {pendingAction?.item.numbers.join(", ")}
                    </span>
                  )}
                  {pendingAction?.type === "confirm" && " will be finalised."}
                </p>
                <p className="mt-1 text-xs text-foreground-light">
                  Submitted by:{" "}
                  <span className="font-medium text-foreground">
                    {pendingAction?.item.submitted_by}
                  </span>
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <UiButton
                  type="button"
                  variant="outline"
                  disabled={isActing}
                  onClick={() => setPendingAction(null)}
                >
                  Cancel
                </UiButton>
                <UiButton
                  type="button"
                  variant={
                    pendingAction?.type === "confirm" ? "success" : "danger"
                  }
                  isPending={isActing}
                  onClick={() => pendingAction && executeAction(pendingAction)}
                >
                  {isActing
                    ? "Working…"
                    : pendingAction?.type === "confirm"
                      ? "Confirm result"
                      : "Reject result"}
                </UiButton>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

export default ManageDrawDrawer;

const PendingCard = ({
  item,
  onConfirm,
  onReject,
}: {
  item: IPendingApproval;
  onConfirm: () => void;
  onReject: () => void;
}) => {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {/* Header strip */}
      <div className="border-b border-border bg-surface-100 px-4 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-foreground-light">
              {item.game_type}
            </span>
            <span className="truncate text-sm font-medium text-foreground">
              {item.event_name ?? "—"}
            </span>
          </div>
          {/* Draw numbers */}
          <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
            {item.numbers.map((n, i) => (
              <span
                key={i}
                className="font-ident rounded-md border border-brand-300 bg-brand-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-brand-800"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-foreground-light">
          <LuCalendar className="size-3.5 shrink-0 text-foreground-muted" />
          <span>{item.draw_date ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-light">
          <LuUser className="size-3.5 shrink-0 text-foreground-muted" />
          <span>{item.submitted_by ?? "—"}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
        <button
          type="button"
          onClick={onReject}
          className="flex cursor-pointer items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50"
        >
          <LuCircleX className="size-3.5" />
          Reject
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex cursor-pointer items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          <LuCheck className="size-3.5" />
          Confirm
        </button>
      </div>
    </div>
  );
};
