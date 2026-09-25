import CustomInputComponent from "@/components/custom-input-component";
import { Button } from "@/components/ui";
import { Form, Popover } from "@heroui/react";
import React from "react";
import { LuFilter } from "react-icons/lu";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type Props = {
  onFilterTap?: () => void;
};

function FilterRetailers({ onFilterTap }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentName = searchParams.get("name") ?? "";
  const currentPhone = searchParams.get("phone") ?? "";
  const filtersCount = [currentName, currentPhone].filter(Boolean).length;
  const hasActiveFilter = !!(currentName || currentPhone);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const name = (data.name as string)?.trim() ?? "";
    const phone = (data.phoneNumber as string)?.trim() ?? "";

    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (phone) params.set("phone", phone);

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    onFilterTap?.();
    setIsOpen(false);
  };

  const handleReset = () => {
    router.push(pathname);
    onFilterTap?.();
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <Button
          variant={hasActiveFilter ? "secondary" : "outline"}
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          <LuFilter />
          Filter
          {hasActiveFilter && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {filtersCount}
            </span>
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Content
        className="w-80 rounded-2xl border border-border-subtle p-0 shadow-lg shadow-zinc-200/60"
        placement="bottom right"
      >
        <Popover.Dialog className="w-full p-0">
          {/* key forces inputs to re-render with fresh defaultValues when params change */}
          <Form key={`${currentName}-${currentPhone}`} onSubmit={handleSubmit}>
            <div className="flex w-full flex-col gap-4 p-5">
              <p className="text-sm font-semibold text-foreground">
                Filter retailers
              </p>
              <CustomInputComponent
                label="Name"
                name="name"
                placeholder="e.g. Kwame Mensah"
                defaultValue={currentName}
              />
              <CustomInputComponent
                label="Phone number"
                name="phoneNumber"
                type="tel"
                placeholder="e.g. 0501234567"
                defaultValue={currentPhone}
              />
              <div className="flex flex-col gap-2">
                <Button type="submit" fullWidth>
                  Apply filter
                </Button>
                {hasActiveFilter && (
                  <Button
                    variant="ghost"
                    type="button"
                    fullWidth
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export default FilterRetailers;
