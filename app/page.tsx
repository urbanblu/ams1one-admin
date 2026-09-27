"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/stores/auth.store";
import { getFirstAccessibleHref } from "@/utils/navigation";
import { RouteSplash } from "@/components/ui";

const Home = () => {
  const { auth, _hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Deciding before rehydration lands sends a signed-in visitor to the login
    // screen and straight back out of it — the flash this page used to cause.
    if (!_hasHydrated) return;

    if (!auth) {
      router.replace("/login");
      return;
    }

    router.replace(
      auth.pages !== undefined
        ? getFirstAccessibleHref(auth.pages)
        : "/sales?tab=tickets",
    );
  }, [auth, _hasHydrated, router]);

  return <RouteSplash />;
};

export default Home;
