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
import type { ElementType } from "react";

function OperationalTab({ operational }: { operational: ILmcOperational }) {
  return (
    <div className="flex flex-col space-y-3 divide-border-subtle">
      <Section label="Writers" total={operational.writers_total}>
        <Tile
          icon={LuUserCheck}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Active"
          value={String(operational.active)}
        />
        <Tile
          icon={LuUserMinus}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          label="Passive"
          value={String(operational.passive)}
        />
        <Tile
          icon={LuUserX}
          iconBg="bg-subtle"
          iconColor="text-muted-foreground"
          label="Inactive"
          value={String(operational.inactive)}
        />
        <Tile
          icon={LuRefreshCw}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Recover"
          value={String(operational.recover)}
        />
        <Tile
          icon={LuBan}
          iconBg="bg-rose-100"
          iconColor="text-rose-500"
          label="No Use"
          value={String(operational.no_use)}
        />
      </Section>
      <Section label="POS">
        <Tile
          icon={LuTablet}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          label="Issued"
          value={String(operational.pos_issued)}
        />
        <Tile
          icon={LuActivity}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          label="Trading"
          value={String(operational.pos_trading)}
        />
        <Tile
          icon={LuTriangle}
          iconBg="bg-rose-100"
          iconColor="text-rose-500"
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

const Tile = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-2">
      <div className={`${iconBg} rounded-md p-1`}>
        <Icon className={`w-3 h-3 ${iconColor}`} />
      </div>
      <span className="text-xs text-muted-foreground font-semibold">
        {label}
      </span>
    </div>
    <span className="text-xs font-semibold tabular-nums">{value}</span>
  </div>
);
