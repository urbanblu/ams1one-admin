"use client";

import EmptyImage from "@/public/images/new/empty-page.jpg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { LuArrowRight } from "react-icons/lu";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="relative h-56 w-56">
          <Image
            src={EmptyImage}
            alt="Page not found"
            fill
            className="object-contain"
          />
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>

        <Button
          size="lg"
          className="mt-8"
          onClick={() => router.push("/sales")}
        >
          Go to Sales
          <LuArrowRight />
        </Button>
      </div>
    </div>
  );
}
