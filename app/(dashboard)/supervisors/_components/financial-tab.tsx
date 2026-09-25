import { DetailRow } from "@/components/ui";
import React from "react";
import type { ILmcFinancial } from "@/interfaces/lmc.interface";
import { LuWallet, LuArrowUp, LuShoppingBag, LuPercent } from "react-icons/lu";

function FinancialTab({ financial }: { financial: ILmcFinancial }) {
  return (
    <div className="flex flex-col divide-y divide-border-subtle">
      <div className="py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary-soft rounded-md p-1.5">
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
        <DetailRow
          icon={<LuArrowUp />}
          iconClassName="bg-blue-50 text-blue-500"
          label="Top-Ups"
          value={String(financial.monthly_topups)}
        />
        <DetailRow
          icon={<LuShoppingBag />}
          iconClassName="bg-emerald-50 text-emerald-500"
          label="Sales"
          value={String(financial.monthly_sales)}
        />
        <DetailRow
          icon={<LuPercent />}
          iconClassName="bg-orange-100 text-orange-500"
          label="Commissions"
          value={String(financial.monthly_commissions)}
        />
      </div>
    </div>
  );
}

export default FinancialTab;
