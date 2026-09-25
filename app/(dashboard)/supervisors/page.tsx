"use client";

import Image from "next/image";
import EmptyImage from "@/public/images/new/empty-page.jpg";
import { Tabs } from "@heroui/react";
import {
  Avatar,
  Button,
  PageHeader,
  SearchInput,
  Skeleton,
} from "@/components/ui";
import { LuUpload } from "react-icons/lu";
import OperationalTab from "./_components/operational-tab";
import FinancialTab from "./_components/financial-tab";
import NewLmcDrawer from "./_components/new-supervisor-drawer";
import { useQuery } from "@tanstack/react-query";
import LmcService from "@/api/lmc";
import { useMemo, useState } from "react";
import ToastService from "@/utils/toast-service";
import { useRouter } from "next/navigation";
import { usePageAccess } from "@/hooks/use-page-access";

function Lmcs() {
  const router = useRouter();
  const { hasPage } = usePageAccess();
  const canRegister = hasPage("supervisors.register");
  const canViewDetail = hasPage("supervisors.detail");

  const [searchTerm, setSearchTerm] = useState("");
  const { data: cards = [], isPending } = useQuery({
    queryKey: ["lmc", "detail-cards"],
    queryFn: LmcService.fetchDetailCards,
  });

  const filteredCards = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return cards;

    return cards.filter((card) =>
      [card.name, card.phone, card.code, card.address]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(query)),
    );
  }, [cards, searchTerm]);

  return (
    <div className="flex flex-col gap-5 px-5 py-6 lg:px-8 lg:py-7">
      <PageHeader
        title="Supervisors"
        description={`${cards.length.toLocaleString("en-US")} local management companies`}
        actions={
          <>
            <SearchInput
              className="w-full sm:w-56"
              placeholder="Search supervisors"
              value={searchTerm}
              onChange={setSearchTerm}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                ToastService.info({ text: "Feature not yet available" });
              }}
            >
              <LuUpload />
              Export
            </Button>
            {canRegister && <NewLmcDrawer />}
          </>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
        {isPending &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border-subtle bg-surface"
            >
              <div className="flex flex-col items-center gap-2.5 px-4 py-6">
                <Skeleton className="size-14 rounded-full" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <div className="space-y-2 border-t border-border-subtle px-4 py-4">
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-3/4" />
              </div>
            </div>
          ))}
        {!isPending &&
          filteredCards.map((card) => {
            return (
              <div
                key={card.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface"
              >
                <div
                  className={`relative flex flex-col items-center gap-2.5 overflow-hidden bg-brand-gradient px-4 py-6 ${
                    canViewDetail ? "cursor-pointer" : "cursor-default"
                  }`}
                  onClick={() =>
                    canViewDetail && router.push(`/supervisors/${card.id}`)
                  }
                >
                  <div className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-white/20 blur-3xl" />
                  <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.06]" />
                  <div className="relative flex flex-col items-center gap-2.5">
                    <Avatar
                      name={card.name}
                      src={card.photo_url ?? undefined}
                      size="lg"
                      className="rounded-full ring-2 ring-white/40"
                    />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-center text-sm font-semibold leading-tight text-white">
                        {card.name}
                      </span>
                      <span className="text-xs tabular-nums text-white/70">
                        {card.phone}
                      </span>
                    </div>
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                      {card.code}
                    </span>
                  </div>
                </div>
                <Tabs className="mt-2 w-full px-2">
                  <Tabs.ListContainer>
                    <Tabs.List
                      aria-label="Options"
                      className="w-full gap-1 rounded-2xl p-1"
                    >
                      <Tabs.Tab
                        className="h-9 flex-1 rounded-xl text-sm font-medium"
                        id="operational"
                      >
                        Operational
                        <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                      </Tabs.Tab>
                      <Tabs.Tab
                        className="h-9 flex-1 rounded-xl text-sm font-medium"
                        id="financial"
                      >
                        Financial
                        <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>
                  <Tabs.Panel className="px-3 py-3" id="operational">
                    <OperationalTab operational={card.operational} />
                  </Tabs.Panel>
                  <Tabs.Panel className="px-3 py-3" id="financial">
                    <FinancialTab financial={card.financial} />
                  </Tabs.Panel>
                </Tabs>
              </div>
            );
          })}
        {!isPending && filteredCards.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 py-16">
            <div className="relative size-44">
              <Image src={EmptyImage} alt="" fill className="object-contain" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {searchTerm.trim()
                ? "No supervisors match your search"
                : "No supervisors yet"}
            </p>
            <p className="max-w-[220px] text-center text-xs text-muted-foreground">
              {searchTerm.trim()
                ? "Try a different name, phone number or code."
                : "Add your first supervisor to get started."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lmcs;
