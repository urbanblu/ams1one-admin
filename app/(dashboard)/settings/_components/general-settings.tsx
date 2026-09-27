import Image from "next/image";
import OrganizationImage from "@/public/images/organization-image-placeholder.webp";
import {
  LuMail,
  LuMapPin,
  LuPhone,
  LuHash,
  LuLandmark,
  LuBadgeCheck,
  LuCreditCard,
  LuNetwork,
  LuBanknote,
  LuGlobe,
  LuDatabase,
  LuLanguages,
  LuCircleDollarSign,
} from "react-icons/lu";
import type { ElementType } from "react";

function GeneralSettings() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-col items-start gap-4 border-b border-border bg-surface-100 px-5 py-4 sm:flex-row sm:items-center">
          <div className="shrink-0 overflow-hidden rounded-md border border-border">
            <Image
              src={OrganizationImage}
              alt="Organisation logo"
              className="size-16 object-cover"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs text-foreground-light">Organisation</span>
            <span className="text-lg font-medium leading-tight text-foreground">
              N/A
            </span>
            <span className="text-xs tabular-nums text-foreground-light">
              N/A
            </span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <InfoTile icon={LuMail} label="Primary Email" value="N/A" />
          <InfoTile icon={LuPhone} label="Primary Contact" value="N/A" />
        </div>
        <div className="border-t border-border">
          <InfoTile icon={LuMapPin} label="Address" value="N/A" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-3.5">
          <span className="text-xs font-medium text-foreground-light">
            Organisation Details
          </span>
        </div>
        <div className="grid sm:grid-cols-2 divide-border">
          <InfoTile
            icon={LuHash}
            label="Organisation's ID"
            value="N/A"
            border
          />
          <InfoTile
            icon={LuBadgeCheck}
            label="License Type"
            value="N/A"
            border
          />
          <InfoTile
            icon={LuNetwork}
            label="Distribution Channel"
            value="N/A"
            border
          />
          <InfoTile icon={LuGlobe} label="Country" value="N/A" border />
          <InfoTile
            icon={LuLanguages}
            label="Default Language"
            value="N/A"
            border
          />
          <InfoTile
            icon={LuCircleDollarSign}
            label="Default Currency"
            value="N/A"
            border
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-5 py-3.5">
          <span className="text-xs font-medium text-foreground-light">
            Financial Settings
          </span>
        </div>
        <div className="grid sm:grid-cols-2 divide-border">
          <InfoTile icon={LuLandmark} label="Partner Bank" value="N/A" border />
          <InfoTile
            icon={LuCreditCard}
            label="Collection Account #"
            value="N/A"
            border
          />
          <InfoTile
            icon={LuBanknote}
            label="Payout Account #"
            value="N/A"
            border
          />
          <InfoTile
            icon={LuDatabase}
            label="Operations Account #"
            value="N/A"
            border
          />
        </div>
      </div>
    </div>
  );
}

export default GeneralSettings;

const InfoTile = ({
  icon: Icon,
  label,
  value,
  border = false,
}: {
  icon: ElementType;
  label: string;
  value: string;
  border?: boolean;
}) => (
  <div
    className={`flex items-center gap-3 px-5 py-3.5 ${border ? "border-b border-border" : ""}`}
  >
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-subtle text-foreground-muted">
      <Icon className="size-3.5" />
    </span>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-xs font-medium text-foreground-light">{label}</span>
      <span className="truncate text-sm font-medium tabular-nums text-foreground">
        {value}
      </span>
    </div>
  </div>
);
