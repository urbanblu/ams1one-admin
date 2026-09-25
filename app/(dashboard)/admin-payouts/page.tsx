"use client";

import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import PayoutsService, { IAdminPayout } from "@/api/payouts";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import { Form } from "@heroui/react";
import { Badge, Button, Card, PageHeader, PageShell } from "@/components/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { usePageAccess } from "@/hooks/use-page-access";
import { LuBanknote, LuCheck, LuTriangleAlert, LuClock } from "react-icons/lu";

const PROVIDERS = [
  { key: "MTN", label: "MTN Mobile Money" },
  { key: "VOD", label: "Vodafone Cash" },
  { key: "ATL", label: "AirtelTigo Money" },
];

function statusBadge(status: IAdminPayout["status"]) {
  if (status === "success")
    return (
      <Badge tone="success">
        <LuCheck className="size-3.5" />
        Success
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge tone="danger">
        <LuTriangleAlert className="size-3.5" />
        Failed
      </Badge>
    );
  return (
    <Badge tone="warning">
      <LuClock className="size-3.5" />
      Pending
    </Badge>
  );
}

function AdminPayoutsView() {
  const { hasPage } = usePageAccess();
  const canSend = hasPage("admin_payouts.send");

  const [provider, setProvider] = useState<"MTN" | "VOD" | "ATL">("MTN");
  const [lastPayout, setLastPayout] = useState<IAdminPayout | null>(null);
  const [formKey, setFormKey] = useState(0);

  const { mutate: send, isPending } = useMutation({
    mutationFn: ({
      payload,
      key,
    }: {
      payload: Parameters<typeof PayoutsService.sendAdminPayout>[0];
      key: string;
    }) => PayoutsService.sendAdminPayout(payload, key),
    onSuccess: (data) => {
      ToastService.success({ text: "Payout initiated successfully." });
      setLastPayout(data);
      setFormKey((k) => k + 1);
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to send payout." });
    },
  });

  const handleSubmit: React.ComponentProps<typeof Form>["onSubmit"] = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const amount = String(data.amount ?? "").trim();
    const mobile_number = String(data.mobile_number ?? "").trim();
    const recipient_name = String(data.recipient_name ?? "").trim();
    const description = String(data.description ?? "").trim();

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      ToastService.error({ text: "Enter a valid amount." });
      return;
    }
    if (!mobile_number) {
      ToastService.error({ text: "Enter a mobile number." });
      return;
    }

    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    send({
      payload: {
        amount,
        mobile_number,
        mobile_provider: provider,
        recipient_name,
        description: description || undefined,
      },
      key: idempotencyKey,
    });
  };

  if (!canSend) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-muted-foreground">
        You don&apos;t have permission to access this page.
      </div>
    );
  }

  return (
    <PageShell className="max-w-xl">
      <PageHeader
        title="Payments"
        description="Send a mobile money payout and track its confirmation."
      />

      {lastPayout && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Last payout
            </span>
            {statusBadge(lastPayout.status)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="Reference" value={lastPayout.reference} mono />
            <Field label="Amount" value={`USD ${lastPayout.amount}`} mono />
            <Field label="Recipient" value={lastPayout.recipient_name} />
            <Field label="Mobile" value={lastPayout.mobile_number} mono />
            {lastPayout.paystack_transfer_code && (
              <div className="col-span-2">
                <Field
                  label="Transfer code"
                  value={lastPayout.paystack_transfer_code}
                  mono
                />
              </div>
            )}
          </div>
          {lastPayout.status === "pending" && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-700">
              Status is pending — it will flip to success or failed once
              Paystack confirms via webhook.
            </p>
          )}
        </Card>
      )}

      <Form key={formKey} onSubmit={handleSubmit}>
        <div className="w-full space-y-4">
          <CustomInputComponent
            label="Amount (USD)"
            name="amount"
            type="number"
            showPreficIcon={false}
            showPlaceholder={false}
            isRequired
          />
          <CustomInputComponent
            label="Mobile number"
            name="mobile_number"
            type="tel"
            isRequired
          />
          <CustomSelectComponent
            label="Mobile provider"
            placeholder="Select provider"
            showDropDownIcon
            list={PROVIDERS}
            initialItemKey="MTN"
            onSelectionChange={(val) =>
              setProvider(val.key as "MTN" | "VOD" | "ATL")
            }
          />
          <CustomInputComponent
            label="Recipient name"
            name="recipient_name"
            showPreficIcon={false}
            showPlaceholder={false}
            isRequired
          />
          <CustomInputComponent
            label="Description (optional)"
            name="description"
            showPreficIcon={false}
            showPlaceholder={false}
            isRequired={false}
          />
          <Button
            type="submit"
            size="lg"
            fullWidth
            className="mt-2"
            isPending={isPending}
          >
            <LuBanknote />
            {isPending ? "Sending…" : "Send payout"}
          </Button>
        </div>
      </Form>
    </PageShell>
  );
}

export default AdminPayoutsView;

const Field = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="min-w-0">
    <p className="text-[11px] text-zinc-400">{label}</p>
    <p
      className={`mt-0.5 truncate text-sm font-medium text-foreground ${
        mono ? "tabular-nums" : ""
      }`}
    >
      {value}
    </p>
  </div>
);
