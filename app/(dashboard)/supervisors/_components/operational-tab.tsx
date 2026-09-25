import { DetailRow } from "@/components/ui";
import React from "react";
import type { ILmcOperational } from "@/interfaces/lmc.interface";
import {
  LuUserCheck,
  LuUserMinus,
  LuUserX,
  LuRefreshCw,
  LuBan,
  LuTablet,
  LuActivity,
  LuTriangle,
} from "react-icons/lu";

function OperationalTab({ operational }: { operational: ILmcOperational }) {
  return (
    <div className="flex flex-col space-y-3 divide-border-subtle">
      <Section label="Writers" total={operational.writers_total}>
        <DetailRow
          icon={<LuUserCheck />}
          iconClassName="bg-emerald-50 text-emerald-500"
          label="Active"
          value={String(operational.active)}
        />
        <DetailRow
          icon={<LuUserMinus />}
          iconClassName="bg-amber-50 text-amber-500"
          label="Passive"
          value={String(operational.passive)}
        />
        <DetailRow
          icon={<LuUserX />}
          iconClassName="bg-subtle text-muted-foreground"
          label="Inactive"
          value={String(operational.inactive)}
        />
        <DetailRow
          icon={<LuRefreshCw />}
          iconClassName="bg-blue-50 text-blue-500"
          label="Recover"
          value={String(operational.recover)}
        />
        <DetailRow
          icon={<LuBan />}
          iconClassName="bg-rose-50 text-rose-500"
          label="No Use"
          value={String(operational.no_use)}
        />
      </Section>
      <Section label="POS">
        <DetailRow
          icon={<LuTablet />}
          iconClassName="bg-primary-soft text-primary"
          label="Issued"
          value={String(operational.pos_issued)}
        />
        <DetailRow
          icon={<LuActivity />}
          iconClassName="bg-blue-50 text-blue-500"
          label="Trading"
          value={String(operational.pos_trading)}
        />
        <DetailRow
          icon={<LuTriangle />}
          iconClassName="bg-rose-50 text-rose-500"
          label="Recovery"
          value={String(operational.pos_recovery)}
        />
      </Section>
    </div>
  );
}

export default OperationalTab;

const Section = ({
  label,
  total,
  children,
}: {
  label: string;
  total?: number | string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      {total != null && (
        <span className="text-[11px] font-bold text-muted-foreground">
          {total} total
        </span>
      )}
    </div>
    {children}
  </div>
);

