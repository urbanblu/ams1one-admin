"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  token: string;
  dimmed?: boolean;
}

export default function QRCodeDisplay({ token, dimmed }: QRCodeDisplayProps) {
  return (
    // qrcode.react emits fixed width/height presentation attributes, so the
    // SVG has to be told to scale or it overflows (and gets clipped by the
    // card's overflow-hidden) on any phone narrower than ~408px.
    <div
      className="w-full max-w-[17.5rem] rounded-lg bg-white p-4"
      style={{
        opacity: dimmed ? 0.25 : 1,
        filter: dimmed ? "grayscale(1)" : "none",
      }}
    >
      <QRCodeSVG
        value={token}
        size={280}
        bgColor="#ffffff"
        fgColor="#111111"
        level="M"
        className="h-auto w-full"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
}
