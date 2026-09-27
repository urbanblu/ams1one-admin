"use client";

import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerInnerProps {
  onScan: (token: string) => void;
  onError: (message: string) => void;
  active: boolean;
}

const READER_ID = "qr-reader-element";

export default function QRScannerInner({
  onScan,
  onError,
  active,
}: QRScannerInnerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    firedRef.current = false;

    if (!window.isSecureContext) {
      onError("Camera requires HTTPS. Use the manual token input below.");
      return;
    }

    const scanner = new Html5Qrcode(READER_ID, { verbose: false });

    const startPromise = scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          if (firedRef.current) return;
          firedRef.current = true;
          onScan(decodedText);
        },
        () => {},
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        onError(
          msg.toLowerCase().includes("permission")
            ? "Camera permission denied. Use the manual token input below."
            : "Could not access camera. Use the manual token input below.",
        );
        return Promise.reject(err);
      });

    return () => {
      startPromise
        .then(() => scanner.stop())
        .then(() => scanner.clear())
        .catch(() => {
          try {
            scanner.clear();
          } catch {
            /* ignore */
          }
        });
    };
    // onScan and onError are stable callbacks — intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div
      id={READER_ID}
      className="w-full rounded-xl overflow-hidden"
      style={{ minHeight: 280 }}
    />
  );
}
