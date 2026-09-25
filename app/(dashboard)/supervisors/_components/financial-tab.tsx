import React from "react";
import type { ILmcFinancial } from "@/interfaces/lmc.interface";
import { LuWallet, LuArrowUp, LuShoppingBag, LuPercent } from "react-icons/lu";
import type { ElementType } from "react";

function FinancialTab({ financial }: { financial: ILmcFinancial }) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      <div className="py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 rounded-md p-1.5">
            <LuWallet className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Balance
            </span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              USD {financial.wallet_balance}
            </span>
          </div>
        </div>
      </div>
      <div className="py-2.5 flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
          Monthly
        </span>
        <Tile
          icon={LuArrowUp}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Top-Ups"
          value={String(financial.monthly_topups)}
        />
        <Tile
          icon={LuShoppingBag}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          label="Sales"
          value={String(financial.monthly_sales)}
        />
        <Tile
          icon={LuPercent}
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
          label="Commissions"
          value={String(financial.monthly_commissions)}
        />
      </div>
    </div>
  );
}

export default FinancialTab;

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
