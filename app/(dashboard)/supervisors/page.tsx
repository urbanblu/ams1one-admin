"use client";

import Image from "next/image";
import EmptyImage from "@/public/images/new/empty-page.jpg";
import { AppBarActions, Button, PageShell, SearchInput } from "@/components/ui";
import { LuUpload } from "react-icons/lu";
import {
  SupervisorCard,
  SupervisorCardSkeleton,
} from "./_components/supervisor-card";
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
    <PageShell>
      <AppBarActions>
        {/* No table footer on a card grid, so the count rides along here. */}
        <span className="hidden shrink-0 text-xs tabular-nums text-foreground-light lg:inline">
          {cards.length.toLocaleString("en-US")} supervisors
        </span>
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
      </AppBarActions>
      {/* 280: the foot carries three figures side by side, and the widest
          balance this data produces needs its third of that. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {isPending &&
          Array.from({ length: 6 }).map((_, i) => (
            <SupervisorCardSkeleton key={i} />
          ))}
        {!isPending &&
          filteredCards.map((card) => (
            <SupervisorCard
              key={card.id}
              card={card}
              onOpen={
                canViewDetail
                  ? () => router.push(`/supervisors/${card.id}`)
                  : undefined
              }
            />
          ))}
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
    </PageShell>
  );
}

export default Lmcs;
