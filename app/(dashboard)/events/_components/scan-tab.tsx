"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import {
  LuCamera,
  LuCameraOff,
  LuCircleCheck,
  LuCircleX,
} from "react-icons/lu";
import EventsService from "@/api/events";
import ApiError from "@/utils/api_error";

const QRScannerInner = dynamic(() => import("./qr-scanner-inner"), {
  ssr: false,
});

type ScanState =
  | { status: "idle" }
  | { status: "success"; event: string; phone: string; scanned_at: string }
  | { status: "error"; message: string };

export default function ScanTab() {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (token: string) => EventsService.scanTicket(token.trim()),
    onSuccess: (res) => {
      setScanState({
        status: "success",
        event: res.event_name,
        phone: res.player_phone,
        scanned_at: res.scanned_at,
      });
    },
    onError: (err: ApiError) => {
      setScanState({ status: "error", message: err.message ?? "Scan failed." });
    },
  });

  const handleScan = useCallback(
    async (token: string) => {
      if (isPending) return;
      setCameraOn(false);
      await mutateAsync(token);
    },
    [isPending, mutateAsync],
  );

  const reset = () => {
    setScanState({ status: "idle" });
    setCameraOn(false);
    setCameraError(null);
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto py-4">
      <div className="text-center">
        <h2 className="text-sm font-medium text-foreground">Gate Scanner</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Point your camera at a ticket QR code to validate entry.
        </p>
      </div>

      {/* Result display */}
      {scanState.status !== "idle" && (
        <div
          className={`w-full rounded-lg p-6 flex flex-col items-center gap-3 ${
            scanState.status === "success"
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-rose-50 border border-rose-200"
          }`}
        >
          {scanState.status === "success" ? (
            <>
              <LuCircleCheck className="w-14 h-14 text-emerald-600" />
              <p className="text-lg font-medium text-emerald-600">
                Entry Approved
              </p>
              <div className="text-center text-sm text-emerald-700 space-y-0.5">
                <p className="font-medium">{scanState.event}</p>
                <p>{scanState.phone}</p>
                <p className="text-xs text-emerald-600">
                  Scanned{" "}
                  {new Intl.DateTimeFormat("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(new Date(scanState.scanned_at))}
                </p>
              </div>
            </>
          ) : (
            <>
              <LuCircleX className="w-14 h-14 text-rose-600" />
              <p className="text-lg font-medium text-rose-600">Entry Denied</p>
              <p className="text-sm text-rose-600 text-center">
                {scanState.message}
              </p>
            </>
          )}
          <Button
            size="sm"
            onClick={reset}
            className="mt-1 font-medium text-xs bg-white border border-border text-foreground"
          >
            Scan Another
          </Button>
        </div>
      )}

      {/* Camera controls */}
      {scanState.status === "idle" && (
        <>
          <Button
            size="md"
            onClick={() => {
              setCameraOn((v) => !v);
              setCameraError(null);
            }}
            isDisabled={isPending}
            className={`w-full font-medium text-sm rounded-xl ${
              cameraOn ? "bg-subtle text-foreground" : "bg-brand-700 text-white"
            }`}
          >
            {cameraOn ? (
              <>
                <LuCameraOff className="w-4 h-4" /> Stop Camera
              </>
            ) : (
              <>
                <LuCamera className="w-4 h-4" /> Start Camera Scanner
              </>
            )}
          </Button>

          {cameraOn && (
            <div className="w-full border border-border rounded-lg overflow-hidden bg-black">
              <QRScannerInner
                onScan={handleScan}
                onError={(msg) => {
                  setCameraError(msg);
                  setCameraOn(false);
                }}
                active={cameraOn}
              />
            </div>
          )}

          {cameraError && !cameraOn && (
            <div className="flex w-full items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3">
              <LuCameraOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-600">{cameraError}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
