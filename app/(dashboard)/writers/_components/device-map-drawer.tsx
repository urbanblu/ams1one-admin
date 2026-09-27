"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { IconButton } from "@/components/ui";
import { LuLoaderCircle, LuMapPin, LuRefreshCw, LuX } from "react-icons/lu";
import { useRouter } from "next/navigation";
import WritersService from "@/api/writers";

const DeviceMapInner = dynamic(() => import("./device-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <LuLoaderCircle className="size-5 animate-spin text-brand-700" />
    </div>
  ),
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceMapDrawer({ isOpen, onClose }: Props) {
  const router = useRouter();
  const {
    data: devices = [],
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["writers", "device-locations"],
    queryFn: WritersService.fetchDeviceLocations,
    enabled: isOpen,
    staleTime: 30_000,
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-foreground/40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface sm:w-[82vw] sm:overflow-hidden sm:rounded-l-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <LuMapPin className="size-4 shrink-0 text-foreground-muted" />
            <div className="min-w-0">
              <p className="text-sm font-medium tracking-tight text-foreground">
                POS device locations
              </p>
              {!isPending && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {devices.length} device{devices.length !== 1 ? "s" : ""}{" "}
                  reporting
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              label="Refresh locations"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <LuRefreshCw className={isFetching ? "animate-spin" : ""} />
            </IconButton>
            <IconButton label="Close" onClick={onClose}>
              <LuX />
            </IconButton>
          </div>
        </div>

        {/* Legend */}
        <div className="flex shrink-0 items-center gap-4 border-b border-border bg-surface-muted px-5 py-2.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground-muted">Status</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-rose-500" />
            No use
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-foreground-muted" />
            Other
          </span>
        </div>

        {/* Map */}
        <div className="relative min-h-0 flex-1">
          {isPending ? (
            <div className="flex h-full items-center justify-center">
              <LuLoaderCircle className="size-5 animate-spin text-brand-700" />
            </div>
          ) : devices.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-subtle text-foreground-muted">
                <LuMapPin className="size-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                No devices have reported their location yet.
              </p>
            </div>
          ) : (
            <DeviceMapInner
              devices={devices}
              onWriterClick={(writerId) => {
                onClose();
                router.push(`/writers/${writerId}`);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
