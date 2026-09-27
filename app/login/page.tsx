"use client";

import CustomInputComponent from "@/components/custom-input-component";
import { Button, RouteSplash } from "@/components/ui";
import ToastService from "@/utils/toast-service";
import { cn, Form } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import AuthService from "@/api/auth";
import useAuth from "@/stores/auth.store";
import { getFirstAccessibleHref } from "@/utils/navigation";
import { useEffect, useState } from "react";
import { LuCircleAlert, LuTriangleAlert } from "react-icons/lu";
import { signInMessage } from "./sign-in-copy";

function LoginView() {
  const router = useRouter();
  const { auth, setAuth, _hasHydrated } = useAuth();
  const [isCapsLockOn, setCapsLockOn] = useState(false);
  // Counts submissions so the error callout can re-mount per attempt. Without
  // it, a second failure carrying the same message changes nothing on screen
  // and the attempt reads as if it never resolved.
  const [attempt, setAttempt] = useState(0);

  const profileRequest = useMutation({
    mutationFn: async () => {
      const [user, pages] = await Promise.all([
        AuthService.fetchProfile(),
        AuthService.fetchMyPages(),
      ]);
      return { user, pages };
    },
    onSuccess: ({ user, pages }) => {
      setAuth({ access: auth!.access, refresh: auth!.refresh, user, pages });
      router.replace(getFirstAccessibleHref(pages));
      ToastService.success({ text: "Login successful" });
    },
  });

  const loginRequest = useMutation({
    mutationFn: AuthService.login,
    onSuccess: (result) => {
      if (result) {
        setAuth({ user: undefined, ...result });
        profileRequest.mutate();
      }
    },
  });

  // A session restored from storage is only readable after rehydration, so the
  // form stays behind RouteSplash until we know whether we are about to leave.
  const hasSession = auth?.user !== undefined && auth?.pages !== undefined;

  useEffect(() => {
    if (!_hasHydrated) return;
    if (hasSession) {
      router.replace(getFirstAccessibleHref(auth!.pages!));
    }
  }, [auth, hasSession, _hasHydrated, router]);

  // One field, one screen: the cursor belongs in it rather than one Tab away.
  useEffect(() => {
    if (!_hasHydrated || hasSession) return;
    document.getElementById("login-email")?.focus();
  }, [_hasHydrated, hasSession]);

  const isPending = loginRequest.isPending || profileRequest.isPending;

  // A failed sign-in is the one error on this screen that has to survive being
  // read, so it states itself in the form rather than in a toast that leaves.
  const errorMessage = (() => {
    if (isPending) return undefined;
    if (loginRequest.isError)
      return signInMessage(loginRequest.error?.message ?? "Unable to login");
    if (profileRequest.isError)
      return signInMessage(
        profileRequest.error?.message ?? "Unable to fetch profile",
      );
    return undefined;
  })();

  if (!_hasHydrated || hasSession) return <RouteSplash />;

  return (
    /* The shape every other Ams1one sign-in uses: the mark, large and
       centred; one line under it; the fields; the button. No card, no band,
       no labels — the placeholders name the fields, and there are only two.
       The controls are the app's own (rounded-md, bordered) on the app's
       own canvas, one step taller than the h-9 the tables use — a front door
       can afford 4px a data row cannot. The column sits a little above centre, where a centred block
       reads as centred. */
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 pb-[6vh] pt-10">
      <div className="flex w-full max-w-[360px] flex-col items-center">
        {/* The screen holds a blank RouteSplash until rehydration says whether
            this person is about to be sent onward, so the form's arrival is a
            real reveal rather than load decoration. Two steps — identity, then
            form 70ms later — and no more. */}
        <div className="animate-rise-in flex flex-col items-center">
          <Image
            src="/images/new/logo.png"
            alt="Ams1one Lottery"
            width={110}
            height={96}
            className="h-16 w-auto object-contain"
            priority
          />
          <h1 className="sr-only">Sign in to Ams1one admin</h1>
          <p className="mt-5 text-sm text-foreground-light">
            Sign in to the admin console
          </p>
        </div>

        <div
          className="animate-rise-in mt-8 w-full"
          style={{ animationDelay: "70ms" }}
        >
          {errorMessage && (
            <div
              key={attempt}
              role="alert"
              className="animate-rise-in mb-4 flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5"
            >
              <LuCircleAlert className="mt-0.5 size-3.5 shrink-0 text-rose-600" />
              <p className="text-xs leading-relaxed text-rose-700">
                {errorMessage}
              </p>
            </div>
          )}

          <Form
            className="w-full"
            aria-busy={isPending}
            onSubmit={(e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              setAttempt((n) => n + 1);
              loginRequest.mutate({
                email: data.email as string,
                password: data.password as string,
              });
            }}
          >
            {/* In flight, the fields recede and stop taking input: the
                button's spinner speaks for itself, but two live fields above
                it invite typing into a form that is already gone. */}
            <div
              className={cn(
                "w-full space-y-3 transition-opacity duration-200",
                isPending && "pointer-events-none opacity-60",
              )}
            >
              <CustomInputComponent
                id="login-email"
                type="email"
                name="email"
                placeholder="Email"
                className="h-10"
                showLabel={false}
                showPreficIcon={false}
                isRequired
              />

              {/* Caps Lock is the reason most of these passwords are wrong,
                  and the field cannot say so itself — the wrapper listens. */}
              <div
                className="w-full"
                onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                onBlur={() => setCapsLockOn(false)}
              >
                <CustomInputComponent
                  id="login-password"
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="h-10"
                  showLabel={false}
                  showPreficIcon={false}
                  isRequired
                />
                {isCapsLockOn && (
                  <p className="animate-rise-in mt-1.5 flex items-center gap-1.5 px-1 text-xs text-amber-700">
                    <LuTriangleAlert className="size-3.5 shrink-0" />
                    Caps Lock is on
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              isPending={isPending}
              className="mt-4 h-10"
            >
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </Form>
        </div>

        <p className="mt-6 text-xs text-foreground-light">
          Forgot your password? Ask an administrator.
        </p>
      </div>
    </main>
  );
}

export default LoginView;
