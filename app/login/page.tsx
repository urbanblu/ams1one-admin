"use client";

import CustomInputComponent from "@/components/custom-input-component";
import { Button } from "@/components/ui";
import ToastService from "@/utils/toast-service";
import { Form } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import AuthService from "@/api/auth";
import useAuth from "@/stores/auth.store";
import { getFirstAccessibleHref } from "@/utils/navigation";
import { useEffect } from "react";
import { LuChartNoAxesColumn, LuShieldCheck, LuZap } from "react-icons/lu";

const HIGHLIGHTS = [
  { icon: LuChartNoAxesColumn, text: "Live sales and draw performance" },
  { icon: LuZap, text: "Approve payouts and top-ups in seconds" },
  { icon: LuShieldCheck, text: "Dual-approval controls on every draw" },
];

function LoginView() {
  const router = useRouter();
  const { auth, setAuth } = useAuth();

  const profileRequest = useMutation({
    mutationFn: async () => {
      const [user, pages] = await Promise.all([
        AuthService.fetchProfile(),
        AuthService.fetchMyPages(),
      ]);
      return { user, pages };
    },
    onError: (error) => {
      ToastService.error({ text: error?.message ?? "Unable to fetch profile" });
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
    onError: (error) => {
      ToastService.error({ text: error?.message ?? "Unable to login" });
    },
  });

  useEffect(() => {
    if (auth?.user && auth?.pages !== undefined) {
      router.replace(getFirstAccessibleHref(auth.pages));
    }
  }, [auth, router]);

  const isPending = loginRequest.isPending || profileRequest.isPending;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — brand */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-brand-gradient p-12 lg:flex">
        {/* Soft highlights + dot grid, matching the hero panels in-app */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.07]" />

        {/* The mark is a violet gradient built for light surfaces, so it sits
            on a white plate rather than directly on the brand gradient. */}
        <div className="relative w-fit rounded-2xl bg-white/95 px-6 py-4">
          <Image
            src="/images/new/logo.png"
            alt="Ams1one"
            width={132}
            height={52}
            className="object-contain"
            priority
          />
        </div>

        <div className="relative max-w-sm">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">
            Admin Console
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white">
            Everything across the network, in one place.
          </h2>

          <div className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <Icon className="size-3.5 text-white" />
                </span>
                <span className="text-sm text-white/75">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-white/60">
          © {new Date().getFullYear()} Ams1one. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Image
              src="/images/new/icon.png"
              alt="Ams1one"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your admin account to continue.
            </p>
          </div>

          <Form
            onSubmit={(e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              loginRequest.mutate({
                email: data.email as string,
                password: data.password as string,
              });
            }}
          >
            <div className="mb-6 w-full space-y-4">
              <CustomInputComponent type="email" name="email" isRequired />
              <CustomInputComponent
                type="password"
                name="password"
                isRequired
              />
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              isPending={isPending}
              className="relative overflow-hidden"
            >
              <span className="relative z-10">
                {isPending ? "Signing in…" : "Sign in"}
              </span>
              {/* Shine sweep */}
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
                }}
              />
            </Button>
          </Form>

          <p className="mt-8 text-center text-[11px] text-zinc-400 lg:hidden">
            © {new Date().getFullYear()} Ams1one
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
